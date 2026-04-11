/**
 * 3D Particle System for eDEX-UI
 * Creates dynamic particle effects like digital rain, energy fields, etc.
 */

const Logger = require('./Logger');
const logger = new Logger('ParticleSystem');

class ParticleSystem {
	constructor(engine) {
		this.engine = engine;
		this.particles = new Map();
		this.emitters = new Map();
		logger.info('Particle system initialized');
	}

	/**
	 * Create a digital rain effect
	 */
	createDigitalRain(name, options = {}) {
		const {
			count = 500,
			speed = 0.5,
			width = 100,
			height = 100,
			color = 0x00ff00,
			luminosity = 0.8
		} = options;

		try {
			const geometry = new THREE.BufferGeometry();
			const positions = [];
			const velocities = [];

			for (let i = 0; i < count; i++) {
				positions.push(
					Math.random() * width - width / 2,
					Math.random() * height - height / 2,
					Math.random() * 50 - 25
				);

				velocities.push(
					(Math.random() - 0.5) * 0.1,
					-speed * (0.5 + Math.random() * 0.5),
					0
				);
			}

			geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));

			const material = new THREE.PointsMaterial({
				color: color,
				size: 0.2,
				sizeAttenuation: true,
				transparent: true,
				opacity: luminosity
			});

			const particleSystem = new THREE.Points(geometry, material);
			particleSystem.userData.velocities = velocities;
			particleSystem.userData.resetPositions = positions.slice();
			particleSystem.userData.width = width;
			particleSystem.userData.height = height;

			this.engine.addMesh(name, particleSystem);
			this.particles.set(name, {
				system: particleSystem,
				type: 'rain',
				active: true
			});

			// Register animation
			this.engine.registerAnimation(`${name}-animation`, (deltaTime) => {
				this.updateDigitalRain(name, deltaTime);
			});

			logger.info(`Digital rain created: ${name}`);
			return particleSystem;
		} catch (error) {
			logger.error(`Failed to create digital rain: ${name}`, { error: error.message });
			throw error;
		}
	}

	/**
	 * Update digital rain particles
	 */
	updateDigitalRain(name, deltaTime) {
		const { system } = this.particles.get(name);
		const positions = system.geometry.attributes.position.array;
		const velocities = system.userData.velocities;
		const resetPositions = system.userData.resetPositions;
		const width = system.userData.width;
		const height = system.userData.height;

		for (let i = 0; i < positions.length; i += 3) {
			positions[i] += velocities[i * 1] * deltaTime;
			positions[i + 1] += velocities[i * 1 + 1] * deltaTime;
			positions[i + 2] += velocities[i * 1 + 2] * deltaTime;

			// Reset particles that fall below
			if (positions[i + 1] < -height / 2) {
				positions[i] = resetPositions[i];
				positions[i + 1] = height / 2;
				positions[i + 2] = resetPositions[i + 2];
			}
		}

		system.geometry.attributes.position.needsUpdate = true;
	}

	/**
	 * Create a floating particle cloud
	 */
	createParticleCloud(name, options = {}) {
		const {
			count = 200,
			radius = 20,
			color = 0x00ffff,
			turbulence = 0.5
		} = options;

		try {
			const geometry = new THREE.BufferGeometry();
			const positions = [];

			for (let i = 0; i < count; i++) {
				const phi = Math.random() * Math.PI * 2;
				const theta = Math.random() * Math.PI;
				const r = radius * (0.5 + Math.random() * 0.5);

				positions.push(
					r * Math.sin(theta) * Math.cos(phi),
					r * Math.sin(theta) * Math.sin(phi),
					r * Math.cos(theta)
				);
			}

			geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));

			const material = new THREE.PointsMaterial({
				color: color,
				size: 0.5,
				sizeAttenuation: true,
				transparent: true,
				opacity: 0.6
			});

			const particleSystem = new THREE.Points(geometry, material);
			particleSystem.userData.turbulence = turbulence;
			particleSystem.userData.time = 0;
			particleSystem.userData.initialPositions = positions.slice();

			this.engine.addMesh(name, particleSystem);
			this.particles.set(name, {
				system: particleSystem,
				type: 'cloud',
				active: true
			});

			// Register animation
			this.engine.registerAnimation(`${name}-animation`, (deltaTime) => {
				this.updateParticleCloud(name, deltaTime);
			});

			logger.info(`Particle cloud created: ${name}`);
			return particleSystem;
		} catch (error) {
			logger.error(`Failed to create particle cloud: ${name}`, { error: error.message });
			throw error;
		}
	}

	/**
	 * Update particle cloud with turbulent motion
	 */
	updateParticleCloud(name, deltaTime) {
		const { system } = this.particles.get(name);
		system.userData.time += deltaTime;

		const positions = system.geometry.attributes.position.array;
		const initialPositions = system.userData.initialPositions;
		const turbulence = system.userData.turbulence;
		const time = system.userData.time;

		for (let i = 0; i < positions.length; i += 3) {
			positions[i] = initialPositions[i] + Math.sin(time + i) * turbulence;
			positions[i + 1] = initialPositions[i + 1] + Math.sin(time + i + 1) * turbulence;
			positions[i + 2] = initialPositions[i + 2] + Math.cos(time + i + 2) * turbulence;
		}

		system.geometry.attributes.position.needsUpdate = true;
		system.rotation.x += deltaTime * 0.02;
		system.rotation.y += deltaTime * 0.03;
	}

	/**
	 * Create energy field effect
	 */
	createEnergyField(name, options = {}) {
		const {
			radius = 30,
			color = 0xff00ff,
			intensity = 0.7,
			segments = 32
		} = options;

		try {
			const geometry = new THREE.IcosahedronGeometry(radius, segments);

			const material = new THREE.MeshPhongMaterial({
				color: color,
				emissive: color,
				emissiveIntensity: intensity,
				transparent: true,
				opacity: 0.3,
				wireframe: true
			});

			const field = new THREE.Mesh(geometry, material);
			field.userData.targetIntensity = intensity;

			this.engine.addMesh(name, field);
			this.particles.set(name, {
				system: field,
				type: 'field',
				active: true
			});

			// Register animation
			this.engine.registerAnimation(`${name}-animation`, (deltaTime) => {
				this.updateEnergyField(name, deltaTime);
			});

			logger.info(`Energy field created: ${name}`);
			return field;
		} catch (error) {
			logger.error(`Failed to create energy field: ${name}`, { error: error.message });
			throw error;
		}
	}

	/**
	 * Update energy field
	 */
	updateEnergyField(name, deltaTime) {
		const { system } = this.particles.get(name);
		system.rotation.x += deltaTime * 0.5;
		system.rotation.y += deltaTime * 0.3;
		system.rotation.z += deltaTime * 0.2;

		// Pulsing effect
		const pulse = Math.sin(Date.now() * 0.001) * 0.5 + 0.5;
		system.material.opacity = 0.2 + pulse * 0.3;
		system.material.emissiveIntensity = system.userData.targetIntensity * pulse;
	}

	/**
	 * Create geometric nodes effect (3D network visualization)
	 */
	createGeometricNodes(name, options = {}) {
		const {
			count = 50,
			radius = 30,
			nodeSize = 0.3,
			nodeColor = 0x00ff00,
			connectionColor = 0x00ff00
		} = options;

		try {
			const group = new THREE.Group();

			// Create nodes
			const nodeGeometry = new THREE.SphereGeometry(nodeSize, 8, 8);
			const nodeMaterial = new THREE.MeshBasicMaterial({ color: nodeColor });

			const nodes = [];
			const positions = [];

			for (let i = 0; i < count; i++) {
				const node = new THREE.Mesh(nodeGeometry, nodeMaterial.clone());
				const phi = Math.random() * Math.PI * 2;
				const theta = Math.random() * Math.PI;
				const r = radius * (0.5 + Math.random() * 0.5);

				node.position.set(
					r * Math.sin(theta) * Math.cos(phi),
					r * Math.sin(theta) * Math.sin(phi),
					r * Math.cos(theta)
				);

				nodes.push(node);
				positions.push(node.position.clone());
				group.add(node);
			}

			// Create connections
			const connectionGeometry = new THREE.BufferGeometry();
			const connectionPositions = [];

			for (let i = 0; i < count; i++) {
				for (let j = i + 1; j < Math.min(i + 4, count); j++) {
					connectionPositions.push(
						positions[i].x, positions[i].y, positions[i].z,
						positions[j].x, positions[j].y, positions[j].z
					);
				}
			}

			connectionGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(connectionPositions), 3));

			const connectionMaterial = new THREE.LineBasicMaterial({
				color: connectionColor,
				transparent: true,
				opacity: 0.4
			});

			const connections = new THREE.LineSegments(connectionGeometry, connectionMaterial);
			group.add(connections);

			group.userData.nodes = nodes;
			group.userData.positions = positions;

			this.engine.addMesh(name, group);
			this.particles.set(name, {
				system: group,
				type: 'nodes',
				active: true
			});

			// Register animation
			this.engine.registerAnimation(`${name}-animation`, (deltaTime) => {
				this.updateGeometricNodes(name, deltaTime);
			});

			logger.info(`Geometric nodes created: ${name}`);
			return group;
		} catch (error) {
			logger.error(`Failed to create geometric nodes: ${name}`, { error: error.message });
			throw error;
		}
	}

	/**
	 * Update geometric nodes
	 */
	updateGeometricNodes(name, deltaTime) {
		const { system } = this.particles.get(name);
		const nodes = system.userData.nodes;
		const positions = system.userData.positions;
		const time = Date.now() * 0.0005;

		nodes.forEach((node, i) => {
			const originalPos = positions[i];
			node.position.x = originalPos.x + Math.sin(time + i) * 2;
			node.position.y = originalPos.y + Math.cos(time + i + 1) * 2;
			node.position.z = originalPos.z + Math.sin(time + i + 2) * 2;
		});

		system.rotation.x += deltaTime * 0.1;
		system.rotation.y += deltaTime * 0.15;
	}

	/**
	 * Stop a particle system
	 */
	stopParticleSystem(name) {
		const particle = this.particles.get(name);
		if (particle) {
			particle.active = false;
			this.engine.unregisterAnimation(`${name}-animation`);
			logger.info(`Particle system stopped: ${name}`);
		}
	}

	/**
	 * Resume a particle system
	 */
	resumeParticleSystem(name) {
		const particle = this.particles.get(name);
		if (particle) {
			particle.active = true;
			logger.info(`Particle system resumed: ${name}`);
		}
	}

	/**
	 * Remove a particle system
	 */
	removeParticleSystem(name) {
		const particle = this.particles.get(name);
		if (particle) {
			this.engine.removeMesh(name);
			this.engine.unregisterAnimation(`${name}-animation`);
			this.particles.delete(name);
			logger.info(`Particle system removed: ${name}`);
		}
	}

	/**
	 * Get all active particle systems
	 */
	getActiveSystems() {
		const active = [];
		for (const [name, particle] of this.particles.entries()) {
			if (particle.active) {
				active.push({ name, type: particle.type });
			}
		}
		return active;
	}

	/**
	 * Dispose all particle systems
	 */
	dispose() {
		for (const name of this.particles.keys()) {
			this.removeParticleSystem(name);
		}
		logger.info('Particle system disposed');
	}
}

// Export for use as a class
if (typeof module !== 'undefined' && module.exports) {
	module.exports = ParticleSystem;
}
