import Foundation
import Capacitor
import UserNotifications
import UIKit

/**
 * CallPlugin for showing native iOS CallKit interface
 * Clean implementation focused purely on CallKit functionality
 */
@objc(CallPlugin)
public class CallPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "CallPlugin"
    public let jsName = "CallPlugin"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "startCall", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "endCall", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "reportIncomingCall", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "showCallNotification", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "hideCallNotification", returnType: CAPPluginReturnPromise)
    ]

    public override init() {
        super.init()
        print("🔧 CallPlugin init() called")
        setupNotificationActions()
    }

    @objc override public func load() {
        print("🔧 CallPlugin load() called")
        print("🔧 CallPlugin loaded successfully with methods: \(pluginMethods.map { $0.name })")
    }
    
    // MARK: - CallKit Methods
    
    /**
     * Start a call - shows native iOS CallKit interface
     */
    @objc func startCall(_ call: CAPPluginCall) {
        print("📞 [CallPlugin] startCall called")
        
        let callerId = call.getString("callerId") ?? "test-user"
        let callerName = call.getString("callerName") ?? "Test Call"
        let callType = call.getString("callType") ?? "audio"
        
        print("📞 [CallPlugin] Starting call to: \(callerName) (\(callerId)), type: \(callType)")
        
        DispatchQueue.main.async {
            // Use CallKitManager to show native incoming call interface
            let isVideo = (callType == "video")
            CallKitManager.shared.showIncomingCall(callerName: callerName, callerId: callerId, isVideo: isVideo)
            
            call.resolve([
                "success": true,
                "callId": UUID().uuidString,
                "platform": "ios-callkit",
                "message": "Native iOS CallKit screen triggered"
            ])
        }
    }
    
    /**
     * End a call
     */
    @objc func endCall(_ call: CAPPluginCall) {
        print("📞 [CallPlugin] endCall called")
        
        DispatchQueue.main.async {
            // In a real implementation, you would end the actual call here
            // For now, we'll just acknowledge the end call request
            
            call.resolve([
                "success": true,
                "message": "Call ended"
            ])
        }
    }
    
    /**
     * Report an incoming call - alternative method name for compatibility
     */
    @objc func reportIncomingCall(_ call: CAPPluginCall) {
        print("📞 [CallPlugin] reportIncomingCall called")
        
        let callerName = call.getString("callerName") ?? "Unknown Caller"
        let callerNumber = call.getString("callerNumber") ?? "unknown"
        let callType = call.getString("callType") ?? "audio"
        
        print("📞 [CallPlugin] Reporting incoming call from: \(callerName)")
        
        DispatchQueue.main.async {
            let isVideo = (callType == "video")
            CallKitManager.shared.showIncomingCall(callerName: callerName, callerId: callerNumber, isVideo: isVideo)
            
            call.resolve([
                "success": true,
                "callId": UUID().uuidString,
                "platform": "ios-callkit"
            ])
        }
    }
    
    // MARK: - Notification Methods (Fallback)
    
    private func setupNotificationActions() {
        print("📞 Setting up call notification actions...")
        
        // Define Accept action
        let acceptAction = UNNotificationAction(
            identifier: "ACCEPT_CALL",
            title: "Accept",
            options: [.foreground]
        )
        
        // Define Decline action
        let declineAction = UNNotificationAction(
            identifier: "DECLINE_CALL",
            title: "Decline",
            options: [.destructive]
        )
        
        // Create the category
        let callCategory = UNNotificationCategory(
            identifier: "CALL_CATEGORY",
            actions: [acceptAction, declineAction],
            intentIdentifiers: [],
            options: [.customDismissAction]
        )
        
        // Register the category
        UNUserNotificationCenter.current().setNotificationCategories([callCategory])
        print("📞 Call notification actions registered")
    }

    @objc func showCallNotification(_ call: CAPPluginCall) {
        print("📞 showCallNotification called")
        
        let callerName = call.getString("callerName") ?? "Unknown Caller"
        let callerId = call.getString("callerId") ?? "unknown"
        
        print("📞 Creating call notification for: \(callerName)")
        
        DispatchQueue.main.async {
            self.createCallNotification(callerName: callerName, callerId: callerId) { success in
                if success {
                    call.resolve([
                        "success": true,
                        "message": "Call notification shown"
                    ])
                } else {
                    call.reject("Failed to show call notification")
                }
            }
        }
    }
    
    @objc func hideCallNotification(_ call: CAPPluginCall) {
        print("📞 hideCallNotification called")
        
        DispatchQueue.main.async {
            UNUserNotificationCenter.current().removePendingNotificationRequests(withIdentifiers: ["incoming_call"])
            UNUserNotificationCenter.current().removeDeliveredNotifications(withIdentifiers: ["incoming_call"])
            
            call.resolve([
                "success": true,
                "message": "Call notification hidden"
            ])
        }
    }
    
    private func createCallNotification(callerName: String, callerId: String, completion: @escaping (Bool) -> Void) {
        let content = UNMutableNotificationContent()
        content.title = "Incoming Call"
        content.body = "\(callerName) is calling..."
        content.sound = UNNotificationSound.default
        content.categoryIdentifier = "CALL_CATEGORY"
        
        // Add custom data
        content.userInfo = [
            "callerId": callerId,
            "callerName": callerName,
            "type": "incoming_call"
        ]
        
        // Create request
        let request = UNNotificationRequest(
            identifier: "incoming_call",
            content: content,
            trigger: nil // Show immediately
        )
        
        // Add the notification
        UNUserNotificationCenter.current().add(request) { error in
            DispatchQueue.main.async {
                if let error = error {
                    print("❌ Error showing call notification: \(error)")
                    completion(false)
                } else {
                    print("✅ Call notification added successfully")
                    completion(true)
                }
            }
        }
    }
} 