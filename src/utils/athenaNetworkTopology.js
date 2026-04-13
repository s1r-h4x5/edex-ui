/**
 * Athena Nexus 3D Network Visualization
 * Three.js-based 3D visualization of container networks and topology
 */
class AthenaNetworkTopology {
    constructor(containerId, width = 800, height = 600) {
        this.containerId = containerId;
        this.width = width;
        this.height = height;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.nodes = new Map(); // container nodes
        this.links = []; // network connections
        this.animation = null;
        this.initialized = false;
    }

    /**
     * Initialize Three.js scene
     */
    async initialize() {
        const container = document.getElementById(this.containerId);
        if (!container) return false;

        try {
            // Scene setup
            this.scene = new THREE.Scene();
            this.scene.background = new THREE.Color(0x0a0a14);
            this.scene.fog = new THREE.Fog(0x0a0a14, 100, 500);

            // Camera setup
            this.camera = new THREE.PerspectiveCamera(
                75,
                this.width / this.height,
                0.1,
                1000
            );
            this.camera.position.z = 50;

            // Renderer setup
            this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
            this.renderer.setSize(this.width, this.height);
            this.renderer.setPixelRatio(window.devicePixelRatio);
            container.appendChild(this.renderer.domElement);

            // Add lights
            this.addLighting();

            // Enable mouse controls
            this.enableMouseControls();

            // Start render loop
            this.animate();

            this.initialized = true;
            return true;
        } catch (err) {
            console.error("Failed to initialize 3D network visualization:", err);
            return false;
        }
    }

    /**
     * Add 3D lighting to scene
     */
    addLighting() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0x00ff00, 0.4);
        this.scene.add(ambientLight);

        // Point light (green glow)
        const pointLight = new THREE.PointLight(0x00ff00, 0.8);
        pointLight.position.set(0, 30, 30);
        this.scene.add(pointLight);

        // Directional light
        const directionalLight = new THREE.DirectionalLight(0x00aa00, 0.5);
        directionalLight.position.set(10, 20, 10);
        this.scene.add(directionalLight);
    }

    /**
     * Add a container node to the network
     */
    addContainer(containerId, name, x = 0, y = 0, z = 0) {
        if (this.nodes.has(containerId)) return;

        // Create container node geometry
        const geometry = new THREE.IcosahedronGeometry(2, 4);
        const material = new THREE.MeshStandardMaterial({
            color: 0x00ff00,
            emissive: 0x00aa00,
            wireframe: false,
            metalness: 0.7,
            roughness: 0.2
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(x, y, z);
        mesh.userData = {
            id: containerId,
            name: name,
            type: "container"
        };

        // Add glow effect
        const glow = this.createGlowMesh(geometry);
        glow.position.copy(mesh.position);
        mesh.add(glow);

        this.scene.add(mesh);
        this.nodes.set(containerId, {
            mesh,
            position: new THREE.Vector3(x, y, z),
            velocity: new THREE.Vector3(0, 0, 0),
            connections: []
        });

        return mesh;
    }

    /**
     * Create glow effect for nodes
     */
    createGlowMesh(geometry) {
        const glowGeometry = geometry.clone();
        const glowMaterial = new THREE.MeshStandardMaterial({
            color: 0x00ff00,
            emissive: 0x00ff00,
            transparent: true,
            opacity: 0.2,
            emissiveIntensity: 0.5
        });

        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        glow.scale.set(1.3, 1.3, 1.3);

        return glow;
    }

    /**
     * Connect two containers with a link
     */
    addConnection(containerId1, containerId2, data = {}) {
        const node1 = this.nodes.get(containerId1);
        const node2 = this.nodes.get(containerId2);

        if (!node1 || !node2) return false;

        // Create connection line
        const vertices = [
            node1.position,
            node2.position
        ];

        const geometry = new THREE.BufferGeometry().setFromPoints(vertices);
        const material = new THREE.LineBasicMaterial({
            color: 0x00ff00,
            linewidth: 2,
            transparent: true,
            opacity: 0.6
        });

        const line = new THREE.Line(geometry, material);
        line.userData = {
            id: `${containerId1}_${containerId2}`,
            source: containerId1,
            target: containerId2,
            ...data
        };

        this.scene.add(line);

        this.links.push({
            line,
            node1,
            node2,
            data
        });

        node1.connections.push(containerId2);
        node2.connections.push(containerId1);

        return true;
    }

    /**
     * Update node metrics with visual feedback
     */
    updateNodeMetrics(containerId, metrics) {
        const node = this.nodes.get(containerId);
        if (!node) return;

        // Scale node based on memory usage
        const scale = 1 + (metrics.memoryPercent / 100) * 0.5;
        node.mesh.scale.set(scale, scale, scale);

        // Color based on CPU usage
        const cpu = metrics.cpu;
        let color;
        if (cpu > 80) {
            color = 0xff0000; // Red - high CPU
        } else if (cpu > 60) {
            color = 0xffaa00; // Orange - medium CPU
        } else {
            color = 0x00ff00; // Green - low CPU
        }

        node.mesh.material.color.setHex(color);
        node.mesh.children[0].material.emissive.setHex(color);
    }

    /**
     * Physics-based node repulsion and attraction
     */
    applyForces() {
        const nodes = Array.from(this.nodes.values());
        const repulsionForce = 0.5;
        const attractionForce = 0.1;

        // Node-to-node repulsion
        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                const nodeA = nodes[i];
                const nodeB = nodes[j];

                const distance = nodeA.position.distanceTo(nodeB.position);
                if (distance < 0.01) continue;

                const direction = nodeB.position.clone().sub(nodeA.position).normalize();
                const force = repulsionForce / (distance * distance);

                nodeA.velocity.sub(direction.multiplyScalar(force));
                nodeB.velocity.add(direction.multiplyScalar(force));
            }
        }

        // Spring attraction along connections
        for (const link of this.links) {
            const nodeA = link.node1;
            const nodeB = link.node2;

            const desiredDistance = 20;
            const distance = nodeA.position.distanceTo(nodeB.position);

            const direction = nodeB.position.clone().sub(nodeA.position).normalize();
            const force = (distance - desiredDistance) * attractionForce;

            nodeA.velocity.add(direction.clone().multiplyScalar(force));
            nodeB.velocity.sub(direction.clone().multiplyScalar(force));
        }

        // Apply velocity with damping
        const damping = 0.85;
        for (const node of nodes) {
            node.velocity.multiplyScalar(damping);
            node.position.add(node.velocity);
            node.mesh.position.copy(node.position);

            // Constrain to bounds
            this.constrainNodePosition(node);
        }
    }

    /**
     * Keep nodes within scene bounds
     */
    constrainNodePosition(node) {
        const bounds = 40;
        if (node.position.x > bounds) node.position.x = bounds;
        if (node.position.x < -bounds) node.position.x = -bounds;
        if (node.position.y > bounds) node.position.y = bounds;
        if (node.position.y < -bounds) node.position.y = -bounds;
        if (node.position.z > bounds) node.position.z = bounds;
        if (node.position.z < -bounds) node.position.z = -bounds;
    }

    /**
     * Update connection lines to follow nodes
     */
    updateLinks() {
        for (const link of this.links) {
            const line = link.line;
            const positionAttribute = line.geometry.attributes.position;

            positionAttribute.array[0] = link.node1.position.x;
            positionAttribute.array[1] = link.node1.position.y;
            positionAttribute.array[2] = link.node1.position.z;

            positionAttribute.array[3] = link.node2.position.x;
            positionAttribute.array[4] = link.node2.position.y;
            positionAttribute.array[5] = link.node2.position.z;

            positionAttribute.needsUpdate = true;
        }
    }

    /**
     * Mouse controls for camera
     */
    enableMouseControls() {
        let isDragging = false;
        let previousMousePosition = { x: 0, y: 0 };

        this.renderer.domElement.addEventListener('mousedown', (e) => {
            isDragging = true;
            previousMousePosition = { x: e.clientX, y: e.clientY };
        });

        this.renderer.domElement.addEventListener('mousemove', (e) => {
            if (isDragging) {
                const deltaX = e.clientX - previousMousePosition.x;
                const deltaY = e.clientY - previousMousePosition.y;

                this.scene.rotation.y += deltaX * 0.005;
                this.scene.rotation.x += deltaY * 0.005;

                previousMousePosition = { x: e.clientX, y: e.clientY };
            }
        });

        this.renderer.domElement.addEventListener('mouseup', () => {
            isDragging = false;
        });

        // Zoom with mouse wheel
        this.renderer.domElement.addEventListener('wheel', (e) => {
            e.preventDefault();
            this.camera.position.z += e.deltaY * 0.1;
            this.camera.position.z = Math.max(10, Math.min(100, this.camera.position.z));
        });
    }

    /**
     * Animation loop
     */
    animate() {
        this.animation = requestAnimationFrame(() => this.animate());

        // Apply physics
        this.applyForces();

        // Update connection lines
        this.updateLinks();

        // Gentle rotation
        this.scene.rotation.z += 0.0001;

        // Render
        this.renderer.render(this.scene, this.camera);
    }

    /**
     * Get network statistics
     */
    getNetworkStats() {
        return {
            nodeCount: this.nodes.size,
            linkCount: this.links.length,
            averageConnections: this.nodes.size > 0 
                ? Array.from(this.nodes.values()).reduce((sum, n) => sum + n.connections.length, 0) / this.nodes.size
                : 0
        };
    }

    /**
     * Export network graph as JSON
     */
    exportNetworkGraph() {
        const nodes = Array.from(this.nodes.entries()).map(([id, data]) => ({
            id,
            name: data.mesh.userData.name,
            position: {
                x: data.position.x,
                y: data.position.y,
                z: data.position.z
            }
        }));

        const links = this.links.map(link => ({
            source: link.line.userData.source,
            target: link.line.userData.target,
            data: link.data
        }));

        return { nodes, links };
    }

    /**
     * Clear visualization
     */
    clear() {
        // Remove all meshes
        for (const node of this.nodes.values()) {
            this.scene.remove(node.mesh);
        }

        // Remove all links
        for (const link of this.links) {
            this.scene.remove(link.line);
        }

        this.nodes.clear();
        this.links = [];
    }

    /**
     * Dispose resources
     */
    dispose() {
        if (this.animation) {
            cancelAnimationFrame(this.animation);
        }

        if (this.renderer) {
            this.renderer.dispose();
            if (this.renderer.domElement.parentNode) {
                this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
            }
        }

        this.clear();
        this.initialized = false;
    }

    /**
     * Handle window resize
     */
    onWindowResize(width, height) {
        this.width = width;
        this.height = height;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }
}

/**
 * 3D Container Dashboard
 * Real-time 3D visualization of container metrics
 */
class ThreeDContainerDashboard {
    constructor(containerId) {
        this.containerId = containerId;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.charts = new Map();
        this.initialized = false;
    }

    /**
     * Initialize 3D container dashboard
     */
    async initialize() {
        const container = document.getElementById(this.containerId);
        if (!container) return false;

        try {
            // Scene setup
            this.scene = new THREE.Scene();
            this.scene.background = new THREE.Color(0x0a0a14);

            // Camera setup
            this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
            this.camera.position.z = 30;

            // Renderer setup
            this.renderer = new THREE.WebGLRenderer({ antialias: true });
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            container.appendChild(this.renderer.domElement);

            // Create 3D charts
            this.createMetricsVisualizations();

            // Start render loop
            this.animate();

            this.initialized = true;
            return true;
        } catch (err) {
            console.error("Failed to initialize 3D dashboard:", err);
            return false;
        }
    }

    /**
     * Create 3D metric visualizations
     */
    createMetricsVisualizations() {
        // CPU Usage as rotating torus
        const cpuGeometry = new THREE.TorusGeometry(5, 2, 16, 100);
        const cpuMaterial = new THREE.MeshStandardMaterial({
            color: 0x00ff00,
            emissive: 0x00aa00,
            metalness: 0.7,
            roughness: 0.2
        });
        const cpuMesh = new THREE.Mesh(cpuGeometry, cpuMaterial);
        cpuMesh.position.x = -10;
        this.scene.add(cpuMesh);
        this.charts.set('cpu', cpuMesh);

        // Memory Usage as scaling cube
        const memGeometry = new THREE.BoxGeometry(4, 4, 4);
        const memMaterial = new THREE.MeshStandardMaterial({
            color: 0x00ff00,
            emissive: 0x00ff00,
            wireframe: true,
            transparent: true,
            opacity: 0.7
        });
        const memMesh = new THREE.Mesh(memGeometry, memMaterial);
        memMesh.position.x = 0;
        this.scene.add(memMesh);
        this.charts.set('memory', memMesh);

        // Network I/O as particle system
        const particleCount = 1000;
        const particleGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);

        for (let i = 0; i < particleCount * 3; i += 3) {
            positions[i] = (Math.random() - 0.5) * 20 + 10;
            positions[i + 1] = (Math.random() - 0.5) * 20;
            positions[i + 2] = (Math.random() - 0.5) * 20;
        }

        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const particleMaterial = new THREE.PointsMaterial({
            color: 0x00ff00,
            size: 0.1,
            transparent: true,
            opacity: 0.8
        });

        const particles = new THREE.Points(particleGeometry, particleMaterial);
        this.scene.add(particles);
        this.charts.set('network', particles);
    }

    /**
     * Update metric visualization
     */
    updateMetric(metricType, value) {
        const chart = this.charts.get(metricType);
        if (!chart) return;

        switch (metricType) {
            case 'cpu':
                // Rotate based on CPU %
                chart.rotation.z += (value / 100) * 0.1;
                break;
            case 'memory':
                // Scale based on memory %
                const scale = 0.5 + (value / 100) * 1.5;
                chart.scale.set(scale, scale, scale);
                break;
            case 'network':
                // Particle distribution based on network activity
                chart.geometry.attributes.position.needsUpdate = true;
                break;
        }
    }

    /**
     * Animation loop
     */
    animate() {
        requestAnimationFrame(() => this.animate());

        // Auto-rotate scene
        this.scene.rotation.y += 0.001;

        this.renderer.render(this.scene, this.camera);
    }

    /**
     * Dispose resources
     */
    dispose() {
        if (this.renderer) {
            this.renderer.dispose();
        }
        this.initialized = false;
    }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        AthenaNetworkTopology,
        ThreeDContainerDashboard
    };
}
