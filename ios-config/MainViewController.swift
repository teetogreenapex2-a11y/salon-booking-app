import UIKit
import Capacitor
import WebKit

// Hairsalonix native tab bar. The website decides WHICH tabs to show (the
// salon owner picks them in Business settings) and sends them here through
// window.HxTabBar.setTabs(json, activeKey). Taps go back to the website as a
// "hx-navigate" event, so pages change without a full reload. The last slot
// is always "More", which asks the website to open its own More sheet.
class MainViewController: CAPBridgeViewController, UITabBarDelegate, WKScriptMessageHandler {

    private let tabBar = UITabBar()
    private let moreTag = 999
    private var tabHrefs: [Int: String] = [:]
    private var activeTag: Int? = nil

    override func viewDidLoad() {
        super.viewDidLoad()
        tabBar.delegate = self
        tabBar.isHidden = true // hidden until the website sends tabs
        tabBar.barTintColor = UIColor(red: 0x7F/255, green: 0x2D/255, blue: 0x4A/255, alpha: 1)
        tabBar.tintColor = .white
        tabBar.unselectedItemTintColor = UIColor.white.withAlphaComponent(0.65)
        tabBar.isTranslucent = false
        tabBar.translatesAutoresizingMaskIntoConstraints = false

        view.addSubview(tabBar)
        NSLayoutConstraint.activate([
            tabBar.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            tabBar.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            tabBar.bottomAnchor.constraint(equalTo: view.bottomAnchor)
        ])
    }

    // Runs before the first page load, so the bridge exists from the start.
    override func capacitorDidLoad() {
        guard let webView = self.bridge?.webView else { return }

        webView.scrollView.contentInsetAdjustmentBehavior = .never
        webView.scrollView.bounces = false
        webView.scrollView.alwaysBounceVertical = false

        let berry = UIColor(red: 0x7F / 255, green: 0x2D / 255, blue: 0x4A / 255, alpha: 1)
        let cream = UIColor(red: 0xFA / 255, green: 0xF6 / 255, blue: 0xF3 / 255, alpha: 1)
        webView.backgroundColor = cream
        webView.scrollView.backgroundColor = cream
        webView.isOpaque = false
        view.backgroundColor = berry

        let bridgeScript = """
        window.HxTabBar = {
          setTabs: function(json, activeKey) {
            window.webkit.messageHandlers.hxTabBar.postMessage({action: 'setTabs', tabs: json, active: activeKey});
          },
          hide: function() {
            window.webkit.messageHandlers.hxTabBar.postMessage({action: 'hide'});
          }
        };
        """
        let userScript = WKUserScript(source: bridgeScript, injectionTime: .atDocumentStart, forMainFrameOnly: false)
        webView.configuration.userContentController.addUserScript(userScript)
        webView.configuration.userContentController.add(self, name: "hxTabBar")
    }

    // MARK: - Messages from the website

    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        guard let body = message.body as? [String: Any],
              let action = body["action"] as? String else { return }

        if action == "hide" {
            tabBar.isHidden = true
            return
        }
        if action == "setTabs" {
            let json = body["tabs"] as? String ?? "[]"
            let active = body["active"] as? String ?? ""
            applyTabs(json: json, activeKey: active)
        }
    }

    private func applyTabs(json: String, activeKey: String) {
        guard let data = json.data(using: .utf8),
              let list = try? JSONSerialization.jsonObject(with: data) as? [[String: Any]],
              !list.isEmpty else {
            tabBar.isHidden = true
            return
        }

        var items: [UITabBarItem] = []
        var hrefs: [Int: String] = [:]
        var selected: UITabBarItem? = nil

        // At most 4 website tabs + More = 5, the most iOS shows without
        // collapsing into its own plain "More" list.
        for (i, t) in list.prefix(4).enumerated() {
            let title = t["label"] as? String ?? ""
            let sf = t["sf"] as? String ?? "circle"
            let href = t["href"] as? String ?? "/admin"
            let image = UIImage(systemName: sf) ?? UIImage(systemName: "circle")
            let item = UITabBarItem(title: title, image: image, tag: i + 1)
            items.append(item)
            hrefs[i + 1] = href
            if (t["key"] as? String) == activeKey { selected = item }
        }
        items.append(UITabBarItem(title: "More", image: UIImage(systemName: "ellipsis"), tag: moreTag))

        tabHrefs = hrefs
        tabBar.items = items
        tabBar.selectedItem = selected
        activeTag = selected?.tag
        tabBar.isHidden = false
        // The webview can get reordered during navigation and cover the bar.
        view.bringSubviewToFront(tabBar)
    }

    // MARK: - Taps

    func tabBar(_ tabBar: UITabBar, didSelect item: UITabBarItem) {
        if item.tag == moreTag {
            runJS("window.dispatchEvent(new Event('hx-open-more'));")
            // More acts like a button: keep the current page's tab highlighted.
            if let items = tabBar.items {
                tabBar.selectedItem = items.first(where: { $0.tag == activeTag })
            }
            return
        }
        guard let href = tabHrefs[item.tag] else { return }
        activeTag = item.tag
        if let data = try? JSONSerialization.data(withJSONObject: [href], options: []),
           let arr = String(data: data, encoding: .utf8) {
            // arr looks like ["/admin/calendar"] - take the first element.
            runJS("window.dispatchEvent(new CustomEvent('hx-navigate', {detail: {href: \(arr)[0]}}));")
        }
    }

    private func runJS(_ js: String) {
        self.bridge?.webView?.evaluateJavaScript(js, completionHandler: nil)
    }
}
