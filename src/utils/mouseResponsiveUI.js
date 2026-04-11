/**
 * Tier 2: Advanced Mouse-Responsive UI System
 * Makes UI elements react to mouse movement, position, and proximity
 * Creates immersive, responsive interface
 */

class MouseResponsiveUI {
    constructor() {
        this.responsiveElements = new Map();
        this.mousePos = { x: 0, y: 0 };
        this.init();
    }

    /**
     * Initialize mouse-responsive system
     */
    init() {
        try {
            // Track mouse movement
            document.addEventListener('mousemove', (e) => this.handleMouseMove(e));
            
            // Register elements for responsiveness
            this.discoverResponsiveElements();
            
            // Observe for new elements
            this.setupMutationObserver();

            logger.success('Mouse-responsive UI', 'Initialized');

        } catch (error) {
            logger.error('Mouse-responsive UI', error.message);
        }
    }

    /**
     * Handle mouse movement
     */
    handleMouseMove(event) {
        this.mousePos.x = event.clientX;
        this.mousePos.y = event.clientY;
        this.updateResponsiveElements();
    }

    /**
     * Discover elements marked for responsiveness
     */
    discoverResponsiveElements() {
        // Find elements with data-mouse-reactive attribute
        document.querySelectorAll('[data-mouse-reactive]').forEach(el => {
            const type = el.getAttribute('data-mouse-reactive');
            this.registerElement(el, type);
        });

        // Also register certain module containers
        document.querySelectorAll('.mod').forEach(el => {
            if (!this.responsiveElements.has(el)) {
                this.registerElement(el, 'tilt');
            }
        });
    }

    /**
     * Register element for mouse response
     */
    registerElement(element, type = 'tilt') {
        if (this.responsiveElements.has(element)) return;

        this.responsiveElements.set(element, {
            type,
            originalTransform: element.style.transform || '',
            rect: element.getBoundingClientRect()
        });

        logger.log('Mouse-responsive UI', `Registered ${type}: ${element.className}`);
    }

    /**
     * Update responsive elements based on mouse position
     */
    updateResponsiveElements() {
        this.responsiveElements.forEach((config, element) => {
            try {
                const rect = element.getBoundingClientRect();
                const centerX = rect.left + rect.width / 2;
                const centerY = rect.top + rect.height / 2;

                // Distance from mouse to element center
                const dx = this.mousePos.x - centerX;
                const dy = this.mousePos.y - centerY;
                const distance = Math.sqrt(dx * dx + dy * dy);

                switch (config.type) {
                    case 'tilt':
                        this.applyTilt(element, dx, dy, rect);
                        break;
                    case 'attract':
                        this.applyAttract(element, dx, dy, distance);
                        break;
                    case 'repel':
                        this.applyRepel(element, dx, dy, distance);
                        break;
                    case 'follow':
                        this.applyFollow(element, this.mousePos, rect);
                        break;
                    case 'glow':
                        this.applyGlow(element, distance);
                        break;
                }
            } catch (e) {
                // Silently fail if element removed from DOM
            }
        });
    }

    /**
     * Tilt effect - rotate based on mouse position relative to element
     */
    applyTilt(element, dx, dy, rect) {
        const maxAngle = 5; // Max 5 degree rotation
        const rotateX = (dy / rect.height) * maxAngle;
        const rotateY = -(dx / rect.width) * maxAngle;

        const transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
        element.style.transform = transform;
        element.style.transition = 'transform 0.1s ease-out';
    }

    /**
     * Attract effect - move element toward mouse
     */
    applyAttract(element, dx, dy, distance) {
        const maxDistance = 200;
        if (distance > maxDistance) {
            element.style.transform = '';
            return;
        }

        const strength = 1 - (distance / maxDistance);
        const moveX = (dx / distance) * strength * 20;
        const moveY = (dy / distance) * strength * 20;

        element.style.transform = `translate(${moveX}px, ${moveY}px) scale(${1 + strength * 0.05})`;
        element.style.transition = 'transform 0.1s ease-out';
    }

    /**
     * Repel effect - move element away from mouse
     */
    applyRepel(element, dx, dy, distance) {
        const maxDistance = 200;
        if (distance > maxDistance) {
            element.style.transform = '';
            return;
        }

        const strength = 1 - (distance / maxDistance);
        const moveX = -(dx / distance) * strength * 30;
        const moveY = -(dy / distance) * strength * 30;

        element.style.transform = `translate(${moveX}px, ${moveY}px)`;
        element.style.transition = 'transform 0.1s ease-out';
    }

    /**
     * Follow effect - element follows mouse with lag
     */
    applyFollow(element, mousePos, rect) {
        const lagged = element._laggedPos || { x: mousePos.x, y: mousePos.y };
        
        lagged.x += (mousePos.x - lagged.x) * 0.1;
        lagged.y += (mousePos.y - lagged.y) * 0.1;
        
        element._laggedPos = lagged;
        
        const offsetX = lagged.x - rect.left - rect.width / 2;
        const offsetY = lagged.y - rect.top - rect.height / 2;

        element.style.transform = `translate(${offsetX * 0.1}px, ${offsetY * 0.1}px)`;
    }

    /**
     * Glow effect - intensity based on proximity
     */
    applyGlow(element, distance) {
        const maxDistance = 300;
        const intensity = Math.max(0, 1 - (distance / maxDistance));

        element.style.boxShadow = `0 0 ${intensity * 30}px rgba(0, 255, 0, ${intensity * 0.5})`;
        element.style.transition = 'box-shadow 0.1s ease-out';
    }

    /**
     * Setup mutation observer for new elements
     */
    setupMutationObserver() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === 1) { // Element node
                            // Check for mouse-reactive data attribute
                            if (node.hasAttribute?.('data-mouse-reactive')) {
                                const type = node.getAttribute('data-mouse-reactive');
                                this.registerElement(node, type);
                            }

                            // Check children
                            node.querySelectorAll?.('[data-mouse-reactive]').forEach(el => {
                                const type = el.getAttribute('data-mouse-reactive');
                                this.registerElement(el, type);
                            });
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
     * Apply effect to element
     */
    applyEffectToElement(element, effectType) {
        element.setAttribute('data-mouse-reactive', effectType);
        this.registerElement(element, effectType);
    }

    /**
     * Remove responsiveness from element
     */
    removeResponsiveness(element) {
        this.responsiveElements.delete(element);
        element.removeAttribute('data-mouse-reactive');
        element.style.transform = '';
    }

    /**
     * Get stats
     */
    getStats() {
        return {
            activeElements: this.responsiveElements.size,
            mousePos: this.mousePos,
            effects: Array.from(this.responsiveElements.values())
                .map(c => c.type)
                .reduce((acc, t) => ({...acc, [t]: (acc[t] || 0) + 1}), {})
        };
    }
}

/**
 * Initialize mouse-responsive UI
 */
function setupMouseResponsiveUI() {
    if (window.mouseResponsiveUI) return;
    window.mouseResponsiveUI = new MouseResponsiveUI();
    return window.mouseResponsiveUI;
}

// Initialize when ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => setupMouseResponsiveUI(), 1000);
    });
} else {
    setTimeout(() => setupMouseResponsiveUI(), 1000);
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MouseResponsiveUI, setupMouseResponsiveUI };
}
