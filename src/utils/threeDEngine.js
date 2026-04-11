/**
 * 3D Engine Module - Core Three.js wrapper and management
 * Provides a centralized interface for all 3D rendering in eDEX-UI
 */

const Logger = require('./Logger');
const logger = new Logger('3DEngine');

class ThreeDEngine {
	constructor(containerId, options = {}) {
		this.containerId = containerId;
		this.container = null;
		this.scene = null;
		this.camera = null;
		this.renderer = null;
		this.clock = null;
		this.animations = new Map();
		this.meshes = new Map();
		this.lights = new Map();
		this.enabled = true;
		
		// Configuration
		this.config = {
			antialias: options.antialias !== false,
			alpha: options.alpha !== false,
			shadowMap: options.shadowMap !== false,
			pixelRatio: options.pixelRatio || (typeof window !== 'undefined' ? window.devicePixelRatio : 1),
			fov: options.fov || 75,
			near: options.near || 0.1,
			far: options.far || 10000,
			...options
		};

		logger.info('3D Engine initialized with config', this.config);
	}

	/**
	 * Initialize the 3D rendering environment
	 */
	init() {
		try {
			this.container = document.getElementById(this.containerId);
			if (!this.container) {
				throw new Error(`Container #${this.containerId} not found`);
			}

			// Create Three.js components
			this.scene = new THREE.Scene();
			this.scene.background = new THREE.Color(0x000000);
			this.scene.fog = new THREE.FogExp2(0x000000, 0.002);

			const width = this.container.clientWidth;
			const height = this.container.clientHeight;

			this.camera = new THREE.PerspectiveCamera(
				this.config.fov,
				width / height,
				this.config.near,
				this.config.far
			);
			this.camera.position.z = 50;

			this.renderer = new THREE.WebGLRenderer({
				antialias: this.config.antialias,
				alpha: this.config.alpha,
				powerPreference: 'high-performance'
			});

			this.renderer.setPixelRatio(this.config.pixelRatio);
			this.renderer.setSize(width, height);
			this.renderer.shadowMap.enabled = this.config.shadowMap;
			this.renderer.shadowMap.type = THREE.PCFShadowShadowMap;

			this.container.appendChild(this.renderer.domElement);

			this.clock = new THREE.Clock();

			// Handle window resize
			window.addEventListener('resize', () => this.onWindowResize());

			logger.info('3D Engine initialized successfully');
			return true;
		} catch (error) {
			logger.error('Failed to initialize 3D Engine', { error: error.message });
			this.enabled = false;
			return false;
		}
	}

	/**
	 * Handle window resize
	 */
	onWindowResize() {
		if (!this.container || !this.camera || !this.renderer) return;

		const width = this.container.clientWidth;
		const height = this.container.clientHeight;

		this.camera.aspect = width / height;
		this.camera.updateProjectionMatrix();
		this.renderer.setSize(width, height);

		logger.debug('Window resized', { width, height });
	}

	/**
	 * Add a mesh to the scene
	 */
	addMesh(name, mesh) {
		if (!(mesh instanceof THREE.Object3D)) {
			throw new Error('Invalid mesh object');
		}
		this.meshes.set(name, mesh);
		this.scene.add(mesh);
		logger.debug(`Mesh added: ${name}`);
		return mesh;
	}

	/**
	 * Remove a mesh from the scene
	 */
	removeMesh(name) {
		const mesh = this.meshes.get(name);
		if (mesh) {
			this.scene.remove(mesh);
			this.meshes.delete(name);
			logger.debug(`Mesh removed: ${name}`);
		}
	}

	/**
	 * Get a mesh by name
	 */
	getMesh(name) {
		return this.meshes.get(name);
	}

	/**
	 * Add a light to the scene
	 */
	addLight(name, light) {
		if (!(light instanceof THREE.Light)) {
			throw new Error('Invalid light object');
		}
		this.lights.set(name, light);
		this.scene.add(light);
		logger.debug(`Light added: ${name}`);
		return light;
	}

	/**
	 * Register an animation loop
	 */
	registerAnimation(name, callback) {
		if (typeof callback !== 'function') {
			throw new Error('Animation callback must be a function');
		}
		this.animations.set(name, callback);
		logger.debug(`Animation registered: ${name}`);
	}

	/**
	 * Unregister an animation loop
	 */
	unregisterAnimation(name) {
		this.animations.delete(name);
		logger.debug(`Animation unregistered: ${name}`);
	}

	/**
	 * Main render loop
	 */
	render() {
		if (!this.enabled) return;

		const deltaTime = this.clock.getDelta();

		// Execute registered animations
		for (const [name, callback] of this.animations.entries()) {
			try {
				callback(deltaTime, this.scene, this.camera);
			} catch (error) {
				logger.error(`Animation error: ${name}`, { error: error.message });
			}
		}

		this.renderer.render(this.scene, this.camera);
	}

	/**
	 * Start the render loop
	 */
	startRenderLoop() {
		const renderLoop = () => {
			this.render();
			requestAnimationFrame(renderLoop);
		};
		renderLoop();
		logger.info('Render loop started');
	}

	/**
	 * Create a group for organizing meshes
	 */
	createGroup(name) {
		const group = new THREE.Group();
		this.addMesh(name, group);
		return group;
	}

	/**
	 * Update camera position
	 */
	setCameraPosition(x, y, z) {
		this.camera.position.set(x, y, z);
		this.camera.lookAt(0, 0, 0);
	}

	/**
	 * Dispose of all resources
	 */
	dispose() {
		// Dispose geometries and materials
		this.meshes.forEach(mesh => {
			if (mesh.geometry) mesh.geometry.dispose();
			if (mesh.material) {
				if (Array.isArray(mesh.material)) {
					mesh.material.forEach(m => m.dispose());
				} else {
					mesh.material.dispose();
				}
			}
		});

		// Dispose lights
		this.lights.forEach(light => {
			if (light.shadow && light.shadow.map) {
				light.shadow.map.dispose();
			}
		});

		// Clear animations
		this.animations.clear();

		// Dispose renderer
		if (this.renderer) {
			this.renderer.dispose();
		}

		logger.info('3D Engine disposed');
	}
}

// Export for use as a class
if (typeof module !== 'undefined' && module.exports) {
	module.exports = ThreeDEngine;
}
