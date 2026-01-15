/**
 * App.js - Inicializador del Renderer
 * 
 * Conecta todos los módulos del renderer y coordina sus interacciones.
 * Reproductor de archivos locales únicamente.
 */
class App {
    constructor() {
        // Inicializar módulos
        this.audio = new AudioModule();
        this.visualizer = new VisualizerModule('visualizerCanvas');
        this.playlist = new PlaylistModule('playlistItems');
        this.ui = new UIModule();

        this.init();
    }

    /**
     * Inicializa la aplicación y conecta los módulos
     */
    init() {
        // Conectar visualizador con audio
        this.visualizer.connectAudio(this.audio);
        this.visualizer.start();

        // Configurar callbacks del módulo de audio
        this.audio.onPlayStateChange = (isPlaying) => {
            this.ui.setPlayState(isPlaying);
        };

        this.audio.onTimeUpdate = (currentTime, duration) => {
            this.ui.updateProgress(currentTime, duration);
        };

        this.audio.onTrackEnd = () => {
            // Avanzar al siguiente track automáticamente
            this.playlist.nextTrack();
        };

        this.audio.onError = (error) => {
            this.ui.showError('Error al reproducir audio');
            console.error(error);
        };

        // Configurar callbacks del módulo UI
        this.ui.onPlay = () => this.play();
        this.ui.onPause = () => this.audio.pause();
        this.ui.onPrevious = () => this.playPrevious();
        this.ui.onNext = () => this.playNext();
        this.ui.onSeek = (percent) => this.audio.seekPercent(percent);
        this.ui.onVolumeChange = (volume) => this.audio.setVolume(volume);
        this.ui.onAddFiles = () => this.addLocalFiles();
        this.ui.onEqualizerChange = (index, value) => this.audio.setEqualizerBand(index, value);

        // Configurar callbacks del módulo playlist
        this.playlist.onTrackSelect = (track) => this.loadAndPlay(track);

        // Establecer volumen inicial
        this.audio.setVolume(0.8);

        console.log('Glass Music Player inicializado');
    }

    /**
     * Reproduce el track actual o selecciona el primero
     */
    async play() {
        const currentTrack = this.playlist.getCurrentTrack();

        if (!currentTrack && this.playlist.tracks.length > 0) {
            // Si no hay track seleccionado, seleccionar el primero
            this.playlist.selectTrack(this.playlist.tracks[0].id);
        } else {
            await this.audio.play();
        }
    }

    /**
     * Reproduce el track anterior
     */
    async playPrevious() {
        // Si estamos en los primeros 3 segundos, ir al track anterior
        // Si no, reiniciar el track actual
        if (this.audio.getCurrentTime() > 3) {
            this.audio.seek(0);
        } else {
            this.playlist.previousTrack();
        }
    }

    /**
     * Reproduce el siguiente track
     */
    playNext() {
        this.playlist.nextTrack();
    }

    /**
     * Carga y reproduce un track
     */
    async loadAndPlay(track) {
        try {
            this.ui.showLoading(true);

            await this.audio.loadLocalFile(track.path);
            this.ui.updateNowPlaying(track);
            await this.audio.play();

        } catch (error) {
            console.error('Error al cargar track:', error);
            this.ui.showError(`Error al cargar: ${track.title}`);
        } finally {
            this.ui.showLoading(false);
        }
    }

    /**
     * Abre diálogo para agregar archivos locales
     */
    async addLocalFiles() {
        try {
            const filePaths = await window.electronAPI.openFileDialog();

            if (!filePaths || filePaths.length === 0) {
                return;
            }

            for (const filePath of filePaths) {
                this.playlist.addLocalTrack(filePath);
            }

            // Si es el primer track, seleccionarlo automáticamente
            if (this.playlist.tracks.length === filePaths.length && filePaths.length > 0) {
                this.playlist.selectTrack(this.playlist.tracks[0].id);
            }

        } catch (error) {
            console.error('Error al agregar archivos:', error);
            this.ui.showError('Error al agregar archivos');
        }
    }
}

// Iniciar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM cargado, inicializando aplicación...');

    // Verificar si electronAPI está disponible
    if (window.electronAPI) {
        console.log('electronAPI detectada, iniciando app...');
        window.app = new App();
    } else {
        console.error('electronAPI NO disponible - la app necesita ejecutarse con Electron');
        const container = document.querySelector('.playlist-items');
        if (container) {
            container.innerHTML = '<li class="playlist-empty"><span style="color: #ef4444;">Ejecuta: npm start</span></li>';
        }
    }
});
