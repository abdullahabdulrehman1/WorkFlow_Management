import UIKit

class MockCallScreenViewController: UIViewController {
    
    override func viewDidLoad() {
        super.viewDidLoad()
        print("🎭 MockCallScreenViewController viewDidLoad called")
        setupCallScreenUI()
        print("🎭 MockCallScreenViewController UI setup completed")
    }
    
    override func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)
        print("🎭 MockCallScreenViewController appeared on screen")
    }
    
    private func setupCallScreenUI() {
        print("🎭 Setting up call screen UI...")
        
        // Background
        view.backgroundColor = UIColor.black
        
        // Contact name
        let nameLabel = UILabel()
        nameLabel.text = "Workflow Test Call"
        nameLabel.textColor = .white
        nameLabel.font = UIFont.systemFont(ofSize: 28, weight: .light)
        nameLabel.textAlignment = .center
        nameLabel.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(nameLabel)
        
        // Status label
        let statusLabel = UILabel()
        statusLabel.text = "incoming call..."
        statusLabel.textColor = UIColor.lightGray
        statusLabel.font = UIFont.systemFont(ofSize: 16)
        statusLabel.textAlignment = .center
        statusLabel.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(statusLabel)
        
        // Avatar circle
        let avatarView = UIView()
        avatarView.backgroundColor = UIColor.gray
        avatarView.layer.cornerRadius = 80
        avatarView.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(avatarView)
        
        // Avatar icon
        let avatarLabel = UILabel()
        avatarLabel.text = "📞"
        avatarLabel.font = UIFont.systemFont(ofSize: 60)
        avatarLabel.textAlignment = .center
        avatarLabel.translatesAutoresizingMaskIntoConstraints = false
        avatarView.addSubview(avatarLabel)
        
        // Decline button (red)
        let declineButton = UIButton()
        declineButton.backgroundColor = UIColor.systemRed
        declineButton.setTitle("✕", for: .normal)
        declineButton.titleLabel?.font = UIFont.systemFont(ofSize: 30, weight: .light)
        declineButton.layer.cornerRadius = 35
        declineButton.translatesAutoresizingMaskIntoConstraints = false
        declineButton.addTarget(self, action: #selector(dismissCall), for: .touchUpInside)
        view.addSubview(declineButton)
        
        // Accept button (green)
        let acceptButton = UIButton()
        acceptButton.backgroundColor = UIColor.systemGreen
        acceptButton.setTitle("📞", for: .normal)
        acceptButton.titleLabel?.font = UIFont.systemFont(ofSize: 24)
        acceptButton.layer.cornerRadius = 35
        acceptButton.translatesAutoresizingMaskIntoConstraints = false
        acceptButton.addTarget(self, action: #selector(acceptCall), for: .touchUpInside)
        view.addSubview(acceptButton)
        
        // Layout constraints
        NSLayoutConstraint.activate([
            // Avatar
            avatarView.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            avatarView.centerYAnchor.constraint(equalTo: view.centerYAnchor, constant: -100),
            avatarView.widthAnchor.constraint(equalToConstant: 160),
            avatarView.heightAnchor.constraint(equalToConstant: 160),
            
            // Avatar icon
            avatarLabel.centerXAnchor.constraint(equalTo: avatarView.centerXAnchor),
            avatarLabel.centerYAnchor.constraint(equalTo: avatarView.centerYAnchor),
            
            // Name
            nameLabel.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            nameLabel.topAnchor.constraint(equalTo: avatarView.bottomAnchor, constant: 30),
            nameLabel.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 20),
            nameLabel.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -20),
            
            // Status
            statusLabel.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            statusLabel.topAnchor.constraint(equalTo: nameLabel.bottomAnchor, constant: 10),
            
            // Buttons
            declineButton.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 80),
            declineButton.bottomAnchor.constraint(equalTo: view.safeAreaLayoutGuide.bottomAnchor, constant: -50),
            declineButton.widthAnchor.constraint(equalToConstant: 70),
            declineButton.heightAnchor.constraint(equalToConstant: 70),
            
            acceptButton.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -80),
            acceptButton.bottomAnchor.constraint(equalTo: view.safeAreaLayoutGuide.bottomAnchor, constant: -50),
            acceptButton.widthAnchor.constraint(equalToConstant: 70),
            acceptButton.heightAnchor.constraint(equalToConstant: 70),
        ])
        
        print("🎭 UI constraints applied successfully")
    }
    
    @objc private func acceptCall() {
        print("📞 Mock call accepted!")
        showCallConnectedScreen()
    }
    
    @objc private func dismissCall() {
        print("❌ Mock call declined!")
        dismiss(animated: true, completion: nil)
    }
    
    private func showCallConnectedScreen() {
        print("📞 Showing call connected screen")
        let alertController = UIAlertController(title: "Call Connected", message: "Mock call is now active", preferredStyle: .alert)
        alertController.addAction(UIAlertAction(title: "End Call", style: .destructive) { _ in
            print("📞 Ending call from alert")
            self.dismiss(animated: true, completion: nil)
        })
        present(alertController, animated: true, completion: nil)
    }
} 