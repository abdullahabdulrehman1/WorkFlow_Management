import Foundation
import Capacitor

@objc(CallPlugin)
public class CallPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "CallPlugin"
    public let jsName = "CallPlugin"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "showTestCall", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "showMockCallScreen", returnType: CAPPluginReturnPromise)
    ]

    @objc func showTestCall(_ call: CAPPluginCall) {
        CallKitManager.shared.showTestCall()
        call.resolve(["success": true, "message": "Real CallKit triggered"])
    }
    
    @objc func showMockCallScreen(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            // Create and present the mock call screen
            let mockCallVC = MockCallScreenViewController()
            mockCallVC.modalPresentationStyle = .fullScreen
            
            // Get the current view controller
            guard let currentVC = self.bridge?.viewController else {
                call.reject("Unable to get current view controller")
                return
            }
            
            // Present the mock call screen
            currentVC.present(mockCallVC, animated: true) {
                print("🎭 Mock call screen presented!")
                call.resolve(["success": true, "message": "Mock call screen shown"])
            }
        }
    }
} 