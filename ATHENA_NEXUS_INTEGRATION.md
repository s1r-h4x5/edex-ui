# Athena Nexus Integration Guide

## Overview

Athena Nexus has been integrated into **eDEX-UI** as a new security-focused container management module. It provides a unified interface for deploying, managing, and monitoring security tools running inside Docker or Podman containers.

This integration leverages eDEX-UI's existing infrastructure (3D visualizations, real-time metrics, modular architecture) while adding enterprise-grade container orchestration features.

## Features Integrated

### Dashboard
- **Live Container Cards** with real-time CPU/RAM metrics
- **Uptime Ticker** and health status badges
- **Per-Tool Action Buttons**: Deploy, Start, Stop, Restart, Update, Delete
- **Real-Time Output Streaming** showing exact runtime commands
- **Compose Stack Support** with per-container status indicators
- **Automatic Button Disabling** during in-progress operations

### Tool Registry
- **Curated Library** of 6+ security tools (Nuclei, OpenVAS, Wazuh, MISP, Zeek, Suricata)
- **Pre-Flight Checks** before every deploy (port conflicts, socket reachability, compose availability)
- **Live Progress Output** with per-layer progress bars during image pulls
- **Full Compose Stack Support** (URL-based, file-based, Git repo-based)
- **Environment Variable Configuration UI** for tools requiring secrets/settings
- **Update & Delete** operations from registry view

### Pre-Flight Health Checks
- **17-Point System Scan** grouped by category (System, Runtime, Network, Storage, Security)
- **Smart Caching** reusing already-connected runtime info
- **Checks Include**: Docker/Podman socket, API version, rootless mode, systemd session, disk space, DNS, network interfaces

### Secrets Vault
- **Encrypted Key-Value Store** for API keys, tokens, credentials
- **System Keyring Integration** (placeholder for enhancement)
- **Import/Export Support** in JSON/ENV formats
- **Selective Encryption** with system-level file permissions

### Audit Log
- **Tamper-Evident Timestamp Events** for all container actions
- **Filterable** by category, outcome, date range
- **Exportable** to JSON/CSV
- **Integrity Verification** for security compliance

### Snapshot & Backup
- **Create/Restore/Export/Delete** snapshots of container images
- **Metadata Tracking** with size and creation timestamps
- **Persistent Storage** in `~/.local/share/athena-nexus/snapshots/`

### Network Topology
- **Visual Graph** of running containers and connections
- **D3-Powered Visualization** (ready for 3D enhancement)
- **Real-Time Network Monitoring**

### User-Defined Tools
- **Custom Tool Registry** alongside built-in tools
- **Stored in** `~/.config/athena-nexus/tools.json`
- **Full Feature Parity** with built-in tools

### Settings
- **Runtime Switching** (Docker ↔ Podman) without restarting
- **Custom Registry Path** support
- **Config Export/Import** for portable setups

## Architecture

### File Structure

```
src/
├── classes/
│   ├── containerManager.class.js      # Main UI container for Athena Nexus
│   └── athenaRegistry.class.js        # Tool registry and deployment
├── utils/
│   ├── containerManager.js            # Docker/Podman socket communication
│   └── athenaVault.js                 # Secrets, audit, snapshots
├── assets/css/
│   └── mod_athena_nexus.css          # Styling for Athena Nexus UI
└── ui.html                            # Updated with Athena Nexus includes
```

### Component Breakdown

#### 1. **ContainerManager** (containerManager.class.js)
Handles the main UI for container management:
- Runtime switching (Docker/Podman)
- Tab-based interface (Dashboard, Registry, Health Check, Logs)
- Real-time container status display
- Container action execution (start, stop, restart, delete)
- Modal-based action feedback

#### 2. **AthenaRegistry** (athenaRegistry.class.js)
Manages the tool registry and deployment:
- Built-in tool definitions
- Category-based organization
- Deploy modal with environment variable configuration
- Pre-flight health checks before deployment
- Tool information display

#### 3. **ContainerRuntimeManager** (utils/containerManager.js)
Low-level Docker/Podman API communication:
- Socket connection management
- Container list/inspect/stats
- Container lifecycle operations (start, stop, restart)
- Image pulling with progress tracking
- System info and health checks

#### 4. **ContainerHealthChecker** (utils/containerManager.js)
Comprehensive system health scanning:
- Docker socket availability
- Podman socket availability
- Compose binary detection
- Disk space verification
- DNS resolution testing
- Network interface enumeration

#### 5. **ComposeFileManager** (utils/containerManager.js)
Manages Docker Compose file lifecycle:
- Load from URL, Git repository, or local file
- Parse and validate YAML
- Save to config directory
- Cleanup after deployment

#### 6. **SecretsVault** (utils/athenaVault.js)
Encrypted credential storage:
- Encrypt/decrypt secrets
- Import/export in JSON/ENV formats
- File-level access controls
- List and manage secrets

#### 7. **AuditLogger** (utils/athenaVault.js)
Tamper-evident event logging:
- Timestamp all container actions
- Categorize by action type
- Filter and export logs
- Integrity verification

#### 8. **SnapshotManager** (utils/athenaVault.js)
Container image snapshots:
- Create snapshots of running images
- Restore from snapshots
- Export snapshots
- Metadata tracking

## Configuration

### Default Paths (XDG Standard)

| Path | Contents |
|------|----------|
| `~/.config/athena-nexus/config.json` | Runtime settings |
| `~/.config/athena-nexus/tools.json` | Tool registry |
| `~/.config/athena-nexus/vault.json` | Encrypted secrets |
| `~/.config/athena-nexus/audit.json` | Audit events |
| `~/.local/share/athena-nexus/snapshots/` | Snapshot tarballs |
| `/tmp/athena-nexus/{tool_id}/` | Ephemeral working directories |

### Tool Registry Schema

#### Single-Image Tool
```json
{
  "id": "nuclei",
  "name": "Nuclei",
  "category": "vulnerability",
  "description": "Fast and customizable vulnerability scanner.",
  "type": "image",
  "source": {
    "registry": "docker.io",
    "image": "projectdiscovery/nuclei",
    "version": "latest"
  },
  "tags": ["scanner", "cli"],
  "cli_tool": true
}
```

#### Compose Stack Tool
```json
{
  "id": "wazuh",
  "name": "Wazuh SIEM",
  "category": "siem",
  "description": "Unified security information and event management.",
  "type": "compose",
  "source": {
    "compose_repo": "https://github.com/wazuh/wazuh-docker",
    "compose_repo_tag": "v4.14.3",
    "compose_subdir": "single-node"
  },
  "access": {
    "entrypoint": "https://localhost:443",
    "health_check": "https://localhost:443",
    "ports": ["443:443", "1514:1514"]
  },
  "env_vars": [
    {
      "key": "ADMIN_PASSWORD",
      "label": "Admin Password",
      "description": "Password for web console",
      "required": true,
      "secret": true
    }
  ]
}
```

## Built-In Tool Registry

| Tool | Category | Type | Source |
|------|----------|------|--------|
| Nuclei | Vulnerability | Image | docker.io/projectdiscovery/nuclei |
| Greenbone OpenVAS | Vulnerability | Compose | github.com/greenbone/openvas-docker |
| Zeek IDS | Network | Image | docker.io/zeek/zeek |
| Suricata IDS/IPS | Network | Image | docker.io/jasonish/suricata |
| Wazuh SIEM | SIEM | Compose | github.com/wazuh/wazuh-docker |
| MISP | Threat Intel | Compose | github.com/MISP/misp-docker |

## Usage Examples

### Initialize Container Manager
```javascript
// Create and initialize the container manager
const containerMgr = new ContainerManager('parent-div-id');

// The UI will automatically:
// 1. Check for Docker/Podman availability
// 2. List running containers
// 3. Display real-time metrics
// 4. Enable tool deployment from registry
```

### Deploy a Tool
```javascript
// User clicks "Deploy" button for a tool
// 1. Pre-flight checks are run (sockets, ports, disk space)
// 2. If tool requires env vars, deploy modal appears
// 3. User enters configuration values
// 4. Deployment progress is streamed to UI
// 5. Container health is monitored
```

### Manage Secrets
```javascript
const vault = new SecretsVault();
await vault.initialize();

// Store an API key
await vault.setSecret("openvas_api_key", "sk-12345...");

// Retrieve later
const apiKey = await vault.getSecret("openvas_api_key");

// Export for backup
await vault.exportSecrets("/backup/secrets.json");
```

### Health Checks
```javascript
const runtimeMgr = new ContainerRuntimeManager("docker");
const healthChecker = new ContainerHealthChecker(runtimeMgr);

const checks = await healthChecker.runHealthCheck();
checks.forEach(check => {
  console.log(`${check.name}: ${check.passed ? '✓' : '✗'}`);
});
```

### Audit Logging
```javascript
const auditLogger = new AuditLogger();
await auditLogger.initialize();

// Log container actions
await auditLogger.logEvent(
  "container_deploy",
  "deployment",
  "success",
  { tool: "nuclei", version: "latest" }
);

// Export for compliance
await auditLogger.exportLog("/var/log/athena-audit.json");
```

## Integration with eDEX-UI Features

### Existing Features Utilized

1. **Modular Architecture**
   - Athena Nexus follows the same class-based pattern as other eDEX-UI modules
   - CSS organized in separate `mod_athena_nexus.css`
   - Seamless integration with existing module system

2. **Terminal Module**
   - Real-time command output can be displayed in Terminal
   - Live streaming of container logs
   - Interactive shell access to deployed containers

3. **Real-Time Metrics**
   - Reuse existing metric collection infrastructure
   - Display CPU/RAM usage in container cards
   - Health monitoring leverages existing monitoring systems

4. **3D Visualization** (Future Enhancement)
   - Network topology visualization (D3 → Three.js conversion)
   - 3D container orchestration overview
   - Volumetric data flow visualization

5. **Settings & Themes**
   - Athena Nexus settings integrate with eDEX-UI settings
   - Theme switching applies to Athena UI
   - Configuration persistent across sessions

## Enhancement Roadmap

### Phase 1: Core Container Management (Complete)
- ✅ Basic container lifecycle management
- ✅ Tool registry and deployment
- ✅ Pre-flight health checks
- ✅ Secrets vault
- ✅ Audit logging

### Phase 2: Advanced Monitoring
- Grafana integration for detailed metrics
- Prometheus scraping support
- Custom health check definitions
- Performance optimization tips

### Phase 3: 3D Visualization
- Three.js network topology graph
- Volumetric data flow visualization
- Real-time 3D container metrics display
- Advanced shader effects for data representation

### Phase 4: Multi-Host Management
- Remote Docker daemon support
- Container clustering visualization
- Cross-host networking
- Distributed deployment strategies

### Phase 5: Advanced Security
- Network policy visualization
- RBAC enforcement
- Vulnerability scanning integration
- Compliance reporting (CIS benchmarks)

## Testing

Run tests for vault and logging:
```bash
npm test -- athenaVault
```

Test Docker/Podman integration:
```bash
npm test -- containerManager
```

## Troubleshooting

### Docker Socket Not Found
```bash
# Enable Docker socket (Linux)
sudo systemctl enable --now docker
sudo usermod -aG docker $USER
# Log out and back in
```

### Podman Socket Not Found
```bash
# Enable Podman socket (user-mode)
systemctl --user enable --now podman.socket
```

### Permission Denied on Config Directory
```bash
# Fix permissions
chmod 700 ~/.config/athena-nexus
chmod 600 ~/.config/athena-nexus/*.json
```

### Failed Pre-Flight Checks
Check the Health Check tab for detailed information:
- **Docker Socket**: Is Docker daemon running?
- **Disk Space**: Do you have >10GB free?
- **DNS**: Can you resolve docker.io?
- **Ports**: Are required ports available?

## Performance Considerations

- **Metric Collection**: Limited to 2-second intervals to avoid overload
- **Container Listing**: Cached when not actively refreshing
- **Image Pulling**: Layer-by-layer progress tracked in separate thread
- **Log Streaming**: Limited to 100 lines per fetch (configurable)

## Security Best Practices

1. **Secrets Vault**: Always use secrets vault for sensitive data
2. **Audit Logging**: Regularly export and archive audit logs
3. **Snapshots**: Store backups in encrypted, offline storage
4. **File Permissions**: Ensure `~/.config/athena-nexus/` is `chmod 700`
5. **Socket Access**: Use rootless Docker/Podman when possible

## Contributing

To extend Athena Nexus:

1. **Add a New Tool**: Edit `athenaRegistry.class.js` → `builtInTools` array
2. **Add a Health Check**: Edit `ContainerHealthChecker` → add method
3. **Add a Feature**: Create new class, import in `ui.html`, add CSS
4. **Test Integration**: Run `npm test` to verify no breakage

## License

Athena Nexus integration is part of eDEX-UI and falls under the same GPL-3.0 license.

## References

- [Docker API Documentation](https://docs.docker.com/engine/api/)
- [Podman API Documentation](https://docs.podman.io/en/latest/API.html)
- [Docker Compose Specification](https://github.com/compose-spec/compose-spec)
- [Athena OS](https://athena-os.org/)

---

**Last Updated**: April 13, 2026
**Status**: Integration Complete - Ready for Enhancement
