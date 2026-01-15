const { BrowserWindow } = require('electron');
const path = require('path');

/**
 * WindowModule - Módulo de Configuración de Ventana
 * 
 * Maneja la creación y configuración de la ventana principal.
 * Configura el estilo frameless necesario para el diseño glassmorphism.
 */
class WindowModule {
    constructor() {
        this.windowConfig = {
            width: 900,
            height: 600,
            minWidth: 600,
            minHeight: 400,
            frame: false,           // Sin barra de título nativa
            transparent: true,      // Fondo transparente para glassmorphism
            vibrancy: 'dark',       // Efecto vibrancy en macOS
            visualEffectState: 'active',
            backgroundColor: '#00000000',
            icon: path.join(__dirname, '../../../icon', process.platform === 'win32' ? 'logo.ico' : 'logo.png'),
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                preload: path.join(__dirname, '../preload.js')
            }
        };
    }

    /**
     * Crea la ventana principal con configuración glassmorphism
     */
    createMainWindow() {
        const window = new BrowserWindow(this.windowConfig);

        // Configurar comportamiento de la ventana
        window.setBackgroundColor('#00000000');

        return window;
    }
}

module.exports = WindowModule;
