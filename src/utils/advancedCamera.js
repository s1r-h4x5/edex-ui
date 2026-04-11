/**
 * Tier 3: Advanced 3D Camera System
 * Professional camera controls with orbiting, tweening, and focus tracking
 * Supports perspective shift, depth of field, and cinematic movements
 */

class AdvancedCamera {
    constructor(threeDEngine) {
        this.engine = threeDEngine;
        this.camera = threeDEngine?.camera;
        this.scene = threeDEngine?.scene;
        
        // Camera state
        this.controls = {
            orbit: true,
            autoRotate: false,
            rotationSpeed: 0.002,
            zoomSpeed: 0.1,
            panSpeed: 0.5
        };
        
        // Position tracking
        this.position = { x: 0, y: 0, z: 150 };
        this.target = { x: 0, y: 0, z: 0 };
        this.rotation = { x: 0, y: 0, z: 0 };
        
        // Animation
        this.isAnimating = false;
        this.tweenDuration = 1000;
        this.tweenStart = null;
        
        // Effect parameters
        this.depthOfField = { enabled: false, focus: 100, aperture: 2.8 };
        this.motionBlur = { enabled: false, strength: 0.5 };
        this.vignette = { enabled: false, darkness: 0.3 };
        
        this.init();
    }

    /**
     * Initialize camera system
     */
    init() {
        try {
            if (!this.camera) {
                console.warn('AdvancedCamera: No camera found in 3D engine');
                return;
            }

            this.setupEventListeners();
            this.setupOrbitAnimation();

            logger.success('Advanced camera', 'Initialized with orbit controls');

        } catch (error) {
            logger.error('Advanced camera', error.message);
        }
    }

    /**
     * Setup event listeners for camera control
     */
    setupEventListeners() {
        document.addEventListener('wheel', (e) => this.handleZoom(e));
        document.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
    }

    /**
     * Handle zoom events
     */
    handleZoom(event) {
        if (!this.controls.orbit) return;

        event.preventDefault();
        const direction = event.deltaY > 0 ? 1 : -1;
        const distance = Math.sqrt(
            this.position.x ** 2 +
            this.position.y ** 2 +
            this.position.z ** 2
        );

        const newDistance = distance + (direction * this.controls.zoomSpeed * 10);
        const ratio = newDistance / distance;

        this.position.x *= ratio;
        this.position.y *= ratio;
        this.position.z *= ratio;

        this.updateCameraPosition();
    }

    /**
     * Handle mouse movement for camera pan
     */
    handleMouseMove(event) {
        if (!this.controls.orbit || event.buttons === 0) return;

        const deltaX = event.movementX * this.controls.panSpeed;
        const deltaY = event.movementY * this.controls.panSpeed;

        // Orbit around target
        const radius = Math.sqrt(
            this.position.x ** 2 +
            this.position.y ** 2 +
            this.position.z ** 2
        );

        const theta = Math.atan2(this.position.z, this.position.x);
        const phi = Math.acos(this.position.y / radius);

        const newTheta = theta + (deltaX / radius) * 0.01;
        const newPhi = Math.max(0.1, Math.min(Math.PI - 0.1, phi + (deltaY / radius) * 0.01));

        this.position.x = radius * Math.sin(newPhi) * Math.cos(newTheta);
        this.position.y = radius * Math.cos(newPhi);
        this.position.z = radius * Math.sin(newPhi) * Math.sin(newTheta);

        this.updateCameraPosition();
    }

    /**
     * Handle keyboard camera controls
     */
    handleKeyboard(event) {
        const moveAmount = 5;
        
        switch (event.key.toLowerCase()) {
            case 'arrowup':
                this.position.y += moveAmount;
                break;
            case 'arrowdown':
                this.position.y -= moveAmount;
                break;
            case 'arrowleft':
                this.position.x -= moveAmount;
                break;
            case 'arrowright':
                this.position.x += moveAmount;
                break;
            case '1':
                this.setPreset('default');
                break;
            case '2':
                this.setPreset('topdown');
                break;
            case '3':
                this.setPreset('side');
                break;
            case '4':
                this.toggleAutoRotate();
                break;
            default:
                return;
        }

        this.updateCameraPosition();
    }

    /**
     * Update camera position
     */
    updateCameraPosition() {
        if (!this.camera) return;

        this.camera.position.set(this.position.x, this.position.y, this.position.z);
        this.camera.lookAt(this.target.x, this.target.y, this.target.z);
    }

    /**
     * Setup continuous orbit animation
     */
    setupOrbitAnimation() {
        const animate = () => {
            if (this.controls.autoRotate && this.controls.orbit) {
                const radius = Math.sqrt(
                    this.position.x ** 2 +
                    this.position.y ** 2 +
                    this.position.z ** 2
                );

                const angle = Math.atan2(this.position.z, this.position.x);
                const newAngle = angle + this.controls.rotationSpeed;

                this.position.x = radius * Math.cos(newAngle);
                this.position.z = radius * Math.sin(newAngle);

                this.updateCameraPosition();
            }

            requestAnimationFrame(animate);
        };

        animate();
    }

    /**
     * Tween camera to position
     */
    async tweenToPosition(targetPos, duration = this.tweenDuration) {
        return new Promise((resolve) => {
            const startPos = {
                x: this.position.x,
                y: this.position.y,
                z: this.position.z
            };

            const startTime = performance.now();

            const tween = (currentTime) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(1, elapsed / duration);

                // Easing function (ease-in-out-cubic)
                const easeProgress = progress < 0.5
                    ? 4 * progress * progress * progress
                    : 1 - Math.pow(-2 * progress + 2, 3) / 2;

                this.position.x = startPos.x + (targetPos.x - startPos.x) * easeProgress;
                this.position.y = startPos.y + (targetPos.y - startPos.y) * easeProgress;
                this.position.z = startPos.z + (targetPos.z - startPos.z) * easeProgress;

                this.updateCameraPosition();

                if (progress < 1) {
                    requestAnimationFrame(tween);
                } else {
                    resolve();
                }
            };

            requestAnimationFrame(tween);
        });
    }

    /**
     * Set camera to preset position
     */
    async setPreset(preset) {
        const presets = {
            default: { x: 100, y: 80, z: 100 },
            topdown: { x: 0, y: 200, z: 0.1 },
            side: { x: 200, y: 0, z: 0 },
            front: { x: 0, y: 0, z: 200 },
            back: { x: 0, y: 0, z: -200 },
            closeup: { x: 50, y: 50, z: 50 }
        };

        if (presets[preset]) {
            await this.tweenToPosition(presets[preset]);
            window.notify(`Camera preset: ${preset}`, 'info', 2000);
        }
    }

    /**
     * Toggle auto-rotate
     */
    toggleAutoRotate() {
        this.controls.autoRotate = !this.controls.autoRotate;
        window.notify(
            this.controls.autoRotate ? '⟳ Auto-rotate ON' : '⟳ Auto-rotate OFF',
            'info',
            1000
        );
    }

    /**
     * Focus on object
     */
    focusOn(object, distance = 100) {
        const box = new window.THREE.Box3().setFromObject(object);
        const center = box.getCenter(new window.THREE.Vector3());
        const size = box.getSize(new window.THREE.Vector3());

        this.target = { x: center.x, y: center.y, z: center.z };
        
        const maxDim = Math.max(size.x, size.y, size.z);
        const fov = this.camera.fov * (Math.PI / 180);
        let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2)) + distance;

        this.position = {
            x: center.x,
            y: center.y + maxDim,
            z: center.z + cameraZ
        };

        this.updateCameraPosition();
    }

    /**
     * Enable depth of field effect
     */
    setDepthOfField(enabled, focus = 100, aperture = 2.8) {
        this.depthOfField = { enabled, focus, aperture };
        
        if (enabled) {
            window.notify(`DoF: f/${aperture} @ ${focus}m`, 'info', 2000);
        }

        return this.depthOfField;
    }

    /**
     * Enable vignette effect
     */
    setVignette(enabled, darkness = 0.3) {
        this.vignette = { enabled, darkness };
        
        if (enabled) {
            window.notify(`Vignette: ${Math.round(darkness * 100)}%`, 'info', 2000);
        }

        return this.vignette;
    }

    /**
     * Get camera statistics
     */
    getStats() {
        const distance = Math.sqrt(
            this.position.x ** 2 +
            this.position.y ** 2 +
            this.position.z ** 2
        );

        return {
            position: this.position,
            target: this.target,
            distance,
            fov: this.camera?.fov,
            autoRotate: this.controls.autoRotate,
            orbit: this.controls.orbit
        };
    }
}

/**
 * Initialize advanced camera
 */
function setupAdvancedCamera() {
    if (!window.threeDEngine) {
        console.warn('Advanced camera requires 3D engine');
        return;
    }

    if (window.advancedCamera) return;
    window.advancedCamera = new AdvancedCamera(window.threeDEngine);
    return window.advancedCamera;
}

// Auto-initialize
if (window.threeDEngine) {
    setupAdvancedCamera();
} else {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => setupAdvancedCamera(), 2000);
    });
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AdvancedCamera, setupAdvancedCamera };
}
