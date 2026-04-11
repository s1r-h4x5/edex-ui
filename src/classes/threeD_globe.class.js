/**
 * Enhanced 3D Globe Module with WebGL Rendering
 * Original locationGlobe.class.js enhanced with Three.js WebGL rendering
 */

const Logger = require('../utils/Logger');
const logger = new Logger('ThreeDGlobe');

class ThreeDGlobe {
	constructor(name, parent, engine, geoiplookup) {
		this.name = name;
		this.parent = parent;
		this.engine = engine;
		this.geoiplookup = geoiplookup;
		this.dom = null;
		this.globe = null;
		this.scene = null;
		this.camera = null;
		this.renderer = null;
		this.activeConnections = [];
		this.maxConnections = 20;
		this.updateInterval = 5000;
		this.lastUpdate = 0;

		logger.info('3D Globe module initialized');
	}

	/**
	 * Initialize the globe
	 */
	init() {
		try {
			this.dom = document.createElement('div');
			this.dom.id = this.name;
			this.dom.className = 'mod-3d-globe';
			this.parent.appendChild(this.dom);

			logger.info('3D Globe module initialized');
		} catch (error) {
			logger.error('Failed to initialize 3D Globe', { error: error.message });
		}
	}

	/**
	 * Create and render a 3D globe
	 */
	createGlobe() {
		try {
			// Create globe geometry
			const globeGeometry = new THREE.SphereGeometry(20, 64, 64);

			// Create globe material with texture
			const globeMaterial = new THREE.MeshPhongMaterial({
				color: 0x001144,
				emissive: 0x000044,
				emissiveIntensity: 0.5,
				shininess: 30
			});

			// Create globe mesh
			this.globe = new THREE.Mesh(globeGeometry, globeMaterial);
			this.globe.castShadow = true;
			this.globe.receiveShadow = true;

			// Add wireframe overlay for grid effect
			const wireframeGeometry = new THREE.SphereGeometry(20.1, 32, 32);
			const wireframeMaterial = new THREE.MeshBasicMaterial({
				color: 0x00ff00,
				wireframe: true,
				transparent: true,
				opacity: 0.2
			});

			const wireframe = new THREE.Mesh(wireframeGeometry, wireframeMaterial);
			wireframe.position.copy(this.globe.position);

			// Create group for globe and its elements
			const globeGroup = new THREE.Group();
			globeGroup.add(this.globe);
			globeGroup.add(wireframe);

			this.engine.addMesh(`${this.name}-globe`, globeGroup);

			// Register animation loop for globe rotation
			this.engine.registerAnimation(`${this.name}-rotation`, (deltaTime) => {
				this.updateGlobeRotation(globeGroup, deltaTime);
			});

			logger.info('3D Globe created');
			return globeGroup;
		} catch (error) {
			logger.error('Failed to create 3D globe', { error: error.message });
			return null;
		}
	}

	/**
	 * Update globe rotation
	 */
	updateGlobeRotation(globeGroup, deltaTime) {
		if (globeGroup) {
			globeGroup.rotation.y += deltaTime * 0.1;
		}
	}

	/**
	 * Add connection point to globe
	 */
	addConnection(lat, lon, color = 0x00ff00) {
		try {
			// Convert lat/lon to 3D position on sphere
			const phi = (90 - lat) * (Math.PI / 180);
			const theta = (lon + 180) * (Math.PI / 180);

			const x = 20 * Math.sin(phi) * Math.cos(theta);
			const y = 20 * Math.cos(phi);
			const z = 20 * Math.sin(phi) * Math.sin(theta);

			// Create marker
			const markerGeometry = new THREE.SphereGeometry(0.5, 16, 16);
			const markerMaterial = new THREE.MeshBasicMaterial({
				color: color,
				emissive: color,
				emissiveIntensity: 0.8
			});

			const marker = new THREE.Mesh(markerGeometry, markerMaterial);
			marker.position.set(x, y, z);

			this.engine.addMesh(`connection-${Date.now()}-${Math.random()}`, marker);

			this.activeConnections.push({
				marker: marker,
				position: new THREE.Vector3(x, y, z),
				creationTime: Date.now()
			});

			// Remove old connections if exceeded max
			if (this.activeConnections.length > this.maxConnections) {
				const oldConnection = this.activeConnections.shift();
				this.engine.removeMesh(`connection-${oldConnection.creationTime}`);
			}

			logger.debug(`Connection added at lat: ${lat}, lon: ${lon}`);
		} catch (error) {
			logger.error('Failed to add connection', { error: error.message });
		}
	}

	/**
	 * Update globe with location data
	 */
	updateLocations() {
		const now = Date.now();
		if (now - this.lastUpdate < this.updateInterval) {
			return;
		}

		try {
			// This would normally fetch real location data from network events
			// For now, it's a placeholder for integration with the main application
			this.lastUpdate = now;
		} catch (error) {
			logger.error('Failed to update locations', { error: error.message });
		}
	}

	/**
	 * Render the globe
	 */
	render() {
		this.updateLocations();

		if (!this.dom) return;

		// Update or create globe
		if (!this.globe) {
			this.createGlobe();
		}
	}

	/**
	 * Remove active connections
	 */
	clearConnections() {
		this.activeConnections.forEach(conn => {
			this.engine.removeMesh(`connection-${conn.creationTime}`);
		});
		this.activeConnections = [];
		logger.info('Connections cleared');
	}

	/**
	 * Close the module
	 */
	close() {
		if (this.dom && this.dom.parentNode) {
			this.dom.parentNode.removeChild(this.dom);
		}

		this.clearConnections();
		this.engine.removeMesh(`${this.name}-globe`);
		this.engine.unregisterAnimation(`${this.name}-rotation`);

		logger.info('3D Globe module closed');
	}
}

// Export for use as a class
if (typeof module !== 'undefined' && module.exports) {
	module.exports = ThreeDGlobe;
}
