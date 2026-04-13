/**
 * Container Manager Class
 * Handles Docker/Podman socket communication for Athena Nexus
 */
class ContainerManager {
    constructor(parentId) {
        if (!parentId) {
            throw "Missing parentId parameter";
        }

        this.parent = document.getElementById(parentId);
        this.runtime = "docker"; // or "podman"
        this.socketPath = "/var/run/docker.sock";
        this.containers = [];
        this.metrics = {};
        this.isConnected = false;

        this.initializeUI();
        this.checkRuntimeAvailability();
        this.startMetricsCollection();
    }

    initializeUI() {
        this.parent.innerHTML += `
            <div id="mod_container_manager">
                <div class="container-header">
                    <h1>CONTAINER NEXUS</h1>
                    <div class="runtime-selector">
                        <button id="runtime-docker" class="runtime-btn active">Docker</button>
                        <button id="runtime-podman" class="runtime-btn">Podman</button>
                    </div>
                    <div class="connection-status">
                        <span id="connection-status-indicator" class="status-offline">⚫ Offline</span>
                    </div>
                </div>
                
                <div class="container-tabs">
                    <button class="tab-btn active" data-tab="dashboard">Dashboard</button>
                    <button class="tab-btn" data-tab="registry">Registry</button>
                    <button class="tab-btn" data-tab="health">Health Check</button>
                    <button class="tab-btn" data-tab="logs">Logs</button>
                </div>

                <div id="tab-dashboard" class="tab-content active">
                    <div class="containers-grid" id="containers-grid">
                        <div class="loading">Connecting to ${this.runtime}...</div>
                    </div>
                </div>

                <div id="tab-registry" class="tab-content">
                    <div class="registry-tools" id="registry-tools">
                        <div class="loading">Loading tool registry...</div>
                    </div>
                </div>

                <div id="tab-health" class="tab-content">
                    <div class="health-checks" id="health-checks">
                        <div class="loading">Running system checks...</div>
                    </div>
                </div>

                <div id="tab-logs" class="tab-content">
                    <div class="logs-viewer" id="logs-viewer">
                        <div class="log-stream"></div>
                    </div>
                </div>

                <div id="container-action-modal" class="modal hidden">
                    <div class="modal-content">
                        <h2 id="modal-title">Action</h2>
                        <div id="modal-body"></div>
                        <div class="modal-actions">
                            <button id="modal-confirm">Confirm</button>
                            <button id="modal-cancel">Cancel</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.setupTabSwitching();
        this.setupRuntimeSelector();
    }

    setupTabSwitching() {
        const tabBtns = document.querySelectorAll("#mod_container_manager .tab-btn");
        tabBtns.forEach(btn => {
            btn.addEventListener("click", (e) => {
                document.querySelectorAll("#mod_container_manager .tab-btn").forEach(b => b.classList.remove("active"));
                document.querySelectorAll("#mod_container_manager .tab-content").forEach(c => c.classList.remove("active"));
                
                e.target.classList.add("active");
                const tabId = e.target.getAttribute("data-tab");
                document.getElementById(`tab-${tabId}`).classList.add("active");
            });
        });
    }

    setupRuntimeSelector() {
        document.getElementById("runtime-docker").addEventListener("click", () => {
            this.switchRuntime("docker");
        });
        document.getElementById("runtime-podman").addEventListener("click", () => {
            this.switchRuntime("podman");
        });
    }

    switchRuntime(runtime) {
        this.runtime = runtime;
        this.socketPath = runtime === "podman" 
            ? "/run/user/1000/podman/podman.sock" 
            : "/var/run/docker.sock";

        document.querySelectorAll("#mod_container_manager .runtime-btn").forEach(btn => btn.classList.remove("active"));
        document.getElementById(`runtime-${runtime}`).classList.add("active");

        this.checkRuntimeAvailability();
        this.refreshContainers();
    }

    async checkRuntimeAvailability() {
        try {
            // TODO: Implement socket availability check
            this.isConnected = true;
            this.updateConnectionStatus(true);
            this.refreshContainers();
        } catch (err) {
            this.isConnected = false;
            this.updateConnectionStatus(false);
            console.error(`Failed to connect to ${this.runtime}:`, err);
        }
    }

    updateConnectionStatus(connected) {
        const indicator = document.getElementById("connection-status-indicator");
        if (connected) {
            indicator.textContent = `🟢 Connected (${this.runtime})`;
            indicator.classList.remove("status-offline");
            indicator.classList.add("status-online");
        } else {
            indicator.textContent = "🔴 Offline";
            indicator.classList.remove("status-online");
            indicator.classList.add("status-offline");
        }
    }

    async refreshContainers() {
        if (!this.isConnected) return;

        try {
            // TODO: Fetch containers from Docker/Podman socket
            const gridDiv = document.getElementById("containers-grid");
            if (this.containers.length === 0) {
                gridDiv.innerHTML = `<div class="no-containers">No containers running. Deploy tools from the Registry.</div>`;
                return;
            }

            gridDiv.innerHTML = this.containers.map(container => this.createContainerCard(container)).join("");
            this.attachCardListeners();
        } catch (err) {
            console.error("Failed to refresh containers:", err);
        }
    }

    createContainerCard(container) {
        const metrics = this.metrics[container.id] || { cpu: 0, memory: 0 };
        
        return `
            <div class="container-card" data-container-id="${container.id}">
                <div class="card-header">
                    <h3>${container.name}</h3>
                    <span class="status-badge ${container.state}">${container.state.toUpperCase()}</span>
                </div>
                
                <div class="card-image">
                    <span class="image-name">${container.image}</span>
                </div>

                <div class="card-metrics">
                    <div class="metric">
                        <label>CPU</label>
                        <span>${metrics.cpu.toFixed(2)}%</span>
                    </div>
                    <div class="metric">
                        <label>RAM</label>
                        <span>${(metrics.memory / 1024 / 1024).toFixed(2)}MB</span>
                    </div>
                    <div class="metric">
                        <label>Uptime</label>
                        <span>${this.formatUptime(container.uptime)}</span>
                    </div>
                </div>

                <div class="health-indicator">
                    <span class="health-badge ${container.health}">${container.health.toUpperCase()}</span>
                </div>

                <div class="card-actions">
                    ${container.state === "running" ? `
                        <button class="action-btn" data-action="stop">Stop</button>
                        <button class="action-btn" data-action="restart">Restart</button>
                    ` : `
                        <button class="action-btn" data-action="start">Start</button>
                    `}
                    <button class="action-btn" data-action="logs">Logs</button>
                    <button class="action-btn delete" data-action="delete">Delete</button>
                </div>
            </div>
        `;
    }

    attachCardListeners() {
        document.querySelectorAll("#mod_container_manager .container-card").forEach(card => {
            const containerId = card.getAttribute("data-container-id");
            
            card.querySelectorAll(".action-btn").forEach(btn => {
                btn.addEventListener("click", (e) => {
                    const action = e.target.getAttribute("data-action");
                    this.executeContainerAction(containerId, action);
                });
            });
        });
    }

    async executeContainerAction(containerId, action) {
        const container = this.containers.find(c => c.id === containerId);
        if (!container) return;

        try {
            // TODO: Implement actual Docker/Podman commands
            console.log(`Executing ${action} on container ${containerId}`);
            
            switch(action) {
                case "stop":
                    this.showActionModal(`Stopping ${container.name}`, `Executing: docker stop ${container.id}`);
                    break;
                case "start":
                    this.showActionModal(`Starting ${container.name}`, `Executing: docker start ${container.id}`);
                    break;
                case "restart":
                    this.showActionModal(`Restarting ${container.name}`, `Executing: docker restart ${container.id}`);
                    break;
                case "logs":
                    this.showActionModal(`Logs for ${container.name}`, `<pre id="action-logs">Streaming logs...</pre>`);
                    break;
                case "delete":
                    this.showActionModal(`Delete ${container.name}?`, `This action cannot be undone.`);
                    break;
            }
        } catch (err) {
            console.error(`Failed to execute ${action}:`, err);
        }
    }

    showActionModal(title, body) {
        const modal = document.getElementById("container-action-modal");
        document.getElementById("modal-title").textContent = title;
        document.getElementById("modal-body").innerHTML = body;
        modal.classList.remove("hidden");

        document.getElementById("modal-cancel").onclick = () => {
            modal.classList.add("hidden");
        };
    }

    startMetricsCollection() {
        setInterval(() => {
            if (this.isConnected) {
                this.collectMetrics();
            }
        }, 2000);
    }

    async collectMetrics() {
        // TODO: Fetch metrics from containers
        // Update this.metrics object
    }

    formatUptime(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days}d ${hours % 24}h`;
        if (hours > 0) return `${hours}h ${minutes % 60}m`;
        if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
        return `${seconds}s`;
    }

    destroy() {
        // Cleanup
    }
}
