/**
 * 3D CPU Monitor Module for eDEX-UI
 * Displays CPU metrics in beautiful 3D visualizations
 */

const Logger = require('../utils/Logger');
const logger = new Logger('3DCPUinfo');

class ThreeDCPUinfo {
	constructor(name, parent, engine, si) {
		this.name = name;
		this.parent = parent;
		this.engine = engine;
		this.si = si;
		this.data = null;
		this.dom = null;
		this.canvas3d = null;
		this.cpuVisualization = null;
		this.updateInterval = 500;
		this.lastUpdate = 0;
		this.maxCoreCount = 0;

		logger.info('3D CPU Monitor module initialized');
	}

	/**
	 * Initialize the module
	 */
	init() {
		try {
			this.dom = document.createElement('div');
			this.dom.id = this.name;
			this.dom.className = 'mod-3d-cpuinfo';
			this.parent.appendChild(this.dom);

			// Create visualization title
			const titleDiv = document.createElement('div');
			titleDiv.className = '3d-title';
			titleDiv.textContent = 'CPU 3D Monitor';
			this.dom.appendChild(titleDiv);

			// Create 3D container
			const canvasContainer = document.createElement('div');
			canvasContainer.className = 'canvas-3d-container';
			this.dom.appendChild(canvasContainer);

			this.canvas3d = document.createElement('canvas');
			this.canvas3d.className = 'canvas-3d-cpu';
			canvasContainer.appendChild(this.canvas3d);

			// Request initial data
			this.updateCPUinfo();

			logger.info('3D CPU Monitor module initialized');
		} catch (error) {
			logger.error('Failed to initialize 3D CPU Monitor', { error: error.message });
		}
	}

	/**
	 * Update CPU information
	 */
	updateCPUinfo() {
		const now = Date.now();
		if (now - this.lastUpdate < this.updateInterval) {
			return;
		}

		try {
			this.si.currentLoad((data) => {
				this.data = data;
				this.updateVisualization();
				this.lastUpdate = now;
			});
		} catch (error) {
			logger.error('Failed to update CPU info', { error: error.message });
		}
	}

	/**
	 * Update 3D visualization with CPU data
	 */
	updateVisualization() {
		if (!this.data) return;

		const usage = this.data.currentLoad;
		const cores = this.data.cores || [];

		// Update or create visualization
		if (this.cpuVisualization) {
			this.updateCPUBars(usage, cores);
		}

		this.render();
	}

	/**
	 * Update CPU bar visualization
	 */
	updateCPUBars(usage, cores) {
		// This would update the 3D visualization with new CPU data
		const totalLoad = usage.toFixed(1);

		// Create visual representation
		if (this.dom) {
			const statsDiv = this.dom.querySelector('.cpu-stats') || this.createStatsDiv();
			statsDiv.innerHTML = `
				<div class="cpu-bar-item">
					<span class="label">Overall:</span>
					<span class="value">${totalLoad}%</span>
				</div>
			`;

			cores.forEach((core, index) => {
				const coreDiv = document.createElement('div');
				coreDiv.className = 'cpu-bar-item';
				coreDiv.innerHTML = `
					<span class="label">Core ${index + 1}:</span>
					<span class="value">${core.load.toFixed(1)}%</span>
				`;
				statsDiv.appendChild(coreDiv);
			});
		}
	}

	/**
	 * Create stats div
	 */
	createStatsDiv() {
		const statsDiv = document.createElement('div');
		statsDiv.className = 'cpu-stats';
		if (this.dom) {
			this.dom.appendChild(statsDiv);
		}
		return statsDiv;
	}

	/**
	 * Render the module
	 */
	render() {
		this.updateCPUinfo();

		if (!this.dom) return;

		// Keep visual representation updated
		if (this.data) {
			const usage = this.data.currentLoad;
			const usage1 = this.data.currentLoadUser || 0;
			const usage2 = this.data.currentLoadSystem || 0;

			// Create info display
			const infoDiv = document.createElement('div');
			infoDiv.className = '3d-cpuinfo-content';
			infoDiv.innerHTML = `
				<div class="info-row">
					<span class="label">Load:</span>
					<span class="value">${usage.toFixed(1)}%</span>
				</div>
				<div class="info-row">
					<span class="label">User:</span>
					<span class="value">${usage1.toFixed(1)}%</span>
				</div>
				<div class="info-row">
					<span class="label">System:</span>
					<span class="value">${usage2.toFixed(1)}%</span>
				</div>
			`;

			// Update or create content
			const existingContent = this.dom.querySelector('.3d-cpuinfo-content');
			if (existingContent) {
				existingContent.innerHTML = infoDiv.innerHTML;
			} else {
				this.dom.appendChild(infoDiv);
			}
		}
	}

	/**
	 * Close the module
	 */
	close() {
		if (this.dom && this.dom.parentNode) {
			this.dom.parentNode.removeChild(this.dom);
		}

		if (this.cpuVisualization) {
			this.engine.removeMesh('cpu3d');
		}

		logger.info('3D CPU Monitor module closed');
	}
}

// Export for use as a class
if (typeof module !== 'undefined' && module.exports) {
	module.exports = ThreeDCPUinfo;
}
