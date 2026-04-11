/**
 * 3D System Monitor Module for eDEX-UI
 * Displays system metrics in beautiful 3D visualizations
 */

const Logger = require('../utils/Logger');
const logger = new Logger('3DSysinfo');

class ThreeDSysinfo {
	constructor(name, parent, engine, si) {
		this.name = name;
		this.parent = parent;
		this.engine = engine;
		this.si = si;
		this.data = null;
		this.dom = null;
		this.stats = {};
		this.visualizations = new Map();
		this.updateInterval = 1000;
		this.lastUpdate = 0;

		logger.info('3D System Info module initialized');
	}

	/**
	 * Initialize the module
	 */
	init() {
		try {
			this.dom = document.createElement('div');
			this.dom.id = this.name;
			this.dom.className = 'mod-3d-sysinfo';
			this.parent.appendChild(this.dom);

			// Create 3D container
			this.canvas3d = document.createElement('canvas');
			this.canvas3d.className = 'canvas-3d';
			this.dom.appendChild(this.canvas3d);

			// Request initial data
			this.updateSysinfo();

			logger.info('3D System Info module initialized');
		} catch (error) {
			logger.error('Failed to initialize 3D Sysinfo module', { error: error.message });
		}
	}

	/**
	 * Update system information
	 */
	updateSysinfo() {
		const now = Date.now();
		if (now - this.lastUpdate < this.updateInterval) {
			return;
		}

		try {
			this.si.getAll((data) => {
				this.data = data;
				this.updateVisualizations();
				this.lastUpdate = now;
			});
		} catch (error) {
			logger.error('Failed to update system info', { error: error.message });
		}
	}

	/**
	 * Update 3D visualizations with new data
	 */
	updateVisualizations() {
		if (!this.data) return;

		// Update CPU visualization
		if (this.data.currentLoad) {
			const cpuLoad = this.data.currentLoad.currentLoad;
			// Update visualization if it exists
		}

		// Update memory visualization
		if (this.data.mem) {
			const memUsage = (this.data.mem.used / this.data.mem.total) * 100;
			// Update visualization if it exists
		}

		// Update temperature visualization
		if (this.data.cpuTemperature) {
			const temp = this.data.cpuTemperature.main;
			// Update visualization if it exists
		}
	}

	/**
	 * Render the module
	 */
	render() {
		this.updateSysinfo();

		if (!this.dom) return;

		// Clear and rebuild DOM
		this.dom.innerHTML = '';

		// Create info sections
		this.createInfoSections();
	}

	/**
	 * Create info sections
	 */
	createInfoSections() {
		if (!this.data) return;

		const contentDiv = document.createElement('div');
		contentDiv.className = '3d-sysinfo-content';

		// System info
		const systemDiv = document.createElement('div');
		systemDiv.className = '3d-sysinfo-section';
		systemDiv.innerHTML = `
			<span class="label">System:</span>
			<span class="value">${this.data.system.manufacturer} ${this.data.system.model}</span>
		`;
		contentDiv.appendChild(systemDiv);

		// OS info
		const osDiv = document.createElement('div');
		osDiv.className = '3d-sysinfo-section';
		osDiv.innerHTML = `
			<span class="label">OS:</span>
			<span class="value">${this.data.osInfo.platform} ${this.data.osInfo.release}</span>
		`;
		contentDiv.appendChild(osDiv);

		// CPU info
		if (this.data.cpu) {
			const cpuDiv = document.createElement('div');
			cpuDiv.className = '3d-sysinfo-section';
			cpuDiv.innerHTML = `
				<span class="label">CPU:</span>
				<span class="value">${this.data.cpu.brand} (${this.data.cpu.cores} cores)</span>
			`;
			contentDiv.appendChild(cpuDiv);
		}

		// Memory info
		if (this.data.mem) {
			const memDiv = document.createElement('div');
			memDiv.className = '3d-sysinfo-section';
			const memUsagePercent = ((this.data.mem.used / this.data.mem.total) * 100).toFixed(1);
			memDiv.innerHTML = `
				<span class="label">Memory:</span>
				<span class="value">${memUsagePercent}% (${(this.data.mem.used / 1024 / 1024 / 1024).toFixed(1)}GB / ${(this.data.mem.total / 1024 / 1024 / 1024).toFixed(1)}GB)</span>
			`;
			contentDiv.appendChild(memDiv);
		}

		// Uptime
		if (this.data.time) {
			const uptimeDiv = document.createElement('div');
			uptimeDiv.className = '3d-sysinfo-section';
			const dayUptime = Math.floor(this.data.time.uptime / 86400);
			uptimeDiv.innerHTML = `
				<span class="label">Uptime:</span>
				<span class="value">${dayUptime}d</span>
			`;
			contentDiv.appendChild(uptimeDiv);
		}

		this.dom.appendChild(contentDiv);
	}

	/**
	 * Close the module
	 */
	close() {
		if (this.dom && this.dom.parentNode) {
			this.dom.parentNode.removeChild(this.dom);
		}

		// Dispose visualizations
		for (const viz of this.visualizations.values()) {
			this.engine.removeMesh(viz);
		}
		this.visualizations.clear();

		logger.info('3D System Info module closed');
	}
}

// Export for use as a class
if (typeof module !== 'undefined' && module.exports) {
	module.exports = ThreeDSysinfo;
}
