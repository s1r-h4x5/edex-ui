/**
 * 3D RAM Watcher Module for eDEX-UI
 * Displays memory metrics in beautiful 3D visualizations
 */

const Logger = require('../utils/Logger');
const logger = new Logger('3DRAMwatcher');

class ThreeDRAMwatcher {
	constructor(name, parent, engine, si) {
		this.name = name;
		this.parent = parent;
		this.engine = engine;
		this.si = si;
		this.data = null;
		this.dom = null;
		this.canvas3d = null;
		this.memVisualization = null;
		this.updateInterval = 1000;
		this.lastUpdate = 0;
		this.history = [];
		this.maxHistoryPoints = 50;

		logger.info('3D RAM Watcher module initialized');
	}

	/**
	 * Initialize the module
	 */
	init() {
		try {
			this.dom = document.createElement('div');
			this.dom.id = this.name;
			this.dom.className = 'mod-3d-ramwatcher';
			this.parent.appendChild(this.dom);

			// Create visualization title
			const titleDiv = document.createElement('div');
			titleDiv.className = '3d-title';
			titleDiv.textContent = 'RAM 3D Monitor';
			this.dom.appendChild(titleDiv);

			// Create 3D container
			const canvasContainer = document.createElement('div');
			canvasContainer.className = 'canvas-3d-container';
			this.dom.appendChild(canvasContainer);

			this.canvas3d = document.createElement('canvas');
			this.canvas3d.className = 'canvas-3d-ram';
			canvasContainer.appendChild(this.canvas3d);

			// Request initial data
			this.updateMemoryInfo();

			logger.info('3D RAM Watcher module initialized');
		} catch (error) {
			logger.error('Failed to initialize 3D RAM Watcher', { error: error.message });
		}
	}

	/**
	 * Update memory information
	 */
	updateMemoryInfo() {
		const now = Date.now();
		if (now - this.lastUpdate < this.updateInterval) {
			return;
		}

		try {
			this.si.mem((data) => {
				this.data = data;
				this.recordHistory();
				this.updateVisualization();
				this.lastUpdate = now;
			});
		} catch (error) {
			logger.error('Failed to update memory info', { error: error.message });
		}
	}

	/**
	 * Record memory usage history
	 */
	recordHistory() {
		if (!this.data) return;

		const usagePercent = (this.data.used / this.data.total) * 100;
		this.history.push(usagePercent);

		// Keep history limited
		if (this.history.length > this.maxHistoryPoints) {
			this.history.shift();
		}
	}

	/**
	 * Update 3D visualization with memory data
	 */
	updateVisualization() {
		if (!this.data) return;

		const usagePercent = (this.data.used / this.data.total) * 100;
		const usedGB = this.data.used / 1024 / 1024 / 1024;
		const totalGB = this.data.total / 1024 / 1024 / 1024;
		const availableGB = this.data.available / 1024 / 1024 / 1024;

		this.render();
	}

	/**
	 * Render the module
	 */
	render() {
		this.updateMemoryInfo();

		if (!this.dom) return;

		if (this.data) {
			const usagePercent = ((this.data.used / this.data.total) * 100).toFixed(1);
			const usedGB = (this.data.used / 1024 / 1024 / 1024).toFixed(2);
			const totalGB = (this.data.total / 1024 / 1024 / 1024).toFixed(2);
			const availableGB = (this.data.available / 1024 / 1024 / 1024).toFixed(2);
			const buffers = (this.data.buffers / 1024 / 1024 / 1024).toFixed(2);

			// Create info display
			const infoDiv = document.createElement('div');
			infoDiv.className = '3d-ramwatcher-content';
			infoDiv.innerHTML = `
				<div class="info-row">
					<span class="label">Used:</span>
					<span class="value">${usagePercent}% (${usedGB}GB)</span>
				</div>
				<div class="info-row">
					<span class="label">Total:</span>
					<span class="value">${totalGB}GB</span>
				</div>
				<div class="info-row">
					<span class="label">Available:</span>
					<span class="value">${availableGB}GB</span>
				</div>
				<div class="info-row">
					<span class="label">Buffers:</span>
					<span class="value">${buffers}GB</span>
				</div>
			`;

			// Update or create content
			const existingContent = this.dom.querySelector('.3d-ramwatcher-content');
			if (existingContent) {
				existingContent.innerHTML = infoDiv.innerHTML;
			} else {
				this.dom.appendChild(infoDiv);
			}
		}
	}

	/**
	 * Get memory usage history
	 */
	getHistory() {
		return this.history;
	}

	/**
	 * Get current memory usage percentage
	 */
	getUsagePercent() {
		if (!this.data) return 0;
		return (this.data.used / this.data.total) * 100;
	}

	/**
	 * Close the module
	 */
	close() {
		if (this.dom && this.dom.parentNode) {
			this.dom.parentNode.removeChild(this.dom);
		}

		if (this.memVisualization) {
			this.engine.removeMesh('mem3d');
		}

		this.history = [];

		logger.info('3D RAM Watcher module closed');
	}
}

// Export for use as a class
if (typeof module !== 'undefined' && module.exports) {
	module.exports = ThreeDRAMwatcher;
}
