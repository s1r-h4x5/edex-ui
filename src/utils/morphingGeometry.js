/**
 * Tier 3: Morphing & Deforming Geometry System
 * Creates animated shape transformations and organic deformations
 * Supports morphing between geometries, procedural deformation, and physics-based animation
 */

class MorphingGeometry {
    constructor(threeDEngine) {
        this.engine = threeDEngine;
        this.scene = threeDEngine?.scene;
        this.morphTargets = new Map();
        this.deformers = new Map();
        this.init();
    }

    /**
     * Initialize morphing system
     */
    init() {
        try {
            if (!window.THREE || !this.scene) {
                console.warn('MorphingGeometry: Three.js not available');
                return;
            }

            logger.success('Morphing geometry', 'Initialized');

        } catch (error) {
            logger.error('Morphing geometry', error.message);
        }
    }

    /**
     * Create morphable mesh
     */
    createMorphableMesh(geometry, material, targetGeometries = []) {
        try {
            // Ensure geometry has morph targets
            if (!geometry.morphAttributes) {
                geometry.morphAttributes = {};
            }

            if (!geometry.morphAttributes.position) {
                geometry.morphAttributes.position = [];
            }

            // Add target geometries as morph targets
            targetGeometries.forEach((targetGeom, index) => {
                geometry.morphAttributes.position[index] = targetGeom.getAttribute('position').clone();
            });

            // Create mesh with morph support
            const mesh = new window.THREE.Mesh(geometry, material);
            mesh.morphTargetInfluences = new Array(targetGeometries.length).fill(0);

            // Store morph targets
            this.morphTargets.set(mesh.uuid, {
                mesh,
                targets: targetGeometries,
                influences: mesh.morphTargetInfluences,
                playing: false,
                currentTarget: 0
            });

            this.scene.add(mesh);
            return mesh;

        } catch (error) {
            logger.error('Morphing geometry', `Failed to create morphable mesh: ${error.message}`);
            return null;
        }
    }

    /**
     * Morph between targets
     */
    async morphTo(mesh, targetIndex, duration = 1000) {
        const morphData = this.morphTargets.get(mesh.uuid);
        if (!morphData) return;

        return new Promise((resolve) => {
            const startTime = performance.now();
            const startInfluences = [...morphData.influences];

            const tween = (currentTime) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(1, elapsed / duration);

                // Reset all influences
                morphData.influences.forEach((_, i) => {
                    morphData.influences[i] = 0;
                });

                // Easing (ease-in-out)
                const easeProgress = progress < 0.5
                    ? 2 * progress * progress
                    : -1 + (4 - 2 * progress) * progress;

                morphData.influences[targetIndex] = easeProgress;
                mesh.morphTargetInfluences = morphData.influences;

                if (progress < 1) {
                    requestAnimationFrame(tween);
                } else {
                    morphData.currentTarget = targetIndex;
                    resolve();
                }
            };

            requestAnimationFrame(tween);
        });
    }

    /**
     * Animate morphing sequences
     */
    async playMorphSequence(mesh, sequence, duration = 1000) {
        const morphData = this.morphTargets.get(mesh.uuid);
        if (!morphData) return;

        morphData.playing = true;

        for (const targetIndex of sequence) {
            if (!morphData.playing) break;
            await this.morphTo(mesh, targetIndex, duration);
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        morphData.playing = false;
    }

    /**
     * Stop morphing animation
     */
    stopMorphing(mesh) {
        const morphData = this.morphTargets.get(mesh.uuid);
        if (morphData) {
            morphData.playing = false;
        }
    }

    /**
     * Deform geometry with procedural noise
     */
    applyProcuralDeformation(mesh, noiseScale = 0.1, timeSpeed = 0.001) {
        const geometry = mesh.geometry;
        const positionAttribute = geometry.getAttribute('position');
        const originalPositions = new Float32Array(positionAttribute.array);

        const deformer = {
            mesh,
            originalPositions,
            noiseScale,
            timeSpeed,
            time: 0,
            active: true
        };

        this.deformers.set(mesh.uuid, deformer);

        // Start deformation loop
        const deformLoop = () => {
            if (!deformer.active) {
                this.deformers.delete(mesh.uuid);
                return;
            }

            deformer.time += deformer.timeSpeed;

            const positions = positionAttribute.array;
            for (let i = 0; i < originalPositions.length; i += 3) {
                const x = originalPositions[i];
                const y = originalPositions[i + 1];
                const z = originalPositions[i + 2];

                // Simple noise-based deformation
                const noiseValue = Math.sin(x * 0.1 + deformer.time) *
                                   Math.cos(y * 0.1 + deformer.time) *
                                   Math.sin(z * 0.1 + deformer.time);

                positions[i] = x + noiseValue * deformer.noiseScale;
                positions[i + 1] = y + noiseValue * deformer.noiseScale * 0.5;
                positions[i + 2] = z + noiseValue * deformer.noiseScale;
            }

            positionAttribute.needsUpdate = true;
            requestAnimationFrame(deformLoop);
        };

        requestAnimationFrame(deformLoop);

        return deformer;
    }

    /**
     * Create wave deformation
     */
    applyWaveDeformation(mesh, amplitude = 0.5, frequency = 1, timeSpeed = 0.02) {
        const geometry = mesh.geometry;
        const positionAttribute = geometry.getAttribute('position');
        const originalPositions = new Float32Array(positionAttribute.array);

        const deformer = {
            mesh,
            originalPositions,
            amplitude,
            frequency,
            timeSpeed,
            time: 0,
            active: true
        };

        this.deformers.set(mesh.uuid, deformer);

        const deformLoop = () => {
            if (!deformer.active) {
                this.deformers.delete(mesh.uuid);
                return;
            }

            deformer.time += deformer.timeSpeed;

            const positions = positionAttribute.array;
            for (let i = 0; i < originalPositions.length; i += 3) {
                const x = originalPositions[i];
                const y = originalPositions[i + 1];
                const z = originalPositions[i + 2];

                const wave = Math.sin((x + deformer.time) * deformer.frequency) * deformer.amplitude;

                positions[i] = x + wave * 0.1;
                positions[i + 1] = y + wave;
                positions[i + 2] = z + wave * 0.1;
            }

            positionAttribute.needsUpdate = true;
            requestAnimationFrame(deformLoop);
        };

        requestAnimationFrame(deformLoop);

        return deformer;
    }

    /**
     * Stop deformation
     */
    stopDeformation(mesh) {
        const deformer = this.deformers.get(mesh.uuid);
        if (deformer) {
            deformer.active = false;
        }
    }

    /**
     * Create shape from parametric function
     */
    createParametricShape(uFunc, vFunc, uVect, vVect, uSegments = 30, vSegments = 20) {
        const geometry = new window.THREE.BufferGeometry();
        const vertices = [];
        const normals = [];

        for (let v = 0; v <= vSegments; v++) {
            const vSegment = v / vSegments;

            for (let u = 0; u <= uSegments; u++) {
                const uSegment = u / uSegments;

                const point = new window.THREE.Vector3();
                point.x = uFunc(uSegment, vSegment, uVect);
                point.y = vFunc(uSegment, vSegment, vVect);
                point.z = Math.sin(uSegment * Math.PI) * Math.cos(vSegment * Math.PI) * 20;

                vertices.push(point.x, point.y, point.z);
                normals.push(0, 1, 0);
            }
        }

        geometry.setAttribute('position', new window.THREE.BufferAttribute(new Float32Array(vertices), 3));
        geometry.setAttribute('normal', new window.THREE.BufferAttribute(new Float32Array(normals), 3));

        return geometry;
    }

    /**
     * Get deformation stats
     */
    getStats() {
        return {
            morphTargets: this.morphTargets.size,
            activeDeformers: this.deformers.size,
            meshes: this.morphTargets.size + this.deformers.size
        };
    }
}

/**
 * Initialize morphing geometry system
 */
function setupMorphingGeometry() {
    if (!window.threeDEngine) {
        console.warn('Morphing requires 3D engine');
        return;
    }

    if (window.morphingGeometry) return;
    window.morphingGeometry = new MorphingGeometry(window.threeDEngine);
    return window.morphingGeometry;
}

// Auto-initialize
if (window.threeDEngine) {
    setupMorphingGeometry();
} else {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => setupMorphingGeometry(), 2000);
    });
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MorphingGeometry, setupMorphingGeometry };
}
