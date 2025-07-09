import UIKit
import Capacitor
import FirebaseCore
import FirebaseMessaging
import UserNotifications
import CallKit

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // Override point for customization after application launch.
        
        // Configure Firebase
        FirebaseApp.configure()
        
        // Set up push notifications
        setupPushNotifications(application)
        
        return true
    }
    
    private func setupPushNotifications(_ application: UIApplication) {
        print("🔔 Setting up push notifications...")
        
        // Set messaging delegate
        Messaging.messaging().delegate = self
        
        // Set notification delegate
        UNUserNotificationCenter.current().delegate = self
        
        // Request permission
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound, .badge]) { granted, error in
            print("Permission granted: \(granted)")
            if let error = error {
                print("Error requesting permission: \(error)")
            }
        }
        
        application.registerForRemoteNotifications()
    }

    func applicationWillResignActive(_ application: UIApplication) {
        // Sent when the application is about to move from active to inactive state. This can occur for certain types of temporary interruptions (such as an incoming phone call or SMS message) or when the user quits the application and it begins the transition to the background state.
        // Use this method to pause ongoing tasks, disable timers, and invalidate graphics rendering callbacks. Games should use this method to pause the game.
    }

    func applicationDidEnterBackground(_ application: UIApplication) {
        // Use this method to release shared resources, save user data, invalidate timers, and store enough application state information to restore your application to its current state in case it is terminated later.
        // If your application supports background execution, this method is called instead of applicationWillTerminate: when the user quits the application.
    }

    func applicationWillEnterForeground(_ application: UIApplication) {
        // Called as part of the transition from the background to the active state; here you can undo many of the changes made on entering the background.
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
        // Restart any tasks that were paused (or not yet started) while the application was inactive. If the application was previously in the background, optionally refresh the user interface.
        application.applicationIconBadgeNumber = 0
    }

    func applicationWillTerminate(_ application: UIApplication) {
        // Called when the application is about to terminate. Save data if appropriate. See also applicationDidEnterBackground:.
    }

    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        // Called when the app was launched with a url. Feel free to add additional processing here,
        // but if you want the App API to support tracking app url opens, make sure to keep this call
        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
    }

    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        // Called when the app was launched with an activity, including Universal Links.
        // Feel free to add additional processing here, but if you want the App API to support
        // tracking app url opens, make sure to keep this call
        return ApplicationDelegateProxy.shared.application(application, continue: userActivity, restorationHandler: restorationHandler)
    }
    
    // MARK: - Push Notifications
    func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
        print("📱 Registered for remote notifications")
        Messaging.messaging().apnsToken = deviceToken
    }
    
    func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: Error) {
        print("❌ Failed to register for remote notifications: \(error)")
    }
    
    // Handle background push notifications
    func application(_ application: UIApplication, didReceiveRemoteNotification userInfo: [AnyHashable : Any], fetchCompletionHandler completionHandler: @escaping (UIBackgroundFetchResult) -> Void) {
        print("📱 [Background] ========== PUSH NOTIFICATION RECEIVED ==========")
        print("📱 [Background] Full userInfo: \(userInfo)")
        print("📱 [Background] App state: \(application.applicationState.rawValue)") // 0=active, 1=inactive, 2=background
        
        // Debug: Print all top-level keys
        print("📱 [Background] Top-level keys: \(Array(userInfo.keys))")
        
        // Check if this is an iOS CallKit notification (direct data from FCM withData)
        if let type = userInfo["type"] as? String,
           type == "ios_call" {
            
            let callerName = userInfo["callerName"] as? String ?? "Unknown Caller"
            let callerId = userInfo["callerId"] as? String ?? "unknown"
            let callType = userInfo["callType"] as? String ?? "voice"
            
            print("📞 [Background] ✅ iOS CallKit notification detected (root level)!")
            print("📞 [Background] Caller: \(callerName), ID: \(callerId), Type: \(callType)")
            triggerCallKit(callerName: callerName, callerId: callerId, callType: callType)
            
            completionHandler(.newData)
            return
        }
        
        // Check APNS payload nested structure
        if let data = userInfo["data"] as? [String: Any],
           let type = data["type"] as? String,
           type == "ios_call" {
            
            let callerName = data["callerName"] as? String ?? "Unknown Caller"
            let callerId = data["callerId"] as? String ?? "unknown"
            let callType = data["callType"] as? String ?? "voice"
            
            print("📞 [Background] ✅ iOS CallKit notification detected (APNS data)!")
            print("📞 [Background] Caller: \(callerName), ID: \(callerId), Type: \(callType)")
            triggerCallKit(callerName: callerName, callerId: callerId, callType: callType)
            
            completionHandler(.newData)
            return
        }
        
        // Check Google FCM format (gcm.notification.data)
        if let gcm = userInfo["gcm"] as? [String: Any],
           let notificationData = gcm["notification"] as? [String: Any],
           let data = notificationData["data"] as? [String: Any],
           let type = data["type"] as? String,
           type == "ios_call" {
            
            let callerName = data["callerName"] as? String ?? "Unknown Caller"
            let callerId = data["callerId"] as? String ?? "unknown"
            let callType = data["callType"] as? String ?? "voice"
            
            print("📞 [Background] ✅ iOS CallKit notification detected (GCM format)!")
            print("📞 [Background] Caller: \(callerName), ID: \(callerId), Type: \(callType)")
            triggerCallKit(callerName: callerName, callerId: callerId, callType: callType)
            
            completionHandler(.newData)
            return
        }
        
        // Check if triggerCallKit is explicitly set
        if let triggerCallKitFlag = userInfo["triggerCallKit"] as? String,
           triggerCallKitFlag == "true" {
            
            let callerName = userInfo["callerName"] as? String ?? "Unknown Caller"
            let callerId = userInfo["callerId"] as? String ?? "unknown"
            let callType = userInfo["callType"] as? String ?? "voice"
            
            print("📞 [Background] ✅ CallKit trigger detected!")
            print("📞 [Background] Caller: \(callerName), ID: \(callerId), Type: \(callType)")
            triggerCallKit(callerName: callerName, callerId: callerId, callType: callType)
            
            completionHandler(.newData)
            return
        }
        
        // Check if this is a DesktopCallEvent (fallback to custom modal)
        if let data = userInfo["data"] as? [String: Any],
           let type = data["type"] as? String,
           type == "DesktopCallEvent" {
            
            let callerName = data["callerName"] as? String ?? "Unknown Caller"
            let callerId = data["callerId"] as? String ?? "unknown"
            
            print("📞 [Background] DesktopCallEvent detected - showing call screen")
            showBackgroundCallScreen(callerName: callerName, callerId: callerId)
        } else {
            print("❌ [Background] No matching notification type found")
            print("❌ [Background] Expected patterns:")
            print("   - userInfo['type'] = 'ios_call'")
            print("   - userInfo['data']['type'] = 'ios_call'")
            print("   - userInfo['triggerCallKit'] = 'true'")
            print("   - userInfo['data']['type'] = 'DesktopCallEvent'")
        }
        
        completionHandler(.newData)
    }
    
    // MARK: - CallKit Integration
    private func triggerCallKit(callerName: String, callerId: String, callType: String) {
        print("📞 [CallKit] Triggering CallKit for: \(callerName)")
        print("📞 [CallKit] About to access CallKitManager.shared")
        
        DispatchQueue.main.async {
            // Use CallKitManager to show native call interface
            print("📞 [CallKit] Inside DispatchQueue, getting CallKitManager instance")
            let callKitManager = CallKitManager.shared
            print("📞 [CallKit] Got CallKitManager instance: \(type(of: callKitManager))")
            
            let isVideoCall = (callType == "video")
            print("📞 [CallKit] About to call showIncomingCall with isVideo: \(isVideoCall)")
            
            callKitManager.showIncomingCall(callerName: callerName, callerId: callerId, isVideo: isVideoCall)
        }
    }
    
    public func showBackgroundCallScreen(callerName: String, callerId: String) {
        print("📞 Creating background call screen for: \(callerName)")
        
        DispatchQueue.main.async {
            // Create the call screen
            let callScreen = self.createCallScreenViewController(callerName: callerName, callerId: callerId)
            
            // Present it over everything
            if let window = self.window,
               let rootVC = window.rootViewController {
                
                // If there's already a presented VC, present over it
                var topVC = rootVC
                while let presentedVC = topVC.presentedViewController {
                    topVC = presentedVC
                }
                
                topVC.present(callScreen, animated: true) {
                    print("📞 Background call screen presented successfully")
                }
            }
        }
    }
    
    private func createCallScreenViewController(callerName: String, callerId: String) -> UIViewController {
        let callVC = UIViewController()
        callVC.modalPresentationStyle = .fullScreen
        
        // Black background
        callVC.view.backgroundColor = UIColor.black
        
        // Caller name label
        let nameLabel = UILabel()
        nameLabel.text = callerName
        nameLabel.textColor = .white
        nameLabel.font = UIFont.systemFont(ofSize: 32, weight: .medium)
        nameLabel.textAlignment = .center
        nameLabel.translatesAutoresizingMaskIntoConstraints = false
        
        // Status label
        let statusLabel = UILabel()
        statusLabel.text = "Incoming call..."
        statusLabel.textColor = .lightGray
        statusLabel.font = UIFont.systemFont(ofSize: 18)
        statusLabel.textAlignment = .center
        statusLabel.translatesAutoresizingMaskIntoConstraints = false
        
        // Accept button
        let acceptButton = UIButton()
        acceptButton.setTitle("Accept", for: .normal)
        acceptButton.backgroundColor = .systemGreen
        acceptButton.setTitleColor(.white, for: .normal)
        acceptButton.layer.cornerRadius = 35
        acceptButton.titleLabel?.font = UIFont.systemFont(ofSize: 18, weight: .medium)
        acceptButton.translatesAutoresizingMaskIntoConstraints = false
        acceptButton.addTarget(self, action: #selector(acceptCallTapped), for: .touchUpInside)
        
        // Decline button
        let declineButton = UIButton()
        declineButton.setTitle("Decline", for: .normal)
        declineButton.backgroundColor = .systemRed
        declineButton.setTitleColor(.white, for: .normal)
        declineButton.layer.cornerRadius = 35
        declineButton.titleLabel?.font = UIFont.systemFont(ofSize: 18, weight: .medium)
        declineButton.translatesAutoresizingMaskIntoConstraints = false
        declineButton.addTarget(self, action: #selector(declineCallTapped), for: .touchUpInside)
        
        // Add views
        callVC.view.addSubview(nameLabel)
        callVC.view.addSubview(statusLabel)
        callVC.view.addSubview(acceptButton)
        callVC.view.addSubview(declineButton)
        
        // Set up constraints
        NSLayoutConstraint.activate([
            // Name label
            nameLabel.centerXAnchor.constraint(equalTo: callVC.view.centerXAnchor),
            nameLabel.topAnchor.constraint(equalTo: callVC.view.safeAreaLayoutGuide.topAnchor, constant: 100),
            nameLabel.leadingAnchor.constraint(greaterThanOrEqualTo: callVC.view.leadingAnchor, constant: 20),
            nameLabel.trailingAnchor.constraint(lessThanOrEqualTo: callVC.view.trailingAnchor, constant: -20),
            
            // Status label
            statusLabel.centerXAnchor.constraint(equalTo: callVC.view.centerXAnchor),
            statusLabel.topAnchor.constraint(equalTo: nameLabel.bottomAnchor, constant: 20),
            
            // Accept button
            acceptButton.leadingAnchor.constraint(equalTo: callVC.view.leadingAnchor, constant: 60),
            acceptButton.bottomAnchor.constraint(equalTo: callVC.view.safeAreaLayoutGuide.bottomAnchor, constant: -80),
            acceptButton.widthAnchor.constraint(equalToConstant: 120),
            acceptButton.heightAnchor.constraint(equalToConstant: 70),
            
            // Decline button
            declineButton.trailingAnchor.constraint(equalTo: callVC.view.trailingAnchor, constant: -60),
            declineButton.bottomAnchor.constraint(equalTo: callVC.view.safeAreaLayoutGuide.bottomAnchor, constant: -80),
            declineButton.widthAnchor.constraint(equalToConstant: 120),
            declineButton.heightAnchor.constraint(equalToConstant: 70)
        ])
        
        // Store caller info for button actions
        callVC.view.accessibilityIdentifier = callerId
        
        return callVC
    }
    
    @objc private func acceptCallTapped() {
        print("✅ Call accepted")
        dismissCallScreen()
        showCallResult(title: "Call Accepted ✅", message: "Call has been accepted")
    }
    
    @objc private func declineCallTapped() {
        print("❌ Call declined")
        dismissCallScreen()
        showCallResult(title: "Call Declined ❌", message: "Call has been declined")
    }
    
    private func dismissCallScreen() {
        DispatchQueue.main.async {
            if let window = self.window,
               let rootVC = window.rootViewController {
                
                var topVC = rootVC
                while let presentedVC = topVC.presentedViewController {
                    topVC = presentedVC
                }
                
                topVC.dismiss(animated: true)
            }
        }
    }
    
    private func showCallResult(title: String, message: String) {
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
            if let window = self.window,
               let rootVC = window.rootViewController {
                
                var topVC = rootVC
                while let presentedVC = topVC.presentedViewController {
                    topVC = presentedVC
                }
                
                let alert = UIAlertController(title: title, message: message, preferredStyle: .alert)
                alert.addAction(UIAlertAction(title: "OK", style: .default))
                topVC.present(alert, animated: true)
            }
        }
    }
}

// MARK: - MessagingDelegate
extension AppDelegate: MessagingDelegate {
    func messaging(_ messaging: Messaging, didReceiveRegistrationToken fcmToken: String?) {
        print("FCM registration token: \(fcmToken ?? "nil")")
    }
}

// MARK: - UNUserNotificationCenterDelegate
extension AppDelegate: UNUserNotificationCenterDelegate {
    // Handle notifications when app is in foreground
    func userNotificationCenter(_ center: UNUserNotificationCenter, willPresent notification: UNNotification, withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
        print("📞 [Foreground] ========== NOTIFICATION RECEIVED ==========")
        print("📞 [Foreground] Title: \(notification.request.content.title)")
        print("📞 [Foreground] Body: \(notification.request.content.body)")
        
        let userInfo = notification.request.content.userInfo
        print("📞 [Foreground] Full userInfo: \(userInfo)")
        print("📞 [Foreground] Top-level keys: \(Array(userInfo.keys))")
        
        // Check if this is an iOS CallKit notification (direct data from FCM withData)
        if let type = userInfo["type"] as? String,
           type == "ios_call" {
            
            let callerName = userInfo["callerName"] as? String ?? "Unknown Caller"
            let callerId = userInfo["callerId"] as? String ?? "unknown"
            let callType = userInfo["callType"] as? String ?? "voice"
            
            print("📞 [Foreground] ✅ iOS CallKit notification detected (root level)!")
            print("📞 [Foreground] Caller: \(callerName), ID: \(callerId), Type: \(callType)")
            triggerCallKit(callerName: callerName, callerId: callerId, callType: callType)
            
            // Don't show the notification banner since we're showing CallKit
            completionHandler([])
            return
        }
        
        // Check APNS payload nested structure
        if let data = userInfo["data"] as? [String: Any],
           let type = data["type"] as? String,
           type == "ios_call" {
            
            let callerName = data["callerName"] as? String ?? "Unknown Caller"
            let callerId = data["callerId"] as? String ?? "unknown"
            let callType = data["callType"] as? String ?? "voice"
            
            print("📞 [Foreground] ✅ iOS CallKit notification detected (APNS data)!")
            print("📞 [Foreground] Caller: \(callerName), ID: \(callerId), Type: \(callType)")
            triggerCallKit(callerName: callerName, callerId: callerId, callType: callType)
            
            // Don't show the notification banner since we're showing CallKit
            completionHandler([])
            return
        }
        
        // Check Google FCM format (gcm.notification.data)
        if let gcm = userInfo["gcm"] as? [String: Any],
           let notificationData = gcm["notification"] as? [String: Any],
           let data = notificationData["data"] as? [String: Any],
           let type = data["type"] as? String,
           type == "ios_call" {
            
            let callerName = data["callerName"] as? String ?? "Unknown Caller"
            let callerId = data["callerId"] as? String ?? "unknown"
            let callType = data["callType"] as? String ?? "voice"
            
            print("📞 [Foreground] ✅ iOS CallKit notification detected (GCM format)!")
            print("📞 [Foreground] Caller: \(callerName), ID: \(callerId), Type: \(callType)")
            triggerCallKit(callerName: callerName, callerId: callerId, callType: callType)
            
            // Don't show the notification banner since we're showing CallKit
            completionHandler([])
            return
        }
        
        // Check if triggerCallKit is explicitly set
        if let triggerCallKitFlag = userInfo["triggerCallKit"] as? String,
           triggerCallKitFlag == "true" {
            
            let callerName = userInfo["callerName"] as? String ?? "Unknown Caller"
            let callerId = userInfo["callerId"] as? String ?? "unknown"
            let callType = userInfo["callType"] as? String ?? "voice"
            
            print("📞 [Foreground] ✅ CallKit trigger detected!")
            print("📞 [Foreground] Caller: \(callerName), ID: \(callerId), Type: \(callType)")
            triggerCallKit(callerName: callerName, callerId: callerId, callType: callType)
            
            // Don't show the notification banner since we're showing CallKit
            completionHandler([])
            return
        }
        
        // Check if this is a DesktopCallEvent (fallback to custom modal)
        if let data = userInfo["data"] as? [String: Any],
           let type = data["type"] as? String,
           type == "DesktopCallEvent" {
            
            let callerName = data["callerName"] as? String ?? "Unknown Caller"
            let callerId = data["callerId"] as? String ?? "unknown"
            
            print("📞 [Foreground] DesktopCallEvent detected - showing call screen")
            showBackgroundCallScreen(callerName: callerName, callerId: callerId)
            
            // Don't show the notification banner since we're showing the call screen
            completionHandler([])
        } else {
            print("❌ [Foreground] No matching notification type found")
            print("❌ [Foreground] Expected patterns:")
            print("   - userInfo['type'] = 'ios_call'")
            print("   - userInfo['data']['type'] = 'ios_call'")
            print("   - userInfo['triggerCallKit'] = 'true'")
            print("   - userInfo['data']['type'] = 'DesktopCallEvent'")
            // Show other notifications normally
            completionHandler([.alert, .sound, .badge])
        }
    }
    
    // Handle notification actions
    func userNotificationCenter(_ center: UNUserNotificationCenter, didReceive response: UNNotificationResponse, withCompletionHandler completionHandler: @escaping () -> Void) {
        print("📞 Notification action received: \(response.actionIdentifier)")
        completionHandler()
    }
}
