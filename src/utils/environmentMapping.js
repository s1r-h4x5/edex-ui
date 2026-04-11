/**
 * Tier 3: HDRI & Environment Mapping System
 * High Dynamic Range Imaging with realistic lighting and reflections
 * Supports procedural environment generation and IBL (Image-Based Lighting)
 */

class EnvironmentMapping {
    constructor(threeDEngine) {
        this.engine = threeDEngine;
        this.scene = threeDEngine?.scene;
        this.renderer = threeDEngine?.renderer;
        this.textureLoader = new window.THREE.TextureLoader();
        this.pmremGenerator = null;
        this.currentHDRI = null;
        this.init();
    }

    /**
     * Initialize environment mapping
     */
    init() {
        try {
            if (!this.renderer || !window.THREE) {
                console.warn('EnvironmentMapping: WebGL not available');
                return;
            }

            // Create PMREM generator for IBL
            this.pmremGenerator = new window.THREE.PMREMGenerator(this.renderer);
            this.pmremGenerator.compileEquirectangularShader();

            // Create Default environment
            this.createProceduralSkybox('default');

            logger.success('Environment mapping', 'Initialized with procedural skybox');

        } catch (error) {
            logger.error('Environment mapping', error.message);
        }
    }

    /**
     * Create procedural environment texture
     */
    createProceduralSkybox(type = 'default') {
        const canvas = document.createElement('canvas');
        canvas.width = 2048;
        canvas.height = 1024;
        const ctx = canvas.getContext('2d');

        switch (type) {
            case 'default':
                this.drawGradientSky(ctx, canvas.width, canvas.height);
                break;
            case 'cyberpunk':
                this.drawCyberpunkSky(ctx, canvas.width, canvas.height);
                break;
            case 'nebula':
                this.drawNebulaSky(ctx, canvas.width, canvas.height);
                break;
            case 'desert':
                this.drawDesertSky(ctx, canvas.width, canvas.height);
                break;
            default:
                this.drawGradientSky(ctx, canvas.width, canvas.height);
        }

        const texture = new window.THREE.CanvasTexture(canvas);
        texture.mapping = window.THREE.EquirectangularReflectionMapping;

        return this.setEnvironmentMap(texture);
    }

    /**
     * Draw gradient cyberpunk sky
     */
    drawGradientSky(ctx, width, height) {
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, '#001a40');    // Deep blue
        gradient.addColorStop(0.5, '#0d47a1');  // Bright blue
        gradient.addColorStop(1, '#1a1a2e');    // Dark purple

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        // Add stars
        ctx.fillStyle = '#ffffff';
        for (let i = 0; i < 200; i++) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            const size = Math.random() * 2;
            ctx.fillRect(x, y, size, size);
        }
    }

    /**
     * Draw cyberpunk themed sky
     */
    drawCyberpunkSky(ctx, width, height) {
        // Dark base
        ctx.fillStyle = '#0a0e27';
        ctx.fillRect(0, 0, width, height);

        // Neon gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, 'rgba(255, 0, 200, 0.3)');
        gradient.addColorStop(0.5, 'rgba(0, 255, 200, 0.2)');
        gradient.addColorStop(1, 'rgba(0, 0, 50, 0.5)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        // Neon grid lines
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        for (let i = 0; i < width; i += 100) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i, height);
            ctx.stroke();
        }

        // Add neon particles
        ctx.fillStyle = '#00ffff';
        for (let i = 0; i < 150; i++) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            const size = Math.random() * 3;
            ctx.fillRect(x, y, size, size);
        }
    }

    /**
     * Draw nebula sky
     */
    drawNebulaSky(ctx, width, height) {
        // Create random nebula-like patterns
        ctx.fillStyle = '#0a0a1f';
        ctx.fillRect(0, 0, width, height);

        // Add color nebula clouds
        const colors = [
            'rgba(255, 0, 100, 0.4)',
            'rgba(0, 150, 255, 0.3)',
            'rgba(100, 0, 255, 0.3)',
            'rgba(0, 255, 150, 0.2)'
        ];

        for (let i = 0; i < 5; i++) {
            ctx.fillStyle = colors[i % colors.length];
            const x = Math.random() * width;
            const y = Math.random() * height;
            const radius = 200 + Math.random() * 300;

            const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
            gradient.addColorStop(0, colors[i % colors.length]);
            gradient.addColorStop(1, 'transparent');

            ctx.fillStyle = gradient;
            ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
        }

        // Add stars
        ctx.fillStyle = '#ffffff';
        for (let i = 0; i < 300; i++) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            const size = Math.random() * 2.5;
            ctx.fillRect(x, y, size, size);
        }
    }

    /**
     * Draw desert sky
     */
    drawDesertSky(ctx, width, height) {
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, '#ffb366');    // Sun glow
        gradient.addColorStop(0.3, '#ff9933');  // Orange
        gradient.addColorStop(1, '#cc8844');    // Sand horizon

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        // Sun
        const sunGradient = ctx.createRadialGradient(width / 2, height * 0.2, 0, width / 2, height * 0.2, 200);
        sunGradient.addColorStop(0, 'rgba(255, 255, 200, 0.8)');
        sunGradient.addColorStop(1, 'rgba(255, 200, 100, 0.3)');
        ctx.fillStyle = sunGradient;
        ctx.fillRect(width / 2 - 250, height * 0.2 - 250, 500, 500);
    }

    /**
     * Set environment map
     */
    setEnvironmentMap(texture) {
        if (!this.scene || !this.pmremGenerator) return null;

        // Generate the environment map
        const envMap = this.pmremGenerator.fromEquirectangular(texture);
        
        // Apply to scene
        this.scene.environment = envMap.texture;
        this.scene.background = envMap.texture;

        // Apply to materials if needed
        if (this.scene.children) {
            this.scene.children.forEach(child => {
                if (child.material) {
                    child.material.envMapIntensity = 0.8;
                }
            });
        }

        this.currentHDRI = {
            texture,
            envMap: envMap.texture
        };

        return envMap.texture;
    }

    /**
     * Load external HDRI
     */
    async loadExternalHDRI(url) {
        try {
            const texture = await this.textureLoader.loadAsync(url);
            texture.mapping = window.THREE.EquirectangularReflectionMapping;
            return this.setEnvironmentMap(texture);
        } catch (error) {
            logger.error('Environment mapping', `Failed to load HDRI from ${url}: ${error.message}`);
            return null;
        }
    }

    /**
     * Apply dynamic environment map
     */
    applyDynamicEnvironment(type = 'cyberpunk') {
        this.createProceduralSkybox(type);
        window.notify(`Environment: ${type}`, 'info', 2000);
    }

    /**
     * Adjust environment intensity
     */
    setEnvironmentIntensity(intensity) {
        if (this.scene && this.scene.children) {
            this.scene.children.forEach(child => {
                if (child.material && child.material.envMapIntensity !== undefined) {
                    child.material.envMapIntensity = Math.max(0, Math.min(1, intensity));
                }
            });
        }

        if (this.scene.environment) {
            this.scene.environment.intensity = intensity;
        }

        return intensity;
    }

    /**
     * Create ambient light from environment
     */
    addAmbientLightFromEnvironment(intensity = 1) {
        const light = new window.THREE.AmbientLight(0xffffff, intensity);
        this.scene.add(light);
        return light;
    }

    /**
     * Add directional light
     */
    addDirectionalLight(color = 0xffffff, intensity = 1, x = 100, y = 100, z = 100) {
        const light = new window.THREE.DirectionalLight(color, intensity);
        light.position.set(x, y, z);
        
        // Add shadow support if available
        if (this.renderer.shadowMap) {
            light.castShadow = true;
            light.shadow.camera.left = -200;
            light.shadow.camera.right = 200;
            light.shadow.camera.top = 200;
            light.shadow.camera.bottom = -200;
        }

        this.scene.add(light);
        return light;
    }

    /**
     * Add point light
     */
    addPointLight(color = 0xffffff, intensity = 1, x = 0, y = 0, z = 50) {
        const light = new window.THREE.PointLight(color, intensity, 500);
        light.position.set(x, y, z);
        
        if (this.renderer.shadowMap) {
            light.castShadow = true;
        }

        this.scene.add(light);
        return light;
    }

    /**
     * Get environment stats
     */
    getStats() {
        return {
            hasEnvironment: !!this.currentHDRI,
            mapType: this.currentHDRI ? 'custom' : 'default'
        };
    }
}

/**
 * Initialize environment mapping
 */
function setupEnvironmentMapping() {
    if (!window.threeDEngine) {
        console.warn('Environment mapping requires 3D engine');
        return;
    }

    if (window.environmentMapping) return;
    window.environmentMapping = new EnvironmentMapping(window.threeDEngine);
    return window.environmentMapping;
}

// Auto-initialize
if (window.threeDEngine) {
    setupEnvironmentMapping();
} else {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => setupEnvironmentMapping(), 2000);
    });
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { EnvironmentMapping, setupEnvironmentMapping };
}
