import Foundation
import Capacitor

@objc(CallKitPlugin)
public class CallKitPlugin: CAPPlugin {
    
    private let callKitManager = CallKitManager.shared
    
    override public func load() {
        super.load()
        
        // Listen for call events
        NotificationCenter.default.addObserver(self, selector: #selector(callDidStart), name: .callDidStart, object: nil)
        NotificationCenter.default.addObserver(self, selector: #selector(callDidAnswer), name: .callDidAnswer, object: nil)
        NotificationCenter.default.addObserver(self, selector: #selector(callDidEnd), name: .callDidEnd, object: nil)
        NotificationCenter.default.addObserver(self, selector: #selector(callDidHold), name: .callDidHold, object: nil)
        NotificationCenter.default.addObserver(self, selector: #selector(callDidMute), name: .callDidMute, object: nil)
    }
    
    deinit {
        NotificationCenter.default.removeObserver(self)
    }
    
    // MARK: - JavaScript Methods
    
    @objc func reportIncomingCall(_ call: CAPPluginCall) {
        guard let callerName = call.getString("callerName"),
              let callerNumber = call.getString("callerNumber") else {
            call.reject("Missing required parameters: callerName, callerNumber")
            return
        }
        
        callKitManager.reportIncomingCall(callerName: callerName, callerNumber: callerNumber) { error in
            DispatchQueue.main.async {
                if let error = error {
                    call.reject("Failed to report incoming call: \(error.localizedDescription)")
                } else {
                    call.resolve([
                        "success": true,
                        "message": "Incoming call reported successfully"
                    ])
                }
            }
        }
    }
    
    @objc func startOutgoingCall(_ call: CAPPluginCall) {
        guard let phoneNumber = call.getString("phoneNumber"),
              let contactName = call.getString("contactName") else {
            call.reject("Missing required parameters: phoneNumber, contactName")
            return
        }
        
        callKitManager.startOutgoingCall(to: phoneNumber, contactName: contactName)
        
        call.resolve([
            "success": true,
            "message": "Outgoing call started successfully"
        ])
    }
    
    @objc func endCall(_ call: CAPPluginCall) {
        guard let callUUIDString = call.getString("callUUID"),
              let callUUID = UUID(uuidString: callUUIDString) else {
            call.reject("Missing or invalid callUUID parameter")
            return
        }
        
        callKitManager.endCall(callUUID: callUUID)
        
        call.resolve([
            "success": true,
            "message": "Call ended successfully"
        ])
    }
    
    @objc func setCallOnHold(_ call: CAPPluginCall) {
        guard let callUUIDString = call.getString("callUUID"),
              let callUUID = UUID(uuidString: callUUIDString) else {
            call.reject("Missing or invalid callUUID parameter")
            return
        }
        
        let onHold = call.getBool("onHold") ?? false
        
        callKitManager.setCallOnHold(callUUID: callUUID, onHold: onHold)
        
        call.resolve([
            "success": true,
            "message": "Call hold status updated successfully"
        ])
    }
    
    // MARK: - Event Handlers
    
    @objc private func callDidStart(_ notification: Notification) {
        guard let callUUID = notification.object as? UUID else { return }
        
        notifyListeners("callDidStart", data: [
            "callUUID": callUUID.uuidString,
            "timestamp": Date().timeIntervalSince1970
        ])
    }
    
    @objc private func callDidAnswer(_ notification: Notification) {
        guard let callUUID = notification.object as? UUID else { return }
        
        notifyListeners("callDidAnswer", data: [
            "callUUID": callUUID.uuidString,
            "timestamp": Date().timeIntervalSince1970
        ])
    }
    
    @objc private func callDidEnd(_ notification: Notification) {
        guard let callUUID = notification.object as? UUID else { return }
        
        notifyListeners("callDidEnd", data: [
            "callUUID": callUUID.uuidString,
            "timestamp": Date().timeIntervalSince1970
        ])
    }
    
    @objc private func callDidHold(_ notification: Notification) {
        guard let data = notification.object as? [String: Any],
              let callUUID = data["uuid"] as? UUID,
              let isOnHold = data["isOnHold"] as? Bool else { return }
        
        notifyListeners("callDidHold", data: [
            "callUUID": callUUID.uuidString,
            "isOnHold": isOnHold,
            "timestamp": Date().timeIntervalSince1970
        ])
    }
    
    @objc private func callDidMute(_ notification: Notification) {
        guard let data = notification.object as? [String: Any],
              let callUUID = data["uuid"] as? UUID,
              let isMuted = data["isMuted"] as? Bool else { return }
        
        notifyListeners("callDidMute", data: [
            "callUUID": callUUID.uuidString,
            "isMuted": isMuted,
            "timestamp": Date().timeIntervalSince1970
        ])
    }
} 