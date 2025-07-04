import UIKit
import Capacitor

class ViewController: CAPBridgeViewController {
    override func viewDidLoad() {
        super.viewDidLoad()
        
        // Register our custom CallPlugin
        bridge?.registerPluginInstance(CallPlugin())
    }
} 