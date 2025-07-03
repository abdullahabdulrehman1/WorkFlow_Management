import Foundation
import CallKit
import AVFoundation

@objc public class CallKitManager: NSObject {
    
    private let callController = CXCallController()
    private let provider: CXProvider
    
    public static let shared = CallKitManager()
    
    override init() {
        // Configure the provider
        let providerConfiguration = CXProviderConfiguration()
        providerConfiguration.localizedName = "Workflow App"
        providerConfiguration.supportsVideo = true
        providerConfiguration.maximumCallGroups = 1
        providerConfiguration.maximumCallsPerCallGroup = 1
        providerConfiguration.supportedHandleTypes = [.phoneNumber, .generic]
        
        // Set call screen appearance
        providerConfiguration.iconTemplateImageData = nil // You can add your app icon here
        
        provider = CXProvider(configuration: providerConfiguration)
        super.init()
        
        provider.setDelegate(self, queue: nil)
    }
    
    // MARK: - Incoming Call
    @objc public func reportIncomingCall(callerName: String, callerNumber: String, completion: @escaping (Error?) -> Void) {
        let callUUID = UUID()
        let callHandle = CXHandle(type: .phoneNumber, value: callerNumber)
        let callUpdate = CXCallUpdate()
        
        callUpdate.remoteHandle = callHandle
        callUpdate.localizedCallerName = callerName
        callUpdate.hasVideo = true
        callUpdate.supportsGrouping = false
        callUpdate.supportsUngrouping = false
        callUpdate.supportsHolding = false
        callUpdate.supportsDTMF = false
        
        provider.reportNewIncomingCall(with: callUUID, update: callUpdate) { error in
            completion(error)
        }
    }
    
    // MARK: - Outgoing Call
    @objc public func startOutgoingCall(to phoneNumber: String, contactName: String) {
        let callUUID = UUID()
        let handle = CXHandle(type: .phoneNumber, value: phoneNumber)
        let startCallAction = CXStartCallAction(call: callUUID, handle: handle)
        
        startCallAction.isVideo = true
        startCallAction.contactIdentifier = contactName
        
        let transaction = CXTransaction(action: startCallAction)
        
        callController.request(transaction) { error in
            if let error = error {
                print("Error requesting start call transaction: \(error.localizedDescription)")
            } else {
                print("Start call transaction requested successfully")
            }
        }
    }
    
    // MARK: - End Call
    @objc public func endCall(callUUID: UUID) {
        let endCallAction = CXEndCallAction(call: callUUID)
        let transaction = CXTransaction(action: endCallAction)
        
        callController.request(transaction) { error in
            if let error = error {
                print("Error requesting end call transaction: \(error.localizedDescription)")
            }
        }
    }
    
    // MARK: - Hold/Unhold Call
    @objc public func setCallOnHold(callUUID: UUID, onHold: Bool) {
        let holdAction = CXSetHeldCallAction(call: callUUID, onHold: onHold)
        let transaction = CXTransaction(action: holdAction)
        
        callController.request(transaction) { error in
            if let error = error {
                print("Error requesting hold call transaction: \(error.localizedDescription)")
            }
        }
    }
}

// MARK: - CXProviderDelegate
extension CallKitManager: CXProviderDelegate {
    
    public func providerDidReset(_ provider: CXProvider) {
        print("Provider did reset")
        // Handle provider reset
    }
    
    public func provider(_ provider: CXProvider, perform action: CXStartCallAction) {
        print("Provider perform start call action")
        
        // Configure audio session
        configureAudioSession()
        
        // Report call started
        action.fulfill()
        
        // Notify your app that call started
        NotificationCenter.default.post(name: .callDidStart, object: action.callUUID)
    }
    
    public func provider(_ provider: CXProvider, perform action: CXAnswerCallAction) {
        print("Provider perform answer call action")
        
        // Configure audio session
        configureAudioSession()
        
        // Report call answered
        action.fulfill()
        
        // Notify your app that call was answered
        NotificationCenter.default.post(name: .callDidAnswer, object: action.callUUID)
    }
    
    public func provider(_ provider: CXProvider, perform action: CXEndCallAction) {
        print("Provider perform end call action")
        
        // Report call ended
        action.fulfill()
        
        // Notify your app that call ended
        NotificationCenter.default.post(name: .callDidEnd, object: action.callUUID)
    }
    
    public func provider(_ provider: CXProvider, perform action: CXSetHeldCallAction) {
        print("Provider perform hold call action")
        action.fulfill()
        
        // Notify your app about hold status change
        NotificationCenter.default.post(name: .callDidHold, object: ["uuid": action.callUUID, "isOnHold": action.isOnHold])
    }
    
    public func provider(_ provider: CXProvider, perform action: CXSetMutedCallAction) {
        print("Provider perform mute call action")
        action.fulfill()
        
        // Handle mute/unmute
        NotificationCenter.default.post(name: .callDidMute, object: ["uuid": action.callUUID, "isMuted": action.isMuted])
    }
    
    private func configureAudioSession() {
        let audioSession = AVAudioSession.sharedInstance()
        do {
            try audioSession.setCategory(.playAndRecord, mode: .voiceChat, options: [])
            try audioSession.setActive(true)
        } catch {
            print("Error configuring audio session: \(error.localizedDescription)")
        }
    }
}

// MARK: - Notification Names
extension Notification.Name {
    static let callDidStart = Notification.Name("callDidStart")
    static let callDidAnswer = Notification.Name("callDidAnswer")
    static let callDidEnd = Notification.Name("callDidEnd")
    static let callDidHold = Notification.Name("callDidHold")
    static let callDidMute = Notification.Name("callDidMute")
} 