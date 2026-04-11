/**
 * Tier 2: Advanced Post-Processing Effects
 * GPU-accelerated visual effects using WebGL and CSS filters
 * Chromatic aberration, glitch, motion blur, bloom, depth of field
 */

class PostProcessingEffects {
    constructor() {
        this.activeEffects = new Map();
        this.effectShaders = {};
        this.init();
    }

    /**
     * Initialize post-processing system
     */
    init() {
        try {
            if (!window.threeDEngine) {
                console.warn('PostProcessingEffects: 3D engine not available');
                return;
            }

            // Setup WebGL context for effects
            this.setupWebGLEffects();

            // Create shader library
            this.createShaders();

            logger.success('Post-processing effects', 'Initialized');

        } catch (error) {
            logger.error('Post-processing effects', error.message);
        }
    }

    /**
     * Setup WebGL effects
     */
    setupWebGLEffects() {
        // Get Three.js renderer from engine
        const renderer = window.threeDEngine?.renderer;
        if (!renderer) return;

        this.renderer = renderer;
        this.composer = null; // Will be initialized if EffectComposer is available

        // Try to load EffectComposer if available
        if (window.THREE?.EffectComposer) {
            this.setupEffectComposer();
        }
    }

    /**
     * Setup effect composer for post-processing chain
     */
    setupEffectComposer() {
        // This would require EffectComposer library
        // For now, we'll use CSS-based fallbacks
        logger.log('Post-processing', 'Using CSS-based effects (WebGL composer requires additional library)');
    }

    /**
     * Create shader dictionary
     */
    createShaders() {
        this.effectShaders = {
            chromaticAberration: {
                vertex: `
                    varying vec2 vUv;
                    void main() {
                        vUv = uv;
                        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                    }
                `,
                fragment: `
                    uniform sampler2D tDiffuse;
                    uniform float amount;
                    varying vec2 vUv;
                    
                    void main() {
                        vec2 offset = vec2(amount, amount);
                        vec4 r = texture2D(tDiffuse, vUv + offset);
                        vec4 g = texture2D(tDiffuse, vUv);
                        vec4 b = texture2D(tDiffuse, vUv - offset);
                        
                        gl_FragColor = vec4(r.r, g.g, b.b, 1.0);
                    }
                `
            },
            glitch: {
                description: 'Random RGB channel offset for glitch effect'
            },
            motionBlur: {
                description: 'Directional blur effect based on movement'
            }
        };
    }

    /**
     * Apply chromatic aberration to element
     */
    applyChromaticAberration(element, intensity = 0.005) {
        const filter = `url(#chromatic-aberration-${intensity})`;
        element.style.filter = filter;

        // Create SVG filter if doesn't exist
        this.ensureSVGFilter('chromatic-aberration', `
            <filter id="chromatic-aberration-${intensity}">
                <feOffset dx="${intensity * 100}" in="SourceGraphic" result="r"/>
                <feOffset dx="-${intensity * 100}" in="SourceGraphic" result="b"/>
                <feComponentTransfer>
                    <feFuncR type="discrete" tableValues="0 0 0 0 1"/>
                    <feFuncG type="discrete" tableValues="0 1 1 1 0"/>
                    <feFuncB type="discrete" tableValues="1 1 0 0 0"/>
                </feComponentTransfer>
                <feComposite in="r" in2="SourceGraphic" operator="screen" result="chromatic"/>
                <feBlend in="chromatic" in2="SourceGraphic" mode="normal"/>
            </filter>
        `);

        return element;
    }

    /**
     * Apply glitch effect to element
     */
    applyGlitch(element, intensity = 0.05) {
        element.classList.add('glitch-effect');
        element.style.setProperty('--glitch-intensity', intensity);

        // Add glitch animation
        const animation = `
            @keyframes glitch-shift {
                0%, 100% { transform: translate(0); }
                20% { transform: translate(${intensity * 20}px, ${intensity * 20}px); }
                40% { transform: translate(-${intensity * 15}px, ${intensity * 15}px); }
                60% { transform: translate(${intensity * 10}px, -${intensity * 10}px); }
                80% { transform: translate(-${intensity * 20}px, -${intensity * 20}px); }
            }
        `;

        this.injectKeyframe(animation);
        element.style.animation = `glitch-shift 0.2s infinite`;

        // Remove after duration
        setTimeout(() => {
            element.classList.remove('glitch-effect');
            element.style.animation = '';
        }, 3000);

        return element;
    }

    /**
     * Apply motion blur effect
     */
    applyMotionBlur(element, intensity = 10, angle = 0) {
        const blur = `blur(${intensity}px)`;
        const filter = `${element.style.filter} ${blur}`.trim();
        element.style.filter = filter;

        setTimeout(() => {
            element.style.filter = element.style.filter.replace(blur, '').trim();
        }, 1000);

        return element;
    }

    /**
     * Apply bloom/glow effect
     */
    applyBloom(element, radius = 20, intensity = 0.5) {
        const shadow = `0 0 ${radius}px rgba(0, 255, 0, ${intensity})`;
        element.style.textShadow = shadow;
        element.style.boxShadow = shadow;

        return element;
    }

    /**
     * Apply depth of field effect
     */
    applyDepthOfField(focusElement, blurIntensity = 5) {
        document.querySelectorAll('.mod').forEach(el => {
            if (el !== focusElement) {
                el.style.filter = `blur(${blurIntensity}px)`;
                el.style.opacity = '0.6';
            } else {
                el.style.filter = 'none';
                el.style.opacity = '1';
            }
        });

        return focusElement;
    }

    /**
     * Apply film grain effect (analog look)
     */
    applyFilmGrain(element, intensity = 0.1) {
        const filter = `url(#film-grain-${intensity})`;
        const currentFilter = element.style.filter || '';
        element.style.filter = `${currentFilter} ${filter}`.trim();

        // Create SVG filter
        this.ensureSVGFilter('film-grain', `
            <filter id="film-grain-${intensity}">
                <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" result="noise" />
                <feColorMatrix in="noise" type="saturate" values="0"/>
                <feBlend in="SourceGraphic" in2="noise" mode="overlay" result="grain" />
                <feComponentTransfer in="grain">
                    <feFuncA type="linear" slope="${intensity}"/>
                </feComponentTransfer>
            </filter>
        `);

        return element;
    }

    /**
     * Apply scanlines effect (CRT monitor look)
     */
    applyScanlines(element, intensity = 0.15) {
        const filter = `url(#scanlines-${intensity})`;
        const currentFilter = element.style.filter || '';
        element.style.filter = `${currentFilter} ${filter}`.trim();

        // Create SVG filter
        this.ensureSVGFilter('scanlines', `
            <filter id="scanlines-${intensity}">
                <feTurbulence type="fractalNoise" baseFrequency="0, ${intensity}" numOctaves="1" result="scanlines" />
                <feColorMatrix in="scanlines" type="saturate" values="0"/>
                <feBlend in="SourceGraphic" in2="scanlines" mode="overlay" />
            </filter>
        `);

        return element;
    }

    /**
     * Apply duotone color effect
     */
    applyDuotone(element, color1 = '#ff0040', color2 = '#0040ff') {
        const shadow1 = `0 0 20px ${color1}`;
        const shadow2 = `0 0 10px ${color2}`;
        element.style.filter = `saturate(0.8) hue-rotate(10deg)`;
        element.style.boxShadow = `${shadow1}, ${shadow2}`;

        return element;
    }

    /**
     * Apply vignette effect (darkened edges)
     */
    applyVignette(element, intensity = 0.5) {
        const filter = `url(#vignette-${intensity})`;
        element.style.filter = `${element.style.filter} ${filter}`.trim();

        this.ensureSVGFilter('vignette', `
            <filter id="vignette-${intensity}">
                <radialGradient id="vignetteGradient">
                    <stop offset="0%" style="stop-color:black;stop-opacity:0" />
                    <stop offset="100%" style="stop-color:black;stop-opacity:${intensity}" />
                </radialGradient>
                <rect width="100%" height="100%" fill="url(#vignetteGradient)" />
            </filter>
        `);

        return element;
    }

    /**
     * Ensure SVG filter exists in DOM
     */
    ensureSVGFilter(filterName, filterXML) {
        let svg = document.querySelector(`svg[data-filter="${filterName}"]`);
        if (!svg) {
            svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.setAttribute('style', 'display: none;');
            svg.setAttribute('data-filter', filterName);
            svg.innerHTML = filterXML;
            document.body.appendChild(svg);
        }

        return svg;
    }

    /**
     * Inject CSS keyframe animation
     */
    injectKeyframe(keyframeCode) {
        const styleEl = document.createElement('style');
        styleEl.textContent = keyframeCode;
        document.head.appendChild(styleEl);
    }

    /**
     * Get active effects
     */
    getActiveEffects() {
        return Array.from(this.activeEffects.entries()).map(([el, effects]) => ({
            element: el,
            effects: Object.keys(effects)
        }));
    }

    /**
     * Clear all effects from element
     */
    clearEffects(element) {
        element.style.filter = '';
        element.style.boxShadow = '';
        element.style.textShadow = '';
        element.style.animation = '';
        element.classList.remove('glitch-effect');
        this.activeEffects.delete(element);
    }

    /**
     * Clear all effects globally
     */
    clearAllEffects() {
        this.activeEffects.forEach((_, element) => {
            this.clearEffects(element);
        });
        this.activeEffects.clear();
    }
}

/**
 * Initialize post-processing
 */
function setupPostProcessing() {
    if (window.postProcessingEffects) return;
    window.postProcessingEffects = new PostProcessingEffects();
    return window.postProcessingEffects;
}

// Auto-initialize
if (window.threeDEngine) {
    setupPostProcessing();
} else if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => setupPostProcessing(), 1500);
    });
} else {
    setTimeout(() => setupPostProcessing(), 1500);
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PostProcessingEffects, setupPostProcessing };
}
