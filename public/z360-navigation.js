// URL Navigation Handler for z360.biz domains
(function() {
    'use strict';
    
    // Store original functions
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    const originalOpen = window.open;
    
    // Function to check if URL is a z360.biz domain
    function isZ360Domain(url) {
        try {
            const urlObj = new URL(url, window.location.origin);
            const hostname = urlObj.hostname;
            return hostname === 'app.z360.biz' || hostname.endsWith('.z360.biz');
        } catch (e) {
            return false;
        }
    }
    
    // Override history.pushState
    history.pushState = function(state, title, url) {
        if (url && isZ360Domain(url)) {
            console.log('Intercepting pushState for z360.biz URL:', url);
            window.location.href = url;
            return;
        }
        return originalPushState.apply(this, arguments);
    };
    
    // Override history.replaceState
    history.replaceState = function(state, title, url) {
        if (url && isZ360Domain(url)) {
            console.log('Intercepting replaceState for z360.biz URL:', url);
            window.location.href = url;
            return;
        }
        return originalReplaceState.apply(this, arguments);
    };
    
    // Override window.open
    window.open = function(url, target, features) {
        if (url && isZ360Domain(url) && (!target || target === '_self' || target === '_top')) {
            console.log('Intercepting window.open for z360.biz URL:', url);
            window.location.href = url;
            return window;
        }
        return originalOpen.apply(this, arguments);
    };
    
    // Intercept all link clicks
    document.addEventListener('click', function(event) {
        const target = event.target.closest('a');
        if (target && target.href && isZ360Domain(target.href)) {
            event.preventDefault();
            console.log('Intercepting link click for z360.biz URL:', target.href);
            window.location.href = target.href;
        }
    }, true);
    
    // Intercept form submissions
    document.addEventListener('submit', function(event) {
        const form = event.target;
        if (form && form.action && isZ360Domain(form.action)) {
            console.log('Form submission to z360.biz domain detected:', form.action);
            // Allow form to submit normally as it's within our domain
        }
    }, true);
    
    // Monitor for programmatic redirects
    const originalAssign = location.assign;
    const originalReplace = location.replace;
    
    location.assign = function(url) {
        if (isZ360Domain(url)) {
            console.log('Intercepting location.assign for z360.biz URL:', url);
            window.location.href = url;
            return;
        }
        return originalAssign.call(this, url);
    };
    
    location.replace = function(url) {
        if (isZ360Domain(url)) {
            console.log('Intercepting location.replace for z360.biz URL:', url);
            window.location.href = url;
            return;
        }
        return originalReplace.call(this, url);
    };
    
    console.log('z360.biz URL navigation handler initialized');
})();