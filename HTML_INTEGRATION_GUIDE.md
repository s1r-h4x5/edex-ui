# HTML Integration Guide - Advanced Animations

## 📝 Update UI.HTML

Add these lines to your `src/ui.html` file:

### Step 1: Add CSS Links (in the `<head>` section)

```html
<!-- Existing CSS files -->
<link rel="stylesheet" href="assets/css/main.css?v=25.9.8">
<link rel="stylesheet" href="assets/css/boot_screen.css?v=25.9.8">
<!-- ... other existing CSS files ... -->

<!-- ADD THESE NEW LINES -->
<link rel="stylesheet" href="assets/css/animations_advanced.css?v=1.0">
<!-- End new CSS -->
```

### Step 2: Add JavaScript Imports (before closing `</body>`)

```html
<!-- Existing scripts -->
<script src="https://cdn.jsdelivr.net/npm/three@r128/build/three.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/cannon-es@0.20.0/dist/cannon-es.js"></script>
<!-- ... other scripts ... -->

<!-- ADD THESE NEW LINES -->
<script src="utils/advancedAnimations.js?v=1.0"></script>
<!-- End new scripts -->
```

---

## 🔧 Global Initialization

Add this initialization code in your main startup script or in a new `_advancedAnimations.js` file:

### Option A: Add to Existing Boot Script

If you have a `_boot.js` file, add this section:

```javascript
// Advanced Animations Initialization
let advancedAnimationsReady = false;

async function initializeAdvancedAnimations() {
    try {
        // Initialize accessibility manager
        const a11yManager = new AccessibilityManager();
        
        // Log user preferences
        logger.log('accessibility', {
            prefersReducedMotion: a11yManager.prefersReducedMotion,
            highContrast: a11yManager.highContrast,
            darkMode: a11yManager.darkMode
        });

        // Respect reduced motion preference globally
        if (!a11yManager.prefersReducedMotion) {
            document.body.classList.add('animations-enabled');
        }

        advancedAnimationsReady = true;
        logger.success('Advanced animations system initialized');
    } catch (error) {
        logger.error('Failed to initialize advanced animations', error);
    }
}

// Call after DOM is ready
document.addEventListener('DOMContentLoaded', initializeAdvancedAnimations);
```

### Option B: Create New File `src/_advancedAnimations.js`

```javascript
/**
 * Advanced Animations System Initialization
 * Initializes all animation utilities and accessibility features
 */

// Store global references
window.animationSystem = {
    audio: null,
    mouse: null,
    accessibility: null,
    initialized: false
};

async function initializeAnimationSystem() {
    try {
        // 1. Initialize Accessibility Manager
        window.animationSystem.accessibility = new AccessibilityManager();

        // 2. Setup global accessibility classes
        const a11y = window.animationSystem.accessibility;
        if (a11y.prefersReducedMotion) {
            document.body.classList.add('reduced-motion');
            document.body.style.setProperty('--animation-duration', '0.01s');
        }

        if (a11y.highContrast) {
            document.body.classList.add('high-contrast');
        }

        if (a11y.darkMode) {
            document.body.classList.add('dark-mode');
        }

        // 3. Apply color blind filter if needed
        if (a11y.colorBlindMode !== 'normal') {
            const filter = `url(#colorblind-${a11y.colorBlindMode})`;
            document.body.style.filter = filter;
            logger.log('Applied color blind mode:', a11y.colorBlindMode);
        }

        // 4. Wait for 3D engine to be ready
        if (window.threeDEngine) {
            // Initialize audio-reactive module (requires user interaction)
            setupAudioReactiveSystem();
        }

        // 5. Setup mouse interactions
        setupMouseInteractions();

        // 6. Setup notification system
        setupNotificationSystem();

        window.animationSystem.initialized = true;
        logger.success('Animation system fully initialized');

    } catch (error) {
        logger.error('Animation system initialization error:', error);
    }
}

/**
 * Initialize audio-reactive visualization
 * Triggered by user interaction (clicks) due to browser autoplay policy
 */
function setupAudioReactiveSystem() {
    if (window.animationSystem.audio) return; // Already initialized

    const initAudioOnInteraction = async () => {
        try {
            window.animationSystem.audio = new AudioReactiveModule();
            await window.animationSystem.audio.init();

            logger.log('Audio-reactive system ready');

            // Remove this listener since we only need to initialize once
            document.removeEventListener('click', initAudioOnInteraction);
            document.removeEventListener('keydown', initAudioOnInteraction);

        } catch (error) {
            logger.warn('Audio initialization requires HTTPS or user permission:', error);
        }
    };

    // Audio requires user interaction to initialize
    document.addEventListener('click', initAudioOnInteraction, { once: true });
    document.addEventListener('keydown', initAudioOnInteraction, { once: true });
}

/**
 * Setup mouse interaction effects
 */
function setupMouseInteractions() {
    if (!window.threeDEngine) return;

    window.animationSystem.mouse = new MouseInteraction(window.threeDEngine);

    // Add click ripples globally
    document.addEventListener('click', (e) => {
        window.animationSystem.mouse.createClickRipple(e.clientX, e.clientY);
    });

    // Optional: Add cursor trail
    // window.animationSystem.mouse.createCursorTrail('#00ff00', 15);

    logger.log('Mouse interactions enabled');
}

/**
 * Setup global notification system
 */
function setupNotificationSystem() {
    // Create notification container if it doesn't exist
    if (!document.querySelector('.notification-container')) {
        const container = document.createElement('div');
        container.className = 'notification-container bottom-right';
        document.body.appendChild(container);
    }

    // Expose global notify function
    window.notify = function(message, type = 'info', duration = 4000) {
        const container = document.querySelector('.notification-container');
        const notification = document.createElement('div');
        notification.className = `notification notification-${type} animate-slide-in`;
        notification.innerHTML = `
            <div class="notification-icon">${getNotificationIcon(type)}</div>
            <div class="notification-content">${message}</div>
            <button class="notification-close">×</button>
        `;

        container.appendChild(notification);

        const dismissTimer = setTimeout(() => dismiss(), duration);

        notification.querySelector('.notification-close').addEventListener('click', dismiss);

        function dismiss() {
            clearTimeout(dismissTimer);
            notification.classList.add('closing');
            notification.style.animation = 'slideOutNotification 0.3s ease-in';
            setTimeout(() => notification.remove(), 300);
        }
    };

    logger.log('Notification system ready');
}

function getNotificationIcon(type) {
    const icons = {
        'success': '✓',
        'error': '✕',
        'warning': '⚠',
        'info': 'ℹ'
    };
    return icons[type] || '•';
}

/**
 * Module Enhancement: Add animations to all new modules
 */
function enhanceModuleAnimations() {
    // Animate module titles on appearance
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1 && node.classList.contains('mod')) { // Element node
                        const title = node.querySelector('.mod-title');
                        if (title) {
                            const originalText = title.textContent;
                            title.textContent = '';
                            TextAnimations.revealText(title, originalText, 0.8);
                        }

                        // Animate initial content
                        node.classList.add('animate-fade-in');
                    }
                });
            }
        });
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}

/**
 * Keyboard Shortcut Support
 */
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Alt + A: Toggle animations
        if (e.altKey && e.key === 'a') {
            e.preventDefault();
            document.body.classList.toggle('animations-disabled');
            window.notify(
                document.body.classList.contains('animations-disabled') 
                    ? 'Animations disabled' 
                    : 'Animations enabled'
            );
        }

        // Alt + C: Toggle contrast
        if (e.altKey && e.key === 'c') {
            e.preventDefault();
            const a11y = window.animationSystem.accessibility;
            a11y.setHighContrast(!a11y.highContrast);
            document.body.classList.toggle('high-contrast');
            window.notify('High contrast toggled');
        }

        // Alt + M: Cycle color blind modes
        if (e.altKey && e.key === 'm') {
            e.preventDefault();
            const modes = ['normal', 'deuteranopia', 'protanopia', 'tritanopia', 'achromatopsia'];
            const a11y = window.animationSystem.accessibility;
            const currentIndex = modes.indexOf(a11y.colorBlindMode);
            const nextIndex = (currentIndex + 1) % modes.length;
            a11y.setColorBlindMode(modes[nextIndex]);
            window.notify(`Color blind mode: ${modes[nextIndex]}`);
        }
    });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initializeAnimationSystem();
        enhanceModuleAnimations();
        setupKeyboardShortcuts();
    });
} else {
    initializeAnimationSystem();
    enhanceModuleAnimations();
    setupKeyboardShortcuts();
}

// Export for external use
export { initializeAnimationSystem };
```

Then add to ui.html:
```html
<script src="_advancedAnimations.js?v=1.0"></script>
```

---

## 🎯 Specific Module Enhancements

### CPU Info Module - Add Audio Reactivity

File: `src/classes/cpuinfo.class.js`

Add to the class:

```javascript
// Add to constructor
this.audioVisualizer = null;

// Add method to initialize audio visualization
setupAudioVisualization() {
    if (!window.animationSystem?.audio) return;

    try {
        this.audioVisualizer = window.animationSystem.audio.createAudioBars(16);
        // Position bars in the visualizer area
        const container = this.module.querySelector('.cpu-bars');
        if (container && this.audioVisualizer) {
            container.appendChild(this.audioVisualizer);
        }
    } catch (error) {
        logger.warn('Audio visualization not available:', error);
    }
}

// Call in refresh method
refresh(data) {
    // ... existing code ...
    this.setupAudioVisualization();
}
```

### System Info Module - Animated Counters

File: `src/classes/sysinfo.class.js`

```javascript
refresh(data) {
    // Animate the version number increases
    const uptimeEl = this.module.querySelector('.uptime-value');
    if (uptimeEl) {
        const oldValue = parseFloat(uptimeEl.textContent) || 0;
        const newValue = data.uptime;
        
        if (newValue !== oldValue) {
            TextAnimations.animateNumber(uptimeEl, oldValue, newValue, 0.5, 2);
        }
    }

    // Apply wave effect to hostnames
    const hostnameEl = this.module.querySelector('.hostname');
    if (hostnameEl) {
        hostnameEl.classList.add('animate-wave');
    }
}
```

### RAM Watcher - Smooth Transitions

File: `src/classes/ramwatcher.class.js`

```javascript
// Enhanced refresh with animations
async refresh() {
    const oldPercentage = this.ramPercentage?.value || 0;
    
    // ... existing code to update ramPercentage ...

    // Animate the percentage change
    const percentEl = this.module.querySelector('.ram-percentage');
    if (percentEl && this.ramPercentage.value !== oldPercentage) {
        await TextAnimations.animateNumber(
            percentEl,
            oldPercentage,
            this.ramPercentage.value,
            0.3,
            1
        );
    }

    // Add pulse effect if high usage
    const bar = this.module.querySelector('.ram-bar');
    if (this.ramPercentage.value > 80) {
        bar.classList.add('animate-pulse');
    } else {
        bar.classList.remove('animate-pulse');
    }
}
```

---

## 🎨 Global CSS Enhancements

Add to your `main.css`:

```css
/* Global animation variables */
:root {
    --animation-duration: 0.3s;
    --animation-easing: cubic-bezier(0.4, 0, 0.2, 1);
}

/* Respect user preferences */
@media (prefers-reduced-motion: reduce) {
    :root {
        --animation-duration: 0.01s;
    }

    * {
        animation-duration: 0.01s !important;
        transition-duration: 0.01s !important;
    }
}

/* High contrast mode */
body.high-contrast {
    --text-color: #ffffff;
    --border-color: #ffff00;
    --bg-color: #000000;
}

/* Ensure smooth animations */
.animate-fade-in,
.animate-pulse,
.animate-bounce {
    animation-timing-function: var(--animation-easing);
}

/* GPU acceleration for transforms */
.mod,
.notification,
.terminal-line {
    will-change: transform, opacity;
    backface-visibility: hidden;
    perspective: 1000px;
}
```

---

## 🧪 Testing Checklist

```html
<!-- Add these test buttons to verify everything works -->
<div id="animation-test-panel" style="
    position: fixed;
    bottom: 20px;
    left: 20px;
    background: rgba(0,0,0,0.8);
    border: 1px solid #00ff00;
    padding: 10px;
    border-radius: 4px;
    font-size: 12px;
    z-index: 10000;
    color: #00ff00;
    font-family: monospace;
">
    <div style="margin-bottom: 5px; font-weight: bold;">Animation Tests</div>
    <button onclick="testFadeAnimation()" style="display: block; margin: 2px; width: 100%;">
        Test Fade
    </button>
    <button onclick="testSlideAnimation()" style="display: block; margin: 2px; width: 100%;">
        Test Slide
    </button>
    <button onclick="testTextAnimation()" style="display: block; margin: 2px; width: 100%;">
        Test Text
    </button>
    <button onclick="notifyTest()" style="display: block; margin: 2px; width: 100%;">
        Test Notify
    </button>
</div>

<script>
function testFadeAnimation() {
    const el = document.createElement('div');
    el.textContent = 'Fade Test';
    el.style.cssText = 'position: fixed; top: 50%; left: 50%; color: #00ff00;';
    document.body.appendChild(el);
    
    TransitionEffects.fadeOut(el, 1).then(() => el.remove());
}

function testSlideAnimation() {
    const el = document.createElement('div');
    el.textContent = 'Slide In Test';
    el.style.cssText = 'position: fixed; top: 30%; left: 20%; color: #00ffff;';
    document.body.appendChild(el);
    
    TransitionEffects.slideIn(el, 'left', 1).then(() => {
        setTimeout(() => TransitionEffects.slideIn(el, 'left', 0.5), 1000);
    });
}

function testTextAnimation() {
    if (!document.querySelector('.text-test')) {
        const el = document.createElement('div');
        el.className = 'text-test';
        el.style.cssText = 'position: fixed; bottom: 50%; left: 10%; color: #ffff00; font-size: 14px;';
        document.body.appendChild(el);
    }
    
    const el = document.querySelector('.text-test');
    TextAnimations.revealText(el, 'Animation Working!', 2);
}

function notifyTest() {
    if (window.notify) {
        window.notify('✓ Notifications working!', 'success', 3000);
    } else {
        console.warn('Notification system not initialized');
    }
}
</script>
```

---

## ✅ Verification Steps

After integration:

1. **Open DevTools Console**: Check for any errors
2. **Check Network Tab**: Verify CSS and JS files load
3. **Test Accessibility**: Disable animations in browser settings
4. **Performance Monitor**: Check FPS stays above 30
5. **Mobile Test**: Verify touch interactions work
6. **Cross-browser**: Test in Chrome, Firefox, Safari, Edge

**Expected Results:**
- ✅ All animations smooth (60fps)
- ✅ No console errors
- ✅ Reduced motion respected
- ✅ Notifications appear/dismiss smoothly
- ✅ Module titles reveal on load
- ✅ Click ripples visible

---

**Implementation Status**: Ready for Production ✅
