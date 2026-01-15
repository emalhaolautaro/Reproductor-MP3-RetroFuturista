/**
 * VisualizerModule - Módulo de Visualización de Audio
 * 
 * Renderiza barras estilo LED matrix con segmentos individuales
 * que cambian de color según la altura, estilo futurista.
 */
class VisualizerModule {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.audioModule = null;

        this.animationId = null;
        this.isRunning = false;

        // Configuración visual - estilo LED matrix
        this.config = {
            barCount: 32,           // Número de barras
            segmentHeight: 6,       // Altura de cada segmento LED
            segmentGap: 2,          // Espacio entre segmentos
            barWidth: 12,           // Ancho de cada barra
            barGap: 6,              // Espacio entre barras
            smoothing: 0.7,
            maxSegments: 20,        // Máximo de segmentos por barra
            // Colores futuristas - paleta cyan/magenta/púrpura
            colors: [
                '#06b6d4', // Cyan (base)
                '#22d3ee', // Cyan claro
                '#67e8f9', // Cyan más claro
                '#a855f7', // Púrpura
                '#c084fc', // Púrpura claro
                '#e879f9', // Magenta
                '#f0abfc', // Rosa claro
                '#ffffff', // Blanco (pico)
            ]
        };

        // Datos suavizados
        this.smoothedData = [];
        // Picos que caen lentamente
        this.peaks = [];

        this.init();
    }

    /**
     * Inicializa el canvas y ajusta al tamaño
     */
    init() {
        this.resize();
        window.addEventListener('resize', () => this.resize());

        // Inicializar peaks
        for (let i = 0; i < this.config.barCount; i++) {
            this.peaks[i] = 0;
        }
    }

    /**
     * Ajusta el tamaño del canvas al contenedor
     */
    resize() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        this.canvas.width = rect.width * window.devicePixelRatio;
        this.canvas.height = rect.height * window.devicePixelRatio;
        this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

        this.width = rect.width;
        this.height = rect.height;

        // Recalcular configuración basada en el tamaño
        const totalBarWidth = this.config.barWidth + this.config.barGap;
        this.config.barCount = Math.floor(this.width / totalBarWidth);
        this.config.maxSegments = Math.floor((this.height * 0.7) / (this.config.segmentHeight + this.config.segmentGap));
    }

    /**
     * Conecta el módulo de audio
     */
    connectAudio(audioModule) {
        this.audioModule = audioModule;
    }

    /**
     * Inicia la animación del visualizador
     */
    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.animate();
    }

    /**
     * Detiene la animación
     */
    stop() {
        this.isRunning = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    /**
     * Loop de animación principal
     */
    animate() {
        if (!this.isRunning) return;

        this.render();
        this.animationId = requestAnimationFrame(() => this.animate());
    }

    /**
     * Renderiza un frame del visualizador
     */
    render() {
        // Limpiar canvas
        this.ctx.clearRect(0, 0, this.width, this.height);

        // Obtener datos de frecuencia
        let frequencyData;
        if (this.audioModule) {
            frequencyData = this.audioModule.getFrequencyData();
        }

        if (!frequencyData || frequencyData.length === 0 || !this.audioModule?.isPlaying) {
            this.renderIdleState();
            return;
        }

        // Suavizar datos
        this.smoothData(frequencyData);

        // Renderizar barras LED
        this.renderLEDBars();
    }

    /**
     * Suaviza los datos de frecuencia con distribución logarítmica
     * para que las barras se vean más balanceadas
     */
    smoothData(frequencyData) {
        const dataLength = frequencyData.length;

        if (this.smoothedData.length !== this.config.barCount) {
            this.smoothedData = new Array(this.config.barCount).fill(0);
            this.peaks = new Array(this.config.barCount).fill(0);
        }

        // Usar escala logarítmica para distribuir las frecuencias
        // Esto da más peso a las frecuencias medias y altas
        for (let i = 0; i < this.config.barCount; i++) {
            // Escala logarítmica: las barras de la derecha cubren más rango de frecuencias
            const logScale = Math.pow(i / this.config.barCount, 1.5);
            const startIndex = Math.floor(logScale * dataLength * 0.8);
            const endIndex = Math.floor(Math.pow((i + 1) / this.config.barCount, 1.5) * dataLength * 0.8);

            // Promediar las frecuencias en este rango
            let sum = 0;
            let count = 0;
            for (let j = startIndex; j < endIndex && j < dataLength; j++) {
                sum += frequencyData[j];
                count++;
            }

            const value = count > 0 ? sum / count : 0;

            // Aplicar un boost a las frecuencias altas que normalmente tienen menos energía
            const boostFactor = 1 + (i / this.config.barCount) * 0.8;
            const boostedValue = Math.min(255, value * boostFactor);

            // Suavizado
            this.smoothedData[i] = this.smoothedData[i] * this.config.smoothing +
                boostedValue * (1 - this.config.smoothing);

            // Actualizar picos
            const currentLevel = this.smoothedData[i];
            if (currentLevel > this.peaks[i]) {
                this.peaks[i] = currentLevel;
            } else {
                // Los picos caen lentamente
                this.peaks[i] = Math.max(0, this.peaks[i] - 2);
            }
        }
    }

    /**
     * Obtiene el color para un segmento basado en su posición
     */
    getSegmentColor(segmentIndex, totalSegments, barIndex) {
        const ratio = segmentIndex / totalSegments;
        const colors = this.config.colors;

        // Variación por barra para dar más vida
        const offset = (barIndex % 3) * 0.1;
        const adjustedRatio = Math.min(1, ratio + offset);

        const colorIndex = Math.floor(adjustedRatio * (colors.length - 1));
        return colors[Math.min(colorIndex, colors.length - 1)];
    }

    /**
     * Renderiza las barras estilo LED
     */
    renderLEDBars() {
        const totalBarWidth = this.config.barWidth + this.config.barGap;
        const totalWidth = this.config.barCount * totalBarWidth;
        const startX = (this.width - totalWidth) / 2;

        // Base Y (desde abajo)
        const baseY = this.height * 0.85;

        for (let i = 0; i < this.config.barCount; i++) {
            const value = this.smoothedData[i];
            const numSegments = Math.floor((value / 255) * this.config.maxSegments);
            const peakSegment = Math.floor((this.peaks[i] / 255) * this.config.maxSegments);

            const x = startX + i * totalBarWidth;

            // Dibujar segmentos activos
            for (let s = 0; s < numSegments; s++) {
                const segmentY = baseY - (s * (this.config.segmentHeight + this.config.segmentGap));

                // Color basado en la posición del segmento
                const color = this.getSegmentColor(s, this.config.maxSegments, i);

                // Glow para segmentos superiores
                if (s > numSegments * 0.7) {
                    this.ctx.shadowBlur = 8;
                    this.ctx.shadowColor = color;
                } else {
                    this.ctx.shadowBlur = 3;
                    this.ctx.shadowColor = color;
                }

                this.ctx.fillStyle = color;
                this.ctx.beginPath();
                this.ctx.roundRect(x, segmentY - this.config.segmentHeight, this.config.barWidth, this.config.segmentHeight, 1);
                this.ctx.fill();
            }

            // Dibujar indicador de pico (el segmento más alto que cae)
            if (peakSegment > numSegments && peakSegment > 0) {
                const peakY = baseY - (peakSegment * (this.config.segmentHeight + this.config.segmentGap));

                this.ctx.shadowBlur = 6;
                this.ctx.shadowColor = '#ffffff';
                this.ctx.fillStyle = '#ffffff';
                this.ctx.beginPath();
                this.ctx.roundRect(x, peakY - this.config.segmentHeight, this.config.barWidth, this.config.segmentHeight, 1);
                this.ctx.fill();
            }

            // Dibujar segmentos apagados (tenues) para dar efecto de matriz
            this.ctx.shadowBlur = 0;
            for (let s = numSegments; s < this.config.maxSegments; s++) {
                if (s === peakSegment) continue; // Saltar el pico
                const segmentY = baseY - (s * (this.config.segmentHeight + this.config.segmentGap));

                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
                this.ctx.beginPath();
                this.ctx.roundRect(x, segmentY - this.config.segmentHeight, this.config.barWidth, this.config.segmentHeight, 1);
                this.ctx.fill();
            }
        }

        this.ctx.shadowBlur = 0;
    }

    /**
     * Renderiza estado inactivo
     */
    renderIdleState() {
        const totalBarWidth = this.config.barWidth + this.config.barGap;
        const totalWidth = this.config.barCount * totalBarWidth;
        const startX = (this.width - totalWidth) / 2;
        const baseY = this.height * 0.85;
        const time = Date.now() / 1000;

        for (let i = 0; i < this.config.barCount; i++) {
            const x = startX + i * totalBarWidth;

            // Onda suave
            const wave = Math.sin(time * 1.5 + i * 0.2) * 0.5 + 0.5;
            const numSegments = Math.floor(wave * 4) + 1;

            for (let s = 0; s < numSegments; s++) {
                const segmentY = baseY - (s * (this.config.segmentHeight + this.config.segmentGap));

                this.ctx.fillStyle = 'rgba(6, 182, 212, 0.4)';
                this.ctx.beginPath();
                this.ctx.roundRect(x, segmentY - this.config.segmentHeight, this.config.barWidth, this.config.segmentHeight, 1);
                this.ctx.fill();
            }

            // Segmentos apagados
            for (let s = numSegments; s < this.config.maxSegments; s++) {
                const segmentY = baseY - (s * (this.config.segmentHeight + this.config.segmentGap));

                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
                this.ctx.beginPath();
                this.ctx.roundRect(x, segmentY - this.config.segmentHeight, this.config.barWidth, this.config.segmentHeight, 1);
                this.ctx.fill();
            }
        }
    }

    /**
     * Actualiza la configuración
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
    }

    /**
     * Limpia recursos
     */
    destroy() {
        this.stop();
        window.removeEventListener('resize', this.resize);
    }
}

// Exportar como variable global
window.VisualizerModule = VisualizerModule;
