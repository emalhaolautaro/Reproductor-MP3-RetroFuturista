/**
 * UIModule - Módulo de Interfaz de Usuario
 * 
 * Maneja todas las interacciones de UI, incluyendo controles de ventana
 * y botones del reproductor. Solo archivos locales.
 */
class UIModule {
    constructor() {
        // Referencias a elementos del DOM
        this.elements = {
            // Controles de ventana
            closeBtn: document.getElementById('closeBtn'),
            minimizeBtn: document.getElementById('minimizeBtn'),
            maximizeBtn: document.getElementById('maximizeBtn'),
            titleBar: document.getElementById('titleBar'),

            // Controles del reproductor
            playBtn: document.getElementById('playBtn'),
            prevBtn: document.getElementById('prevBtn'),
            nextBtn: document.getElementById('nextBtn'),
            progressBar: document.getElementById('progressBar'),
            volumeSlider: document.getElementById('volumeSlider'),
            timeCurrent: document.getElementById('timeCurrent'),
            timeTotal: document.getElementById('timeTotal'),

            // Playlist
            addFileBtn: document.getElementById('addFileBtn'),

            // Info de reproducción
            nowPlaying: document.getElementById('nowPlaying'),

            // Ecualizador
            eqBtn: document.getElementById('eqBtn'),
            closeEqBtn: document.getElementById('closeEqBtn'),
            equalizerPanel: document.getElementById('equalizerPanel'),
            eqSliders: document.querySelectorAll('.eq-slider-vertical') // NodeList
        };

        // Callbacks para eventos
        this.onPlay = null;
        this.onPause = null;
        this.onPrevious = null;
        this.onNext = null;
        this.onSeek = null;
        this.onVolumeChange = null;
        this.onAddFiles = null;
        this.onEqualizerChange = null;

        this.init();
    }

    /**
     * Inicializa los event listeners
     */
    init() {
        this.setupWindowControls();
        this.setupPlayerControls();
        this.setupPlaylistControls();
        this.setupEqualizerControls();
    }

    /**
     * Configura los controles de ventana estilo MacOS
     */
    setupWindowControls() {
        // Cerrar ventana
        this.elements.closeBtn.addEventListener('click', () => {
            window.electronAPI.closeWindow();
        });

        // Minimizar ventana
        this.elements.minimizeBtn.addEventListener('click', () => {
            window.electronAPI.minimizeWindow();
        });

        // Maximizar ventana
        this.elements.maximizeBtn.addEventListener('click', () => {
            window.electronAPI.maximizeWindow();
        });
    }

    /**
     * Configura los controles del ecualizador
     */
    setupEqualizerControls() {
        // Toggle panel
        const togglePanel = () => {
            this.elements.equalizerPanel.classList.toggle('hidden');
        };

        if (this.elements.eqBtn) {
            this.elements.eqBtn.addEventListener('click', togglePanel);
        }
        if (this.elements.closeEqBtn) {
            this.elements.closeEqBtn.addEventListener('click', togglePanel);
        }

        // Sliders de banda
        this.elements.eqSliders.forEach(slider => {
            slider.addEventListener('input', (e) => {
                const bandIndex = parseInt(e.target.dataset.band);
                const value = parseFloat(e.target.value);

                // Actualizar valor visual
                const container = e.target.closest('.band-control');
                if (container) {
                    const valueEl = container.querySelector('.band-value');
                    if (valueEl) valueEl.textContent = value > 0 ? `+${value}` : value;
                }

                // Callback
                if (this.onEqualizerChange) {
                    this.onEqualizerChange(bandIndex, value);
                }
            });
        });
    }

    /**
     * Configura los controles del reproductor
     */
    setupPlayerControls() {
        // Botón de reproducción
        this.elements.playBtn.addEventListener('click', () => {
            if (this.elements.playBtn.classList.contains('playing')) {
                if (this.onPause) this.onPause();
            } else {
                if (this.onPlay) this.onPlay();
            }
        });

        // Botón anterior
        this.elements.prevBtn.addEventListener('click', () => {
            if (this.onPrevious) this.onPrevious();
        });

        // Botón siguiente
        this.elements.nextBtn.addEventListener('click', () => {
            if (this.onNext) this.onNext();
        });

        // Barra de progreso
        this.elements.progressBar.addEventListener('input', (e) => {
            if (this.onSeek) this.onSeek(parseFloat(e.target.value));
        });

        // Control de volumen
        this.elements.volumeSlider.addEventListener('input', (e) => {
            if (this.onVolumeChange) this.onVolumeChange(parseFloat(e.target.value) / 100);
        });
    }

    /**
     * Configura los controles de la playlist
     */
    setupPlaylistControls() {
        // Agregar archivos
        this.elements.addFileBtn.addEventListener('click', async () => {
            if (this.onAddFiles) this.onAddFiles();
        });
    }

    /**
     * Actualiza el estado del botón de reproducción
     */
    setPlayState(isPlaying) {
        if (isPlaying) {
            this.elements.playBtn.classList.add('playing');
        } else {
            this.elements.playBtn.classList.remove('playing');
        }
    }

    /**
     * Actualiza la barra de progreso
     */
    updateProgress(currentTime, duration) {
        if (duration > 0) {
            const percent = (currentTime / duration) * 100;
            this.elements.progressBar.value = percent;
            this.elements.progressBar.style.setProperty('--progress', `${percent}%`);
        }

        this.elements.timeCurrent.textContent = this.formatTime(currentTime);
        this.elements.timeTotal.textContent = this.formatTime(duration);
    }

    /**
     * Actualiza la información del track actual
     */
    updateNowPlaying(track) {
        const titleEl = this.elements.nowPlaying.querySelector('.track-title');
        const artistEl = this.elements.nowPlaying.querySelector('.track-artist');

        if (track) {
            titleEl.textContent = track.title || 'Sin título';
            artistEl.textContent = track.artist || '';
        } else {
            titleEl.textContent = 'Sin reproducción';
            artistEl.textContent = '';
        }
    }

    /**
     * Formatea segundos a MM:SS
     */
    formatTime(seconds) {
        if (!seconds || !isFinite(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    /**
     * Muestra un mensaje de error
     */
    showError(message) {
        console.error(message);
    }

    /**
     * Muestra un mensaje de carga
     */
    showLoading(show) {
        // Indicador de carga si es necesario
    }
}

// Exportar como variable global
window.UIModule = UIModule;
