const { contextBridge, ipcRenderer } = require('electron');

/**
 * Preload Script
 * 
 * Expone APIs seguras al renderer process a través de contextBridge.
 * Solo funcionalidad de archivos locales.
 */

console.log('Preload script cargado');

contextBridge.exposeInMainWorld('electronAPI', {
    // Controles de ventana
    minimizeWindow: () => {
        ipcRenderer.send('window:minimize');
    },
    maximizeWindow: () => {
        ipcRenderer.send('window:maximize');
    },
    closeWindow: () => {
        ipcRenderer.send('window:close');
    },

    // Diálogos
    openFileDialog: async () => {
        console.log('Abriendo diálogo de archivos...');
        try {
            const result = await ipcRenderer.invoke('dialog:openFile');
            console.log('Archivos seleccionados:', result);
            return result;
        } catch (error) {
            console.error('Error al abrir diálogo:', error);
            throw error;
        }
    }
});

console.log('electronAPI expuesta correctamente');
