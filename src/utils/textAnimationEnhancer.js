/**
 * Tier 1: Text Animation Enhancement System
 * Automatically animates module titles and important text elements
 * Provides smooth character reveal, number transitions, and glitch effects
 */

class TextAnimationEnhancer {
    constructor() {
        this.animatedElements = new Set();
        this.init();
    }

    /**
     * Initialize text animation enhancements
     */
    init() {
        try {
            // Wait for TextAnimations to be available
            if (!window.TextAnimations) {
                setTimeout(() => this.init(), 200);
                return;
            }

            // Setup dynamic text animation observer
            this.setupMutationObserver();

            // Enhance existing module titles
            this.enhanceExistingTitles();

            logger.success('Text animation enhancer', 'Initialized');

        } catch (error) {
            logger.error('Text animation enhancer', error.message);
        }
    }

    /**
     * Setup mutation observer to animate new text elements
     */
    setupMutationObserver() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === 1) { // Element node
                            // Animate module titles
                            const title = node.querySelector?.('.mod-title') || 
                                         (node.classList?.contains('mod-title') ? node : null);
                            
                            if (title && !this.animatedElements.has(title)) {
                                this.animateText(title, 'reveal', 0.8);
                                this.animatedElements.add(title);
                            }

                            // Animate value updates (like CPU percentages)
                            const values = node.querySelectorAll?.('[data-animatable]') || [];
                            values.forEach(valueEl => {
                                if (!this.animatedElements.has(valueEl)) {
                                    this.animateValue(valueEl);
                                    this.animatedElements.add(valueEl);
                                }
                            });
                        }
                    });
                }

                // Animate text content changes
                if (mutation.type === 'characterData') {
                    const target = mutation.target;
                    if (target.parentElement?.classList.contains('animate-on-change')) {
                        this.animateValue(target.parentElement);
                    }
                }
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
            characterData: true,
            subtree: true
        });

        logger.log('Text animation enhancer', 'Mutation observer active');
    }

    /**
     * Enhance existing module titles on page
     */
    enhanceExistingTitles() {
        if (window.animationSystem?.accessibility?.prefersReducedMotion) {
            return; // Skip if reduced motion enabled
        }

        document.querySelectorAll('.mod-title h1, .mod-title h2, h1').forEach((title, index) => {
            if (title.textContent.trim() && !this.animatedElements.has(title)) {
                // Stagger animations
                setTimeout(() => {
                    this.animateText(title, 'reveal', 0.6);
                    this.animatedElements.add(title);
                }, index * 100);
            }
        });
    }

    /**
     * Animate text with chosen effect
     */
    animateText(element, effect = 'reveal', duration = 0.8) {
        if (!window.TextAnimations || !element) return;

        const originalText = element.textContent;
        element.textContent = ''; // Clear for reveal effect

        switch (effect) {
            case 'reveal':
                TextAnimations.revealText(element, originalText, duration);
                break;
            case 'wave':
                element.textContent = originalText;
                TextAnimations.waveText(element, 15, duration);
                break;
            case 'glitch':
                element.textContent = originalText;
                TextAnimations.glitchText(element, duration);
                break;
            default:
                element.textContent = originalText;
        }
    }

    /**
     * Animate value changes (numbers, status text)
     */
    animateValue(element) {
        if (!window.TextAnimations || !element) return;

        const oldValue = parseFloat(element.textContent);
        if (isNaN(oldValue)) return;

        // Listen for value changes
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'characterData') {
                    const newValue = parseFloat(element.textContent);
                    if (!isNaN(newValue) && newValue !== oldValue) {
                        // Animate from old to new
                        TextAnimations.animateNumber(
                            element,
                            oldValue,
                            newValue,
                            0.3,
                            1
                        );
                    }
                }
            });
        });

        observer.observe(element, {
            characterData: true,
            subtree: true
        });
    }

    /**
     * Mark an element for automatic animation on text change
     */
    markForAnimation(element) {
        element.classList.add('animate-on-change');
        element.setAttribute('data-animatable', 'true');
    }

    /**
     * Get animation statistics
     */
    getStats() {
        return {
            animatedElements: this.animatedElements.size,
            prefersReducedMotion: window.animationSystem?.accessibility?.prefersReducedMotion
        };
    }
}

/**
 * Initialize text animation enhancement
 */
function setupTextAnimationEnhancer() {
    if (window.textAnimationEnhancer) return;
    window.textAnimationEnhancer = new TextAnimationEnhancer();
    return window.textAnimationEnhancer;
}

// Initialize when animation system is ready
if (window.animationSystem?.initialized) {
    setupTextAnimationEnhancer();
} else {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => setupTextAnimationEnhancer(), 1000);
    });
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TextAnimationEnhancer, setupTextAnimationEnhancer };
}
