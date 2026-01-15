const { BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const WindowModule = require('../window/WindowModule');

/**
 * CoreModule - Módulo Central Orquestador
 * 
 * Este es el corazón del sistema. Conecta y coordina todos los demás módulos:
 * - WindowModule: Configuración y manejo de ventana
 * 
 * Expone una API unificada a través de IPC para el renderer process.
 */
class CoreModule {
    constructor() {
        console.log('Inicializando CoreModule...');
        this.windowModule = new WindowModule();
        this.mainWindow = null;

        this.setupIPC();
        console.log('CoreModule inicializado');
    }

    /**
     * Configura los handlers IPC para comunicación con el renderer
     */
    setupIPC() {
        console.log('Configurando handlers IPC...');

        // Controles de ventana
        ipcMain.on('window:minimize', () => {
            console.log('IPC: window:minimize');
            if (this.mainWindow) {
                this.mainWindow.minimize();
            }
        });

        ipcMain.on('window:maximize', () => {
            console.log('IPC: window:maximize');
            if (this.mainWindow) {
                if (this.mainWindow.isMaximized()) {
                    this.mainWindow.unmaximize();
                } else {
                    this.mainWindow.maximize();
                }
            }
        });

        ipcMain.on('window:close', () => {
            console.log('IPC: window:close');
            if (this.mainWindow) {
                this.mainWindow.close();
            }
        });

        // Abrir diálogo de archivos
        ipcMain.handle('dialog:openFile', async () => {
            console.log('IPC: dialog:openFile');
            try {
                const result = await dialog.showOpenDialog(this.mainWindow, {
                    properties: ['openFile', 'multiSelections'],
                    filters: [
                        { name: 'Audio', extensions: ['mp3', 'wav', 'ogg', 'flac', 'm4a', 'aac', 'wma'] }
                    ]
                });
                console.log('Archivos seleccionados:', result.filePaths);
                return result.filePaths;
            } catch (error) {
                console.error('Error en dialog:openFile:', error);
                throw error;
            }
        });

        console.log('Handlers IPC configurados');
    }

    /**
     * Crea la ventana principal de la aplicación
     */
    async createWindow() {
        console.log('Creando ventana principal...');
        this.mainWindow = this.windowModule.createMainWindow();

        // Cargar el HTML del renderer
        const htmlPath = path.join(__dirname, '../../renderer/index.html');
        console.log('Cargando HTML desde:', htmlPath);
        await this.mainWindow.loadFile(htmlPath);

        // Abrir DevTools en desarrollo
        if (process.argv.includes('--enable-logging')) {
            this.mainWindow.webContents.openDevTools();
        }

        console.log('Ventana creada exitosamente');
        return this.mainWindow;
    }
}

module.exports = CoreModule;
