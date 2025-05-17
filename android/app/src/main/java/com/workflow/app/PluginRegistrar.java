package com.workflow.app;

import com.getcapacitor.BridgeActivity;

public class PluginRegistrar {
    public static void registerPlugins(BridgeActivity activity) {
        // Register our custom CallPlugin
        activity.registerPlugin(CallPlugin.class);
    }
}