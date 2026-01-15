/**
 * PlaylistModule - Módulo de Lista de Reproducción
 * 
 * Maneja la lista de reproducción con archivos locales.
 */
class PlaylistModule {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.tracks = [];
        this.currentIndex = -1;

        // Callbacks
        this.onTrackSelect = null;
        this.onPlaylistChange = null;
    }

    /**
     * Agrega un track local a la playlist
     */
    addLocalTrack(filePath) {
        const track = {
            id: this.generateId(),
            type: 'local',
            path: filePath,
            title: this.extractFileName(filePath),
            duration: null
        };

        this.tracks.push(track);
        this.renderPlaylist();

        if (this.onPlaylistChange) {
            this.onPlaylistChange(this.tracks);
        }

        return track;
    }

    /**
     * Elimina un track de la playlist
     */
    removeTrack(trackId) {
        const index = this.tracks.findIndex(t => t.id === trackId);
        if (index !== -1) {
            this.tracks.splice(index, 1);

            // Ajustar índice actual si es necesario
            if (index < this.currentIndex) {
                this.currentIndex--;
            } else if (index === this.currentIndex) {
                this.currentIndex = -1;
            }

            this.renderPlaylist();

            if (this.onPlaylistChange) {
                this.onPlaylistChange(this.tracks);
            }
        }
    }

    /**
     * Selecciona un track para reproducir
     */
    selectTrack(trackId) {
        const index = this.tracks.findIndex(t => t.id === trackId);
        if (index !== -1) {
            this.currentIndex = index;
            this.renderPlaylist();

            if (this.onTrackSelect) {
                this.onTrackSelect(this.tracks[index]);
            }
        }
    }

    /**
     * Obtiene el track actual
     */
    getCurrentTrack() {
        if (this.currentIndex >= 0 && this.currentIndex < this.tracks.length) {
            return this.tracks[this.currentIndex];
        }
        return null;
    }

    /**
     * Avanza al siguiente track
     */
    nextTrack() {
        if (this.tracks.length === 0) return null;

        this.currentIndex = (this.currentIndex + 1) % this.tracks.length;
        const track = this.tracks[this.currentIndex];
        this.renderPlaylist();

        if (this.onTrackSelect) {
            this.onTrackSelect(track);
        }

        return track;
    }

    /**
     * Retrocede al track anterior
     */
    previousTrack() {
        if (this.tracks.length === 0) return null;

        this.currentIndex = this.currentIndex <= 0
            ? this.tracks.length - 1
            : this.currentIndex - 1;
        const track = this.tracks[this.currentIndex];
        this.renderPlaylist();

        if (this.onTrackSelect) {
            this.onTrackSelect(track);
        }

        return track;
    }

    /**
     * Renderiza la playlist en el DOM
     */
    renderPlaylist() {
        this.container.innerHTML = '';

        if (this.tracks.length === 0) {
            this.container.innerHTML = `
                <li class="playlist-empty">
                    <span>No hay canciones</span>
                    <span class="hint">Agrega archivos de audio</span>
                </li>
            `;
            return;
        }

        this.tracks.forEach((track, index) => {
            const isActive = index === this.currentIndex;
            const li = document.createElement('li');
            li.className = `playlist-item${isActive ? ' active' : ''}`;
            li.dataset.trackId = track.id;

            const icon = '<svg viewBox="0 0 24 24"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>';

            const duration = track.duration
                ? this.formatTime(track.duration)
                : '';

            li.innerHTML = `
                <div class="item-icon">${icon}</div>
                <div class="item-info">
                    <span class="item-title">${track.title}</span>
                    <span class="item-duration">${duration}</span>
                </div>
                <button class="item-remove" data-track-id="${track.id}">
                    <svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
                </button>
            `;

            // Click para seleccionar track
            li.addEventListener('click', (e) => {
                if (!e.target.closest('.item-remove')) {
                    this.selectTrack(track.id);
                }
            });

            // Click para eliminar
            li.querySelector('.item-remove').addEventListener('click', () => {
                this.removeTrack(track.id);
            });

            this.container.appendChild(li);
        });
    }

    /**
     * Genera un ID único
     */
    generateId() {
        return 'track_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Extrae el nombre del archivo de una ruta
     */
    extractFileName(filePath) {
        const parts = filePath.replace(/\\/g, '/').split('/');
        const fileName = parts[parts.length - 1];
        return fileName.replace(/\.[^/.]+$/, '');
    }

    /**
     * Formatea segundos a MM:SS
     */
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    /**
     * Limpia la playlist
     */
    clear() {
        this.tracks = [];
        this.currentIndex = -1;
        this.renderPlaylist();
    }
}

// Exportar como variable global
window.PlaylistModule = PlaylistModule;
