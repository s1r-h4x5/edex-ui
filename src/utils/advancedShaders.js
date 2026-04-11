/**
 * Tier 3: Advanced Shader System
 * Custom GLSL shaders for advanced visual effects
 * Handles shader creation, compilation, and material assignments
 */

class AdvancedShaders {
    constructor(threeDEngine) {
        this.engine = threeDEngine;
        this.shaders = new Map();
        this.materials = new Map();
        
        this.init();
    }

    /**
     * Initialize shader system
     */
    init() {
        try {
            this.registerDefaultShaders();
            logger.success('Advanced Shaders', 'Shader system initialized');
        } catch (error) {
            logger.error('Advanced Shaders', error.message);
        }
    }

    /**
     * Register default shaders
     */
    registerDefaultShaders() {
        // Holographic shader
        this.registerShader('holographic', {
            vertex: `
                varying vec3 vNormal;
                varying vec3 vPosition;
                varying float vTime;
                
                uniform float uTime;
                uniform float uWave;
                
                void main() {
                    vNormal = normalize(normalMatrix * normal);
                    vPosition = position;
                    vTime = uTime;
                    
                    vec3 pos = position;
                    pos += normal * sin(uTime * 2.0 + position.y * 0.5) * uWave;
                    
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
                }
            `,
            fragment: `
                varying vec3 vNormal;
                varying vec3 vPosition;
                varying float vTime;
                
                uniform vec3 uColor;
                uniform float uIntensity;
                
                void main() {
                    vec3 normal = normalize(vNormal);
                    float brightness = abs(dot(normal, vec3(0.0, 0.0, 1.0)));
                    
                    vec3 baseColor = uColor;
                    vec3 iridescence = vec3(
                        sin(vTime * 0.5 + vPosition.x) * 0.5 + 0.5,
                        sin(vTime * 0.5 + vPosition.y + 2.0) * 0.5 + 0.5,
                        sin(vTime * 0.5 + vPosition.z + 4.0) * 0.5 + 0.5
                    );
                    
                    vec3 finalColor = mix(baseColor, iridescence, 0.5) * brightness * uIntensity;
                    
                    gl_FragColor = vec4(finalColor, 0.8);
                }
            `,
            uniforms: {
                uTime: { value: 0 },
                uColor: { value: new window.THREE.Color(0x00ffff) },
                uWave: { value: 0.1 },
                uIntensity: { value: 1.0 }
            }
        });

        // Cyber grid shader
        this.registerShader('cyberGrid', {
            vertex: `
                varying vec2 vUv;
                varying vec3 vPosition;
                
                void main() {
                    vUv = uv;
                    vPosition = position;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragment: `
                varying vec2 vUv;
                varying vec3 vPosition;
                
                uniform float uGridSize;
                uniform float uLineWidth;
                uniform vec3 uColor;
                uniform float uTime;
                
                void main() {
                    vec2 grid = fract(vPosition.xz / uGridSize);
                    float line = step(uLineWidth, grid.x) * step(uLineWidth, grid.y);
                    
                    // Animated glow
                    float glow = sin(uTime * 2.0 - vPosition.y * 0.1) * 0.5 + 0.5;
                    
                    vec3 finalColor = mix(uColor, vec3(1.0), glow * 0.3) * (1.0 - line);
                    
                    gl_FragColor = vec4(finalColor, 1.0 - line);
                }
            `,
            uniforms: {
                uTime: { value: 0 },
                uGridSize: { value: 10 },
                uLineWidth: { value: 0.1 },
                uColor: { value: new window.THREE.Color(0x00ff88) }
            }
        });

        // Plasma shader
        this.registerShader('plasma', {
            vertex: `
                varying vec3 vPosition;
                
                void main() {
                    vPosition = position;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragment: `
                varying vec3 vPosition;
                
                uniform float uTime;
                uniform float uScale;
                
                float noise(vec3 p) {
                    return sin(p.x * 10.0) * cos(p.y * 10.0) * sin(p.z * 10.0);
                }
                
                void main() {
                    vec3 p = vPosition * uScale;
                    p += uTime;
                    
                    float n = noise(p);
                    n += noise(p * 2.0) * 0.5;
                    n += noise(p * 4.0) * 0.25;
                    
                    float plasma = sin(n * 3.14159) * 0.5 + 0.5;
                    
                    vec3 color = vec3(
                        sin(plasma * 3.14159),
                        sin(plasma * 3.14159 + 2.0),
                        sin(plasma * 3.14159 + 4.0)
                    );
                    
                    gl_FragColor = vec4(color * plasma, 1.0);
                }
            `,
            uniforms: {
                uTime: { value: 0 },
                uScale: { value: 1.0 }
            }
        });

        // Liquid metal shader
        this.registerShader('liquidMetal', {
            vertex: `
                varying vec3 vNormal;
                varying vec3 vViewDir;
                varying vec3 vPosition;
                
                uniform float uTime;
                
                void main() {
                    vNormal = normalize(normalMatrix * normal);
                    vPosition = position;
                    vViewDir = normalize(cameraPosition - (modelMatrix * vec4(position, 1.0)).xyz);
                    
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragment: `
                varying vec3 vNormal;
                varying vec3 vViewDir;
                varying vec3 vPosition;
                
                uniform vec3 uColor;
                uniform float uTime;
                uniform float uMetalness;
                
                void main() {
                    vec3 normal = normalize(vNormal);
                    
                    // Fresnel effect
                    float fresnel = pow(1.0 - abs(dot(vViewDir, normal)), 2.0);
                    
                    // Ripple effect
                    float ripple = sin(length(vPosition) - uTime * 5.0) * 0.5 + 0.5;
                    
                    vec3 baseColor = mix(uColor, vec3(1.0), fresnel);
                    vec3 finalColor = baseColor * (0.7 + ripple * 0.3);
                    
                    gl_FragColor = vec4(finalColor, 0.9 + uMetalness * 0.1);
                }
            `,
            uniforms: {
                uTime: { value: 0 },
                uColor: { value: new window.THREE.Color(0xff00ff) },
                uMetalness: { value: 0.8 }
            }
        });

        // Wireframe quantum shader
        this.registerShader('quantumWire', {
            vertex: `
                varying vec3 vPosition;
                
                void main() {
                    vPosition = position;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragment: `
                varying vec3 vPosition;
                
                uniform float uTime;
                uniform vec3 uColor;
                
                void main() {
                    float pattern = abs(sin(vPosition.x * 10.0)) + abs(sin(vPosition.y * 10.0));
                    pattern += abs(sin(vPosition.z * 10.0));
                    pattern = step(1.5, pattern);
                    
                    float pulse = sin(uTime * 5.0) * 0.5 + 0.5;
                    
                    vec3 color = mix(uColor, vec3(1.0), pulse) * pattern;
                    
                    gl_FragColor = vec4(color, pattern);
                }
            `,
            uniforms: {
                uTime: { value: 0 },
                uColor: { value: new window.THREE.Color(0x00ffaa) }
            }
        });
    }

    /**
     * Register custom shader
     */
    registerShader(name, shaderDef) {
        this.shaders.set(name, shaderDef);
    }

    /**
     * Create shader material
     */
    createShaderMaterial(shaderName, overrideUniforms = {}) {
        const shaderDef = this.shaders.get(shaderName);
        if (!shaderDef) {
            console.warn(`Shader not found: ${shaderName}`);
            return null;
        }

        const uniforms = window.THREE.UniformsUtils.clone(shaderDef.uniforms);
        
        // Override uniforms
        for (const [key, value] of Object.entries(overrideUniforms)) {
            if (uniforms[key]) {
                uniforms[key].value = value;
            }
        }

        const material = new window.THREE.ShaderMaterial({
            uniforms,
            vertexShader: shaderDef.vertex,
            fragmentShader: shaderDef.fragment,
            transparent: true,
            side: window.THREE.DoubleSide
        });

        return material;
    }

    /**
     * Apply shader to mesh
     */
    applyShaderToMesh(mesh, shaderName, overrideUniforms = {}) {
        const material = this.createShaderMaterial(shaderName, overrideUniforms);
        if (material) {
            mesh.material = material;
            this.materials.set(mesh.uuid, { material, shaderName });
        }
    }

    /**
     * Update shader uniforms
     */
    updateShaderUniforms(mesh, uniforms) {
        const materialData = this.materials.get(mesh.uuid);
        if (materialData) {
            for (const [key, value] of Object.entries(uniforms)) {
                if (materialData.material.uniforms[key]) {
                    materialData.material.uniforms[key].value = value;
                }
            }
        }
    }

    /**
     * Animate shader over time
     */
    animateShader(mesh, duration = Infinity) {
        const materialData = this.materials.get(mesh.uuid);
        if (!materialData) return;

        const startTime = performance.now();

        const animate = () => {
            const elapsed = (performance.now() - startTime) / 1000;
            
            if (materialData.material.uniforms.uTime) {
                materialData.material.uniforms.uTime.value = elapsed;
            }

            if (elapsed < duration) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }

    /**
     * Get available shaders
     */
    getAvailableShaders() {
        return Array.from(this.shaders.keys());
    }

    /**
     * Remove shader material
     */
    removeShaderMaterial(mesh) {
        this.materials.delete(mesh.uuid);
    }

    /**
     * Get shader stats
     */
    getStats() {
        return {
            registeredShaders: this.shaders.size,
            activeMaterials: this.materials.size,
            availableShaders: this.getAvailableShaders()
        };
    }
}

/**
 * Initialize shader system
 */
function setupAdvancedShaders() {
    if (!window.threeDEngine) {
        console.warn('Advanced shaders require 3D engine');
        return;
    }

    if (window.advancedShaders) return;
    window.advancedShaders = new AdvancedShaders(window.threeDEngine);
    return window.advancedShaders;
}

// Auto-initialize
if (window.threeDEngine) {
    setupAdvancedShaders();
} else {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => setupAdvancedShaders(), 2000);
    });
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AdvancedShaders, setupAdvancedShaders };
}
