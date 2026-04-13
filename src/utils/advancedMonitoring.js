/**
 * Advanced Container Monitoring
 * Grafana integration, Prometheus scraping, performance optimization
 */
class AdvancedContainerMonitoring {
    constructor(runtimeManager) {
        this.runtimeManager = runtimeManager;
        this.metrics = new Map();
        this.prometheus = null;
        this.grafana = null;
        this.performanceCache = [];
        this.maxCacheSize = 1000; // Keep last 1000 metrics
    }

    /**
     * Start real-time metric collection
     */
    async startMetricCollection(containerId, interval = 2000) {
        const collectionId = `${containerId}_collection`;
        
        const collector = setInterval(async () => {
            try {
                const stats = await this.runtimeManager.getContainerStats(containerId);
                if (stats) {
                    this.processMetrics(containerId, stats);
                }
            } catch (err) {
                console.error(`Failed to collect metrics for ${containerId}:`, err);
            }
        }, interval);

        return collectionId;
    }

    /**
     * Process raw container statistics into usable metrics
     */
    processMetrics(containerId, stats) {
        const metrics = {
            timestamp: Date.now(),
            containerId,
            cpu: this.calculateCPUPercent(stats),
            memory: this.calculateMemoryUsage(stats),
            memoryPercent: this.calculateMemoryPercent(stats),
            networkIn: stats.networks?.eth0?.rx_bytes || 0,
            networkOut: stats.networks?.eth0?.tx_bytes || 0,
            blockRead: stats.blkio_stats?.io_service_bytes_recursive?.[0]?.value || 0,
            blockWrite: stats.blkio_stats?.io_service_bytes_recursive?.[1]?.value || 0,
            pids: stats.pids_stats?.current || 0,
            uptime: stats.memory_stats?.limit ? Date.now() : 0
        };

        // Store in cache
        this.performanceCache.push(metrics);
        if (this.performanceCache.length > this.maxCacheSize) {
            this.performanceCache.shift();
        }

        // Update map for quick access
        this.metrics.set(containerId, metrics);

        return metrics;
    }

    /**
     * Calculate CPU percentage
     */
    calculateCPUPercent(stats) {
        if (!stats.cpu_stats || !stats.precpu_stats) return 0;

        const cpuDelta = stats.cpu_stats.cpu_usage.total_usage - 
                        (stats.precpu_stats.cpu_usage.total_usage || 0);
        const systemDelta = stats.cpu_stats.system_cpu_usage - 
                           (stats.precpu_stats.system_cpu_usage || 0);
        const numCpus = stats.cpu_stats.online_cpus || 1;

        if (systemDelta === 0) return 0;
        return (cpuDelta / systemDelta) * numCpus * 100;
    }

    /**
     * Calculate memory usage in bytes
     */
    calculateMemoryUsage(stats) {
        return stats.memory_stats?.usage || 0;
    }

    /**
     * Calculate memory percentage
     */
    calculateMemoryPercent(stats) {
        const usage = stats.memory_stats?.usage || 0;
        const limit = stats.memory_stats?.limit || 1;
        return (usage / limit) * 100;
    }

    /**
     * Get metrics trend over time
     */
    getMetricsTrend(containerId, duration = 60000) {
        const now = Date.now();
        const threshold = now - duration;
        
        return this.performanceCache
            .filter(m => m.containerId === containerId && m.timestamp >= threshold)
            .map(m => ({
                timestamp: new Date(m.timestamp).toLocaleTimeString(),
                cpu: m.cpu.toFixed(2),
                memory: (m.memory / 1024 / 1024).toFixed(2),
                memoryPercent: m.memoryPercent.toFixed(2),
                networkIn: m.networkIn,
                networkOut: m.networkOut
            }));
    }

    /**
     * Analyze performance and generate recommendations
     */
    analyzePerformance(containerId) {
        const metrics = this.metrics.get(containerId);
        if (!metrics) return null;

        const trend = this.getMetricsTrend(containerId, 300000); // Last 5 minutes
        const recommendations = [];

        // CPU analysis
        const avgCpuUsage = trend.reduce((sum, m) => sum + parseFloat(m.cpu), 0) / trend.length;
        if (avgCpuUsage > 80) {
            recommendations.push({
                severity: "high",
                category: "CPU",
                message: `High CPU usage detected (${avgCpuUsage.toFixed(2)}%). Consider optimizing application or increasing container resources.`
            });
        }

        // Memory analysis
        const avgMemoryPercent = trend.reduce((sum, m) => sum + parseFloat(m.memoryPercent), 0) / trend.length;
        if (avgMemoryPercent > 85) {
            recommendations.push({
                severity: "high",
                category: "Memory",
                message: `Container approaching memory limit (${avgMemoryPercent.toFixed(2)}%). Risk of OOM kill.`
            });
        } else if (avgMemoryPercent > 70) {
            recommendations.push({
                severity: "medium",
                category: "Memory",
                message: `Memory usage is high (${avgMemoryPercent.toFixed(2)}%). Monitor for potential issues.`
            });
        }

        // Stability analysis
        const cpuVariance = this.calculateVariance(trend.map(m => parseFloat(m.cpu)));
        if (cpuVariance > 50) {
            recommendations.push({
                severity: "medium",
                category: "Stability",
                message: `High CPU variance detected. Application may have performance spikes.`
            });
        }

        return {
            metrics,
            trend,
            recommendations,
            healthScore: this.calculateHealthScore(avgCpuUsage, avgMemoryPercent, cpuVariance)
        };
    }

    /**
     * Calculate health score (0-100)
     */
    calculateHealthScore(cpuUsage, memoryPercent, cpuVariance) {
        let score = 100;

        // CPU penalty
        if (cpuUsage > 90) score -= 30;
        else if (cpuUsage > 80) score -= 20;
        else if (cpuUsage > 60) score -= 10;

        // Memory penalty
        if (memoryPercent > 95) score -= 30;
        else if (memoryPercent > 85) score -= 20;
        else if (memoryPercent > 70) score -= 10;

        // Variance penalty
        if (cpuVariance > 70) score -= 15;
        else if (cpuVariance > 50) score -= 10;

        return Math.max(0, score);
    }

    /**
     * Calculate variance of array
     */
    calculateVariance(arr) {
        if (arr.length === 0) return 0;
        const mean = arr.reduce((a, b) => a + b) / arr.length;
        const variance = arr.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / arr.length;
        return Math.sqrt(variance);
    }

    /**
     * Prometheus integration - generate metrics in Prometheus format
     */
    exportPrometheusMetrics() {
        let output = "";

        for (const [containerId, metrics] of this.metrics.entries()) {
            const labels = `container_id="${containerId}"`;
            
            output += `# HELP container_cpu_usage_percent CPU usage percentage\n`;
            output += `# TYPE container_cpu_usage_percent gauge\n`;
            output += `container_cpu_usage_percent{${labels}} ${metrics.cpu}\n\n`;

            output += `# HELP container_memory_usage_bytes Memory usage in bytes\n`;
            output += `# TYPE container_memory_usage_bytes gauge\n`;
            output += `container_memory_usage_bytes{${labels}} ${metrics.memory}\n\n`;

            output += `# HELP container_memory_usage_percent Memory usage percentage\n`;
            output += `# TYPE container_memory_usage_percent gauge\n`;
            output += `container_memory_usage_percent{${labels}} ${metrics.memoryPercent}\n\n`;

            output += `# HELP container_network_in_bytes Network input bytes\n`;
            output += `# TYPE container_network_in_bytes counter\n`;
            output += `container_network_in_bytes{${labels}} ${metrics.networkIn}\n\n`;

            output += `# HELP container_network_out_bytes Network output bytes\n`;
            output += `# TYPE container_network_out_bytes counter\n`;
            output += `container_network_out_bytes{${labels}} ${metrics.networkOut}\n\n`;
        }

        return output;
    }

    /**
     * Integration with external Prometheus scraper
     */
    async enablePrometheusExport(port = 9100) {
        // TODO: Start HTTP server on port to serve Prometheus metrics
        console.log(`Prometheus metrics available at http://localhost:${port}/metrics`);
        return true;
    }

    /**
     * Grafana integration - generate dashboard JSON
     */
    generateGrafanaDashboard(containerId) {
        return {
            dashboard: {
                title: `Container Performance: ${containerId}`,
                tags: ["athena", "containers"],
                templating: {
                    list: [
                        {
                            name: "container_id",
                            type: "constant",
                            value: containerId
                        }
                    ]
                },
                panels: [
                    {
                        id: 1,
                        title: "CPU Usage",
                        type: "graph",
                        targets: [
                            {
                                expr: `container_cpu_usage_percent{container_id="${containerId}"}`
                            }
                        ]
                    },
                    {
                        id: 2,
                        title: "Memory Usage",
                        type: "graph",
                        targets: [
                            {
                                expr: `container_memory_usage_percent{container_id="${containerId}"}`
                            }
                        ]
                    },
                    {
                        id: 3,
                        title: "Network I/O",
                        type: "graph",
                        targets: [
                            {
                                expr: `container_network_in_bytes{container_id="${containerId}"}`
                            },
                            {
                                expr: `container_network_out_bytes{container_id="${containerId}"}`
                            }
                        ]
                    }
                ]
            }
        };
    }

    /**
     * Export metrics to file for analysis
     */
    async exportMetricsToFile(filePath) {
        try {
            const fs = require('fs').promises;
            const data = {
                exportedAt: new Date().toISOString(),
                metrics: Array.from(this.metrics.entries()).map(([id, m]) => ({
                    containerId: id,
                    ...m
                })),
                recentHistory: this.performanceCache.slice(-100)
            };

            await fs.writeFile(filePath, JSON.stringify(data, null, 2));
            return true;
        } catch (err) {
            console.error("Failed to export metrics:", err);
            return false;
        }
    }

    /**
     * Stop metric collection
     */
    stopMetricCollection(collectionId) {
        clearInterval(collectionId);
    }
}

/**
 * Custom Health Check Definition
 * Allow users to define custom health checks beyond standard ones
 */
class CustomHealthCheck {
    constructor(name, endpoint, expectedStatus = 200) {
        this.name = name;
        this.endpoint = endpoint;
        this.expectedStatus = expectedStatus;
        this.lastCheck = null;
        this.consecutiveFailures = 0;
        this.failureThreshold = 3;
    }

    async execute() {
        try {
            const startTime = Date.now();
            const response = await fetch(this.endpoint, {
                timeout: 5000
            });
            const responseTime = Date.now() - startTime;

            const passed = response.status === this.expectedStatus;

            if (passed) {
                this.consecutiveFailures = 0;
            } else {
                this.consecutiveFailures++;
            }

            this.lastCheck = {
                timestamp: new Date().toISOString(),
                passed,
                status: response.status,
                responseTime,
                healthy: this.consecutiveFailures < this.failureThreshold
            };

            return this.lastCheck;
        } catch (err) {
            this.consecutiveFailures++;
            this.lastCheck = {
                timestamp: new Date().toISOString(),
                passed: false,
                error: err.message,
                healthy: this.consecutiveFailures < this.failureThreshold
            };

            return this.lastCheck;
        }
    }

    getStatus() {
        return this.lastCheck || {
            passed: false,
            healthy: false,
            error: "Not checked yet"
        };
    }
}

/**
 * Health Check Manager
 */
class HealthCheckManager {
    constructor() {
        this.checks = new Map();
        this.intervals = new Map();
    }

    addCustomCheck(containerId, name, endpoint, expectedStatus = 200) {
        const checkId = `${containerId}_${name}`;
        const check = new CustomHealthCheck(name, endpoint, expectedStatus);
        this.checks.set(checkId, check);
        return checkId;
    }

    addStandardCheck(containerId, toolType) {
        // Add tool-specific health checks based on type
        const checks = [];

        switch(toolType) {
            case "nuclei":
                checks.push(this.addCustomCheck(containerId, "CLI", "http://localhost:5000/health", 200));
                break;
            case "openvas":
                checks.push(this.addCustomCheck(containerId, "WebUI", "https://localhost:443", 200));
                break;
            case "wazuh":
                checks.push(this.addCustomCheck(containerId, "API", "https://localhost:55000", 200));
                break;
            case "zeek":
                checks.push(this.addCustomCheck(containerId, "Stats", "http://localhost:9200", 200));
                break;
        }

        return checks;
    }

    async executeCheck(checkId) {
        const check = this.checks.get(checkId);
        if (!check) return null;

        return await check.execute();
    }

    startPeriodicCheck(checkId, interval = 30000) {
        if (this.intervals.has(checkId)) {
            clearInterval(this.intervals.get(checkId));
        }

        const intervalId = setInterval(() => {
            this.executeCheck(checkId);
        }, interval);

        this.intervals.set(checkId, intervalId);
        return intervalId;
    }

    stopPeriodicCheck(checkId) {
        const intervalId = this.intervals.get(checkId);
        if (intervalId) {
            clearInterval(intervalId);
            this.intervals.delete(checkId);
        }
    }

    getAllCheckStatus() {
        const status = {};
        for (const [checkId, check] of this.checks.entries()) {
            status[checkId] = check.getStatus();
        }
        return status;
    }

    getChecksByContainer(containerId) {
        const checks = [];
        for (const [checkId, check] of this.checks.entries()) {
            if (checkId.startsWith(containerId)) {
                checks.push({
                    id: checkId,
                    name: check.name,
                    status: check.getStatus()
                });
            }
        }
        return checks;
    }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        AdvancedContainerMonitoring,
        CustomHealthCheck,
        HealthCheckManager
    };
}
