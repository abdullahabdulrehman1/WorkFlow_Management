import UIKit
import Capacitor
import WebKit

class ViewController: CAPBridgeViewController {
    override func viewDidLoad() {
        super.viewDidLoad()
        
        print("🔧 ViewController loaded - trying both auto and manual registration")
        
        // Manual registration as backup
        print("🔧 Attempting manual CallPlugin registration...")
        let callPlugin = CallPlugin()
        self.bridge?.registerPluginInstance(callPlugin)
        print("🔧 Manual CallPlugin registration completed")
        
        // Set up JavaScript event listeners for push notifications
        setupPushNotificationListeners()
        
        // Let's also check what plugins are registered
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
            print("🔧 Checking registered plugins after delay...")
            if let bridge = self.bridge {
                print("🔧 Bridge exists, plugins should be available")
            } else {
                print("❌ Bridge is nil!")
            }
        }
    }
    
    private func setupPushNotificationListeners() {
        print("📞 Setting up push notification event listeners...")
        
        // Add JavaScript listener for custom push notification events
        let jsCode = """
        window.addEventListener('push-notification-received', function(event) {
            console.log('📞 [JS] Received push-notification-received event:', event.detail);
            
            const notificationData = event.detail;
            if (notificationData && notificationData.data && notificationData.data.type === 'DesktopCallEvent') {
                console.log('📞 [JS] DesktopCallEvent detected, triggering native call screen');
                
                // Trigger the native call screen via a custom event
                window.webkit.messageHandlers.bridge.postMessage({
                    type: 'showCallScreen',
                    data: notificationData.data
                });
            }
        });
        
        console.log('📞 [JS] Push notification event listener set up');
        """
        
        // Execute the JavaScript code
        self.bridge?.webView?.evaluateJavaScript(jsCode) { (result, error) in
            if let error = error {
                print("❌ Error setting up JS listeners: \(error)")
            } else {
                print("✅ JavaScript push notification listeners set up successfully")
            }
        }
        
        // Add message handler for the bridge messages
        self.bridge?.webView?.configuration.userContentController.add(
            CallScreenMessageHandler(viewController: self),
            name: "bridge"
        )
    }
}

// Message handler for call screen events from JavaScript
class CallScreenMessageHandler: NSObject, WKScriptMessageHandler {
    weak var viewController: ViewController?
    
    init(viewController: ViewController) {
        self.viewController = viewController
        super.init()
    }
    
    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        print("📞 [Native] Received message from JavaScript: \(message.body)")
        
        guard let messageDict = message.body as? [String: Any],
              let type = messageDict["type"] as? String,
              type == "showCallScreen",
              let data = messageDict["data"] as? [String: Any] else {
            print("❌ Invalid message format or type")
            return
        }
        
        let callerName = data["callerName"] as? String ?? "Unknown Caller"
        let callerId = data["callerId"] as? String ?? "unknown"
        
        print("📞 [Native] Triggering call screen for: \(callerName)")
        
        // Call the AppDelegate method to show the call screen
        DispatchQueue.main.async {
            if let appDelegate = UIApplication.shared.delegate as? AppDelegate {
                appDelegate.showBackgroundCallScreen(callerName: callerName, callerId: callerId)
            }
        }
    }
} 