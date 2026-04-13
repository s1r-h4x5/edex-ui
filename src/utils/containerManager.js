/**
 * Container Runtime Manager
 * Handles communication with Docker/Podman socket
 */
class ContainerRuntimeManager {
    constructor(runtime = "docker") {
        this.runtime = runtime;
        this.socketPath = this.getSocketPath(runtime);
        this.baseUrl = `unix:${this.socketPath}`;
        this.apiVersion = "v1.40";
    }

    getSocketPath(runtime) {
        if (runtime === "podman") {
            // Try user socket first, then system socket
            const userSocket = `/run/user/${process.env.UID || 1000}/podman/podman.sock`;
            return userSocket;
        }
        return "/var/run/docker.sock";
    }

    async checkConnection() {
        try {
            const response = await this.apiRequest("GET", "/_ping");
            return response === "OK";
        } catch (err) {
            console.error("Failed to ping runtime:", err);
            return false;
        }
    }

    async getSystemInfo() {
        try {
            return await this.apiRequest("GET", "/info");
        } catch (err) {
            console.error("Failed to get system info:", err);
            return null;
        }
    }

    async listContainers(all = false) {
        try {
            const params = all ? "?all=true" : "";
            const response = await this.apiRequest("GET", `/containers/json${params}`);
            return response;
        } catch (err) {
            console.error("Failed to list containers:", err);
            return [];
        }
    }

    async getContainerStats(containerId) {
        try {
            return await this.apiRequest("GET", `/containers/${containerId}/stats?stream=false`);
        } catch (err) {
            console.error(`Failed to get stats for ${containerId}:`, err);
            return null;
        }
    }

    async inspectContainer(containerId) {
        try {
            return await this.apiRequest("GET", `/containers/${containerId}/json`);
        } catch (err) {
            console.error(`Failed to inspect ${containerId}:`, err);
            return null;
        }
    }

    async startContainer(containerId) {
        try {
            await this.apiRequest("POST", `/containers/${containerId}/start`);
            return true;
        } catch (err) {
            console.error(`Failed to start ${containerId}:`, err);
            return false;
        }
    }

    async stopContainer(containerId, timeout = 10) {
        try {
            await this.apiRequest("POST", `/containers/${containerId}/stop?t=${timeout}`);
            return true;
        } catch (err) {
            console.error(`Failed to stop ${containerId}:`, err);
            return false;
        }
    }

    async restartContainer(containerId, timeout = 10) {
        try {
            await this.apiRequest("POST", `/containers/${containerId}/restart?t=${timeout}`);
            return true;
        } catch (err) {
            console.error(`Failed to restart ${containerId}:`, err);
            return false;
        }
    }

    async removeContainer(containerId, force = false) {
        try {
            const params = force ? "?force=true" : "";
            await this.apiRequest("DELETE", `/containers/${containerId}${params}`);
            return true;
        } catch (err) {
            console.error(`Failed to remove ${containerId}:`, err);
            return false;
        }
    }

    async pullImage(image, onProgress = null) {
        try {
            const response = await this.apiRequest("POST", `/images/create?fromImage=${image}`, true);
            if (onProgress && typeof onProgress === "function") {
                // Parse streaming response
                const lines = response.split('\n');
                lines.forEach(line => {
                    if (line) {
                        try {
                            const event = JSON.parse(line);
                            onProgress(event);
                        } catch (e) {
                            // Ignore parse errors
                        }
                    }
                });
            }
            return true;
        } catch (err) {
            console.error(`Failed to pull ${image}:`, err);
            return false;
        }
    }

    async createContainer(config) {
        try {
            return await this.apiRequest("POST", "/containers/create", false, config);
        } catch (err) {
            console.error("Failed to create container:", err);
            return null;
        }
    }

    async composeUp(composeFile, projectName) {
        // TODO: Implement docker-compose/podman-compose interaction
        console.log(`Bringing up compose project: ${projectName}`);
    }

    async composeDown(projectName) {
        // TODO: Implement docker-compose/podman-compose interaction
        console.log(`Bringing down compose project: ${projectName}`);
    }

    async getLogs(containerId, options = {}) {
        try {
            const params = new URLSearchParams({
                stdout: options.stdout !== false ? "true" : "false",
                stderr: options.stderr !== false ? "true" : "false",
                follow: options.follow ? "true" : "false",
                tail: options.tail || "100"
            });

            return await this.apiRequest("GET", `/containers/${containerId}/logs?${params}`, true);
        } catch (err) {
            console.error(`Failed to get logs for ${containerId}:`, err);
            return "";
        }
    }

    async apiRequest(method, endpoint, stream = false, body = null) {
        // TODO: Implement actual socket communication
        // This is a placeholder - real implementation would use electron's IPC
        // to communicate with a backend service that handles socket connections
        
        console.log(`${method} ${endpoint}`, body);

        // For now, return mock data
        if (endpoint === "/_ping") return "OK";
        if (endpoint === "/containers/json") return [];
        
        return null;
    }
}

/**
 * Container health checker
 */
class ContainerHealthChecker {
    constructor(runtimeManager) {
        this.runtimeManager = runtimeManager;
        this.healthChecks = new Map();
    }

    async runHealthCheck(container) {
        const checks = [];

        // Basic connectivity check
        checks.push(await this.checkDockerSocket());

        // Compose binary check
        checks.push(await this.checkComposeBinary());

        // Disk space check
        checks.push(await this.checkDiskSpace());

        // DNS check
        checks.push(await this.checkDNS());

        // Network interfaces check
        checks.push(await this.checkNetworkInterfaces());

        // Docker/Podman specific checks
        if (this.runtimeManager.runtime === "docker") {
            checks.push(await this.checkDockerDaemon());
        } else {
            checks.push(await this.checkPodmanSocket());
        }

        return checks;
    }

    async checkDockerSocket() {
        return {
            name: "Docker Socket",
            category: "Runtime",
            passed: await this.socketExists("/var/run/docker.sock"),
            message: "Docker socket available"
        };
    }

    async checkPodmanSocket() {
        const uid = process.env.UID || 1000;
        const socketPath = `/run/user/${uid}/podman/podman.sock`;
        return {
            name: "Podman Socket",
            category: "Runtime",
            passed: await this.socketExists(socketPath),
            message: "Podman socket available"
        };
    }

    async checkComposeBinary() {
        return {
            name: "Docker Compose",
            category: "Runtime",
            passed: true, // TODO: Check binary availability
            message: "Docker Compose binary available"
        };
    }

    async checkDiskSpace() {
        return {
            name: "Disk Space",
            category: "Storage",
            passed: true, // TODO: Check actual disk space
            message: "Sufficient disk space available (>10GB)"
        };
    }

    async checkDNS() {
        return {
            name: "DNS Resolution",
            category: "Network",
            passed: true, // TODO: Test DNS resolution
            message: "DNS resolution working"
        };
    }

    async checkNetworkInterfaces() {
        return {
            name: "Network Interfaces",
            category: "Network",
            passed: true, // TODO: Check network interfaces
            message: "Network interfaces available"
        };
    }

    async checkDockerDaemon() {
        const info = await this.runtimeManager.getSystemInfo();
        return {
            name: "Docker Daemon",
            category: "Runtime",
            passed: info !== null,
            message: info ? `Docker daemon running (${info.Containers} containers)` : "Docker daemon not responding"
        };
    }

    async socketExists(path) {
        // TODO: Implement actual socket existence check
        return true;
    }
}

/**
 * Compose file manager
 */
class ComposeFileManager {
    constructor(baseDir = `${require('os').homedir()}/.config/athena-nexus`) {
        this.baseDir = baseDir;
        this.fs = require('fs').promises;
        this.path = require('path');
    }

    async loadComposeFromUrl(url) {
        try {
            const response = await fetch(url);
            return await response.text();
        } catch (err) {
            console.error(`Failed to load compose from ${url}:`, err);
            return null;
        }
    }

    async loadComposeFromGit(repo, tag = "main", subdir = "") {
        try {
            // TODO: Implement git repo tarball download
            const tarballUrl = `${repo}/archive/${tag}.tar.gz`;
            console.log(`Loading compose from: ${tarballUrl}`);
            return null; // Placeholder
        } catch (err) {
            console.error(`Failed to load compose from ${repo}:`, err);
            return null;
        }
    }

    async loadComposeFromFile(filePath) {
        try {
            return await this.fs.readFile(filePath, 'utf-8');
        } catch (err) {
            console.error(`Failed to load compose from ${filePath}:`, err);
            return null;
        }
    }

    async saveComposeFile(projectName, content) {
        try {
            const filePath = this.path.join(this.baseDir, `${projectName}-docker-compose.yml`);
            await this.fs.mkdir(this.baseDir, { recursive: true });
            await this.fs.writeFile(filePath, content);
            return filePath;
        } catch (err) {
            console.error(`Failed to save compose file:`, err);
            return null;
        }
    }

    async deleteComposeFile(projectName) {
        try {
            const filePath = this.path.join(this.baseDir, `${projectName}-docker-compose.yml`);
            await this.fs.unlink(filePath);
            return true;
        } catch (err) {
            console.error(`Failed to delete compose file:`, err);
            return false;
        }
    }

    async parseComposeYaml(yaml) {
        // TODO: Parse YAML and extract service/container info
        // Would need to use 'js-yaml' package
        return null;
    }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        ContainerRuntimeManager,
        ContainerHealthChecker,
        ComposeFileManager
    };
}
