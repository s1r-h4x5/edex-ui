/**
 * Tier 3: Volumetric Lighting & God Rays System
 * Creates atmospheric lighting effects, volumetric fog, and light shafts
 * Produces immersive cinematic visuals
 */

class VolumetricLighting {
    constructor(threeDEngine) {
        this.engine = threeDEngine;
        this.scene = threeDEngine?.scene;
        this.renderer = threeDEngine?.renderer;
        this.camera = threeDEngine?.camera;
        
        this.volumetricLights = new Map();
        this.fogInstance = null;
        this.god RayEffect = null;
        
        this.init();
    }

    /**
     * Initialize volumetric lighting
     */
    init() {
        try {
            if (!this.scene || !this.renderer) {
                console.warn('VolumetricLighting: 3D engine not available');
                return;
            }

            // Enable fog by default
            this.addFog('exponential', 0x001a40, 50, 500);

            logger.success('Volumetric lighting', 'Initialized with fog and god rays support');

        } catch (error) {
            logger.error('Volumetric lighting', error.message);
        }
    }

    /**
     * Add volumetric fog
     */
    addFog(type = 'exponential', color = 0x000000, near = 1, far = 1000, density = 0.025) {
        let fog;

        if (type === 'linear') {
            fog = new window.THREE.Fog(color, near, far);
        } else {
            fog = new window.THREE.FogExp2(color, density);
        }

        this.scene.fog = fog;
        this.fogInstance = { type, color, near, far, density };

        return fog;
    }

    /**
     * Animate fog density
     */
    async animateFogDensity(fromDensity, toDensity, duration = 2000) {
        if (!this.fogInstance || !(this.scene.fog instanceof window.THREE.FogExp2)) return;

        return new Promise((resolve) => {
            const startTime = performance.now();
            const startDensity = this.scene.fog.density;

            const animate = (currentTime) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(1, elapsed / duration);

                this.scene.fog.density = startDensity + (toDensity - startDensity) * progress;

                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    resolve();
                }
            };

            requestAnimationFrame(animate);
        });
    }

    /**
     * Create god rays effect (light shafts)
     */
    createGodRays(lightSource, options = {}) {
        const {
            rayCount = 32,
            rayLength = 200,
            rayWidth = 10,
            intensity = 0.5,
            animated = true,
            speed = 0.005
        } = options;

        // Create canvas for ray texture
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');

        // Draw rays
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 2;

        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;

        for (let i = 0; i < rayCount; i++) {
            const angle = (i / rayCount) * Math.PI * 2;
            const startX = centerX + Math.cos(angle) * 50;
            const startY = centerY + Math.sin(angle) * 50;
            const endX = centerX + Math.cos(angle) * rayLength;
            const endY = centerY + Math.sin(angle) * rayLength;

            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(endX, endY);
            ctx.stroke();
        }

        // Create quad geometry for rays
        const quadGeometry = new window.THREE.BufferGeometry();
        const vertices = new Float32Array([
            -rayLength, rayLength, 0,
            rayLength, rayLength, 0,
            -rayLength, -rayLength, 0,
            rayLength, -rayLength, 0
        ]);

        quadGeometry.setAttribute('position', new window.THREE.BufferAttribute(vertices, 3));
        quadGeometry.setIndex(new window.THREE.BufferAttribute(new Uint16Array([0, 1, 2, 1, 3, 2]), 1));

        // Create material
        const texture = new window.THREE.CanvasTexture(canvas);
        const material = new window.THREE.MeshBasicMaterial({
            map: texture,
            emissive: 0xffffff,
            emissiveIntensity: intensity,
            transparent: true,
            blending: window.THREE.AdditiveBlending,
            depthWrite: false
        });

        // Create mesh
        const mesh = new window.THREE.Mesh(quadGeometry, material);
        mesh.position.copy(lightSource.position);
        mesh.lookAt(this.camera.position);

        this.scene.add(mesh);

        const rayData = {
            mesh,
            lightSource,
            intensity,
            animated,
            speed,
            time: 0
        };

        if (animated) {
            const animateRays = () => {
                rayData.time += rayData.speed;
                material.emissiveIntensity = rayData.intensity * (0.5 + Math.sin(rayData.time) * 0.5);
                mesh.lookAt(this.camera.position);
                requestAnimationFrame(animateRays);
            };

            animateRays();
        }

        this.volumetricLights.set(mesh.uuid, rayData);

        return mesh;
    }

    /**
     * Create volumetric fog volume
     */
    createVolumetricVolume(x, y, z, scaleX, scaleY, scaleZ, color = 0x00ffff, density = 0.5) {
        // Create a semi-transparent box for volumetric effect
        const geometry = new window.THREE.BoxGeometry(scaleX, scaleY, scaleZ);
        const material = new window.THREE.MeshStandardMaterial({
            color,
            emissive: color,
            emissiveIntensity: 0.3,
            transparent: true,
            opacity: density,
            metalness: 0.5,
            roughness: 0.7
        });

        const mesh = new window.THREE.Mesh(geometry, material);
        mesh.position.set(x, y, z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        this.scene.add(mesh);

        return mesh;
    }

    /**
     * Add atmospheric haze effect
     */
    addHaze(color = 0x88ccff, density = 0.1) {
        const fogExp = new window.THREE.FogExp2(color, density);
        this.scene.fog = fogExp;

        return fogExp;
    }

    /**
     * Create lens flare effect
     */
    createLensFlare(lightPosition) {
        // Simple lens flare using billboards
        const geometry = new window.THREE.BufferGeometry();
        const vertices = new Float32Array([
            -20, -20, 0,
            20, -20, 0,
            -20, 20, 0,
            20, 20, 0
        ]);

        geometry.setAttribute('position', new window.THREE.BufferAttribute(vertices, 3));
        geometry.setIndex(new window.THREE.BufferAttribute(new Uint16Array([0, 1, 2, 1, 3, 2]), 1));

        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');

        // Draw lens flare circle
        const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(0.3, 'rgba(255, 255, 200, 0.8)');
        gradient.addColorStop(1, 'rgba(255, 200, 100, 0)');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 128, 128);

        const texture = new window.THREE.CanvasTexture(canvas);
        const material = new window.THREE.MeshBasicMaterial({
            map: texture,
            emissive: 0xffff99,
            emissiveIntensity: 0.5,
            transparent: true,
            blending: window.THREE.AdditiveBlending
        });

        const mesh = new window.THREE.Mesh(geometry, material);
        mesh.position.copy(lightPosition);

        this.scene.add(mesh);

        return mesh;
    }

    /**
     * Create crepuscular rays (god rays from sun)
     */
    createCrepuscularRays(sunLight, rayCount = 16) {
        const rays = [];

        for (let i = 0; i < rayCount; i++) {
            const angle = (i / rayCount) * Math.PI * 2;
            const spreadX = Math.cos(angle) * 100;
            const spreadZ = Math.sin(angle) * 100;

            const ray = this.createGodRays(sunLight, {
                rayCount: 8,
                rayLength: 300,
                intensity: 0.3,
                speed: 0.002
            });

            ray.position.x += spreadX;
            ray.position.z += spreadZ;

            rays.push(ray);
        }

        return rays;
    }

    /**
     * Control volumetric light visibility
     */
    setVolumetricLightIntensity(lightMesh, intensity) {
        const rayData = this.volumetricLights.get(lightMesh.uuid);
        if (rayData) {
            rayData.intensity = Math.max(0, Math.min(1, intensity));
            lightMesh.material.emissiveIntensity = rayData.intensity;
        }
    }

    /**
     * Remove volumetric light
     */
    removeVolumetricLight(lightMesh) {
        this.scene.remove(lightMesh);
        this.volumetricLights.delete(lightMesh.uuid);
    }

    /**
     * Get volumetric lighting stats
     */
    getStats() {
        return {
            activeLights: this.volumetricLights.size,
            fogDensity: this.scene.fog?.density || 'linear',
            fogColor: this.scene.fog?.color.getHexString()
        };
    }
}

/**
 * Initialize volumetric lighting
 */
function setupVolumetricLighting() {
    if (!window.threeDEngine) {
        console.warn('Volumetric lighting requires 3D engine');
        return;
    }

    if (window.volumetricLighting) return;
    window.volumetricLighting = new VolumetricLighting(window.threeDEngine);
    return window.volumetricLighting;
}

// Auto-initialize
if (window.threeDEngine) {
    setupVolumetricLighting();
} else {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => setupVolumetricLighting(), 2000);
    });
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { VolumetricLighting, setupVolumetricLighting };
}
