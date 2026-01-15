/**
 * AudioModule - Módulo de Reproducción de Audio
 * 
 * Maneja toda la lógica de reproducción de audio utilizando Web Audio API.
 * Proporciona controles de reproducción y expone el AnalyserNode para el visualizador.
 */
class AudioModule {
    constructor() {
        this.audioContext = null;
        this.analyser = null;
        this.sourceNode = null;
        this.gainNode = null;
        this.audioElement = null;
        this.isSourceConnected = false;

        this.isPlaying = false;
        this.currentTrack = null;

        this.onPlayStateChange = null;
        this.onTimeUpdate = null;
        this.onTrackEnd = null;
        this.onError = null;

        this.init();
    }

    /**
     * Inicializa el contexto de audio y los nodos
     */
    init() {
        // Crear elemento de audio
        this.audioElement = new Audio();
        this.audioElement.preload = 'auto';

        // Event listeners
        this.audioElement.addEventListener('timeupdate', () => {
            if (this.onTimeUpdate) {
                this.onTimeUpdate(this.audioElement.currentTime, this.audioElement.duration);
            }
        });

        this.audioElement.addEventListener('ended', () => {
            console.log('Audio terminado');
            this.isPlaying = false;
            if (this.onPlayStateChange) this.onPlayStateChange(false);
            if (this.onTrackEnd) this.onTrackEnd();
        });

        this.audioElement.addEventListener('error', (e) => {
            const error = this.audioElement.error;
            let errorMsg = 'Error desconocido';
            if (error) {
                switch (error.code) {
                    case MediaError.MEDIA_ERR_ABORTED:
                        errorMsg = 'Reproducción cancelada';
                        break;
                    case MediaError.MEDIA_ERR_NETWORK:
                        errorMsg = 'Error de red al cargar audio';
                        break;
                    case MediaError.MEDIA_ERR_DECODE:
                        errorMsg = 'Error al decodificar audio';
                        break;
                    case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
                        errorMsg = 'Formato de audio no soportado';
                        break;
                }
            }
            console.error('Error de audio:', errorMsg, error);
            this.isPlaying = false;
            if (this.onPlayStateChange) this.onPlayStateChange(false);
            if (this.onError) this.onError(new Error(errorMsg));
        });

        this.audioElement.addEventListener('canplay', () => {
            console.log('Audio listo para reproducir');
        });

        this.audioElement.addEventListener('playing', () => {
            console.log('Reproduciendo...');
            this.isPlaying = true;
            if (this.onPlayStateChange) this.onPlayStateChange(true);
        });

        this.audioElement.addEventListener('pause', () => {
            console.log('Pausado');
            this.isPlaying = false;
            if (this.onPlayStateChange) this.onPlayStateChange(false);
        });
    }

    /**
     * Inicializa Web Audio API (debe llamarse después de interacción del usuario)
     */
    initAudioContext() {
        if (this.audioContext) return;

        console.log('Inicializando AudioContext...');
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

        // Crear AnalyserNode para el visualizador
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 256;
        this.analyser.smoothingTimeConstant = 0.8;

        // Crear GainNode para control de volumen
        this.gainNode = this.audioContext.createGain();

        // Inicializar ecualizador (5 bandas)
        this.equalizerBands = [60, 310, 1000, 3000, 12000];
        this.equalizerNodes = this.equalizerBands.map(freq => {
            const filter = this.audioContext.createBiquadFilter();
            filter.type = 'peaking';
            filter.frequency.value = freq;
            filter.Q.value = 1;
            filter.gain.value = 0;
            return filter;
        });

        // Conectar cadena de nodos: Source -> [Eq1 -> Eq2... -> Eq5] -> Analyser -> Gain -> Destination

        // Conectar filtros en serie
        const inputEq = this.equalizerNodes[0];
        const outputEq = this.equalizerNodes[this.equalizerNodes.length - 1];

        this.equalizerNodes.reduce((prev, curr) => {
            if (prev) prev.connect(curr);
            return curr;
        });

        // Conectar último filtro al analyser
        outputEq.connect(this.analyser);
        this.analyser.connect(this.gainNode);
        this.gainNode.connect(this.audioContext.destination);

        // Conectar el elemento de audio al contexto UNA SOLA VEZ
        try {
            this.sourceNode = this.audioContext.createMediaElementSource(this.audioElement);
            // Conectar source al primer filtro del EQ
            this.sourceNode.connect(inputEq);
            this.isSourceConnected = true;
            console.log('SourceNode conectado al Ecualizador');
        } catch (e) {
            console.log('Error conectando SourceNode:', e.message);
        }

        console.log('AudioContext inicializado con Ecualizador');
    }

    /**
     * Establece la ganancia de una banda del ecualizador
     * @param {number} index Índice de la banda (0-4)
     * @param {number} value Valor de ganancia en dB (-12 a 12)
     */
    setEqualizerBand(index, value) {
        if (this.equalizerNodes && this.equalizerNodes[index]) {
            this.equalizerNodes[index].gain.value = value;
        }
    }

    /**
     * Carga un archivo de audio local
     */
    async loadLocalFile(filePath) {
        console.log('Cargando archivo local:', filePath);

        // Pausar si estaba reproduciendo
        this.audioElement.pause();

        // Convertir ruta de archivo a URL file://
        const fileUrl = `file://${filePath.replace(/\\/g, '/')}`;

        this.currentTrack = {
            type: 'local',
            path: filePath,
            title: this.extractFileName(filePath)
        };

        // Cambiar la fuente
        this.audioElement.src = fileUrl;

        // Inicializar contexto si no existe
        this.initAudioContext();

        // Esperar a que esté listo
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                cleanup();
                reject(new Error('Timeout al cargar archivo'));
            }, 10000);

            const onCanPlay = () => {
                cleanup();
                console.log('Archivo cargado:', this.currentTrack.title);
                resolve(this.currentTrack);
            };

            const onError = () => {
                cleanup();
                reject(new Error('Error al cargar archivo'));
            };

            const cleanup = () => {
                clearTimeout(timeout);
                this.audioElement.removeEventListener('canplaythrough', onCanPlay);
                this.audioElement.removeEventListener('error', onError);
            };

            this.audioElement.addEventListener('canplaythrough', onCanPlay, { once: true });
            this.audioElement.addEventListener('error', onError, { once: true });
        });
    }

    /**
     * Reproduce el audio
     */
    async play() {
        if (!this.audioElement.src) {
            console.log('No hay fuente de audio');
            return;
        }

        this.initAudioContext();

        // Reanudar contexto si está suspendido
        if (this.audioContext && this.audioContext.state === 'suspended') {
            console.log('Reanudando AudioContext...');
            await this.audioContext.resume();
        }

        try {
            console.log('Iniciando reproducción...');
            await this.audioElement.play();
            console.log('Reproducción iniciada');
        } catch (error) {
            console.error('Error al reproducir:', error);
            if (this.onError) this.onError(error);
        }
    }

    /**
     * Pausa el audio
     */
    pause() {
        this.audioElement.pause();
    }

    /**
     * Alterna entre play y pause
     */
    togglePlay() {
        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }

    /**
     * Busca una posición específica en el audio
     */
    seek(time) {
        if (this.audioElement.duration && isFinite(this.audioElement.duration)) {
            this.audioElement.currentTime = Math.max(0, Math.min(time, this.audioElement.duration));
        }
    }

    /**
     * Busca por porcentaje (0-100)
     */
    seekPercent(percent) {
        if (this.audioElement.duration && isFinite(this.audioElement.duration)) {
            const time = (percent / 100) * this.audioElement.duration;
            this.seek(time);
        }
    }

    /**
     * Establece el volumen (0-1)
     */
    setVolume(volume) {
        const normalizedVolume = Math.max(0, Math.min(1, volume));
        this.audioElement.volume = normalizedVolume;
        if (this.gainNode) {
            this.gainNode.gain.value = normalizedVolume;
        }
    }

    /**
     * Obtiene los datos de frecuencia para el visualizador
     */
    getFrequencyData() {
        if (!this.analyser) return new Uint8Array(0);

        const bufferLength = this.analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        this.analyser.getByteFrequencyData(dataArray);
        return dataArray;
    }

    /**
     * Obtiene los datos de forma de onda
     */
    getWaveformData() {
        if (!this.analyser) return new Uint8Array(0);

        const bufferLength = this.analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        this.analyser.getByteTimeDomainData(dataArray);
        return dataArray;
    }

    /**
     * Obtiene el tiempo actual
     */
    getCurrentTime() {
        return this.audioElement.currentTime;
    }

    /**
     * Obtiene la duración total
     */
    getDuration() {
        return this.audioElement.duration || 0;
    }

    /**
     * Extrae el nombre del archivo de una ruta
     */
    extractFileName(filePath) {
        const parts = filePath.replace(/\\/g, '/').split('/');
        const fileName = parts[parts.length - 1];
        return fileName.replace(/\.[^/.]+$/, ''); // Quitar extensión
    }

    /**
     * Limpia recursos
     */
    destroy() {
        this.pause();
        if (this.audioContext) {
            this.audioContext.close();
        }
    }
}

// Exportar como variable global para uso sin módulos ES6
window.AudioModule = AudioModule;
