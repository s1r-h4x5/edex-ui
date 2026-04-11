/**
 * 3D Data Visualization Utilities for eDEX-UI
 * Provides 3D charts, gauges, and data visualization components
 */

const Logger = require('./Logger');
const logger = new Logger('3DVisualizations');

class ThreeDVisualizations {
	constructor(engine) {
		this.engine = engine;
		this.visualizations = new Map();
		logger.info('3D Visualizations module initialized');
	}

	/**
	 * Create a 3D bar chart
	 */
	createBarChart(name, options = {}) {
		const {
			data = [0.5, 0.6, 0.7, 0.8],
			barWidth = 1,
			spacing = 0.2,
			color = 0x00ff00,
			maxValue = 1
		} = options;

		try {
			const group = new THREE.Group();

			data.forEach((value, index) => {
				const height = (value / maxValue) * 10;
				const geometry = new THREE.BoxGeometry(barWidth, height, barWidth);
				const material = new THREE.MeshPhongMaterial({ color });

				const bar = new THREE.Mesh(geometry, material);
				bar.position.x = (index - data.length / 2) * (barWidth + spacing);
				bar.position.y = height / 2;
				bar.castShadow = true;
				bar.receiveShadow = true;

				group.add(bar);
			});

			this.engine.addMesh(name, group);
			this.visualizations.set(name, {
				visualization: group,
				type: 'barChart',
				data: data
			});

			logger.info(`3D bar chart created: ${name}`);
			return group;
		} catch (error) {
			logger.error(`Failed to create 3D bar chart: ${name}`, { error: error.message });
			throw error;
		}
	}

	/**
	 * Update bar chart data
	 */
	updateBarChart(name, newData) {
		const vis = this.visualizations.get(name);
		if (!vis || vis.type !== 'barChart') {
			logger.warn(`Bar chart not found: ${name}`);
			return;
		}

		const group = vis.visualization;
		const children = group.children;

		newData.forEach((value, index) => {
			if (children[index]) {
				const mesh = children[index];
				const maxValue = Math.max(...newData);
				const height = (value / maxValue) * 10;

				mesh.scale.y = height;
				mesh.position.y = height / 2;
			}
		});

		vis.data = newData;
	}

	/**
	 * Create a 3D sphere gauge (CPU, RAM, etc.)
	 */
	createSphereGauge(name, options = {}) {
		const {
			value = 0.5,
			minValue = 0,
			maxValue = 100,
			radius = 5,
			color = 0x00ff00,
			label = 'Gauge'
		} = options;

		try {
			const group = new THREE.Group();

			// Create background sphere (unfilled)
			const bgGeometry = new THREE.IcosahedronGeometry(radius, 4);
			const bgMaterial = new THREE.MeshPhongMaterial({
				color: 0x003300,
				emissive: 0x001100,
				wireframe: true
			});
			const bgSphere = new THREE.Mesh(bgGeometry, bgMaterial);
			group.add(bgSphere);

			// Create filled sphere based on value
			const fillRatio = (value - minValue) / (maxValue - minValue);
			const fillGeometry = new THREE.IcosahedronGeometry(radius * 0.95, 4);
			const fillMaterial = new THREE.MeshPhongMaterial({
				color: color,
				emissive: color,
				emissiveIntensity: 0.5
			});
			const fillSphere = new THREE.Mesh(fillGeometry, fillMaterial);
			fillSphere.scale.z = Math.min(fillRatio, 1);
			group.add(fillSphere);

			group.userData.value = value;
			group.userData.minValue = minValue;
			group.userData.maxValue = maxValue;
			group.userData.fillSphere = fillSphere;
			group.userData.label = label;

			this.engine.addMesh(name, group);
			this.visualizations.set(name, {
				visualization: group,
				type: 'sphereGauge',
				value: value
			});

			logger.info(`Sphere gauge created: ${name}`);
			return group;
		} catch (error) {
			logger.error(`Failed to create sphere gauge: ${name}`, { error: error.message });
			throw error;
		}
	}

	/**
	 * Update sphere gauge value
	 */
	updateSphereGauge(name, newValue) {
		const vis = this.visualizations.get(name);
		if (!vis || vis.type !== 'sphereGauge') {
			logger.warn(`Sphere gauge not found: ${name}`);
			return;
		}

		const group = vis.visualization;
		const fillRatio = (newValue - group.userData.minValue) / (group.userData.maxValue - group.userData.minValue);
		group.userData.fillSphere.scale.z = Math.min(Math.max(fillRatio, 0), 1);
		vis.value = newValue;
	}

	/**
	 * Create a 3D rotating torus (energy ring)
	 */
	createEnergyRing(name, options = {}) {
		const {
			innerRadius = 3,
			outerRadius = 5,
			intensity = 0.8,
			color = 0xcyan
		} = options;

		try {
			const geometry = new THREE.TorusGeometry(outerRadius, outerRadius - innerRadius, 16, 32);
			const material = new THREE.MeshPhongMaterial({
				color: color,
				emissive: color,
				emissiveIntensity: intensity,
				transparent: true,
				opacity: 0.7
			});

			const torus = new THREE.Mesh(geometry, material);
			torus.castShadow = true;
			torus.receiveShadow = true;
			torus.userData.baseIntensity = intensity;

			this.engine.addMesh(name, torus);
			this.visualizations.set(name, {
				visualization: torus,
				type: 'energyRing'
			});

			// Register animation
			this.engine.registerAnimation(`${name}-ring-animation`, (deltaTime) => {
				this.updateEnergyRing(name, deltaTime);
			});

			logger.info(`Energy ring created: ${name}`);
			return torus;
		} catch (error) {
			logger.error(`Failed to create energy ring: ${name}`, { error: error.message });
			throw error;
		}
	}

	/**
	 * Update energy ring
	 */
	updateEnergyRing(name, deltaTime) {
		const vis = this.visualizations.get(name);
		if (!vis) return;

		const ring = vis.visualization;
		ring.rotation.x += deltaTime * 0.5;
		ring.rotation.y += deltaTime * 0.3;
		ring.rotation.z += deltaTime * 0.2;

		// Pulsing intensity
		const pulse = Math.sin(Date.now() * 0.002) * 0.5 + 0.5;
		ring.material.emissiveIntensity = ring.userData.baseIntensity * pulse;
	}

	/**
	 * Create a 3D cylinder gauge (like a progress bar in 3D)
	 */
	createCylinderGauge(name, options = {}) {
		const {
			value = 0.5,
			minValue = 0,
			maxValue = 100,
			radius = 2,
			height = 10,
			color = 0x00ff00
		} = options;

		try {
			const group = new THREE.Group();

			// Background cylinder
			const bgGeometry = new THREE.CylinderGeometry(radius, radius, height, 32);
			const bgMaterial = new THREE.MeshPhongMaterial({
				color: 0x003300
			});
			const bgCylinder = new THREE.Mesh(bgGeometry, bgMaterial);
			group.add(bgCylinder);

			// Filled cylinder
			const fillRatio = (value - minValue) / (maxValue - minValue);
			const fillHeight = height * fillRatio;
			const fillGeometry = new THREE.CylinderGeometry(radius * 0.9, radius * 0.9, fillHeight, 32);
			const fillMaterial = new THREE.MeshPhongMaterial({
				color: color,
				emissive: color,
				emissiveIntensity: 0.6
			});
			const fillCylinder = new THREE.Mesh(fillGeometry, fillMaterial);
			fillCylinder.position.y = (fillHeight - height) / 2;
			group.add(fillCylinder);

			group.userData.value = value;
			group.userData.minValue = minValue;
			group.userData.maxValue = maxValue;
			group.userData.fillCylinder = fillCylinder;
			group.userData.height = height;

			this.engine.addMesh(name, group);
			this.visualizations.set(name, {
				visualization: group,
				type: 'cylinderGauge',
				value: value
			});

			logger.info(`Cylinder gauge created: ${name}`);
			return group;
		} catch (error) {
			logger.error(`Failed to create cylinder gauge: ${name}`, { error: error.message });
			throw error;
		}
	}

	/**
	 * Update cylinder gauge value
	 */
	updateCylinderGauge(name, newValue) {
		const vis = this.visualizations.get(name);
		if (!vis || vis.type !== 'cylinderGauge') {
			logger.warn(`Cylinder gauge not found: ${name}`);
			return;
		}

		const group = vis.visualization;
		const fillRatio = (newValue - group.userData.minValue) / (group.userData.maxValue - group.userData.minValue);
		const height = group.userData.height;
		const fillHeight = height * Math.min(Math.max(fillRatio, 0), 1);

		group.userData.fillCylinder.scale.y = fillHeight / fillHeight;
		group.userData.fillCylinder.position.y = (fillHeight - height) / 2;
		vis.value = newValue;
	}

	/**
	 * Create a 3D line chart (wireframe graph)
	 */
	createLineChart(name, options = {}) {
		const {
			data = [0, 0.3, 0.6, 0.8, 0.5, 0.9],
			color = 0x00ff00,
			segmentLength = 2
		} = options;

		try {
			const points = [];

			data.forEach((value, index) => {
				points.push(
					new THREE.Vector3(
						index * segmentLength - (data.length * segmentLength) / 2,
						value * 10,
						0
					)
				);
			});

			const curve = new THREE.CatmullRomCurve3(points);
			const curvePoints = curve.getPoints(data.length * 10);

			const geometry = new THREE.BufferGeometry().setFromPoints(curvePoints);
			const material = new THREE.LineBasicMaterial({
				color: color,
				linewidth: 2
			});

			const line = new THREE.Line(geometry, material);
			line.userData.data = data;
			line.userData.points = points;

			this.engine.addMesh(name, line);
			this.visualizations.set(name, {
				visualization: line,
				type: 'lineChart',
				data: data
			});

			logger.info(`3D line chart created: ${name}`);
			return line;
		} catch (error) {
			logger.error(`Failed to create 3D line chart: ${name}`, { error: error.message });
			throw error;
		}
	}

	/**
	 * Remove a visualization
	 */
	removeVisualization(name) {
		const vis = this.visualizations.get(name);
		if (vis) {
			this.engine.removeMesh(name);
			this.engine.unregisterAnimation(`${name}-ring-animation`);
			this.visualizations.delete(name);
			logger.info(`Visualization removed: ${name}`);
		}
	}

	/**
	 * Dispose all visualizations
	 */
	dispose() {
		for (const name of this.visualizations.keys()) {
			this.removeVisualization(name);
		}
		logger.info('3D Visualizations disposed');
	}
}

// Export for use as a class
if (typeof module !== 'undefined' && module.exports) {
	module.exports = ThreeDVisualizations;
}
