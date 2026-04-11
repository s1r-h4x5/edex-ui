/**
 * 3D Scene Initializer for eDEX-UI
 * Sets up the complete 3D environment with particles and visualizations
 */

const Logger = require('./Logger');
const logger = new Logger('3DSceneInit');

class ThreeDSceneInitializer {
	constructor(containerId = 'canvas-3d') {
		this.containerId = containerId;
		this.engine = null;
		this.particleSystem = null;
		this.visualizations = null;
		this.initialized = false;
	}

	/**
	 * Initialize the complete 3D scene
	 */
	init() {
		try {
			logger.info('Initializing 3D scene...');

			// Create 3D engine
			this.engine = new ThreeDEngine(this.containerId, {
				antialias: true,
				alpha: false,
				shadowMap: true,
				pixelRatio: window.devicePixelRatio || 1
			});

			if (!this.engine.init()) {
				logger.warn('3D Engine initialization failed, falling back to 2D');
				return false;
			}

			// Setup lighting
			this.setupLighting();

			// Create particle system
			this.particleSystem = new ParticleSystem(this.engine);

			// Create visualizations
			this.visualizations = new ThreeDVisualizations(this.engine);

			// Setup environment
			this.setupEnvironment();

			// Start render loop
			this.engine.startRenderLoop();

			this.initialized = true;
			logger.info('3D scene initialized successfully');
			return true;
		} catch (error) {
			logger.error('Failed to initialize 3D scene', { error: error.message });
			return false;
		}
	}

	/**
	 * Setup lighting for the scene
	 */
	setupLighting() {
		// Ambient light for overall illumination
		const ambientLight = new THREE.AmbientLight(0x0033ff, 0.4);
		this.engine.addLight('ambient', ambientLight);

		// Main directional light
		const directionalLight = new THREE.DirectionalLight(0x00ff00, 0.6);
		directionalLight.position.set(30, 40, 30);
		directionalLight.castShadow = true;
		directionalLight.shadow.mapSize.width = 2048;
		directionalLight.shadow.mapSize.height = 2048;
		this.engine.addLight('main', directionalLight);

		// Accent point lights for atmosphere
		const pointLight1 = new THREE.PointLight(0xff00ff, 0.4);
		pointLight1.position.set(-30, 20, -30);
		this.engine.addLight('accent1', pointLight1);

		const pointLight2 = new THREE.PointLight(0x00ffff, 0.3);
		pointLight2.position.set(30, -20, -30);
		this.engine.addLight('accent2', pointLight2);

		logger.info('Lighting setup complete');
	}

	/**
	 * Setup the environment with background effects
	 */
	setupEnvironment() {
		try {
			// Create digital rain background
			this.particleSystem.createDigitalRain('background-rain', {
				count: 200,
				speed: 0.3,
				width: 200,
				height: 150,
				color: 0x00ff00,
				luminosity: 0.5
			});

			// Create floating particle clouds
			this.particleSystem.createParticleCloud('atmos-cloud-1', {
				count: 150,
				radius: 40,
				color: 0x0088ff,
				turbulence: 0.3
			});

			// Create geometric nodes background
			this.particleSystem.createGeometricNodes('network-nodes', {
				count: 40,
				radius: 50,
				nodeSize: 0.2,
				nodeColor: 0x00ff99,
				connectionColor: 0x00ff99
			});

			// Create energy field
			this.particleSystem.createEnergyField('energy-aura', {
				radius: 25,
				color: 0xff00ff,
				intensity: 0.5,
				segments: 16
			});

			logger.info('Environment setup complete');
		} catch (error) {
			logger.error('Failed to setup environment', { error: error.message });
		}
	}

	/**
	 * Create a monitoring dashboard with 3D visualizations
	 */
	createMonitoringDashboard(options = {}) {
		try {
			const {
				showCPU = true,
				showMemory = true,
				showNetwork = true,
				position = { x: 0, y: 0, z: 0 }
			} = options;

			const dashboardGroup = this.engine.createGroup('monitoring-dashboard');
			dashboardGroup.position.set(position.x, position.y, position.z);

			if (showCPU) {
				this.visualizations.createEnergyRing('cpu-ring', {
					innerRadius: 3,
					outerRadius: 5,
					intensity: 0.7,
					color: 0xffaa00
				});
			}

			if (showMemory) {
				this.visualizations.createSphereGauge('memory-sphere', {
					value: 50,
					maxValue: 100,
					radius: 8,
					color: 0x00ffff
				});
			}

			if (showNetwork) {
				this.visualizations.createBarChart('network-bars', {
					data: [0.5, 0.6, 0.7, 0.4, 0.8],
					color: 0x00ff66
				});
			}

			logger.info('Monitoring dashboard created');
			return dashboardGroup;
		} catch (error) {
			logger.error('Failed to create monitoring dashboard', { error: error.message });
			return null;
		}
	}

	/**
	 * Update visualization data
	 */
	updateData(cpuLoad, memoryUsage, networkActivity) {
		try {
			if (cpuLoad !== undefined) {
				this.visualizations.updateEnergyRing('cpu-ring', 0);
			}

			if (memoryUsage !== undefined) {
				this.visualizations.updateSphereGauge('memory-sphere', memoryUsage);
			}

			if (networkActivity !== undefined) {
				const barData = Array.isArray(networkActivity) ? networkActivity : [networkActivity];
				this.visualizations.updateBarChart('network-bars', barData);
			}
		} catch (error) {
			logger.error('Failed to update data', { error: error.message });
		}
	}

	/**
	 * Toggle particle system visibility
	 */
	toggleParticles(enable) {
		const systems = this.particleSystem.getActiveSystems();
		systems.forEach(system => {
			if (enable) {
				this.particleSystem.resumeParticleSystem(system.name);
			} else {
				this.particleSystem.stopParticleSystem(system.name);
			}
		});
		logger.info(`Particles ${enable ? 'enabled' : 'disabled'}`);
	}

	/**
	 * Get engine reference
	 */
	getEngine() {
		return this.engine;
	}

	/**
	 * Get particle system reference
	 */
	getParticleSystem() {
		return this.particleSystem;
	}

	/**
	 * Get visualizations reference
	 */
	getVisualizations() {
		return this.visualizations;
	}

	/**
	 * Check if 3D is enabled
	 */
	is3DEnabled() {
		return this.initialized && this.engine && this.engine.enabled;
	}

	/**
	 * Dispose all 3D resources
	 */
	dispose() {
		if (this.particleSystem) this.particleSystem.dispose();
		if (this.visualizations) this.visualizations.dispose();
		if (this.engine) this.engine.dispose();

		this.engine = null;
		this.particleSystem = null;
		this.visualizations = null;
		this.initialized = false;

		logger.info('3D scene disposed');
	}
}

// Export for use as a class
if (typeof module !== 'undefined' && module.exports) {
	module.exports = ThreeDSceneInitializer;
}
