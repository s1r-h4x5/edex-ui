/**
 * Athena Registry Class
 * Manages deployment of security tools from the Athena Nexus registry
 */
class AthenaRegistry {
    constructor(parentId) {
        if (!parentId) {
            throw "Missing parentId parameter";
        }

        this.parent = document.getElementById(parentId);
        this.tools = [];
        this.builtInTools = [
            {
                id: "nuclei",
                name: "Nuclei",
                category: "vulnerability",
                description: "Fast and customizable vulnerability scanner.",
                type: "image",
                source: {
                    registry: "docker.io",
                    image: "projectdiscovery/nuclei",
                    version: "latest"
                },
                tags: ["scanner", "cli"],
                cli_tool: true
            },
            {
                id: "greenbone-openvas",
                name: "Greenbone OpenVAS",
                category: "vulnerability",
                description: "Full-featured vulnerability scanner.",
                type: "compose",
                source: {
                    compose_repo: "https://github.com/greenbone/openvas-docker",
                    compose_repo_tag: "main"
                },
                access: {
                    entrypoint: "https://localhost:443",
                    ports: ["443:443"]
                }
            },
            {
                id: "zeek",
                name: "Zeek IDS",
                category: "network",
                description: "Network security monitoring and analysis.",
                type: "image",
                source: {
                    registry: "docker.io",
                    image: "zeek/zeek",
                    version: "latest"
                },
                tags: ["ids", "network"]
            },
            {
                id: "suricata",
                name: "Suricata IDS/IPS",
                category: "network",
                description: "Network threat detection and prevention.",
                type: "image",
                source: {
                    registry: "docker.io",
                    image: "jasonish/suricata",
                    version: "latest"
                },
                tags: ["ids", "ips", "network"]
            },
            {
                id: "wazuh",
                name: "Wazuh SIEM",
                category: "siem",
                description: "Unified security information and event management.",
                type: "compose",
                source: {
                    compose_repo: "https://github.com/wazuh/wazuh-docker",
                    compose_repo_tag: "v4.14.3"
                },
                access: {
                    entrypoint: "https://localhost:443",
                    ports: ["443:443", "1514:1514", "1515:1515"]
                }
            },
            {
                id: "misp",
                name: "MISP",
                category: "threat-intel",
                description: "Malware Information Sharing Platform.",
                type: "compose",
                source: {
                    compose_repo: "https://github.com/MISP/misp-docker",
                    compose_repo_tag: "main"
                },
                access: {
                    entrypoint: "https://localhost:443",
                    ports: ["443:443"]
                }
            }
        ];

        this.loadTools();
        this.displayRegistry();
    }

    loadTools() {
        // Load custom tools from config (would be from electron ipc in real implementation)
        this.tools = [...this.builtInTools];
    }

    displayRegistry() {
        const categories = {};
        
        this.tools.forEach(tool => {
            if (!categories[tool.category]) {
                categories[tool.category] = [];
            }
            categories[tool.category].push(tool);
        });

        let html = '<div class="registry-categories">';
        
        Object.keys(categories).forEach(category => {
            const categoryTools = categories[category];
            const categoryTitle = category
                .split('-')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');

            html += `
                <div class="registry-category">
                    <h3>${categoryTitle}</h3>
                    <div class="tools-list">
                        ${categoryTools.map(tool => this.createToolCard(tool)).join('')}
                    </div>
                </div>
            `;
        });

        html += '</div>';
        
        const registryDiv = document.getElementById("registry-tools");
        if (registryDiv) {
            registryDiv.innerHTML = html;
            this.attachToolListeners();
        }
    }

    createToolCard(tool) {
        return `
            <div class="tool-card" data-tool-id="${tool.id}">
                <div class="tool-header">
                    <h4>${tool.name}</h4>
                    <span class="tool-type-badge ${tool.type}">${tool.type.toUpperCase()}</span>
                </div>
                
                <p class="tool-description">${tool.description}</p>
                
                <div class="tool-tags">
                    ${(tool.tags || []).map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>

                <div class="tool-source">
                    ${tool.type === "image" ? `
                        <span class="source-label">Image:</span>
                        <span class="source-value">${tool.source.registry}/${tool.source.image}:${tool.source.version}</span>
                    ` : `
                        <span class="source-label">Source:</span>
                        <span class="source-value">${tool.source.compose_repo}</span>
                    `}
                </div>

                ${tool.access ? `
                    <div class="tool-access">
                        ${tool.access.entrypoint ? `
                            <span class="access-item">
                                <strong>Entrypoint:</strong> ${tool.access.entrypoint}
                            </span>
                        ` : ''}
                        ${tool.access.ports ? `
                            <span class="access-item">
                                <strong>Ports:</strong> ${tool.access.ports.join(', ')}
                            </span>
                        ` : ''}
                    </div>
                ` : ''}

                <div class="tool-actions">
                    <button class="btn-deploy" data-tool-id="${tool.id}">Deploy</button>
                    <button class="btn-info">Info</button>
                </div>
            </div>
        `;
    }

    attachToolListeners() {
        document.querySelectorAll("#registry-tools .tool-card").forEach(card => {
            const toolId = card.getAttribute("data-tool-id");
            const tool = this.tools.find(t => t.id === toolId);

            card.querySelector(".btn-deploy").addEventListener("click", () => {
                this.initiateDeploy(tool);
            });

            card.querySelector(".btn-info").addEventListener("click", () => {
                this.showToolInfo(tool);
            });
        });
    }

    async initiateDeploy(tool) {
        // Check preflight conditions
        const checks = await this.runPreflightChecks();
        
        if (!checks.passed) {
            const failedChecks = checks.results
                .filter(c => !c.passed)
                .map(c => `- ${c.check}: ${c.message}`)
                .join('\n');

            alert(`Cannot deploy ${tool.name}.\n\nFailed checks:\n${failedChecks}`);
            return;
        }

        // Show deploy modal with env var configuration if needed
        if (tool.env_vars && tool.env_vars.length > 0) {
            this.showDeployModal(tool);
        } else {
            this.deployTool(tool);
        }
    }

    showDeployModal(tool) {
        const modal = document.getElementById("container-action-modal");
        let envHtml = '';

        (tool.env_vars || []).forEach(envVar => {
            const inputType = envVar.secret ? "password" : "text";
            envHtml += `
                <div class="env-var-input">
                    <label for="env-${envVar.key}">
                        ${envVar.label}
                        ${envVar.required ? '<span class="required">*</span>' : ''}
                    </label>
                    <input 
                        type="${inputType}" 
                        id="env-${envVar.key}" 
                        placeholder="${envVar.description}"
                        value="${envVar.default || ''}"
                        ${envVar.required ? 'required' : ''}
                    />
                </div>
            `;
        });

        document.getElementById("modal-title").textContent = `Deploy ${tool.name}`;
        document.getElementById("modal-body").innerHTML = `
            <div class="deploy-config">
                <h3>Configuration</h3>
                ${envHtml}
            </div>
        `;
        modal.classList.remove("hidden");

        document.getElementById("modal-confirm").onclick = () => {
            const envVars = {};
            (tool.env_vars || []).forEach(envVar => {
                envVars[envVar.key] = document.getElementById(`env-${envVar.key}`).value;
            });
            this.deployTool(tool, envVars);
            modal.classList.add("hidden");
        };
    }

    async deployTool(tool, envVars = {}) {
        // TODO: Implement actual deployment via Docker/Podman
        console.log(`Deploying ${tool.name}`, envVars);
        
        // Show progress modal with deployment steps
        const modal = document.getElementById("container-action-modal");
        document.getElementById("modal-title").textContent = `Deploying ${tool.name}`;
        document.getElementById("modal-body").innerHTML = `
            <div class="deploy-progress">
                <div class="progress-item">
                    <span class="status">⏳</span>
                    <span class="text">Checking preflight conditions...</span>
                </div>
                <div class="progress-item">
                    <span class="status">⏳</span>
                    <span class="text">Pulling image layers...</span>
                </div>
                <div class="progress-item">
                    <span class="status">⏳</span>
                    <span class="text">Creating container...</span>
                </div>
                <div class="progress-item">
                    <span class="status">⏳</span>
                    <span class="text">Starting services...</span>
                </div>
            </div>
            <div class="deploy-output">
                <pre id="deploy-log"></pre>
            </div>
        `;
        modal.classList.remove("hidden");
    }

    async runPreflightChecks() {
        const results = [];
        const checks = [
            { name: "docker_socket", label: "Docker socket available", category: "Runtime" },
            { name: "compose_binary", label: "Docker Compose available", category: "Runtime" },
            { name: "disk_space", label: "Sufficient disk space (10GB+)", category: "Storage" },
            { name: "network_dns", label: "DNS resolution working", category: "Network" },
            { name: "port_conflicts", label: "Required ports available", category: "Network" }
        ];

        for (const check of checks) {
            results.push({
                check: check.label,
                category: check.category,
                passed: true, // TODO: Implement actual checks
                message: "OK"
            });
        }

        return {
            passed: results.every(r => r.passed),
            results: results
        };
    }

    showToolInfo(tool) {
        const infoHtml = `
            <div class="tool-info">
                <h2>${tool.name}</h2>
                <p>${tool.description}</p>
                
                <h3>Details</h3>
                <table>
                    <tr>
                        <td><strong>Category:</strong></td>
                        <td>${tool.category}</td>
                    </tr>
                    <tr>
                        <td><strong>Type:</strong></td>
                        <td>${tool.type}</td>
                    </tr>
                    ${tool.source.registry ? `
                    <tr>
                        <td><strong>Registry:</strong></td>
                        <td>${tool.source.registry}</td>
                    </tr>
                    ` : ''}
                    ${tool.source.image ? `
                    <tr>
                        <td><strong>Image:</strong></td>
                        <td>${tool.source.image}</td>
                    </tr>
                    ` : ''}
                </table>
            </div>
        `;

        const modal = document.getElementById("container-action-modal");
        document.getElementById("modal-title").textContent = tool.name;
        document.getElementById("modal-body").innerHTML = infoHtml;
        modal.classList.remove("hidden");
    }
}
