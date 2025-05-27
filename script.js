const SUPABASE_URL = 'https://skhbykqwdbwjcvqmwvft.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNraGJ5a3F3ZGJ3amN2cW13dmZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA3Nzg0NDYsImV4cCI6MjA2MTM1NDQ0Nn0.e8pbfF7O_rTtSKxtFzzc_zZTsegsxsNaluHNFBbWbMs';

document.addEventListener('DOMContentLoaded', async () => {
    if (typeof window.supabase === 'undefined') {
        console.error("Supabase kütüphanesi yüklenemedi.");
        alert("Uygulama başlatılamadı. Lütfen tekrar deneyin.");
        return;
    }

    const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log("Supabase istemcisi oluşturuldu.");

    // DOM Elements
    const elements = {
        musicListDesktop: document.getElementById('musicListDesktop'),
        musicListMobile: document.getElementById('musicListMobile'),
        mobileMusicListModal: document.getElementById('mobileMusicListModal'),
        audioPlayer: document.getElementById('audioPlayer'),
        coverImage: document.getElementById('coverImage'),
        deleteSelect: document.getElementById('deleteSelect'),
        adminButton: document.getElementById('adminButton'),
        adminPanel: document.getElementById('adminPanel'),
        adminControls: document.getElementById('adminControls'),
        loginForm: document.getElementById('loginForm'),
        songCountDesktop: document.getElementById('songCountDesktop'),
        songCountMobile: document.getElementById('songCountMobile'),
        currentSongTitle: document.getElementById('currentSongTitle'),
        authEmail: document.getElementById('authEmail'),
        authPass: document.getElementById('authPass'),
        signInBtn: document.getElementById('signInBtn'),
        signOutBtn: document.getElementById('signOutBtn'),
        loggedInUserEmail: document.getElementById('loggedInUserEmail'),
        playPauseBtn: document.getElementById('playPauseBtn'),
        playPauseIcon: document.getElementById('playPauseBtn').querySelector('i'),
        prevBtn: document.getElementById('prevBtn'),
        nextBtn: document.getElementById('nextBtn'),
        seekBar: document.getElementById('seekBar'),
        currentTime: document.getElementById('currentTime'),
        totalDuration: document.getElementById('totalDuration'),
        volumeBar: document.getElementById('volumeBar'),
        volumeIcon: document.getElementById('volumeIcon'),
        searchBarDesktop: document.getElementById('searchBarDesktop'),
        searchBarMobile: document.getElementById('searchBarMobile'),
        searchTypeDesktop: document.getElementById('searchTypeDesktop'),
        searchTypeMobile: document.getElementById('searchTypeMobile'),
        clearSearchDesktop: document.getElementById('clearSearchDesktop'),
        clearSearchMobile: document.getElementById('clearSearchMobile'),
        closeMobileListBtn: document.getElementById('closeMobileListBtn'),
        closeAdminPanelBtn: document.getElementById('closeAdminPanelBtn'),
        addMusicBtn: document.getElementById('addMusicBtn'),
        deleteMusicBtn: document.getElementById('deleteMusicBtn'),
        musicName: document.getElementById('musicName'),
        musicFile: document.getElementById('musicFile'),
        musicImage: document.getElementById('musicImage'),
        progressRing: document.getElementById('progressRing'),
    };

    // State
    const state = {
        defaultCover: 'https://placehold.co/300x300/e2e8f0/94a3b8?text=Müzik+Seçin',
        currentMusicId: null,
        currentMusicIndex: -1,
        musicData: [],
        lastVolume: 1,
        filteredMusicData: [],
    };

    // Debounce Function for Search
    const debounce = (func, delay) => {
        let timeoutId;
        return (...args) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func(...args), delay);
        };
    };

    // Helper Functions
    const formatTime = (seconds) => {
        if (isNaN(seconds) || seconds < 0 || !isFinite(seconds)) return "0:00";
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const updateVolumeIcon = (volume) => {
        elements.volumeIcon.className = volume === 0
            ? 'fa fa-volume-xmark text-gray-600 hover:text-gray-900 cursor-pointer w-5 text-center'
            : volume < 0.5
                ? 'fa fa-volume-low text-gray-600 hover:text-gray-900 cursor-pointer w-5 text-center'
                : 'fa fa-volume-high text-gray-600 hover:text-gray-900 cursor-pointer w-5 text-center';
    };

    const updatePlayerUIState = () => {
        const hasMultipleSongs = state.musicData.length > 1;
        elements.prevBtn.disabled = !hasMultipleSongs;
        elements.nextBtn.disabled = !hasMultipleSongs;
        elements.playPauseIcon.className = elements.audioPlayer.paused ? 'fa fa-play fa-lg' : 'fa fa-pause fa-lg';
        if (state.currentMusicId === null) {
            elements.currentTime.textContent = "0:00";
            elements.totalDuration.textContent = "0:00";
            elements.seekBar.value = 0;
            elements.seekBar.style.setProperty('--progress', `0%`);
            elements.seekBar.disabled = true;
            elements.currentSongTitle.textContent = "Müzik Seçin";
            elements.progressRing.setAttribute('stroke-dashoffset', '301.6');
        } else {
            elements.seekBar.disabled = false;
        }
    };

    const updateProgressRing = () => {
        if (elements.audioPlayer.duration && isFinite(elements.audioPlayer.duration)) {
            const percentage = (elements.audioPlayer.currentTime / elements.audioPlayer.duration) * 100;
            const circumference = 301.6; // 2 * π * radius (48)
            const offset = circumference * (1 - percentage / 100);
            elements.progressRing.setAttribute('stroke-dashoffset', offset);
        } else {
            elements.progressRing.setAttribute('stroke-dashoffset', '301.6');
        }
    };

    const togglePlayPause = () => {
        if (!elements.audioPlayer.src || state.currentMusicId === null) return;
        if (elements.audioPlayer.paused) {
            elements.audioPlayer.play().catch(e => console.error("Oynatma hatası:", e));
        } else {
            elements.audioPlayer.pause();
        }
    };

    const updateSeekBar = () => {
        if (elements.audioPlayer.duration && isFinite(elements.audioPlayer.duration)) {
            const percentage = (elements.audioPlayer.currentTime / elements.audioPlayer.duration) * 100;
            elements.seekBar.value = percentage;
            elements.seekBar.style.setProperty('--progress', `${percentage}%`);
            elements.currentTime.textContent = formatTime(elements.audioPlayer.currentTime);
            updateProgressRing();
        } else {
            elements.seekBar.value = 0;
            elements.seekBar.style.setProperty('--progress', `0%`);
            elements.currentTime.textContent = formatTime(0);
            elements.progressRing.setAttribute('stroke-dashoffset', '301.6');
        }
    };

    const setDuration = () => {
        if (elements.audioPlayer.duration && isFinite(elements.audioPlayer.duration)) {
            elements.totalDuration.textContent = formatTime(elements.audioPlayer.duration);
            elements.seekBar.value = 0;
            elements.seekBar.style.setProperty('--progress', `0%`);
            elements.currentTime.textContent = formatTime(0);
            elements.progressRing.setAttribute('stroke-dashoffset', '301.6');
        } else {
            elements.totalDuration.textContent = "0:00";
            elements.currentTime.textContent = "0:00";
            elements.seekBar.value = 0;
            elements.seekBar.style.setProperty('--progress', `0%`);
            elements.progressRing.setAttribute('stroke-dashoffset', '301.6');
        }
    };

    const seek = () => {
        if (!elements.audioPlayer.src || !elements.audioPlayer.duration || !isFinite(elements.audioPlayer.duration)) return;
        const time = (elements.seekBar.value / 100) * elements.audioPlayer.duration;
        elements.audioPlayer.currentTime = time;
        elements.seekBar.style.setProperty('--progress', `${elements.seekBar.value}%`);
        updateProgressRing();
    };

    const changeVolume = () => {
        elements.audioPlayer.volume = elements.volumeBar.value;
        updateVolumeIcon(elements.audioPlayer.volume);
        if (elements.audioPlayer.volume > 0) {
            state.lastVolume = elements.audioPlayer.volume;
        }
    };

    const toggleMute = () => {
        if (elements.audioPlayer.volume > 0) {
            state.lastVolume = elements.audioPlayer.volume;
            elements.audioPlayer.volume = 0;
            elements.volumeBar.value = 0;
            updateVolumeIcon(0);
        } else {
            elements.audioPlayer.volume = state.lastVolume;
            elements.volumeBar.value = state.lastVolume;
            updateVolumeIcon(state.lastVolume);
        }
    };

    const loadAndPlayMusic = (index) => {
        if (index < 0 || index >= state.filteredMusicData.length) {
            elements.audioPlayer.pause();
            elements.audioPlayer.src = '';
            elements.coverImage.src = state.defaultCover;
            state.currentMusicId = null;
            state.currentMusicIndex = -1;
            elements.currentSongTitle.textContent = "Müzik Seçin";
            updatePlayerUIState();
            return;
        }

        const music = state.filteredMusicData[index];
        elements.audioPlayer.src = music.audio_url;
        elements.coverImage.src = music.image_url || state.defaultCover;
        state.currentMusicId = music.id;
        state.currentMusicIndex = index;
        elements.currentSongTitle.textContent = music.name;

        document.querySelectorAll('.music-item').forEach(item => {
            item.classList.toggle('bg-indigo-600', item.dataset.id === state.currentMusicId.toString());
            item.classList.toggle('bg-gray-800', item.dataset.id !== state.currentMusicId.toString());
            if (item.dataset.id === state.currentMusicId.toString()) {
                item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        });

        elements.audioPlayer.load();
        elements.audioPlayer.play().catch(e => {
            console.error("Otomatik oynatma engellendi:", e);
            elements.playPauseIcon.className = 'fa fa-play fa-lg';
        });
        updatePlayerUIState();
    };

    const playNext = () => {
        if (state.filteredMusicData.length === 0) return;
        const nextIndex = (state.currentMusicIndex + 1) % state.filteredMusicData.length;
        loadAndPlayMusic(nextIndex);
    };

    const playPrevious = () => {
        if (state.filteredMusicData.length === 0) return;
        if (elements.audioPlayer.currentTime > 3 && state.currentMusicIndex !== -1) {
            elements.audioPlayer.currentTime = 0;
            elements.audioPlayer.play().catch(e => console.error("Oynatma hatası:", e));
        } else {
            const prevIndex = (state.currentMusicIndex - 1 + state.filteredMusicData.length) % state.filteredMusicData.length;
            loadAndPlayMusic(prevIndex);
        }
    };

    const toggleMobileMusicList = () => {
        elements.mobileMusicListModal.classList.toggle('open');
    };

    const filterMusicList = () => {
        const query = (elements.searchBarDesktop.value || elements.searchBarMobile.value || '').trim().toLowerCase();
        const searchType = elements.searchTypeDesktop.value || elements.searchTypeMobile.value;

        if (!query) {
            state.filteredMusicData = [...state.musicData];
        } else {
            state.filteredMusicData = state.musicData.filter(music => {
                if (searchType === 'name') {
                    return music.name.toLowerCase().includes(query);
                } else if (searchType === 'duration') {
                    const durationMinutes = parseFloat(query);
                    if (isNaN(durationMinutes)) return true; // Geçersiz giriş, tümünü göster
                    const durationSeconds = durationMinutes * 60;
                    return music.duration && music.duration <= durationSeconds;
                } else if (searchType === 'date') {
                    const days = parseInt(query);
                    if (isNaN(days)) return true; // Geçersiz giriş, tümünü göster
                    const cutoffDate = new Date();
                    cutoffDate.setDate(cutoffDate.getDate() - days);
                    const musicDate = new Date(music.created_at);
                    return musicDate >= cutoffDate;
                }
                return true;
            });
        }

        // Show/Hide clear buttons based on search input
        elements.clearSearchDesktop.style.display = query ? 'block' : 'none';
        elements.clearSearchMobile.style.display = query ? 'block' : 'none';

        renderMusicList(query, searchType);
    };

    const clearSearch = () => {
        elements.searchBarDesktop.value = '';
        elements.searchBarMobile.value = '';
        elements.clearSearchDesktop.style.display = 'none';
        elements.clearSearchMobile.style.display = 'none';
        state.filteredMusicData = [...state.musicData];
        renderMusicList();
    };

    const highlightText = (text, query) => {
        if (!query) return text;
        const regex = new RegExp(`(${query})`, 'gi');
        return text.replace(regex, '<span class="highlight">$1</span>');
    };

    const renderMusicList = async (query = '', searchType = 'name') => {
        elements.musicListDesktop.innerHTML = '';
        elements.musicListMobile.innerHTML = '';
        elements.deleteSelect.innerHTML = '<option value="" disabled selected>Silmek için seçin...</option>';

        try {
            const { data, error } = await supabaseClient
                .from('musics')
                .select('id, name, audio_url, image_url, duration, created_at')
                .order('created_at', { ascending: false });

            if (error) throw new Error(error.message);

            state.musicData = data || [];
            if (!query) state.filteredMusicData = [...state.musicData];
            elements.songCountDesktop.textContent = `${state.musicData.length} Şarkı`;
            elements.songCountMobile.textContent = `${state.musicData.length} Şarkı`;

            if (state.musicData.length === 0) {
                const noMusicMessage = '<p class="text-gray-400 text-center mt-4">Henüz müzik eklenmemiş.</p>';
                elements.musicListDesktop.innerHTML = noMusicMessage;
                elements.musicListMobile.innerHTML = noMusicMessage;
                if (state.currentMusicId !== null) {
                    elements.audioPlayer.pause();
                    elements.audioPlayer.src = '';
                    elements.coverImage.src = state.defaultCover;
                    state.currentMusicId = null;
                    state.currentMusicIndex = -1;
                    elements.currentSongTitle.textContent = "Müzik Seçin";
                }
                updatePlayerUIState();
                return;
            }

            if (state.filteredMusicData.length === 0 && query) {
                let noResultsMessage;
                if (searchType === 'name') {
                    noResultsMessage = `<p class="text-gray-400 text-center mt-4">"${query}" için sonuç bulunamadı.</p>`;
                } else if (searchType === 'duration') {
                    noResultsMessage = `<p class="text-gray-400 text-center mt-4">${query} dakikadan kısa şarkı bulunamadı.</p>`;
                } else {
                    noResultsMessage = `<p class="text-gray-400 text-center mt-4">Son ${query} günde eklenen şarkı bulunamadı.</p>`;
                }
                elements.musicListDesktop.innerHTML = noResultsMessage;
                elements.musicListMobile.innerHTML = noResultsMessage;
                return;
            }

            const currentSongIndexInNewList = state.musicData.findIndex(music => music.id === state.currentMusicId);
            if (currentSongIndexInNewList !== -1) {
                state.currentMusicIndex = currentSongIndexInNewList;
            } else {
                state.currentMusicId = null;
                state.currentMusicIndex = -1;
                if (!elements.audioPlayer.paused || elements.audioPlayer.currentTime > 0) {
                    elements.audioPlayer.pause();
                    elements.audioPlayer.src = '';
                    elements.coverImage.src = state.defaultCover;
                    elements.currentSongTitle.textContent = "Müzik Seçin";
                }
            }

            state.filteredMusicData.forEach((music, index) => {
                const createMusicItem = () => {
                    const div = document.createElement('div');
                    div.className = `music-item flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all transform hover:scale-[1.03] ${music.id === state.currentMusicId ? 'bg-indigo-600' : 'bg-gray-800 hover:bg-indigo-700'}`;
                    div.dataset.id = music.id;
                    div.setAttribute('role', 'button');
                    div.setAttribute('aria-label', `Müzik çal: ${music.name}`);

                    const img = document.createElement('img');
                    img.src = music.image_url || 'https://placehold.co/60x60/7f9cf5/ffffff?text=♪';
                    img.alt = `Kapak: ${music.name}`;
                    img.className = "w-12 h-12 rounded-md object-cover flex-shrink-0";
                    img.onerror = () => img.src = 'https://placehold.co/60x60/7f9cf5/ffffff?text=♪';
                    div.appendChild(img);

                    const title = document.createElement('span');
                    title.className = "font-medium truncate flex-grow";
                    if (searchType === 'name') {
                        title.innerHTML = highlightText(music.name, query);
                    } else if (searchType === 'duration') {
                        title.innerHTML = `${music.name} (${formatTime(music.duration)})`;
                    } else {
                        const createdAt = new Date(music.created_at).toLocaleDateString('tr-TR');
                        title.innerHTML = `${music.name} (Eklenme: ${createdAt})`;
                    }
                    div.appendChild(title);

                    div.onclick = () => loadAndPlayMusic(index);
                    return div;
                };

                elements.musicListDesktop.appendChild(createMusicItem());
                elements.musicListMobile.appendChild(createMusicItem());

                const option = document.createElement('option');
                option.value = music.id;
                option.text = music.name;
                elements.deleteSelect.appendChild(option);
            });

            updatePlayerUIState();
        } catch (error) {
            console.error("Müzik listesi yüklenemedi:", error);
            const errorMessage = `<p class="text-red-400 text-center mt-4">Müzikler yüklenemedi: ${error.message}</p>`;
            elements.musicListDesktop.innerHTML = errorMessage;
            elements.musicListMobile.innerHTML = errorMessage;
            updatePlayerUIState();
        }
    };

    const getAudioDuration = (file) => {
        return new Promise((resolve) => {
            const audio = new Audio();
            audio.src = URL.createObjectURL(file);
            audio.addEventListener('loadedmetadata', () => {
                resolve(audio.duration);
                URL.revokeObjectURL(audio.src);
            });
            audio.addEventListener('error', () => {
                resolve(null);
            });
        });
    };

    const addMusic = async () => {
        const user = await supabaseClient.auth.getUser();
        if (user.error || !user.data.user) {
            alert('Müzik eklemek için giriş yapmalısınız.');
            return;
        }

        const name = elements.musicName.value.trim();
        const audioFile = elements.musicFile.files[0];
        const imageFile = elements.musicImage.files[0];

        if (!audioFile || !name) {
            alert('Müzik adı ve dosya zorunludur!');
            return;
        }

        elements.addMusicBtn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Ekleniyor...';
        elements.addMusicBtn.disabled = true;

        let audioUrl = null;
        let imageUrl = null;
        let duration = null;
        const filesToRemoveOnError = [];

        try {
            const userId = user.data.user.id;
            const audioFileName = `${userId}/${Date.now()}_${audioFile.name.replace(/\s+/g, '_')}`;
            const audioFilePath = `public/${audioFileName}`;
            filesToRemoveOnError.push(audioFilePath);

            // Calculate duration before uploading
            duration = await getAudioDuration(audioFile);
            if (!duration) throw new Error('Ses dosyasının süresi alınamadı.');

            const { error: audioUploadError } = await supabaseClient.storage
                .from('music-files')
                .upload(audioFilePath, audioFile);
            if (audioUploadError) throw new Error(`Ses dosyası yükleme hatası: ${audioUploadError.message}`);

            const { data: publicAudioUrlData } = supabaseClient.storage
                .from('music-files')
                .getPublicUrl(audioFilePath);
            audioUrl = publicAudioUrlData.publicUrl;

            if (imageFile) {
                if (imageFile.size > 5 * 1024 * 1024) throw new Error("Resim dosyası 5MB'dan büyük!");
                const imageFileName = `${userId}/${Date.now()}_${imageFile.name.replace(/\s+/g, '_')}`;
                const imageFilePath = `public/${imageFileName}`;
                filesToRemoveOnError.push(imageFilePath);

                const { error: imageUploadError } = await supabaseClient.storage
                    .from('music-files')
                    .upload(imageFilePath, imageFile);
                if (imageUploadError) throw new Error(`Resim yükleme hatası: ${imageUploadError.message}`);

                const { data: publicImageUrlData } = supabaseClient.storage
                    .from('music-files')
                    .getPublicUrl(imageFilePath);
                imageUrl = publicImageUrlData.publicUrl;
            }

            const { error: musicInsertError } = await supabaseClient
                .from('musics')
                .insert([{ name, audio_url: audioUrl, image_url: imageUrl, user_id: userId, duration }]);
            if (musicInsertError) throw new Error(`Veritabanı hatası: ${musicInsertError.message}`);

            renderMusicList();
            elements.musicName.value = '';
            elements.musicFile.value = '';
            elements.musicImage.value = '';
            alert('Müzik başarıyla eklendi!');
        } catch (error) {
            console.error('Müzik ekleme hatası:', error.message);
            alert(`Hata: ${error.message}`);
            if (filesToRemoveOnError.length > 0) {
                await supabaseClient.storage.from('music-files').remove(filesToRemoveOnError);
            }
        } finally {
            elements.addMusicBtn.innerHTML = '<i class="fa fa-plus"></i> Müziği Ekle';
            elements.addMusicBtn.disabled = false;
        }
    };

    const deleteMusic = async () => {
        const user = await supabaseClient.auth.getUser();
        if (user.error || !user.data.user) {
            alert('Müzik silmek için giriş yapmalısınız.');
            return;
        }

        const musicIdToDelete = elements.deleteSelect.value;
        if (!musicIdToDelete) {
            alert('Lütfen silinecek müzik seçin.');
            return;
        }

        const musicName = elements.deleteSelect.options[elements.deleteSelect.selectedIndex].text;
        if (!confirm(`"${musicName}" silinsin mi?`)) return;

        elements.deleteMusicBtn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Siliniyor...';
        elements.deleteMusicBtn.disabled = true;

        try {
            const { data: musicToDelete, error: fetchError } = await supabaseClient
                .from('musics')
                .select('id, audio_url, image_url, user_id')
                .eq('id', musicIdToDelete)
                .single();
            if (fetchError || !musicToDelete) throw new Error('Müzik bulunamadı.');

            if (musicToDelete.user_id !== user.data.user.id) {
                alert("Sadece kendi eklediğiniz müzikleri silebilirsiniz.");
                return;
            }

            const filesToRemove = [];
            const baseUrl = `${SUPABASE_URL}/storage/v1/object/public/music-files/`;
            if (musicToDelete.audio_url && musicToDelete.audio_url.startsWith(baseUrl)) {
                filesToRemove.push(musicToDelete.audio_url.substring(baseUrl.length));
            }
            if (musicToDelete.image_url && musicToDelete.image_url.startsWith(baseUrl)) {
                filesToRemove.push(musicToDelete.image_url.substring(baseUrl.length));
            }

            const { error: dbDeleteError } = await supabaseClient
                .from('musics')
                .delete()
                .eq('id', musicIdToDelete);
            if (dbDeleteError) throw new Error(`Veritabanı silme hatası: ${dbDeleteError.message}`);

            if (filesToRemove.length > 0) {
                const { error: storageDeleteError } = await supabaseClient.storage
                    .from('music-files')
                    .remove(filesToRemove);
                if (storageDeleteError) console.error('Depolama silme hatası:', storageDeleteError);
            }

            if (state.currentMusicId === musicIdToDelete) {
                elements.audioPlayer.pause();
                elements.audioPlayer.src = '';
                elements.coverImage.src = state.defaultCover;
                state.currentMusicId = null;
                state.currentMusicIndex = -1;
                elements.currentSongTitle.textContent = "Müzik Seçin";
            }

            await renderMusicList();
            alert(`"${musicName}" silindi!`);
            if (state.currentMusicId === musicIdToDelete && state.musicData.length > 0) {
                loadAndPlayMusic(0);
            }
        } catch (error) {
            console.error('Silme hatası:', error.message);
            alert(`Hata: ${error.message}`);
        } finally {
            elements.deleteMusicBtn.innerHTML = '<i class="fa fa-trash"></i> Seçilen Müziği Sil';
            elements.deleteMusicBtn.disabled = false;
        }
    };

    const showAdminPanel = () => {
        elements.adminPanel.classList.remove('hidden');
        elements.adminPanel.classList.add('flex');
        if (!elements.loginForm.classList.contains('hidden')) {
            elements.authEmail.focus();
        }
    };

    const closeAdminPanel = () => {
        elements.adminPanel.classList.add('hidden');
        elements.adminPanel.classList.remove('flex');
        elements.musicName.value = '';
        elements.musicFile.value = '';
        elements.musicImage.value = '';
        elements.deleteSelect.value = '';
        elements.authEmail.value = '';
        elements.authPass.value = '';
    };

    supabaseClient.auth.onAuthStateChange((event, session) => {
        if (session) {
            elements.loginForm.classList.add('hidden');
            elements.adminControls.classList.remove('hidden');
            elements.adminControls.classList.add('flex', 'flex-col', 'space-y-4');
            elements.loggedInUserEmail.textContent = `Giriş: ${session.user.email || 'Email Yok'}`;
        } else {
            elements.loginForm.classList.remove('hidden');
            elements.loginForm.classList.add('flex', 'flex-col', 'space-y-4');
            elements.adminControls.classList.add('hidden');
            elements.loggedInUserEmail.textContent = '';
        }
    });

    const signIn = async () => {
        const email = elements.authEmail.value.trim();
        const password = elements.authPass.value.trim();
        if (!email || !password) {
            alert("Email ve şifre gerekli.");
            return;
        }

        elements.signInBtn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Giriş Yapılıyor...';
        elements.signInBtn.disabled = true;

        const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
        elements.signInBtn.innerHTML = '<i class="fa fa-sign-in-alt"></i> Giriş Yap';
        elements.signInBtn.disabled = false;

        if (error) {
            console.error("Giriş hatası:", error.message);
            alert(`Giriş başarısız: ${error.message}`);
        } else {
            elements.authEmail.value = '';
            elements.authPass.value = '';
        }
    };

    const signOut = async () => {
        elements.signOutBtn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Çıkılıyor...';
        elements.signOutBtn.disabled = true;

        const { error } = await supabaseClient.auth.signOut();
        elements.signOutBtn.innerHTML = '<i class="fa fa-sign-out-alt"></i> Çıkış Yap';
        elements.signOutBtn.disabled = false;

        if (error) {
            console.error("Çıkış hatası:", error.message);
            alert(`Çıkış başarısız: ${error.message}`);
        }
    };

    // Event Listeners
    elements.adminButton.addEventListener('click', showAdminPanel);
    elements.signInBtn.addEventListener('click', signIn);
    elements.signOutBtn.addEventListener('click', signOut);
    elements.playPauseBtn.addEventListener('click', togglePlayPause);
    elements.audioPlayer.addEventListener('timeupdate', updateSeekBar);
    elements.audioPlayer.addEventListener('loadedmetadata', setDuration);
    elements.audioPlayer.addEventListener('play', updatePlayerUIState);
    elements.audioPlayer.addEventListener('pause', updatePlayerUIState);
    elements.audioPlayer.addEventListener('ended', playNext);
    elements.seekBar.addEventListener('input', seek);
    elements.volumeBar.addEventListener('input', changeVolume);
    elements.volumeIcon.addEventListener('click', toggleMute);
    elements.prevBtn.addEventListener('click', playPrevious);
    elements.nextBtn.addEventListener('click', playNext);
    elements.closeMobileListBtn.addEventListener('click', toggleMobileMusicList);
    elements.closeAdminPanelBtn.addEventListener('click', closeAdminPanel);
    elements.addMusicBtn.addEventListener('click', addMusic);
    elements.deleteMusicBtn.addEventListener('click', deleteMusic);

    // Debounced search handler
    const debouncedFilterMusicList = debounce(filterMusicList, 300);
    elements.searchBarDesktop.addEventListener('input', debouncedFilterMusicList);
    elements.searchBarMobile.addEventListener('input', debouncedFilterMusicList);
    elements.searchTypeDesktop.addEventListener('change', filterMusicList);
    elements.searchTypeMobile.addEventListener('change', filterMusicList);

    // Clear search button listeners
    elements.clearSearchDesktop.addEventListener('click', clearSearch);
    elements.clearSearchMobile.addEventListener('click', clearSearch);

    document.querySelector('.menu-button-mobile').addEventListener('click', toggleMobileMusicList);

    // Initial Setup
    elements.coverImage.src = state.defaultCover;
    elements.volumeBar.value = elements.audioPlayer.volume;
    updateVolumeIcon(elements.audioPlayer.volume);
    updatePlayerUIState();
    renderMusicList();
});
