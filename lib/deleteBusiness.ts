import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { platformAdminEmails } from "@/lib/platform";

type Tx = Prisma.TransactionClient;

// Deletes a row and EVERYTHING that points at it (stylists, bookings,
// customers, products...), following the database's own foreign keys, so a
// fake signup can be removed in one step. Children are removed before parents.
async function deleteTree(tx: Tx, table: string, ids: string[], seen: Set<string>) {
  const fresh = ids.filter((id) => !seen.has(`${table}:${id}`));
  if (fresh.length === 0) return;
  fresh.forEach((id) => seen.add(`${table}:${id}`));

  const fks = (await tx.$queryRawUnsafe(
    `SELECT c.conrelid::regclass::text AS tbl, a.attname AS col
       FROM pg_constraint c
       JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = c.conkey[1]
      WHERE c.contype = 'f' AND c.confrelid = $1::regclass AND array_length(c.conkey, 1) = 1`,
    `"${table}"`
  )) as { tbl: string; col: string }[];

  for (const fk of fks) {
    const childTable = fk.tbl.replace(/^"|"$/g, "");
    const pk = (await tx.$queryRawUnsafe(
      `SELECT a.attname AS col FROM pg_index i
         JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
        WHERE i.indrelid = $1::regclass AND i.indisprimary`,
      fk.tbl
    )) as { col: string }[];

    if (pk.length === 1) {
      const rows = (await tx.$queryRawUnsafe(
        `SELECT "${pk[0].col}"::text AS id FROM ${fk.tbl} WHERE "${fk.col}"::text = ANY($1::text[])`,
        fresh
      )) as { id: string }[];
      await deleteTree(tx, childTable, rows.map((r) => r.id), seen);
    } else {
      await tx.$executeRawUnsafe(`DELETE FROM ${fk.tbl} WHERE "${fk.col}"::text = ANY($1::text[])`, fresh);
    }
  }

  await tx.$executeRawUnsafe(`DELETE FROM "${table}" WHERE "id"::text = ANY($1::text[])`, fresh);
}

export async function deleteBusinessCompletely(businessId: string): Promise<{ ok: boolean; error?: string }> {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    include: { owner: { select: { id: true, email: true } } },
  });
  if (!business) return { ok: false, error: "Not found" };

  const ownerEmail = business.owner?.email?.toLowerCase();
  if (ownerEmail && platformAdminEmails().includes(ownerEmail)) {
    return { ok: false, error: "That salon belongs to a platform admin account - not deleting." };
  }

  await prisma.$transaction(
    async (tx) => {
      const seen = new Set<string>();
      await deleteTree(tx, "Business", [business.id], seen);
      if (business.owner?.id) {
        const others = await tx.business.count({ where: { ownerId: business.owner.id } });
        if (others === 0) await deleteTree(tx, "User", [business.owner.id], seen);
      }
    },
    { timeout: 60000, maxWait: 10000 }
  );
  return { ok: true };
}
