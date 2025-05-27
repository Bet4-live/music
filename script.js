// Supabase Configuration
const SUPABASE_URL = 'https://skhbykqwdbwjcvqmwvft.supabase.co'; // Replace with your URL
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNraGJ5a3F3ZGJ3amN2cW13dmZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU3Nzg0NDYsImV4cCI6MjA2MTM1NDQ0Nn0.e8pbfF7O_rTtSKxtFzzc_zZTsegsxsNaluHNFBbWbMs'; // Replace with your key
let supabaseClient;

document.addEventListener('DOMContentLoaded', async () => {
    if (!window.supabase) {
        alert('Supabase kütüphanesi yüklenemedi.');
        return;
    }
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // DOM Elements
    const elements = {
        musicListDesktop: document.getElementById('musicListDesktop'),
        musicListMobile: document.getElementById('musicListMobile'),
        audioPlayer: document.getElementById('audioPlayer'),
        coverImage: document.getElementById('coverImage'),
        deleteSelect: document.getElementById('deleteSelect'),
        adminButton: document.getElementById('adminButton'),
        adminPanelDiv: document.getElementById('adminPanel'),
        adminControlsDiv: document.getElementById('adminControls'),
        loginForm: document.getElementById('loginForm'),
        songCountDesktop: document.getElementById('songCountDesktop'),
        currentSongTitleElement: document.getElementById('currentSongTitle'),
        playPauseBtn: document.getElementById('playPauseBtn'),
        playPauseIcon: document.querySelector('#playPauseBtn i'),
        prevBtn: document.getElementById('prevBtn'),
        nextBtn: document.getElementById('nextBtn'),
        seekBar: document.getElementById('seekBar'),
        currentTimeSpan: document.getElementById('currentTime'),
        totalDurationSpan: document.getElementById('totalDuration'),
        volumeBar: document.getElementById('volumeBar'),
        volumeIcon: document.getElementById('volumeIcon'),
        searchButton: document.getElementById('searchButton'),
        searchOverlay: document.getElementById('searchOverlay'),
        closeSearchBtn: document.getElementById('closeSearchBtn'),
        searchInput: document.getElementById('searchInput'),
        searchResultsContainer: document.getElementById('searchResults'),
        upcomingSongsContainer: document.getElementById('upcomingSongsContainer'),
        scrollLeftUpcoming: document.getElementById('scrollLeftUpcoming'),
        scrollRightUpcoming: document.getElementById('scrollRightUpcoming'),
        mobileMenuBtn: document.getElementById('mobileMenuBtn'),
        closeMobileListBtn: document.getElementById('closeMobileListBtn'),
        closeAdminPanelBtn: document.getElementById('closeAdminPanelBtn'),
        authEmailInput: document.getElementById('authEmail'),
        authPassInput: document.getElementById('authPass'),
        signInBtn: document.getElementById('signInBtn'),
        signOutBtn: document.getElementById('signOutBtn'),
        loggedInUserEmailSpan: document.getElementById('loggedInUserEmail'),
        addMusicBtn: document.getElementById('addMusicBtn'),
        deleteMusicBtn: document.getElementById('deleteMusicBtn'),
        loadingOverlay: document.getElementById('loadingOverlay'),
        uploadProgress: document.getElementById('uploadProgress')
    };

    // State
    const state = {
        defaultCover: 'https://placehold.co/300x300/e2e8f0/94a3b8?text=Müzik+Seçin',
        currentMusicId: null,
        currentMusicIndex: -1,
        musicData: [],
        lastVolume: 1
    };

    // Utility Functions
    const utils = {
        formatTime(seconds) {
            if (isNaN(seconds) || seconds < 0) return '0:00';
            const minutes = Math.floor(seconds / 60);
            const secs = Math.floor(seconds % 60);
            return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
        },
        showLoading() {
            elements.loadingOverlay.classList.add('flex');
            elements.loadingOverlay.classList.remove('hidden');
        },
        hideLoading() {
            elements.loadingOverlay.classList.add('hidden');
            elements.loadingOverlay.classList.remove('flex');
        }
    };

    // Player Controls
    const player = {
        updateUI() {
            const hasMultipleSongs = state.musicData.length > 1;
            elements.prevBtn.disabled = !hasMultipleSongs;
            elements.nextBtn.disabled = !hasMultipleSongs;
            elements.playPauseIcon.className = elements.audioPlayer.paused ? 'fa fa-play fa-lg' : 'fa fa-pause fa-lg';
            if (!state.currentMusicId) {
                elements.currentTimeSpan.textContent = '0:00';
                elements.totalDurationSpan.textContent = '0:00';
                elements.seekBar.value = 0;
                elements.seekBar.style.setProperty('--progress', '0%');
                elements.seekBar.disabled = true;
                elements.currentSongTitleElement.textContent = 'Müzik Seçin';
            } else {
                elements.seekBar.disabled = false;
            }
        },
        togglePlayPause() {
            if (!elements.audioPlayer.src || !state.currentMusicId) return;
            elements.audioPlayer.paused ? elements.audioPlayer.play() : elements.audioPlayer.pause();
        },
        updateSeekBar() {
            if (elements.audioPlayer.duration) {
                const percentage = (elements.audioPlayer.currentTime / elements.audioPlayer.duration) * 100;
                elements.seekBar.value = percentage;
                elements.seekBar.style.setProperty('--progress', `${percentage}%`);
                elements.currentTimeSpan.textContent = utils.formatTime(elements.audioPlayer.currentTime);
            }
        },
        setDuration() {
            elements.totalDurationSpan.textContent = utils.formatTime(elements.audioPlayer.duration || 0);
        },
        seek() {
            if (!elements.audioPlayer.duration) return;
            elements.audioPlayer.currentTime = (elements.seekBar.value / 100) * elements.audioPlayer.duration;
        },
        changeVolume() {
            elements.audioPlayer.volume = elements.volumeBar.value;
            elements.volumeIcon.className = `fa fa-volume-${elements.audioPlayer.volume === 0 ? 'xmark' : elements.audioPlayer.volume < 0.5 ? 'low' : 'high'} text-gray-600 hover:text-gray-900 cursor-pointer w-5 text-center`;
            if (elements.audioPlayer.volume > 0) state.lastVolume = elements.audioPlayer.volume;
        },
        toggleMute() {
            if (elements.audioPlayer.volume > 0) {
                state.lastVolume = elements.audioPlayer.volume;
                elements.audioPlayer.volume = 0;
                elements.volumeBar.value = 0;
            } else {
                elements.audioPlayer.volume = state.lastVolume;
                elements.volumeBar.value = state.lastVolume;
            }
            this.changeVolume();
        },
        loadAndPlayMusic(index) {
            if (index < 0 || index >= state.musicData.length) {
                elements.audioPlayer.pause();
                elements.audioPlayer.src = '';
                elements.coverImage.src = state.defaultCover;
                state.currentMusicId = null;
                state.currentMusicIndex = -1;
                elements.currentSongTitleElement.textContent = 'Müzik Seçin';
                this.updateUI();
                return;
            }
            const music = state.musicData[index];
            elements.audioPlayer.src = music.audio_url;
            elements.coverImage.src = music.image_url || state.defaultCover;
            state.currentMusicId = music.id;
            state.currentMusicIndex = index;
            elements.currentSongTitleElement.textContent = music.name;
            document.querySelectorAll('.music-item, .upcoming-song-item').forEach(item => {
                const isSelected = item.dataset.id === state.currentMusicId.toString();
                item.classList.toggle('bg-indigo-600', isSelected && item.classList.contains('music-item'));
                item.classList.toggle('bg-gray-800', !isSelected && item.classList.contains('music-item'));
                item.classList.toggle('ring-2 ring-indigo-500 bg-indigo-100 text-indigo-800', isSelected && item.classList.contains('upcoming-song-item'));
                if (isSelected) item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            });
            elements.audioPlayer.play().catch(() => elements.playPauseIcon.className = 'fa fa-play fa-lg');
            this.updateUI();
        },
        playNext() {
            if (!state.musicData.length) return;
            this.loadAndPlayMusic((state.currentMusicIndex + 1) % state.musicData.length);
        },
        playPrevious() {
            if (!state.musicData.length) return;
            if (elements.audioPlayer.currentTime > 3 && state.currentMusicIndex !== -1) {
                elements.audioPlayer.currentTime = 0;
                elements.audioPlayer.play();
            } else {
                this.loadAndPlayMusic((state.currentMusicIndex - 1 + state.musicData.length) % state.musicData.length);
            }
        }
    };

    // Music Management
    const music = {
        async renderMusics() {
            utils.showLoading();
            elements.musicListDesktop.innerHTML = '';
            elements.musicListMobile.innerHTML = '';
            elements.deleteSelect.innerHTML = '<option value="" disabled selected>Silmek için seçin...</option>';
            state.musicData = [];
            try {
                const { data, error } = await supabaseClient.from('musics').select('id, name, audio_url, image_url').order('created_at', { ascending: false });
                if (error) throw new Error(error.message);
                state.musicData = data || [];
                elements.songCountDesktop.textContent = `${state.musicData.length} Şarkı`;
                if (!state.musicData.length) {
                    const msg = '<p class="text-gray-400 text-center mt-4">Henüz müzik eklenmemiş.</p>';
                    elements.musicListDesktop.innerHTML = msg;
                    elements.musicListMobile.innerHTML = msg;
                    if (state.currentMusicId) player.loadAndPlayMusic(-1);
                    this.renderUpcomingSongs();
                    return;
                }
                state.currentMusicIndex = state.musicData.findIndex(m => m.id === state.currentMusicId);
                if (state.currentMusicIndex === -1 && state.currentMusicId) player.loadAndPlayMusic(-1);
                state.musicData.forEach((m, i) => {
                    const item = (mobile = false) => {
                        const div = document.createElement('div');
                        div.className = `music-item flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all transform hover:scale-[1.03] ${m.id === state.currentMusicId ? 'bg-indigo-600' : 'bg-gray-800 hover:bg-indigo-700'}`;
                        div.dataset.id = m.id;
                        div.innerHTML = `<img src="${m.image_url || 'https://placehold.co/60x60/7f9cf5/ffffff?text=♪'}" alt="Kapak" class="w-12 h-12 rounded-md object-cover flex-shrink-0"><span class="font-medium truncate flex-grow">${m.name}</span>`;
                        div.onclick = () => { player.loadAndPlayMusic(i); if (mobile) elements.mobileMusicListModal.classList.remove('open'); };
                        return div;
                    };
                    elements.musicListDesktop.appendChild(item());
                    elements.musicListMobile.appendChild(item(true));
                    elements.deleteSelect.appendChild(new Option(m.name, m.id));
                });
                this.renderUpcomingSongs();
            } catch (error) {
                const msg = `<p class="text-red-400 text-center mt-4">Hata: ${error.message}</p>`;
                elements.musicListDesktop.innerHTML = msg;
                elements.musicListMobile.innerHTML = msg;
            } finally {
                utils.hideLoading();
                player.updateUI();
            }
        },
        renderUpcomingSongs() {
            elements.upcomingSongsContainer.innerHTML = state.musicData.length ? '' : '<p class="text-gray-600 text-center w-full">Henüz müzik yok.</p>';
            state.musicData.slice(0, 10).forEach(m => {
                const div = document.createElement('div');
                div.className = 'upcoming-song-item snap-start';
                div.dataset.id = m.id;
                div.innerHTML = `<img src="${m.image_url || 'https://placehold.co/120x120/7f9cf5/ffffff?text=♪'}" alt="Kapak"><div class="song-title">${m.name}</div>`;
                div.onclick = () => player.loadAndPlayMusic(state.musicData.findIndex(item => item.id === m.id));
                elements.upcomingSongsContainer.appendChild(div);
            });
            if (state.currentMusicId) {
                document.querySelectorAll('.upcoming-song-item').forEach(item => {
                    const isSelected = item.dataset.id === state.currentMusicId.toString();
                    item.classList.toggle('ring-2 ring-indigo-500 bg-indigo-100 text-indigo-800', isSelected);
                });
            }
        },
        async addMusic() {
            const user = await supabaseClient.auth.getUser();
            if (!user.data.user) {
                alert('Giriş yapmalısınız.');
                return;
            }
            const name = document.getElementById('musicName').value.trim();
            const audioFile = document.getElementById('musicFile').files[0];
            const imageFile = document.getElementById('musicImage').files[0];
            if (!name || !audioFile) {
                alert('Müzik adı ve dosya zorunlu.');
                return;
            }
            elements.addMusicBtn.disabled = true;
            elements.uploadProgress.classList.remove('hidden');
            elements.uploadProgress.querySelector('div').style.width = '0%';
            try {
                const userId = user.data.user.id;
                const audioPath = `public/${userId}/${Date.now()}_${audioFile.name.replace(/\s+/g, '_')}`;
                const { error: audioError } = await supabaseClient.storage.from('music-files').upload(audioPath, audioFile, {
                    onUploadProgress: (progress) => {
                        elements.uploadProgress.querySelector('div').style.width = `${progress * 100}%`;
                    }
                });
                if (audioError) throw new Error(audioError.message);
                const audioUrl = supabaseClient.storage.from('music-files').getPublicUrl(audioPath).data.publicUrl;
                let imageUrl = null;
                if (imageFile) {
                    const imagePath = `public/${userId}/${Date.now()}_${imageFile.name.replace(/\s+/g, '_')}`;
                    const { error: imageError } = await supabaseClient.storage.from('music-files').upload(imagePath, imageFile);
                    if (imageError) throw new Error(imageError.message);
                    imageUrl = supabaseClient.storage.from('music-files').getPublicUrl(imagePath).data.publicUrl;
                }
                const { error: insertError } = await supabaseClient.from('musics').insert([{ name, audio_url: audioUrl, image_url: imageUrl, user_id: userId }]);
                if (insertError) throw new Error(insertError.message);
                await this.renderMusics();
                document.getElementById('musicName').value = '';
                document.getElementById('musicFile').value = '';
                document.getElementById('musicImage').value = '';
                alert('Müzik eklendi!');
            } catch (error) {
                alert(`Hata: ${error.message}`);
            } finally {
                elements.addMusicBtn.disabled = false;
                elements.uploadProgress.classList.add('hidden');
            }
        },
        async deleteMusic() {
            const user = await supabaseClient.auth.getUser();
            if (!user.data.user) {
                alert('Giriş yapmalısınız.');
                return;
            }
            const musicId = elements.deleteSelect.value;
            if (!musicId) {
                alert('Müzik seçin.');
                return;
            }
            if (!confirm(`"${elements.deleteSelect.options[elements.deleteSelect.selectedIndex].text}" silinsin mi?`)) return;
            elements.deleteMusicBtn.disabled = true;
            try {
                const { data: music, error: fetchError } = await supabaseClient.from('musics').select('id, audio_url, image_url, user_id').eq('id', musicId).single();
                if (fetchError) throw new Error(fetchError.message);
                if (music.user_id !== user.data.user.id) {
                    alert('Sadece kendi müziğinizi silebilirsiniz.');
                    return;
                }
                const files = [];
                const baseUrl = `${SUPABASE_URL}/storage/v1/object/public/music-files/`;
                if (music.audio_url.startsWith(baseUrl)) files.push(music.audio_url.substring(baseUrl.length));
                if (music.image_url?.startsWith(baseUrl)) files.push(music.image_url.substring(baseUrl.length));
                const { error: deleteError } = await supabaseClient.from('musics').delete().eq('id', musicId);
                if (deleteError) throw new Error(deleteError.message);
                if (files.length) await supabaseClient.storage.from('music-files').remove(files);
                if (state.currentMusicId === musicId) player.loadAndPlayMusic(-1);
                await this.renderMusics();
                alert('Müzik silindi!');
            } catch (error) {
                alert(`Hata: ${error.message}`);
            } finally {
                elements.deleteMusicBtn.disabled = false;
            }
        }
    };

    // Search Functionality
    const search = {
        toggleOverlay() {
            elements.searchOverlay.classList.toggle('hidden');
            elements.searchOverlay.classList.toggle('flex');
            if (!elements.searchOverlay.classList.contains('hidden')) elements.searchInput.focus();
            else elements.searchResultsContainer.innerHTML = '';
        },
        searchMusics: debounce(() => {
            const query = elements.searchInput.value.toLowerCase();
            elements.searchResultsContainer.innerHTML = '';
            if (!query) return;
            const results = state.musicData.filter(m => m.name.toLowerCase().includes(query));
            if (!results.length) {
                elements.searchResultsContainer.innerHTML = '<p class="text-gray-400 text-center">Müzik bulunamadı.</p>';
                return;
            }
            results.forEach(m => {
                const div = document.createElement('div');
                div.className = 'music-item flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all transform hover:scale-[1.02] bg-gray-700 hover:bg-gray-600';
                div.dataset.id = m.id;
                div.innerHTML = `<img src="${m.image_url || 'https://placehold.co/60x60/7f9cf5/ffffff?text=♪'}" alt="Kapak" class="w-10 h-10 rounded-md object-cover flex-shrink-0"><span class="font-medium text-white truncate flex-grow">${m.name}</span>`;
                div.onclick = () => {
                    player.loadAndPlayMusic(state.musicData.findIndex(item => item.id === m.id));
                    search.toggleOverlay();
                };
                elements.searchResultsContainer.appendChild(div);
            });
        }, 300)
    };

    // Authentication
    const auth = {
        async signIn() {
            const email = elements.authEmailInput.value.trim();
            const password = elements.authPassInput.value.trim();
            if (!email || !password) {
                alert('Email ve şifre gerekli.');
                return;
            }
            elements.signInBtn.disabled = true;
            const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
            elements.signInBtn.disabled = false;
            if (error) alert(`Giriş başarısız: ${error.message}`);
            else {
                elements.authEmailInput.value = '';
                elements.authPassInput.value = '';
            }
        },
        async signOut() {
            elements.signOutBtn.disabled = true;
            const { error } = await supabaseClient.auth.signOut();
            elements.signOutBtn.disabled = false;
            if (error) alert(`Çıkış başarısız: ${error.message}`);
        },
        handleStateChange(event, session) {
            if (session) {
                elements.loginForm.classList.add('hidden');
                elements.adminControlsDiv.classList.remove('hidden');
                elements.loggedInUserEmailSpan.textContent = `Giriş Yapıldı: ${session.user.email}`;
            } else {
                elements.loginForm.classList.remove('hidden');
                elements.adminControlsDiv.classList.add('hidden');
                elements.loggedInUserEmailSpan.textContent = '';
            }
        }
    };

    // Event Listeners
    elements.adminButton.addEventListener('click', () => elements.adminPanelDiv.classList.add('flex'));
    elements.closeAdminPanelBtn.addEventListener('click', () => elements.adminPanelDiv.classList.remove('flex'));
    elements.mobileMenuBtn.addEventListener('click', () => elements.mobileMusicListModal.classList.add('open'));
    elements.closeMobileListBtn.addEventListener('click', () => elements.mobileMusicListModal.classList.remove('open'));
    elements.playPauseBtn.addEventListener('click', player.togglePlayPause);
    elements.audioPlayer.addEventListener('timeupdate', player.updateSeekBar);
    elements.audioPlayer.addEventListener('loadedmetadata', player.setDuration);
    elements.audioPlayer.addEventListener('play', player.updateUI);
    elements.audioPlayer.addEventListener('pause', player.updateUI);
    elements.audioPlayer.addEventListener('ended', player.playNext);
    elements.seekBar.addEventListener('input', player.seek);
    elements.volumeBar.addEventListener('input', player.changeVolume);
    elements.volumeIcon.addEventListener('click', player.toggleMute);
    elements.prevBtn.addEventListener('click', player.playPrevious);
    elements.nextBtn.addEventListener('click', player.playNext);
    elements.searchButton.addEventListener('click', search.toggleOverlay);
    elements.closeSearchBtn.addEventListener('click', search.toggleOverlay);
    elements.searchInput.addEventListener('input', search.searchMusics);
    elements.scrollLeftUpcoming.addEventListener('click', () => elements.upcomingSongsContainer.scrollBy({ left: -180, behavior: 'smooth' }));
    elements.scrollRightUpcoming.addEventListener('click', () => elements.upcomingSongsContainer.scrollBy({ left: 180, behavior: 'smooth' }));
    elements.signInBtn.addEventListener('click', auth.signIn);
    elements.signOutBtn.addEventListener('click', auth.signOut);
    elements.addMusicBtn.addEventListener('click', music.addMusic);
    elements.deleteMusicBtn.addEventListener('click', music.deleteMusic);
    supabaseClient.auth.onAuthStateChange(auth.handleStateChange);

    // Initialization
    elements.coverImage.src = state.defaultCover;
    elements.volumeBar.value = elements.audioPlayer.volume;
    player.changeVolume();
    player.updateUI();
    music.renderMusics();

    // Debounce Utility
    function debounce(func, wait) {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func(...args), wait);
        };
    }
});
