package com.workflow.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Register plugins before calling super.onCreate
        registerPlugins(NativePlugins.getPluginClasses());
        
        super.onCreate(savedInstanceState);
    }
}
