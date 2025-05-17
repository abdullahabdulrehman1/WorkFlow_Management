package com.workflow.app;

import com.getcapacitor.Plugin;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

public class NativePlugins {
    public static List<Class<? extends Plugin>> getPluginClasses() {
        return Arrays.asList(
            CallPlugin.class
            // Add any other custom plugins here
        );
    }
}