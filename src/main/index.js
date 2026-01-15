const { app, BrowserWindow } = require('electron');
const path = require('path');
const CoreModule = require('./core/CoreModule');

// Módulo principal - Entry Point de Electron
class MainProcess {
    constructor() {
        this.core = null;
        this.mainWindow = null;
    }

    async init() {
        await app.whenReady();
        
        // Inicializar el módulo central
        this.core = new CoreModule();
        
        // Crear ventana principal
        this.mainWindow = await this.core.createWindow();
        
        // Manejar cierre de todas las ventanas
        app.on('window-all-closed', () => {
            if (process.platform !== 'darwin') {
                app.quit();
            }
        });

        // Reactivar en macOS
        app.on('activate', async () => {
            if (BrowserWindow.getAllWindows().length === 0) {
                this.mainWindow = await this.core.createWindow();
            }
        });
    }
}

// Iniciar aplicación
const mainProcess = new MainProcess();
mainProcess.init().catch(console.error);
