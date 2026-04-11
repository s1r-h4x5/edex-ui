/**
 * Theme & Color Switching System
 * Allows users to switch between color schemes and themes
 * Integrates with existing window.theme system
 */

class ThemeSwitcher {
    constructor() {
        this.currentTheme = 'default';
        this.themes = {
            default: {
                name: 'Default (Green)',
                r: 0,
                g: 255,
                b: 0,
                label: '#00ff00',
                bgColor: 'rgba(0, 20, 40, 0.8)'
            },
            cyan: {
                name: 'Cyan',
                r: 0,
                g: 255,
                b: 255,
                label: '#00ffff',
                bgColor: 'rgba(0, 40, 60, 0.8)'
            },
            purple: {
                name: 'Purple',
                r: 255,
                g: 0,
                b: 255,
                label: '#ff00ff',
                bgColor: 'rgba(40, 0, 60, 0.8)'
            },
            red: {
                name: 'Red (Alert)',
                r: 255,
                g: 0,
                b: 0,
                label: '#ff0000',
                bgColor: 'rgba(60, 0, 0, 0.8)'
            },
            orange: {
                name: 'Orange (Warning)',
                r: 255,
                g: 165,
                b: 0,
                label: '#ffa500',
                bgColor: 'rgba(60, 40, 0, 0.8)'
            },
            blue: {
                name: 'Blue',
                r: 0,
                g: 100,
                b: 255,
                label: '#0064ff',
                bgColor: 'rgba(0, 20, 80, 0.8)'
            },
            pink: {
                name: 'Pink (Vaporwave)',
                r: 255,
                g: 0,
                b: 127,
                label: '#ff007f',
                bgColor: 'rgba(60, 0, 40, 0.8)'
            },
            lime: {
                name: 'Lime',
                r: 173,
                g: 255,
                b: 47,
                label: '#adff2f',
                bgColor: 'rgba(40, 60, 0, 0.8)'
            }
        };

        this.init();
    }

    /**
     * Initialize theme switcher
     */
    init() {
        // Load saved theme from localStorage
        const savedTheme = localStorage.getItem('edex-theme');
        if (savedTheme && this.themes[savedTheme]) {
            this.setTheme(savedTheme);
        } else {
            this.setTheme('default');
        }

        // Create UI if needed
        this.createThemeSwitcherUI();

        logger.success('Theme system', 'Theme switcher initialized');
    }

    /**
     * Create the theme switcher UI
     */
    createThemeSwitcherUI() {
        // Check if UI already exists
        if (document.querySelector('.theme-switcher-container')) {
            return;
        }

        const container = document.createElement('div');
        container.className = 'theme-switcher-container';
        container.innerHTML = `
            <div class="theme-switcher-header">
                <h3>THEMES</h3>
                <button class="theme-switcher-toggle" id="theme-toggle-btn" title="Toggle theme menu">🎨</button>
            </div>
            <div class="theme-switcher-menu" id="theme-menu" style="display: none;">
                ${Object.entries(this.themes).map(([key, theme]) => `
                    <button class="theme-option" data-theme="${key}" title="${theme.name}">
                        <span class="theme-color" style="background-color: rgb(${theme.r}, ${theme.g}, ${theme.b})"></span>
                        <span class="theme-label">${theme.name}</span>
                    </button>
                `).join('')}
                <div class="theme-divider"></div>
                <button class="theme-option preset-option" id="random-theme-btn">
                    <span class="theme-icon">🎲</span>
                    <span class="theme-label">Random</span>
                </button>
                <button class="theme-option preset-option" id="pulse-theme-btn">
                    <span class="theme-icon">⚡</span>
                    <span class="theme-label">Pulse</span>
                </button>
            </div>
        `;

        document.body.appendChild(container);

        // Setup event listeners
        this.setupEventListeners();
    }

    /**
     * Setup event listeners for theme switcher
     */
    setupEventListeners() {
        const toggleBtn = document.getElementById('theme-toggle-btn');
        const menu = document.getElementById('theme-menu');
        const themeOptions = document.querySelectorAll('.theme-option[data-theme]');
        const randomBtn = document.getElementById('random-theme-btn');
        const pulseBtn = document.getElementById('pulse-theme-btn');

        // Toggle menu
        toggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isHidden = menu.style.display === 'none';
            menu.style.display = isHidden ? 'flex' : 'none';

            if (isHidden) {
                await TransitionEffects.fadeIn(menu, 0.2);
            }
        });

        // Close menu on outside click
        document.addEventListener('click', () => {
            menu.style.display = 'none';
        });

        // Theme selection
        themeOptions.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const theme = btn.dataset.theme;
                this.setTheme(theme);
                menu.style.display = 'none';
            });
        });

        // Random theme
        randomBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const themes = Object.keys(this.themes);
            const randomTheme = themes[Math.floor(Math.random() * themes.length)];
            this.setTheme(randomTheme);
            menu.style.display = 'none';
        });

        // Pulse animation (slow color shift)
        pulseBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.startPulseAnimation();
            menu.style.display = 'none';
        });
    }

    /**
     * Set theme
     */
    setTheme(themeName) {
        if (!this.themes[themeName]) {
            console.warn(`Theme '${themeName}' not found`);
            return;
        }

        const theme = this.themes[themeName];
        this.currentTheme = themeName;

        // Update global theme object
        window.theme = {
            r: theme.r,
            g: theme.g,
            b: theme.b,
            label: theme.label
        };

        // Update CSS variables
        document.documentElement.style.setProperty('--theme-r', theme.r);
        document.documentElement.style.setProperty('--theme-g', theme.g);
        document.documentElement.style.setProperty('--theme-b', theme.b);
        document.documentElement.style.setProperty('--theme-color', theme.label);

        // Save to localStorage
        localStorage.setItem('edex-theme', themeName);

        // Update UI highlight
        document.querySelectorAll('.theme-option[data-theme]').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.theme === themeName);
        });

        // Animate theme change
        this.animateThemeChange();

        logger.log('Theme system', `Theme changed to: ${themeName}`);

        if (window.notify) {
            window.notify(`Theme: ${theme.name}`, 'info', 2000);
        }
    }

    /**
     * Animate theme change
     */
    animateThemeChange() {
        const elements = document.querySelectorAll('[style*="color"]');

        elements.forEach(el => {
            el.style.animation = 'none';
            setTimeout(() => {
                el.style.animation = 'colorPulse 0.3s ease-out';
            }, 10);
        });
    }

    /**
     * Start continuous pulse animation cycling through colors
     */
    startPulseAnimation() {
        const themeNames = Object.keys(this.themes);
        let currentIndex = themeNames.indexOf(this.currentTheme);

        const pulse = () => {
            currentIndex = (currentIndex + 1) % themeNames.length;
            this.setTheme(themeNames[currentIndex]);

            // Continue pulsing
            setTimeout(pulse, 2000);
        };

        pulse();
    }

    /**
     * Get all available themes
     */
    getThemes() {
        return this.themes;
    }

    /**
     * Get current theme
     */
    getCurrentTheme() {
        return {
            name: this.currentTheme,
            ...this.themes[this.currentTheme]
        };
    }
}

/**
 * Create and initialize theme switcher
 */
function setupThemeSwitcher() {
    if (window.themeSwitcher) return;
    window.themeSwitcher = new ThemeSwitcher();
    return window.themeSwitcher;
}

// Auto-initialize when animation system is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => setupThemeSwitcher(), 500);
    });
} else {
    setTimeout(() => setupThemeSwitcher(), 500);
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ThemeSwitcher, setupThemeSwitcher };
}
