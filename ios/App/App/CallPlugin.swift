import Foundation
import Capacitor
import UserNotifications
import UIKit

// MARK: - Custom Call Screen Controller

class CustomCallScreenViewController: UIViewController {
    
    // MARK: - UI Elements
    private let backgroundImageView = UIImageView()
    private let callerNameLabel = UILabel()
    private let callerStatusLabel = UILabel()
    private let callerAvatarImageView = UIImageView()
    
    private let acceptButton = UIButton(type: .custom)
    private let declineButton = UIButton(type: .custom)
    private let buttonStackView = UIStackView()
    
    // MARK: - Properties
    var callerName: String = "Unknown Caller"
    var callerId: String = "unknown"
    var callType: String = "voice"
    var onAccept: (() -> Void)?
    var onDecline: (() -> Void)?
    
    // MARK: - Lifecycle
    override func viewDidLoad() {
        super.viewDidLoad()
        setupUI()
        setupConstraints()
        startRingingAnimation()
    }
    
    override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(animated)
        // Hide navigation bar for full screen effect
        navigationController?.setNavigationBarHidden(true, animated: animated)
    }
    
    // MARK: - UI Setup
    private func setupUI() {
        view.backgroundColor = UIColor.black
        
        // Background with gradient
        let gradientLayer = CAGradientLayer()
        gradientLayer.colors = [
            UIColor(red: 0.1, green: 0.1, blue: 0.2, alpha: 1.0).cgColor,
            UIColor.black.cgColor
        ]
        gradientLayer.locations = [0.0, 1.0]
        gradientLayer.frame = view.bounds
        view.layer.insertSublayer(gradientLayer, at: 0)
        
        // Caller Avatar
        callerAvatarImageView.contentMode = .scaleAspectFill
        callerAvatarImageView.layer.cornerRadius = 80
        callerAvatarImageView.layer.masksToBounds = true
        callerAvatarImageView.backgroundColor = UIColor.systemBlue
        callerAvatarImageView.image = createAvatarImage(with: String(callerName.prefix(1)).uppercased())
        
        // Caller Name
        callerNameLabel.text = callerName
        callerNameLabel.textColor = .white
        callerNameLabel.font = UIFont.systemFont(ofSize: 28, weight: .medium)
        callerNameLabel.textAlignment = .center
        callerNameLabel.numberOfLines = 2
        
        // Caller Status
        callerStatusLabel.text = callType == "video" ? "incoming video call" : "incoming call"
        callerStatusLabel.textColor = UIColor.lightGray
        callerStatusLabel.font = UIFont.systemFont(ofSize: 16, weight: .regular)
        callerStatusLabel.textAlignment = .center
        
        // Accept Button (Green)
        acceptButton.backgroundColor = UIColor.systemGreen
        acceptButton.setTitle("Accept", for: .normal)
        acceptButton.setTitleColor(.white, for: .normal)
        acceptButton.titleLabel?.font = UIFont.systemFont(ofSize: 18, weight: .semibold)
        acceptButton.layer.cornerRadius = 35
        acceptButton.addTarget(self, action: #selector(acceptButtonTapped), for: .touchUpInside)
        
        // Decline Button (Red)
        declineButton.backgroundColor = UIColor.systemRed
        declineButton.setTitle("Decline", for: .normal)
        declineButton.setTitleColor(.white, for: .normal)
        declineButton.titleLabel?.font = UIFont.systemFont(ofSize: 18, weight: .semibold)
        declineButton.layer.cornerRadius = 35
        declineButton.addTarget(self, action: #selector(declineButtonTapped), for: .touchUpInside)
        
        // Button Stack
        buttonStackView.axis = .horizontal
        buttonStackView.distribution = .fillEqually
        buttonStackView.spacing = 60
        buttonStackView.addArrangedSubview(declineButton)
        buttonStackView.addArrangedSubview(acceptButton)
        
        // Add to view
        [callerAvatarImageView, callerNameLabel, callerStatusLabel, buttonStackView].forEach {
            $0.translatesAutoresizingMaskIntoConstraints = false
            view.addSubview($0)
        }
    }
    
    private func setupConstraints() {
        NSLayoutConstraint.activate([
            // Caller Avatar
            callerAvatarImageView.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            callerAvatarImageView.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor, constant: 80),
            callerAvatarImageView.widthAnchor.constraint(equalToConstant: 160),
            callerAvatarImageView.heightAnchor.constraint(equalToConstant: 160),
            
            // Caller Name
            callerNameLabel.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            callerNameLabel.topAnchor.constraint(equalTo: callerAvatarImageView.bottomAnchor, constant: 30),
            callerNameLabel.leadingAnchor.constraint(greaterThanOrEqualTo: view.leadingAnchor, constant: 20),
            callerNameLabel.trailingAnchor.constraint(lessThanOrEqualTo: view.trailingAnchor, constant: -20),
            
            // Caller Status
            callerStatusLabel.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            callerStatusLabel.topAnchor.constraint(equalTo: callerNameLabel.bottomAnchor, constant: 10),
            
            // Button Stack
            buttonStackView.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            buttonStackView.bottomAnchor.constraint(equalTo: view.safeAreaLayoutGuide.bottomAnchor, constant: -50),
            buttonStackView.heightAnchor.constraint(equalToConstant: 70),
            buttonStackView.widthAnchor.constraint(equalToConstant: 200),
            
            // Individual button constraints
            acceptButton.heightAnchor.constraint(equalToConstant: 70),
            acceptButton.widthAnchor.constraint(equalToConstant: 70),
            declineButton.heightAnchor.constraint(equalToConstant: 70),
            declineButton.widthAnchor.constraint(equalToConstant: 70)
        ])
    }
    
    // MARK: - Avatar Creation
    private func createAvatarImage(with initial: String) -> UIImage? {
        let size = CGSize(width: 160, height: 160)
        UIGraphicsBeginImageContextWithOptions(size, false, 0)
        defer { UIGraphicsEndImageContext() }
        
        let context = UIGraphicsGetCurrentContext()
        
        // Draw background circle
        context?.setFillColor(UIColor.systemBlue.cgColor)
        context?.fillEllipse(in: CGRect(origin: .zero, size: size))
        
        // Draw initial
        let font = UIFont.systemFont(ofSize: 60, weight: .medium)
        let textAttributes: [NSAttributedString.Key: Any] = [
            .font: font,
            .foregroundColor: UIColor.white
        ]
        
        let textSize = initial.size(withAttributes: textAttributes)
        let textRect = CGRect(
            x: (size.width - textSize.width) / 2,
            y: (size.height - textSize.height) / 2,
            width: textSize.width,
            height: textSize.height
        )
        
        initial.draw(in: textRect, withAttributes: textAttributes)
        
        return UIGraphicsGetImageFromCurrentImageContext()
    }
    
    // MARK: - Animations
    private func startRingingAnimation() {
        // Pulse animation for avatar
        let pulseAnimation = CABasicAnimation(keyPath: "transform.scale")
        pulseAnimation.duration = 1.0
        pulseAnimation.fromValue = 1.0
        pulseAnimation.toValue = 1.05
        pulseAnimation.autoreverses = true
        pulseAnimation.repeatCount = .infinity
        callerAvatarImageView.layer.add(pulseAnimation, forKey: "pulse")
        
        // Bounce animation for buttons
        UIView.animate(withDuration: 0.6, delay: 0.3, options: [.repeat, .autoreverse], animations: {
            self.buttonStackView.transform = CGAffineTransform(scaleX: 1.05, y: 1.05)
        }, completion: nil)
    }
    
    // MARK: - Button Actions
    @objc private func acceptButtonTapped() {
        print("📞 [CustomCallScreen] ✅ Accept button tapped")
        
        // Stop animations
        stopAnimations()
        
        // Animate button press
        UIView.animate(withDuration: 0.1, animations: {
            self.acceptButton.transform = CGAffineTransform(scaleX: 0.95, y: 0.95)
        }) { _ in
            UIView.animate(withDuration: 0.1) {
                self.acceptButton.transform = .identity
            }
        }
        
        // Call the accept callback
        onAccept?()
        
        // Dismiss after a short delay
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
            self.dismiss(animated: true)
        }
    }
    
    @objc private func declineButtonTapped() {
        print("📞 [CustomCallScreen] ❌ Decline button tapped")
        
        // Stop animations
        stopAnimations()
        
        // Animate button press
        UIView.animate(withDuration: 0.1, animations: {
            self.declineButton.transform = CGAffineTransform(scaleX: 0.95, y: 0.95)
        }) { _ in
            UIView.animate(withDuration: 0.1) {
                self.declineButton.transform = .identity
            }
        }
        
        // Call the decline callback
        onDecline?()
        
        // Dismiss immediately
        dismiss(animated: true)
    }
    
    private func stopAnimations() {
        callerAvatarImageView.layer.removeAllAnimations()
        buttonStackView.layer.removeAllAnimations()
        view.layer.removeAllAnimations()
    }
    
    // MARK: - Public Methods
    func updateCallInfo(callerName: String, callerId: String, callType: String) {
        self.callerName = callerName
        self.callerId = callerId
        self.callType = callType
        
        if isViewLoaded {
            callerNameLabel.text = callerName
            callerStatusLabel.text = callType == "video" ? "incoming video call" : "incoming call"
            callerAvatarImageView.image = createAvatarImage(with: String(callerName.prefix(1)).uppercased())
        }
    }
}

// MARK: - CallPlugin

/**
 * CallPlugin for showing native iOS call interface via CallKit
 * Integrates with CallKitManager for WhatsApp-style native call screens
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
    
    private var customCallScreen: CustomCallScreenViewController?

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
     * Start a call - shows native iOS CallKit interface with custom fallback
     */
    @objc func startCall(_ call: CAPPluginCall) {
        print("📞 [CallPlugin] startCall called")
        
        let callerId = call.getString("callerId") ?? "test-user"
        let callerName = call.getString("callerName") ?? "Test Call"
        let callType = call.getString("callType") ?? "audio"
        
        print("📞 [CallPlugin] Starting call to: \(callerName) (\(callerId)), type: \(callType)")
        
        DispatchQueue.main.async {
            // Try CallKit first (for real devices)
            let isVideo = (callType == "video" || callType == "video")
            
            do {
                print("📞 [CallPlugin] 🎯 Attempting CallKit first...")
                CallKitManager.shared.showIncomingCall(callerName: callerName, callerId: callerId, isVideo: isVideo)
                
                // Give CallKit a moment to initialize
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                    // Check if CallKit worked by seeing if we have an active call
                    // For now, we'll always show our custom screen as well for simulator compatibility
                    print("📞 [CallPlugin] 🎨 Also showing custom call screen for simulator compatibility...")
                    self.showCustomCallScreen(callerName: callerName, callerId: callerId, callType: callType)
                }
                
                call.resolve([
                    "success": true,
                    "callId": UUID().uuidString,
                    "platform": "ios-callkit-with-custom-fallback",
                    "message": "CallKit attempted, custom screen shown for compatibility"
                ])
                
            } catch {
                print("📞 [CallPlugin] ❌ CallKit failed, showing custom screen: \(error)")
                self.showCustomCallScreen(callerName: callerName, callerId: callerId, callType: callType)
                
                call.resolve([
                    "success": true,
                    "callId": UUID().uuidString,
                    "platform": "ios-custom-screen",
                    "message": "Custom call screen shown (CallKit unavailable)"
                ])
            }
        }
    }
    
    // MARK: - Custom Call Screen Methods
    
    private func showCustomCallScreen(callerName: String, callerId: String, callType: String) {
        print("📞 [CallPlugin] 🎨 Showing custom call screen for: \(callerName)")
        
        guard let rootViewController = UIApplication.shared.windows.first?.rootViewController else {
            print("❌ [CallPlugin] Could not get root view controller")
            return
        }
        
        // Dismiss any existing custom call screen
        if let existingScreen = customCallScreen {
            existingScreen.dismiss(animated: false)
            customCallScreen = nil
        }
        
        // Create new custom call screen
        customCallScreen = CustomCallScreenViewController()
        customCallScreen?.updateCallInfo(callerName: callerName, callerId: callerId, callType: callType)
        
        // Set up callbacks
        customCallScreen?.onAccept = {
            print("📞 [CallPlugin] ✅ Custom call screen - Accept button tapped")
            // Here you could trigger actual call logic
            self.customCallScreen?.dismiss(animated: true)
            self.customCallScreen = nil
        }
        
        customCallScreen?.onDecline = {
            print("📞 [CallPlugin] ❌ Custom call screen - Decline button tapped")
            // Here you could trigger call rejection logic
            self.customCallScreen?.dismiss(animated: true)
            self.customCallScreen = nil
        }
        
        // Present the call screen modally (full screen)
        customCallScreen?.modalPresentationStyle = .fullScreen
        customCallScreen?.modalTransitionStyle = .crossDissolve
        
        rootViewController.present(customCallScreen!, animated: true) {
            print("📞 [CallPlugin] ✅ Custom call screen presented successfully")
        }
    }
    
    /**
     * End a call
     */
    @objc func endCall(_ call: CAPPluginCall) {
        print("📞 [CallPlugin] endCall called")
        
        DispatchQueue.main.async {
            // Dismiss custom call screen if showing
            if let existingScreen = self.customCallScreen {
                existingScreen.dismiss(animated: true)
                self.customCallScreen = nil
                print("📞 [CallPlugin] Custom call screen dismissed")
            }
            
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