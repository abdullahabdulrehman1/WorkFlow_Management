import Foundation
import CallKit
import AVFoundation

@objc(CallKitManager)
public class CallKitManager: NSObject {
    // MARK: - Singleton
    @objc public static let shared: CallKitManager = CallKitManager()

    // MARK: - Properties
    private let provider: CXProvider
    private let callController = CXCallController()

    // Prevent external initialisation
    private override init() {
        // Configure the provider with a localized name that will be shown on the system UI
        let configuration: CXProviderConfiguration
        configuration = CXProviderConfiguration(localizedName: "Workflow")
        configuration.supportsVideo = false
        if #available(iOS 14.0, *) {
            configuration.includesCallsInRecents = false
        }

        // Optional: Set a custom ringtone if desired (expects the sound file to be in the app bundle)
        // configuration.ringtoneSound = "ringtone.caf"

        self.provider = CXProvider(configuration: configuration)
        super.init()
        self.provider.setDelegate(self, queue: nil)
        
        print("[CallKitManager] ✅ Successfully initialized CallKit provider")
    }

    // MARK: - Public API
    @objc public func showTestCall() {
        showIncomingCall(callerName: "Workflow Test", callerId: "test", isVideo: false)
    }
    
    @objc public func showIncomingCall(callerName: String, callerId: String, isVideo: Bool) {
        print("[CallKitManager] 🔥 showIncomingCall() called for: \(callerName)")
        print("[CallKitManager] 📞 Call details - ID: \(callerId), Video: \(isVideo)")
        
        // Request audio session, otherwise the system may silence the ringtone in silent mode
        do {
            try AVAudioSession.sharedInstance().setCategory(.playAndRecord, mode: .voiceChat, options: [])
            try AVAudioSession.sharedInstance().setActive(true)
            print("[CallKitManager] ✅ Audio session configured successfully")
        } catch {
            print("[CallKitManager] ❌ Audio session error: \(error.localizedDescription)")
        }

        let callUUID = UUID()
        let update = CXCallUpdate()
        update.remoteHandle = CXHandle(type: .generic, value: callerName)
        update.hasVideo = isVideo
        update.localizedCallerName = callerName
        
        print("[CallKitManager] 📞 About to report incoming call with UUID: \(callUUID)")
        print("[CallKitManager] 📞 Caller: \(callerName), Video: \(isVideo)")

        provider.reportNewIncomingCall(with: callUUID, update: update) { error in
            if let error = error {
                print("[CallKitManager] ❌ Failed to report new incoming call: \(error.localizedDescription)")
                print("[CallKitManager] ❌ Error details: \(error)")
                
                // Log common error reasons for debugging
                let errorCode = (error as NSError).code
                switch errorCode {
                case 1: // CXErrorCodeIncomingCallError.unknown
                    print("[CallKitManager] ❌ Unknown error - check entitlements and device capabilities")
                case 2: // CXErrorCodeIncomingCallError.unentitled  
                    print("[CallKitManager] ❌ Missing CallKit entitlements in app")
                case 3: // CXErrorCodeIncomingCallError.callUUIDAlreadyExists
                    print("[CallKitManager] ❌ Call UUID already exists")
                default:
                    print("[CallKitManager] ❌ Error code: \(errorCode)")
                }
            } else {
                print("[CallKitManager] ✅ Incoming call successfully reported for: \(callerName)")
                print("[CallKitManager] 🎉 CallKit should now show the native call interface!")
            }
        }
    }
}

// MARK: - CXProviderDelegate
extension CallKitManager: CXProviderDelegate {
    public func providerDidReset(_ provider: CXProvider) {
        print("[CallKitManager] 🔄 Provider did reset")
    }

    public func provider(_ provider: CXProvider, perform action: CXAnswerCallAction) {
        // Accept the call immediately for the test scenario
        action.fulfill()
        print("[CallKitManager] ✅ Call answered")
    }

    public func provider(_ provider: CXProvider, perform action: CXEndCallAction) {
        action.fulfill()
        print("[CallKitManager] ✅ Call ended")
    }

    // Implement other delegate methods if needed but mark as fulfilled to avoid warnings
    public func provider(_ provider: CXProvider, perform action: CXStartCallAction) {
        action.fulfill()
        print("[CallKitManager] ✅ Call started")
    }

    public func provider(_ provider: CXProvider, didActivate audioSession: AVAudioSession) {
        print("[CallKitManager] 🔊 Audio session activated")
        // Audio session activated – start call audio if needed
    }

    public func provider(_ provider: CXProvider, didDeactivate audioSession: AVAudioSession) {
        print("[CallKitManager] 🔇 Audio session deactivated")
        // Audio session de-activated – stop or pause audio if needed
    }
} 