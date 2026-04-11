/**
 * Advanced Animations System Initialization
 * Initializes all animation utilities and accessibility features
 * Runs automatically when DOM is ready
 */

// Store global references
window.animationSystem = {
    audio: null,
    mouse: null,
    accessibility: null,
    initialized: false
};

/**
 * Main initialization function for animation system
 */
async function initializeAnimationSystem() {
    try {
        // 1. Initialize Accessibility Manager
        window.animationSystem.accessibility = new AccessibilityManager();

        // 2. Setup global accessibility classes
        const a11y = window.animationSystem.accessibility;
        if (a11y.prefersReducedMotion) {
            document.body.classList.add('reduced-motion');
            document.body.style.setProperty('--animation-duration', '0.01s');
            logger.log('Animation system', 'Reduced motion enabled - animations minimized');
        }

        if (a11y.highContrast) {
            document.body.classList.add('high-contrast');
            logger.log('Animation system', 'High contrast mode enabled');
        }

        if (a11y.darkMode) {
            document.body.classList.add('dark-mode');
        }

        // 3. Apply color blind filter if needed
        if (a11y.colorBlindMode !== 'normal') {
            const filterId = `colorblind-${a11y.colorBlindMode}`;
            
            // Create SVG filter container if it doesn't exist
            let svg = document.querySelector('svg[data-filters="colorblind"]');
            if (!svg) {
                svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                svg.setAttribute('style', 'display: none;');
                svg.setAttribute('data-filters', 'colorblind');
                svg.innerHTML = `
                    <defs>
                        <!-- Deuteranopia (Green-Blind) -->
                        <filter id="colorblind-deuteranopia">
                            <feColorMatrix type="matrix" values="
                                0.625  0.375  0     0  0
                                0.7    0.3    0     0  0
                                0      0.3    0.7   0  0
                                0      0      0     1  0
                            "/>
                        </filter>

                        <!-- Protanopia (Red-Blind) -->
                        <filter id="colorblind-protanopia">
                            <feColorMatrix type="matrix" values="
                                0.567  0.433  0     0  0
                                0.558  0.442  0     0  0
                                0      0.242  0.758 0  0
                                0      0      0     1  0
                            "/>
                        </filter>

                        <!-- Tritanopia (Blue-Yellow-Blind) -->
                        <filter id="colorblind-tritanopia">
                            <feColorMatrix type="matrix" values="
                                0.95   0.05   0     0  0
                                0      0.433  0.567 0  0
                                0      0.475  0.525 0  0
                                0      0      0     1  0
                            "/>
                        </filter>

                        <!-- Achromatopsia (Complete Color Blindness) -->
                        <filter id="colorblind-achromatopsia">
                            <feColorMatrix type="saturate" values="0"/>
                        </filter>
                    </defs>
                `;
                document.body.appendChild(svg);
            }

            const filter = `url(#${filterId})`;
            document.body.style.filter = filter;
            logger.log('Animation system', `Applied color blind mode: ${a11y.colorBlindMode}`);
        }

        // 4. Wait for 3D engine to be ready if it exists
        if (window.threeDEngine) {
            logger.log('Animation system', '3D engine detected - audio-reactive features available');
            setupAudioReactiveSystem();
        }

        // 5. Setup mouse interactions
        setupMouseInteractions();

        // 6. Setup notification system
        setupNotificationSystem();

        // 7. Enhance modules with animations
        enhanceModuleAnimations();

        // 8. Setup keyboard shortcuts
        setupKeyboardShortcuts();

        window.animationSystem.initialized = true;
        logger.success('Animation system', 'Advanced animations fully initialized ✓');

    } catch (error) {
        logger.error('Animation system', `Initialization error: ${error.message}`);
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
            // Create instance of audio module
            window.animationSystem.audio = new AudioReactiveModule();
            await window.animationSystem.audio.init();

            logger.success('Animation system', 'Audio-reactive system initialized');

            // Remove listener since we only need to initialize once
            document.removeEventListener('click', initAudioOnInteraction);
            document.removeEventListener('keydown', initAudioOnInteraction);

        } catch (error) {
            logger.warn('Animation system', `Audio initialization requires user gesture or HTTPS: ${error.message}`);
        }
    };

    // Audio requires user interaction to initialize (browser autoplay policy)
    document.addEventListener('click', initAudioOnInteraction, { once: true });
    document.addEventListener('keydown', initAudioOnInteraction, { once: true });
}

/**
 * Setup mouse interaction effects
 */
function setupMouseInteractions() {
    if (!window.threeDEngine) return;

    try {
        window.animationSystem.mouse = new MouseInteraction(window.threeDEngine);

        // Add click ripples globally
        document.addEventListener('click', (e) => {
            if (window.animationSystem.mouse) {
                window.animationSystem.mouse.createClickRipple(e.clientX, e.clientY);
            }
        });

        logger.success('Animation system', 'Mouse interactions enabled');
    } catch (error) {
        logger.warn('Animation system', `Mouse interaction setup failed: ${error.message}`);
    }
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
        if (!container) return;

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

        return notification;
    };

    logger.success('Animation system', 'Notification system ready - use window.notify()');
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
 * Enhance modules with animations on appearance
 */
function enhanceModuleAnimations() {
    // Animate module titles on appearance
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1 && node.classList.contains('mod')) { // Element node
                        const title = node.querySelector('.mod-title');
                        if (title && title.textContent.trim() && window.animationSystem.accessibility.prefersReducedMotion === false) {
                            const originalText = title.textContent;
                            title.textContent = '';
                            title.style.opacity = '1';
                            
                            // Use text animation
                            if (window.TextAnimations) {
                                TextAnimations.revealText(title, originalText, 0.8);
                            }
                        }

                        // Animate module entrance
                        if (!window.animationSystem.accessibility.prefersReducedMotion) {
                            node.classList.add('animate-fade-in');
                        }
                    }
                });
            }
        });
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    logger.log('Animation system', 'Module animation enhancement enabled');
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
            const isDisabled = document.body.classList.contains('animations-disabled');
            if (window.notify) {
                window.notify(
                    isDisabled ? 'Animations disabled' : 'Animations enabled',
                    'info',
                    2000
                );
            }
        }

        // Alt + C: Toggle contrast
        if (e.altKey && e.key === 'c') {
            e.preventDefault();
            const a11y = window.animationSystem.accessibility;
            const newState = !a11y.highContrast;
            a11y.setHighContrast(newState);
            document.body.classList.toggle('high-contrast');
            if (window.notify) {
                window.notify(`High contrast ${newState ? 'enabled' : 'disabled'}`, 'info', 2000);
            }
        }

        // Alt + M: Cycle color blind modes
        if (e.altKey && e.key === 'm') {
            e.preventDefault();
            const modes = ['normal', 'deuteranopia', 'protanopia', 'tritanopia', 'achromatopsia'];
            const a11y = window.animationSystem.accessibility;
            const currentIndex = modes.indexOf(a11y.colorBlindMode);
            const nextIndex = (currentIndex + 1) % modes.length;
            const nextMode = modes[nextIndex];
            
            a11y.setColorBlindMode(nextMode);
            
            // Update filter
            if (nextMode !== 'normal') {
                const filter = `url(#colorblind-${nextMode})`;
                document.body.style.filter = filter;
            } else {
                document.body.style.filter = '';
            }
            
            if (window.notify) {
                window.notify(`Color mode: ${nextMode}`, 'info', 2000);
            }
        }
    });

    logger.log('Animation system', 'Keyboard shortcuts enabled (Alt+A, Alt+C, Alt+M)');
}

/**
 * Initialize when DOM is ready
 */
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAnimationSystem);
} else {
    initializeAnimationSystem();
}

// Export for external use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { initializeAnimationSystem };
}
