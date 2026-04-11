# Quick Start: 3D Animation for eDEX-UI

## 🚀 Getting Started in 5 Minutes

### 1. Initialize the 3D Scene
```javascript
// Create and initialize 3D environment
const scene3d = new ThreeDSceneInitializer('canvas-3d');
const initialized = scene3d.init();

if (initialized) {
    console.log('3D Scene is ready!');
}
```

### 2. Add a Monitoring Dashboard
```javascript
// Create dashboard with CPU, memory, and network monitors
scene3d.createMonitoringDashboard({
    showCPU: true,
    showMemory: true,
    showNetwork: true,
    position: { x: 0, y: 0, z: 0 }
});
```

### 3. Update Data in Real-Time
```javascript
// Update visualizations every 500ms
setInterval(() => {
    const cpuLoad = getCPULoad();      // Your CPU data
    const memUsage = getMemoryUsage(); // Your memory data
    const netActivity = getNetworkData(); // Your network data
    
    scene3d.updateData(cpuLoad, memUsage, netActivity);
}, 500);
```

### 4. Customize Particle Effects
```javascript
const particles = scene3d.getParticleSystem();

// Create digital rain
particles.createDigitalRain('rain-1', {
    count: 500,
    speed: 0.5,
    color: 0x00ff00
});

// Create particle cloud
particles.createParticleCloud('cloud-1', {
    count: 200,
    radius: 30,
    color: 0x00ffff
});
```

---

## 📚 Common Patterns

### Pattern 1: System Monitor Panel
```javascript
class CustomMonitor {
    constructor() {
        this.scene3d = new ThreeDSceneInitializer('monitor-canvas');
        this.scene3d.init();
    }
    
    addCPUVisualization(cpuData) {
        const viz = this.scene3d.getVisualizations();
        viz.createBarChart('cpu-load', {
            data: cpuData,
            color: 0xffaa00,
            maxValue: 100
        });
    }
    
    updateCPU(newLoad) {
        const viz = this.scene3d.getVisualizations();
        viz.updateBarChart('cpu-load', [newLoad]);
    }
}
```

### Pattern 2: Custom 3D Module
```javascript
class CustomThreeDModule {
    constructor(name, parent, engine, systemInfo) {
        this.name = name;
        this.parent = parent;
        this.engine = engine;
        this.si = systemInfo;
        this.dom = null;
    }
    
    init() {
        this.dom = document.createElement('div');
        this.dom.id = this.name;
        this.dom.className = 'custom-3d-module';
        this.parent.appendChild(this.dom);
        
        // Add your custom 3D elements here
    }
    
    render() {
        // Update visualization
    }
    
    close() {
        if (this.dom?.parentNode) {
            this.dom.parentNode.removeChild(this.dom);
        }
    }
}
```

### Pattern 3: Particle Effect Generator
```javascript
function createSceneBackground(engine) {
    const particles = new ParticleSystem(engine);
    
    // Multiple effects for depth
    particles.createDigitalRain('rain', { count: 300 });
    particles.createParticleCloud('clouds', { count: 150 });
    particles.createGeometricNodes('network', { count: 50 });
    particles.createEnergyField('aura', { intensity: 0.7 });
    
    return particles;
}
```

---

## 🎨 Color Schemes

### Preset Colors
```javascript
const COLORS = {
    // Cyan/Blue theme
    CYAN: 0x00ffff,
    LIGHT_BLUE: 0x0088ff,
    DARK_BLUE: 0x001144,
    
    // Green theme
    GREEN: 0x00ff00,
    LIME: 0x00ff99,
    DARK_GREEN: 0x003300,
    
    // Orange/Yellow theme
    ORANGE: 0xffaa00,
    YELLOW: 0xffff00,
    GOLD: 0xffcc66,
    
    // Magenta/Purple theme
    MAGENTA: 0xff00ff,
    VIOLET: 0xff00aa,
    PURPLE: 0xcc00ff,
};

// Apply custom color
viz.createEnergyRing('system', {
    color: COLORS.CYAN,
    intensity: 0.8
});
```

---

## ⚙️ Configuration Options

### Engine Options
```javascript
const engine = new ThreeDEngine('canvas', {
    antialias: true,              // Better rendering quality
    alpha: false,                 // No transparency
    shadowMap: true,              // Enable shadows
    pixelRatio: 1,                // Device pixel ratio
    fov: 75,                      // Field of view
    near: 0.1,                    // Near clipping plane
    far: 10000                    // Far clipping plane
});
```

### Particle Systems
```javascript
particles.createDigitalRain('effect', {
    count: 500,        // Number of particles
    speed: 0.5,        // Fall speed
    width: 100,        // Effect width
    height: 100,       // Effect height
    color: 0x00ff00,   // Color
    luminosity: 0.8    // Brightness
});
```

### Visualizations
```javascript
viz.createSphereGauge('gauge', {
    value: 50,         // Current value
    minValue: 0,       // Minimum
    maxValue: 100,     // Maximum
    radius: 5,         // Sphere size
    color: 0x00ffff,   // Color
    label: 'CPU'       // Label
});
```

---

## 🔧 Troubleshooting

### Issue: WebGL Not Supported
```javascript
if (!scene3d.is3DEnabled()) {
    console.warn('3D rendering not available');
    // Fallback to 2D rendering
}
```

### Issue: Poor Performance
```javascript
// Reduce particles
const particles = scene3d.getParticleSystem();
particles.stopParticleSystem('rain-effect');

// Or remove non-essential visualizations
scene3d.getVisualizations().removeVisualization('network-chart');
```

### Issue: Memory Leak
```javascript
// Always dispose when done
scene3d.dispose();            // Disposes all
// OR individual cleanup
scene3d.getParticleSystem().remove ParticleSystem('effect-name');
```

---

## 📝 Event Integration

### Listen to System Updates
```javascript
// Integrate with your system monitoring
class IntegrationExample {
    constructor(systemInfo) {
        this.si = systemInfo;
        this.scene3d = new ThreeDSceneInitializer('canvas');
        this.scene3d.init();
        
        this.startMonitoring();
    }
    
    startMonitoring() {
        setInterval(() => {
            this.si.currentLoad((cpuData) => {
                this.scene3d.updateData(cpuData.currentLoad, undefined, undefined);
            });
            
            this.si.mem((memData) => {
                const usage = (memData.used / memData.total) * 100;
                this.scene3d.updateData(undefined, usage, undefined);
            });
        }, 1000);
    }
}
```

---

## 📊 Data Binding Examples

### Connect to Real Data
```javascript
// CPU Monitor
viz.createBarChart('cpu-cores', {
    data: systemInfo.cpuCores.map(c => c.load),
    color: 0xffaa00,
    maxValue: 100
});

// Memory Gauge
viz.createSphereGauge('memory', {
    value: (systemInfo.memory.used / systemInfo.memory.total) * 100,
    maxValue: 100,
    color: 0x00ffff
});

// Network Activity
viz.createLineChart('network-history', {
    data: networkHistory.last10Minutes,
    color: 0x00ff99
});
```

---

## 🎯 Best Practices

1. **Always Check 3D Support**
   ```javascript
   if (scene3d.is3DEnabled()) {
       // Use 3D features
   } else {
       // Fall back to 2D
   }
   ```

2. **Manage Resources**
   ```javascript
   // Clean up when modules close
   onModuleClose(() => {
       scene3d.dispose();
   });
   ```

3. **Optimize Particle Count**
   ```javascript
   // 60fps target: limit to ~500 particles
   // 30fps acceptable: up to ~1000 particles
   particles.createDigitalRain('effect', { count: 500 });
   ```

4. **Cache References**
   ```javascript
   // Avoid repeated getters
   const particles = scene3d.getParticleSystem();
   const viz = scene3d.getVisualizations();
   ```

5. **Use Consistent Colors**
   ```javascript
   // Define theme once
   const THEME = {
       primary: 0x00ff00,
       secondary: 0x00ffff,
       accent: 0xffaa00
   };
   ```

---

## 🔗 API Quick Reference

### ThreeDSceneInitializer
- `init()` → boolean
- `createMonitoringDashboard(options)` → Group
- `updateData(cpu, memory, network)` → void
- `toggleParticles(enable)` → void
- `getEngine()` → ThreeDEngine
- `getParticleSystem()` → ParticleSystem
- `getVisualizations()` → ThreeDVisualizations
- `is3DEnabled()` → boolean
- `dispose()` → void

### ParticleSystem
- `createDigitalRain(name, options)` → Points
- `createParticleCloud(name, options)` → Points
- `createEnergyField(name, options)` → Mesh
- `createGeometricNodes(name, options)` → Group

### ThreeDVisualizations
- `createBarChart(name, options)` → Group
- `createSphereGauge(name, options)` → Group
- `createEnergyRing(name, options)` → Mesh
- `createCylinderGauge(name, options)` → Group
- `createLineChart(name, options)` → Line

---

## 📞 Support

For detailed documentation, see:
- **Full Guide**: `3D_ENHANCEMENTS.md`
- **Implementation Details**: `3D_IMPLEMENTATION_SUMMARY.md`
- **API Docs**: Generated from source JSDoc comments

---

**Last Updated**: April 2026
**Version**: 1.0
**Status**: ✅ Production Ready
