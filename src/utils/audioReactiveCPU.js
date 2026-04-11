/**
 * Audio-Reactive CPU Visualization Enhancement
 * Integrates audio frequency data with CPU monitoring
 * Creates a dual visualization: CPU usage + audio frequency response
 */

class AudioReactiveCPUEnhancer {
    constructor(cpuModuleInstance, threeDEngineInstance) {
        this.cpuModule = cpuModuleInstance;
        this.threeDEngine = threeDEngineInstance;
        this.audioModule = null;
        this.audioBars = null;
        this.container = null;
        this.isEnabled = false;
        this.frequencyData = new Uint8Array(32);
        
        this.init();
    }

    /**
     * Initialize the audio-reactive enhancement
     */
    async init() {
        try {
            // Wait for animation system to be ready
            if (!window.animationSystem) {
                console.warn('Audio-reactive CPU: Animation system not ready yet');
                setTimeout(() => this.init(), 500);
                return;
            }

            // Create container for audio visualization
            this.createAudioVisualizationContainer();

            // Initialize audio on first user interaction
            this.setupAudioInitialization();

            logger.success('Audio-reactive CPU enhancer', 'Ready (audio activation on user interaction)');

        } catch (error) {
            logger.error('Audio-reactive CPU enhancer', error.message);
        }
    }

    /**
     * Create the audio visualization container
     */
    createAudioVisualizationContainer() {
        if (!this.cpuModule || !this.cpuModule.container) return;

        // Find or create audio viz section
        let audioSection = this.cpuModule.container.querySelector('.audio-reactive-section');
        if (!audioSection) {
            audioSection = document.createElement('div');
            audioSection.className = 'audio-reactive-section';
            audioSection.innerHTML = `
                <div class="audio-viz-header">
                    <h2>AUDIO FREQUENCY RESPONSE</h2>
                    <button class="audio-toggle-btn" id="audio-toggle" title="Toggle audio (Alt+click anywhere)">🔊 Enable</button>
                </div>
                <div class="audio-canvas-container">
                    <canvas id="audio-frequency-canvas" height="80"></canvas>
                </div>
                <div class="frequency-range">
                    <span>LOW</span>
                    <span>MID</span>
                    <span>HIGH</span>
                </div>
            `;
            this.cpuModule.container.appendChild(audioSection);

            // Setup toggle button
            const toggleBtn = audioSection.querySelector('#audio-toggle');
            toggleBtn.addEventListener('click', (e) => {
                this.toggleAudio();
                e.stopPropagation();
            });
        }

        this.container = audioSection;
    }

    /**
     * Setup audio initialization on user interaction
     */
    setupAudioInitialization() {
        const initAudio = async () => {
            try {
                if (!window.animationSystem.audio) {
                    window.animationSystem.audio = new AudioReactiveModule();
                    await window.animationSystem.audio.init();
                }

                this.audioModule = window.animationSystem.audio;
                this.isEnabled = true;

                // Update UI
                const toggleBtn = this.container.querySelector('#audio-toggle');
                if (toggleBtn) {
                    toggleBtn.textContent = '🔊 Active';
                    toggleBtn.classList.add('active');
                }

                // Start frequency analysis
                this.startFrequencyVisualization();

                logger.success('Audio-reactive CPU', 'Audio input connected');

                // Remove these listeners since we only need them once
                document.removeEventListener('click', initAudio);
                document.removeEventListener('keydown', initAudio);

            } catch (error) {
                logger.warn('Audio-reactive CPU', `Audio initialization failed: ${error.message}`);
            }
        };

        // Audio requires user interaction
        document.addEventListener('click', initAudio, { once: true });
        document.addEventListener('keydown', initAudio, { once: true });
    }

    /**
     * Toggle audio visualization on/off
     */
    toggleAudio() {
        if (!this.audioModule) {
            window.notify('Click anywhere to enable audio first', 'info', 2000);
            return;
        }

        this.isEnabled = !this.isEnabled;

        const toggleBtn = this.container.querySelector('#audio-toggle');
        if (toggleBtn) {
            toggleBtn.textContent = this.isEnabled ? '🔊 Active' : '🔇 Paused';
            toggleBtn.classList.toggle('active', this.isEnabled);
        }

        window.notify(
            this.isEnabled ? 'Audio visualization active' : 'Audio visualization paused',
            'info',
            2000
        );
    }

    /**
     * Start the frequency visualization loop
     */
    startFrequencyVisualization() {
        if (!this.audioModule || !this.container) return;

        const canvas = this.container.querySelector('#audio-frequency-canvas');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const analyser = this.audioModule.analyser;
        const width = canvas.width;
        const height = canvas.height;

        const draw = () => {
            if (!this.isEnabled || !this.audioModule) {
                requestAnimationFrame(draw);
                return;
            }

            // Get frequency data
            analyser.getByteFrequencyData(this.frequencyData);

            // Clear canvas
            ctx.fillStyle = 'rgba(0, 20, 40, 0.2)';
            ctx.fillRect(0, 0, width, height);

            // Draw frequency bars
            const barWidth = width / this.frequencyData.length;
            let hue = 120; // Start with green

            for (let i = 0; i < this.frequencyData.length; i++) {
                const barHeight = (this.frequencyData[i] / 255) * height;

                // Color gradient from green to red based on frequency
                hue = 120 - (i / this.frequencyData.length) * 120; // 120 (green) to 0 (red)
                ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;

                // Draw bar
                ctx.fillRect(
                    i * barWidth,
                    height - barHeight,
                    barWidth - 1,
                    barHeight
                );

                // Draw reflection
                ctx.globalAlpha = 0.3;
                ctx.fillRect(
                    i * barWidth,
                    height,
                    barWidth - 1,
                    barHeight * 0.3
                );
                ctx.globalAlpha = 1.0;
            }

            // Draw center line
            ctx.strokeStyle = `rgba(0, 255, 0, 0.3)`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(0, height);
            ctx.lineTo(width, height);
            ctx.stroke();

            requestAnimationFrame(draw);
        };

        draw();
    }

    /**
     * Get low/mid/high frequency magnitudes (for data-driven visualizations)
     */
    getFrequencyBands() {
        if (!this.audioModule || !this.isEnabled) {
            return { low: 0, mid: 0, high: 0 };
        }

        const data = new Uint8Array(this.audioModule.analyser.frequencyBinCount);
        this.audioModule.analyser.getByteFrequencyData(data);

        const third = Math.floor(data.length / 3);

        const low = data.slice(0, third).reduce((a, b) => a + b) / third / 255;
        const mid = data.slice(third, third * 2).reduce((a, b) => a + b) / third / 255;
        const high = data.slice(third * 2).reduce((a, b) => a + b) / third / 255;

        return { low, mid, high };
    }

    /**
     * Sync CPU visualization colors based on audio
     */
    syncCPUColorsWithAudio() {
        if (!this.isEnabled) return;

        const bands = this.getFrequencyBands();
        const hue = 120 - (bands.low * 120); // Green to red based on bass

        // Update theme colors based on audio
        const r = Math.round(255 * (bands.low * 0.5 + bands.high * 0.5));
        const g = Math.round(255 * (1 - bands.mid * 0.3));
        const b = Math.round(255 * bands.high);

        // Apply to charts
        if (this.cpuModule && this.cpuModule.charts) {
            this.cpuModule.charts.forEach(chart => {
                chart.options.strokeStyle = `rgb(${r}, ${g}, ${b})`;
            });
        }
    }

    /**
     * Clean up resources
     */
    destroy() {
        if (this.container) {
            this.container.remove();
        }
    }
}

/**
 * Create audio-reactive visualization for CPU module
 * Call this after CPU module is initialized
 */
function setupAudioReactiveCPU(cpuModuleInstance) {
    return new AudioReactiveCPUEnhancer(cpuModuleInstance, window.threeDEngine);
}

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AudioReactiveCPUEnhancer, setupAudioReactiveCPU };
}
