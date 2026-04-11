/**
 * Advanced Animation Enhancements for eDEX-UI
 * Collection of ready-to-implement features
 */

// ============================================================================
// 1. AUDIO-REACTIVE VISUALIZATIONS
// ============================================================================

const AudioReactiveModule = (() => {
    return class AudioReactive {
        constructor(engine) {
            this.engine = engine;
            this.audioContext = null;
            this.analyser = null;
            this.isInitialized = false;
            this.dataArray = null;
        }

        /**
         * Initialize audio context (requires user interaction)
         */
        init() {
            try {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                this.audioContext = new AudioContext();
                this.analyser = this.audioContext.createAnalyser();
                this.analyser.fftSize = 256;
                this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
                this.isInitialized = true;
                
                console.log('Audio context initialized');
                return true;
            } catch (error) {
                console.error('Audio context init failed', error);
                return false;
            }
        }

        /**
         * Connect microphone input to analyser
         */
        connectMicrophone() {
            if (!this.isInitialized) return;

            navigator.mediaDevices.getUserMedia({ audio: true })
                .then(stream => {
                    const source = this.audioContext.createMediaStreamAudioSource(stream);
                    source.connect(this.analyser);
                })
                .catch(error => console.error('Mic access denied', error));
        }

        /**
         * Create bars that respond to audio frequency
         */
        createAudioBars(barCount = 32) {
            const viz = this.engine ? new ThreeDVisualizations(this.engine) : null;
            
            // Register animation loop
            this.engine?.registerAnimation('audio-bars', (deltaTime) => {
                if (!this.isInitialized) return;

                this.analyser.getByteFrequencyData(this.dataArray);
                
                // Normalize and downsample data
                const step = Math.floor(this.dataArray.length / barCount);
                const barData = [];
                
                for (let i = 0; i < barCount; i++) {
                    const value = this.dataArray[i * step];
                    barData.push(value / 255); // Normalize to 0-1
                }
                
                // Update visualization
                if (viz) {
                    viz.updateBarChart('audio-bars', barData);
                }
            });

            return viz?.createBarChart('audio-bars', {
                data: Array(barCount).fill(0),
                color: 0x00ff00,
                maxValue: 1
            });
        }

        /**
         * Create waveform visualizer
         */
        createWaveform() {
            if (!this.isInitialized || !this.engine) return;

            this.engine.registerAnimation('waveform', (deltaTime) => {
                const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
                this.analyser.getByteFrequencyData(dataArray);

                // Create line chart from waveform data
                const waveData = Array.from(dataArray).map(v => v / 255);
                // Update with visualization system
            });
        }

        /**
         * Get current frequency magnitude
         */
        getFrequencyMagnitude(frequency = 'low') {
            if (!this.isInitialized) return 0;

            this.analyser.getByteFrequencyData(this.dataArray);
            const length = this.dataArray.length;

            let sum = 0, count = 0;

            switch (frequency) {
                case 'low':
                    for (let i = 0; i < length * 0.25; i++) sum += this.dataArray[i];
                    count = length * 0.25;
                    break;
                case 'mid':
                    for (let i = length * 0.25; i < length * 0.75; i++) sum += this.dataArray[i];
                    count = length * 0.5;
                    break;
                case 'high':
                    for (let i = length * 0.75; i < length; i++) sum += this.dataArray[i];
                    count = length * 0.25;
                    break;
            }

            return (sum / count) / 255;
        }
    };
})();

// ============================================================================
// 2. TEXT ANIMATIONS
// ============================================================================

const TextAnimations = (() => {
    return class TextAnimator {
        /**
         * Reveal text character by character
         */
        static revealText(element, text, duration = 1) {
            element.textContent = '';
            let index = 0;
            const interval = (duration * 1000) / text.length;

            const reveal = () => {
                if (index < text.length) {
                    element.textContent += text[index++];
                    setTimeout(reveal, interval);
                }
            };

            reveal();
        }

        /**
         * Animate number counter
         */
        static animateNumber(element, from, to, duration = 1, decimals = 0) {
            const steps = 60;
            const increment = (to - from) / steps;
            let current = from;
            let count = 0;

            const counter = setInterval(() => {
                current += increment;
                element.textContent = current.toFixed(decimals);

                if (++count >= steps) {
                    clearInterval(counter);
                    element.textContent = to.toFixed(decimals);
                }
            }, (duration * 1000) / steps);
        }

        /**
         * Glitch text effect
         */
        static glitchText(element, duration = 3) {
            const originalText = element.textContent;
            const chars = '!@#$%^&*()_+-=[]{}|;:"<>?,./~`';

            let elapsed = 0;
            const glitchInterval = setInterval(() => {
                if (elapsed > duration * 1000) {
                    clearInterval(glitchInterval);
                    element.textContent = originalText;
                    return;
                }

                // Random character replacement
                let glitched = '';
                for (let i = 0; i < originalText.length; i++) {
                    if (Math.random() > 0.8) {
                        glitched += chars[Math.floor(Math.random() * chars.length)];
                    } else {
                        glitched += originalText[i];
                    }
                }

                element.textContent = glitched;
                elapsed += 50;
            }, 50);
        }

        /**
         * Wave text animation
         */
        static waveText(element, amplitude = 10, duration = 0.5) {
            const text = element.textContent;
            element.innerHTML = '';

            const chars = text.split('').map((char) => {
                const span = document.createElement('span');
                span.textContent = char;
                span.style.position = 'relative';
                span.style.display = 'inline-block';
                element.appendChild(span);
                return span;
            });

            chars.forEach((span, index) => {
                const delay = (index * duration) / text.length;
                span.style.animation = `wave ${duration}s ease-in-out ${delay}s infinite`;
            });
        }
    };
})();

// ============================================================================
// 3. TRANSITION EFFECTS
// ============================================================================

const TransitionEffects = (() => {
    return class Transitions {
        /**
         * Fade transition
         */
        static fadeOut(element, duration = 0.3) {
            return new Promise(resolve => {
                element.style.animation = `fadeOut ${duration}s ease-out`;
                setTimeout(() => {
                    element.style.opacity = '0';
                    resolve();
                }, duration * 1000);
            });
        }

        /**
         * Slide transition
         */
        static slideIn(element, direction = 'left', duration = 0.5) {
            element.style.animation = `slideIn${direction} ${duration}s ease-out`;
            return new Promise(resolve => {
                setTimeout(resolve, duration * 1000);
            });
        }

        /**
         * Rotate transition
         */
        static rotateIn(element, duration = 0.5) {
            element.style.animation = `rotateIn ${duration}s ease-out`;
            return new Promise(resolve => {
                setTimeout(resolve, duration * 1000);
            });
        }

        /**
         * Scale transition
         */
        static scaleUp(element, fromScale = 0.8, duration = 0.5) {
            element.style.transform = `scale(${fromScale})`;
            element.style.animation = `scaleUp ${duration}s ease-out`;
            return new Promise(resolve => {
                setTimeout(resolve, duration * 1000);
            });
        }

        /**
         * Flip transition
         */
        static flip(element, direction = 'X', duration = 0.6) {
            element.style.animation = `flip${direction} ${duration}s ease-in-out`;
            return new Promise(resolve => {
                setTimeout(resolve, duration * 1000);
            });
        }
    };
})();

// ============================================================================
// 4. MOUSE INTERACTION EFFECTS
// ============================================================================

const MouseInteraction = (() => {
    return class MouseEffects {
        constructor(engine) {
            this.engine = engine;
            this.mousePos = { x: 0, y: 0 };
            this.setupListeners();
        }

        setupListeners() {
            document.addEventListener('mousemove', (e) => {
                this.mousePos.x = e.clientX;
                this.mousePos.y = e.clientY;
            });

            document.addEventListener('click', (e) => {
                this.createClickRipple(e.clientX, e.clientY);
            });
        }

        /**
         * Create expanding click ripple
         */
        createClickRipple(x, y) {
            const ripple = document.createElement('div');
            ripple.className = 'click-ripple';
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';
            document.body.appendChild(ripple);

            setTimeout(() => ripple.remove(), 600);
        }

        /**
         * Create cursor trail effect
         */
        createCursorTrail(color = '#00ff00', length = 20) {
            const trail = [];
            const trailLength = length;

            const animate = () => {
                const pos = { ...this.mousePos };

                // Add new position
                trail.unshift(pos);
                if (trail.length > trailLength) trail.pop();

                // Draw trail
                trail.forEach((point, index) => {
                    const opacity = 1 - (index / trailLength);
                    const size = 5 * opacity;

                    // Create or update visual element
                    // (Implementation depends on rendering method)
                });

                requestAnimationFrame(animate);
            };

            animate();
        }

        /**
         * Attract particles to mouse
         */
        attractParticlesToMouse(particles, strength = 0.5) {
            this.engine.registerAnimation('mouse-attraction', (deltaTime) => {
                // Update particle positions based on mouse position and strength
            });
        }

        /**
         * Repel particles from mouse
         */
        repelParticlesFromMouse(particles, strength = 0.5) {
            this.engine.registerAnimation('mouse-repel', (deltaTime) => {
                // Update particle positions to avoid mouse
            });
        }
    };
})();

// ============================================================================
// 5. POST-PROCESSING EFFECTS
// ============================================================================

const PostProcessing = (() => {
    return class Effects {
        /**
         * Chromatic aberration shader effect
         */
        static createChromaticAberration(strength = 0.1) {
            return `
                uniform float strength;
                
                void main() {
                    vec2 uv = gl_FragCoord.xy / iResolution.xy;
                    
                    float r = texture(iChannel0, uv + vec2(strength, 0)).r;
                    float g = texture(iChannel0, uv).g;
                    float b = texture(iChannel0, uv - vec2(strength, 0)).b;
                    
                    gl_FragColor = vec4(r, g, b, 1.0);
                }
            `;
        }

        /**
         * Scanlines effect
         */
        static applyScanlines(element, opacity = 0.15) {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = element.offsetWidth;
            canvas.height = element.offsetHeight;

            ctx.strokeStyle = `rgba(0, 0, 0, ${opacity})`;
            ctx.lineWidth = 1;

            for (let i = 0; i < canvas.height; i += 2) {
                ctx.beginPath();
                ctx.moveTo(0, i);
                ctx.lineTo(canvas.width, i);
                ctx.stroke();
            }

            element.style.backgroundImage = `url(${canvas.toDataURL()})`;
            element.style.backgroundRepeat = 'repeat';
        }

        /**
         * Film grain effect
         */
        static applyFilmGrain(element, intensity = 0.1) {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = 256;
            canvas.height = 256;

            const imageData = ctx.createImageData(256, 256);
            const data = imageData.data;

            for (let i = 0; i < data.length; i += 4) {
                const noise = Math.random() * 255 * intensity;
                data[i] = data[i + 1] = data[i + 2] = noise;
                data[i + 3] = 255;
            }

            ctx.putImageData(imageData, 0, 0);
            element.style.backgroundImage = `url(${canvas.toDataURL()})`;
        }

        /**
         * Glitch effect
         */
        static applyGlitch(element, intensity = 0.05) {
            setInterval(() => {
                const offsetX = (Math.random() - 0.5) * intensity * 100;
                const offsetY = (Math.random() - 0.5) * intensity * 100;

                element.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
                element.style.filter = `hue-rotate(${Math.random() * 360}deg)`;

                setTimeout(() => {
                    element.style.transform = 'translate(0, 0)';
                    element.style.filter = 'hue-rotate(0deg)';
                }, 50);
            }, 2000);
        }

        /**
         * Motion blur
         */
        static applyMotionBlur(element) {
            let lastX = 0, lastY = 0;

            const checkMovement = () => {
                const rect = element.getBoundingClientRect();
                const dx = Math.abs(rect.left - lastX);
                const dy = Math.abs(rect.top - lastY);

                if (dx > 2 || dy > 2) {
                    element.style.filter = 'blur(2px)';
                    lastX = rect.left;
                    lastY = rect.top;

                    if (element._blurTimeout) clearTimeout(element._blurTimeout);
                    element._blurTimeout = setTimeout(() => {
                        element.style.filter = 'blur(0)';
                    }, 100);
                }

                requestAnimationFrame(checkMovement);
            };

            checkMovement();
        }
    };
})();

// ============================================================================
// 6. ACCESSIBILITY FEATURES
// ============================================================================

const AccessibilityManager = (() => {
    return class Accessibility {
        constructor() {
            this.prefersReducedMotion = 
                window.matchMedia("(prefers-reduced-motion: reduce)").matches;
            this.highContrast = 
                window.matchMedia("(prefers-contrast: more)").matches;
            this.darkMode = 
                window.matchMedia("(prefers-color-scheme: dark)").matches;
        }

        /**
         * Get animation duration respecting user preferences
         */
        getAnimationDuration(baseDuration) {
            return this.prefersReducedMotion ? 0 : baseDuration;
        }

        /**
         * Get animation style respecting user preferences
         */
        getAnimationStyle(animationName) {
            if (this.prefersReducedMotion) {
                return ''; // No animation
            }
            return animationName;
        }

        /**
         * Apply color blind mode filter
         */
        setColorBlindMode(mode) {
            const filters = {
                'deuteranopia': 'url(#colorblind-deuteranopia)',
                'protanopia': 'url(#colorblind-protanopia)',
                'tritanopia': 'url(#colorblind-tritanopia)',
                'achromatopsia': 'url(#colorblind-achromatopsia)',
                'normal': 'none'
            };

            document.body.style.filter = filters[mode] || 'none';
        }

        /**
         * Set high contrast mode
         */
        setHighContrast(enabled) {
            if (enabled) {
                document.body.classList.add('high-contrast');
            } else {
                document.body.classList.remove('high-contrast');
            }
        }
    };
})();

// ============================================================================
// EXPORT ALL MODULES
// ============================================================================

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        AudioReactiveModule,
        TextAnimations,
        TransitionEffects,
        MouseInteraction,
        PostProcessing,
        AccessibilityManager
    };
}
