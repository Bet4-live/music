// --- Supabase Setup ---
// !! Buraya kendi Supabase Proje URL ve Public Anon Key bilgilerini GİRİN !!
const SUPABASE_URL = 'https://skhbykqwdbwjcvqmwvft.supabase.co'; // <-- KENDİ URL'NİZİ GİRİN
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNraGJ5a3F3ZGJ3amN2cW13dmZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU3Nzg0NDYsImV4cCI6MjA2MTM1NDQ0Nn0.e8pbfF7O_rTtSKxtFzzc_zZTsegsxsNaluHNFBbWbMs'; // <-- KENDİ ANON KEY'İNİZİ GİRİN
// !! Supabase bilgilerini GİRDİĞİNİZDEN EMİN OLUN !!

let supabaseClient;

document.addEventListener('DOMContentLoaded', async () => {
    console.log("DOMContentLoaded olayı tetiklendi. Script çalışıyor...");

    try {
        if (typeof window.supabase === 'undefined') {
            console.error("Hata: window.supabase tanımlanmamış. Supabase kütüphanesi yüklenemedi veya çalışmadı.");
            alert("Supabase kütüphanesi yüklenirken bir sorun oluştu.");
            return;
        }

        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log("Supabase istemcisi başarıyla başlatıldı.");

        // --- DOM Elements ---
        const adminButton = document.getElementById('adminButton');
        const adminPanel = document.getElementById('adminPanel');
        const closeAdminPanelBtn = document.getElementById('closeAdminPanelBtn');
        const loginForm = document.getElementById('loginForm');
        const adminControls = document.getElementById('adminControls');
        const signInBtn = document.getElementById('signInBtn');
        const signOutBtn = document.getElementById('signOutBtn');
        const authEmail = document.getElementById('authEmail');
        const authPass = document.getElementById('authPass');
        const loggedInUserEmail = document.getElementById('loggedInUserEmail');
        const addMusicBtn = document.getElementById('addMusicBtn');
        const musicNameInput = document.getElementById('musicName');
        const musicFileInput = document.getElementById('musicFile');
        const musicImageInput = document.getElementById('musicImage');
        const musicCardsContainer = document.getElementById('musicCardsContainer');
        const musicListDesktop = document.getElementById('musicListDesktop'); // Desktop sidebar list
        const deleteSelect = document.getElementById('deleteSelect');
        const deleteMusicBtn = document.getElementById('deleteMusicBtn');
        const playPauseBtn = document.getElementById('playPauseBtn');
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        const audioPlayer = document.getElementById('audioPlayer');
        const currentSongTitleElement = document.getElementById('currentSongTitle');
        const currentSongArtistElement = document.getElementById('currentSongArtist');
        const coverImage = document.getElementById('coverImage');
        const seekBar = document.getElementById('seekBar');
        const currentTimeSpan = document.getElementById('currentTime');
        const totalDurationSpan = document.getElementById('totalDuration');
        const volumeBar = document.getElementById('volumeBar');
        const volumeIcon = document.getElementById('volumeIcon');
        const searchInput = document.getElementById('searchInput');
        const searchArea = document.getElementById('searchArea');
        const searchResults = document.getElementById('searchResults');
        const sidebarSearchButton = document.getElementById('sidebarSearchButton');
        const homeButton = document.getElementById('homeButton');
        const mainContent = document.getElementById('mainContent');
        const upcomingMusicContainerWrapper = document.getElementById('upcomingMusicContainerWrapper');
        const upcomingPrevBtn = document.getElementById('upcomingPrevBtn');
        const upcomingNextBtn = document.getElementById('upcomingNextBtn');
        const upcomingMusicContainer = document.getElementById('upcomingMusicContainer');

        // PLAĞA ÖZEL YENİ ELEMENT SEÇİMLERİ
        const plakCerceve = document.querySelector('.plak-cerceve'); 
        const plakMerkez = document.querySelector('.plak-merkez');

        let musicData = [];
        let currentMusicId = null;
        let lastVolume = 1; // Ses kapatıldığında son ses seviyesini saklar

        const defaultCover = "https://placehold.co/60x60/e2e8f0/94a3b8?text=Müzik+Seçin";
        const defaultArtist = "Bilinmeyen Sanatçı";

        // --- Auth State Change Listener ---
        supabaseClient.auth.onAuthStateChange((event, session) => {
            console.log("Auth State Changed:", event, session);
            if (session) {
                adminPanel.classList.remove('hidden'); // Show panel if logged in
                loginForm.classList.add('hidden');
                adminControls.classList.remove('hidden');
                loggedInUserEmail.textContent = `Giriş Yaptınız: ${session.user.email}`;
                // Fetch music for deletion list after login
                fetchMusicForDelete();
            } else {
                loginForm.classList.remove('hidden');
                adminControls.classList.add('hidden');
                loggedInUserEmail.textContent = "";
                adminPanel.classList.add('hidden'); // Hide panel if logged out
            }
        });

        // --- Functions ---

        async function fetchMusicData() {
            try {
                const { data, error } = await supabaseClient
                    .from('musics')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (error) throw error;
                musicData = data;
                console.log("Müzikler başarıyla çekildi:", musicData);
            } catch (error) {
                console.error("Müzikler çekilirken hata:", error);
                alert("Müzikler yüklenirken bir hata oluştu.");
            }
        }

        async function renderMusics(searchTerm = '') {
            await fetchMusicData(); // Always fetch fresh data

            const filteredMusic = searchTerm
                ? musicData.filter(music =>
                    music.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (music.artist && music.artist.toLowerCase().includes(searchTerm.toLowerCase()))
                )
                : musicData;

            // Clear previous results for search
            if (searchResults && searchTerm) {
                searchResults.innerHTML = '';
            } else if (musicCardsContainer) {
                musicCardsContainer.innerHTML = '';
            }
            if (musicListDesktop) {
                musicListDesktop.innerHTML = '';
            }
            if (upcomingMusicContainer && searchTerm === '') { // Only render upcoming if not searching
                upcomingMusicContainer.innerHTML = '';
            }

            if (filteredMusic.length === 0) {
                const noResultsMessage = `<p class="text-gray-400 text-center col-span-full mt-8">Hiç müzik bulunamadı.</p>`;
                if (searchTerm && searchResults) {
                    searchResults.innerHTML = noResultsMessage;
                } else if (musicCardsContainer) {
                    musicCardsContainer.innerHTML = noResultsMessage;
                }
                if (musicListDesktop) {
                    musicListDesktop.innerHTML = `<p class="text-gray-400 text-center mt-4">Henüz müzik yok.</p>`;
                }
                if (upcomingMusicContainer && searchTerm === '') {
                    upcomingMusicContainer.innerHTML = `<p class="text-gray-400 text-center col-span-full mt-4">Yaklaşan müzik yok.</p>`;
                }
                return;
            }

            filteredMusic.forEach((music, index) => {
                const musicCardHtml = `
                    <div class="music-card bg-slate-800 p-4 rounded-lg shadow-lg flex flex-col items-center text-center hover:bg-slate-700 transition-colors cursor-pointer relative ${currentMusicId === music.id ? 'playing-song' : ''}" data-id="${music.id}" data-index="${index}">
                        <img src="${music.image_url || defaultCover}" alt="${music.name}" class="w-full h-auto rounded-md mb-3 object-cover aspect-square">
                        <h4 class="font-semibold text-lg truncate w-full">${music.name}</h4>
                        <p class="text-sm text-gray-400 truncate w-full">${music.artist || defaultArtist}</p>
                        ${currentMusicId === music.id ? '<i class="fa-solid fa-volume-high text-indigo-400 absolute top-2 right-2 text-xl"></i>' : ''}
                    </div>
                `;

                const sidebarItemHtml = `
                    <li>
                        <a href="#" class="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-700 transition-colors text-sm ${currentMusicId === music.id ? 'active-link' : ''}" data-id="${music.id}" data-index="${index}">
                            <img src="${music.image_url || defaultCover}" alt="${music.name}" class="w-8 h-8 rounded object-cover">
                            <span class="font-medium truncate">${music.name}</span>
                            ${currentMusicId === music.id ? '<i class="fa-solid fa-volume-high text-indigo-400 ml-auto"></i>' : ''}
                        </a>
                    </li>
                `;

                if (searchTerm && searchResults) {
                    const searchResultItem = document.createElement('div');
                    searchResultItem.classList.add('flex', 'items-center', 'gap-3', 'p-3', 'hover:bg-slate-700', 'cursor-pointer', 'border-b', 'border-gray-700', 'last:border-b-0');
                    searchResultItem.innerHTML = `<img src="${music.image_url || defaultCover}" alt="${music.name}" class="w-10 h-10 rounded object-cover">
                                                  <div>
                                                      <p class="text-white font-medium">${music.name}</p>
                                                      <p class="text-gray-400 text-sm">${music.artist || defaultArtist}</p>
                                                  </div>`;
                    searchResultItem.dataset.id = music.id;
                    searchResultItem.dataset.index = index;
                    searchResults.appendChild(searchResultItem);
                } else {
                    if (musicCardsContainer) {
                        musicCardsContainer.insertAdjacentHTML('beforeend', musicCardHtml);
                    }
                    if (musicListDesktop) {
                        musicListDesktop.insertAdjacentHTML('beforeend', sidebarItemHtml);
                    }
                    // For upcoming music (if not searching)
                    if (upcomingMusicContainer && searchTerm === '' && index < 10) { // Limit to first 10 for upcoming
                        const upcomingCardHtml = `
                            <div class="music-card-upcoming bg-slate-800 p-3 rounded-lg shadow-lg flex-none w-40 text-center hover:bg-slate-700 transition-colors cursor-pointer ${currentMusicId === music.id ? 'playing-song' : ''}" data-id="${music.id}" data-index="${index}">
                                <img src="${music.image_url || defaultCover}" alt="${music.name}" class="w-full h-auto rounded-md mb-2 object-cover aspect-square">
                                <h4 class="font-semibold text-sm truncate w-full">${music.name}</h4>
                                <p class="text-xs text-gray-400 truncate w-full">${music.artist || defaultArtist}</p>
                            </div>
                        `;
                        upcomingMusicContainer.insertAdjacentHTML('beforeend', upcomingCardHtml);
                    }
                }
            });

            // Add click listeners to all music cards/items after they are rendered
            document.querySelectorAll('.music-card, #musicListDesktop a, #searchResults div').forEach(item => {
                item.addEventListener('click', (event) => {
                    const id = item.dataset.id;
                    const index = parseInt(item.dataset.index);
                    loadAndPlayMusic(index);
                });
            });

            // Update UI state to reflect currently playing song
            if (currentMusicId !== null) {
                const currentMusicCard = document.querySelector(`.music-card[data-id="${currentMusicId}"]`);
                if (currentMusicCard) {
                    currentMusicCard.classList.add('playing-song');
                }
                const currentSidebarItem = document.querySelector(`#musicListDesktop a[data-id="${currentMusicId}"]`);
                if (currentSidebarItem) {
                    currentSidebarItem.classList.add('active-link');
                }
                const currentUpcomingCard = document.querySelector(`.music-card-upcoming[data-id="${currentMusicId}"]`);
                if (currentUpcomingCard) {
                    currentUpcomingCard.classList.add('playing-song');
                }
                // Eğer o an çalan şarkı varsa, plağı da döndürmeye başla
                if (!audioPlayer.paused && plakCerceve && plakMerkez) {
                    plakCerceve.classList.add('plak-donuyor');
                    plakMerkez.style.display = 'block';
                }
            }
        }


        function loadAndPlayMusic(index) {
            if (index < 0 || index >= musicData.length) {
                console.error("Geçersiz müzik indeksi:", index);
                return;
            }
            const music = musicData[index];
            audioPlayer.src = music.file_url;
            currentMusicId = music.id;

            // Update UI
            if (currentSongTitleElement) currentSongTitleElement.textContent = music.name;
            if (currentSongArtistElement) currentSongArtistElement.textContent = music.artist || defaultArtist;
            if (coverImage) coverImage.src = music.image_url || defaultCover;

            audioPlayer.load(); // Ensure the new source is loaded
            audioPlayer.play().catch(e => console.error("Müzik oynatma hatası:", e));
            
            // Plak animasyonunu başlat
            plakCerceve.classList.add('plak-donuyor');
            plakMerkez.style.display = 'block';

            updatePlayerUIState();
            // Re-render to update 'playing-song' classes
            renderMusics(searchInput.value.trim()); // Pass current search term to keep search results
        }

        function playNext() {
            const currentIndex = musicData.findIndex(m => m.id === currentMusicId);
            if (currentIndex !== -1 && currentIndex < musicData.length - 1) {
                loadAndPlayMusic(currentIndex + 1);
            } else {
                // Son şarkı bitti, durdur
                audioPlayer.pause();
                currentMusicId = null; // Müzik seçimini kaldır
                updatePlayerUIState(); // UI'ı sıfırla
                // Plağı durdur ve gizle
                plakCerceve.classList.remove('plak-donuyor');
                plakMerkez.style.display = 'none';
                renderMusics(searchInput.value.trim()); // UI'ı güncelle
            }
        }

        function playPrev() {
            const currentIndex = musicData.findIndex(m => m.id === currentMusicId);
            if (currentIndex > 0) {
                loadAndPlayMusic(currentIndex - 1);
            }
        }

        // --- Müzik Çalma/Durdurma ve Plak Animasyonu Kontrolü ---
        function togglePlayPause() {
            if (!audioPlayer.src || currentMusicId === null) {
                if (musicData.length > 0) loadAndPlayMusic(0); // Play first song if nothing is loaded
                return;
            }
            if (audioPlayer.paused) {
                audioPlayer.play().catch(e => console.error("Oynatma hatası:", e));
                plakCerceve.classList.add('plak-donuyor'); // Plağı döndürme animasyonunu başlat
                plakMerkez.style.display = 'block'; // Plağın ortasındaki deliği göster
            } else {
                audioPlayer.pause();
                plakCerceve.classList.remove('plak-donuyor'); // Plağı durdurma animasyonunu durdur
                plakMerkez.style.display = 'none'; // Plağın ortasındaki deliği gizle
            }
            updatePlayerUIState();
        }


        function updatePlayerUIState() {
            const isPlaying = !audioPlayer.paused;
            if (playPauseBtn) {
                playPauseBtn.innerHTML = isPlaying ? '<i class="fa fa-pause fa-xl"></i>' : '<i class="fa fa-play fa-xl"></i>';
            }

            if (currentMusicId === null) {
                currentTimeSpan.textContent = "0:00";
                totalDurationSpan.textContent = "0:00";
                seekBar.value = 0;
                seekBar.style.setProperty('--progress', `0%`);
                seekBar.disabled = true;
                if(currentSongTitleElement) currentSongTitleElement.textContent = "Müzik Seçin";
                if(currentSongArtistElement) currentSongArtistElement.textContent = defaultArtist;
                if(coverImage) coverImage.src = defaultCover;
                // PLAĞI SIFIRLAMA KODU
                if(plakCerceve) plakCerceve.classList.remove('plak-donuyor');
                if(plakMerkez) plakMerkez.style.display = 'none';

            } else {
                seekBar.disabled = false;
                const currentSong = musicData.find(m => m.id === currentMusicId);
                if (currentSong) {
                    if(currentSongTitleElement) currentSongTitleElement.textContent = currentSong.name;
                    if(currentSongArtistElement) currentSongArtistElement.textContent = currentSong.artist || defaultArtist;
                    if(coverImage) coverImage.src = currentSong.image_url || defaultCover;
                }
            }

            // Next/Prev butonlarını etkinleştir/devre dışı bırak
            if (prevBtn) prevBtn.disabled = currentMusicId === null || musicData.findIndex(m => m.id === currentMusicId) === 0;
            if (nextBtn) nextBtn.disabled = currentMusicId === null || musicData.findIndex(m => m.id === currentMusicId) === musicData.length - 1;
        }

        function formatTime(seconds) {
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = Math.floor(seconds % 60);
            return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
        }

        async function fetchMusicForDelete() {
            try {
                const { data, error } = await supabaseClient
                    .from('musics')
                    .select('id, name');
                if (error) throw error;

                deleteSelect.innerHTML = '<option value="" disabled selected>Silmek için seçin...</option>';
                data.forEach(music => {
                    const option = document.createElement('option');
                    option.value = music.id;
                    option.textContent = music.name;
                    deleteSelect.appendChild(option);
                });
            } catch (error) {
                console.error("Silinecek müzikler çekilirken hata:", error);
            }
        }

        // --- Event Listeners ---

        // Player Controls
        if (playPauseBtn) playPauseBtn.addEventListener('click', togglePlayPause);
        if (nextBtn) nextBtn.addEventListener('click', playNext);
        if (prevBtn) prevBtn.addEventListener('click', playPrev);

        if (audioPlayer) {
            audioPlayer.addEventListener('timeupdate', () => {
                const currentTime = audioPlayer.currentTime;
                const duration = audioPlayer.duration;
                if (!isNaN(duration)) {
                    currentTimeSpan.textContent = formatTime(currentTime);
                    totalDurationSpan.textContent = formatTime(duration);
                    const progress = (currentTime / duration) * 100;
                    seekBar.value = progress;
                    seekBar.style.setProperty('--progress', `${progress}%`);
                }
            });

            audioPlayer.addEventListener('loadedmetadata', () => {
                updatePlayerUIState(); // Update duration when metadata is loaded
            });

            audioPlayer.addEventListener('ended', () => {
                playNext(); // Sonraki şarkıya geç
                // Eğer son şarkı bittiyse ve yeni şarkı başlamadıysa plağı durdur
                if (audioPlayer.paused && audioPlayer.currentTime === 0 && plakCerceve && plakMerkez) {
                    plakCerceve.classList.remove('plak-donuyor');
                    plakMerkez.style.display = 'none';
                }
            });
        }


        if (seekBar) {
            seekBar.addEventListener('input', () => {
                const seekTo = audioPlayer.duration * (seekBar.value / 100);
                audioPlayer.currentTime = seekTo;
                // Update CSS variable immediately for smooth scrubbing
                seekBar.style.setProperty('--progress', `${seekBar.value}%`);
            });
            // Update the --progress variable on page load or when value changes programmatically
            seekBar.style.setProperty('--progress', `${seekBar.value}%`);
        }

        if (volumeBar && volumeIcon && audioPlayer) {
            volumeBar.addEventListener('input', () => {
                audioPlayer.volume = parseFloat(volumeBar.value);
                updateVolumeIcon(audioPlayer.volume);
                lastVolume = audioPlayer.volume; // Update lastVolume
            });

            volumeIcon.addEventListener('click', () => {
                if (audioPlayer.volume > 0) {
                    audioPlayer.volume = 0;
                    volumeBar.value = 0;
                } else {
                    audioPlayer.volume = lastVolume > 0 ? lastVolume : 0.5; // If lastVolume was 0, set to 0.5
                    volumeBar.value = audioPlayer.volume;
                }
                updateVolumeIcon(audioPlayer.volume);
            });
        }

        function updateVolumeIcon(volume) {
            if (volume === 0) {
                volumeIcon.classList.remove('fa-volume-high', 'fa-volume-low');
                volumeIcon.classList.add('fa-volume-xmark');
            } else if (volume < 0.5) {
                volumeIcon.classList.remove('fa-volume-high', 'fa-volume-xmark');
                volumeIcon.classList.add('fa-volume-low');
            } else {
                volumeIcon.classList.remove('fa-volume-low', 'fa-volume-xmark');
                volumeIcon.classList.add('fa-volume-high');
            }
        }

        // Admin Panel Logic
        if (adminButton) {
            adminButton.addEventListener('click', async () => {
                adminPanel.classList.remove('hidden');
                const { data: { session } } = await supabaseClient.auth.getSession();
                if (session) {
                    loginForm.classList.add('hidden');
                    adminControls.classList.remove('hidden');
                    loggedInUserEmail.textContent = `Giriş Yaptınız: ${session.user.email}`;
                    fetchMusicForDelete();
                } else {
                    loginForm.classList.remove('hidden');
                    adminControls.classList.add('hidden');
                }
            });
        }

        if (closeAdminPanelBtn) {
            closeAdminPanelBtn.addEventListener('click', () => {
                adminPanel.classList.add('hidden');
                authEmail.value = ''; // Clear inputs on close
                authPass.value = '';
                musicNameInput.value = '';
                if (musicFileInput) musicFileInput.value = '';
                if (musicImageInput) musicImageInput.value = '';
                if (deleteSelect) deleteSelect.value = '';
            });
        }

        if (signInBtn) {
            signInBtn.addEventListener('click', async () => {
                const email = authEmail.value;
                const password = authPass.value;
                const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
                if (error) {
                    alert(`Giriş hatası: ${error.message}`);
                } else {
                    alert("Başarıyla giriş yapıldı!");
                    // Auth state change listener will handle UI update
                }
            });
        }

        if (signOutBtn) {
            signOutBtn.addEventListener('click', async () => {
                const { error } = await supabaseClient.auth.signOut();
                if (error) {
                    alert(`Çıkış hatası: ${error.message}`);
                } else {
                    alert("Başarıyla çıkış yapıldı!");
                    // Auth state change listener will handle UI update
                }
            });
        }

        if (addMusicBtn) {
            addMusicBtn.addEventListener('click', async () => {
                const musicName = musicNameInput.value.trim();
                const musicFile = musicFileInput.files[0];
                const musicImage = musicImageInput.files[0];

                if (!musicName || !musicFile) {
                    alert("Müzik adı ve müzik dosyası zorunludur!");
                    return;
                }

                try {
                    // Upload music file
                    const musicFilePath = `musics/${Date.now()}-${musicFile.name}`;
                    const { data: musicUploadData, error: musicUploadError } = await supabaseClient.storage
                        .from('music_files') // Supabase bucket adınız
                        .upload(musicFilePath, musicFile, {
                            cacheControl: '3600',
                            upsert: false
                        });

                    if (musicUploadError) throw musicUploadError;
                    const musicFileUrl = `${SUPABASE_URL}/storage/v1/object/public/music_files/${musicFilePath}`;

                    let imageUrl = null;
                    if (musicImage) {
                        const imagePath = `covers/${Date.now()}-${musicImage.name}`;
                        const { data: imageUploadData, error: imageUploadError } = await supabaseClient.storage
                            .from('music_covers') // Supabase bucket adınız (kapaklar için)
                            .upload(imagePath, musicImage, {
                                cacheControl: '3600',
                                upsert: false
                            });
                        if (imageUploadError) throw imageUploadError;
                        imageUrl = `${SUPABASE_URL}/storage/v1/object/public/music_covers/${imagePath}`;
                    }

                    // Insert music data into database
                    const { data, error } = await supabaseClient
                        .from('musics')
                        .insert([{ name: musicName, file_url: musicFileUrl, image_url: imageUrl, artist: "Bilinmeyen Sanatçı" }]); // Artist bilgisi eklemedim, gerekirse formdan alabilirsin

                    if (error) throw error;

                    alert("Müzik başarıyla eklendi!");
                    musicNameInput.value = '';
                    musicFileInput.value = '';
                    if (musicImageInput) musicImageInput.value = '';
                    renderMusics(); // Refresh music list
                    fetchMusicForDelete(); // Refresh delete list
                } catch (error) {
                    console.error("Müzik eklenirken hata:", error);
                    alert(`Müzik eklenirken bir hata oluştu: ${error.message}`);
                }
            });
        }

        if (deleteMusicBtn) {
            deleteMusicBtn.addEventListener('click', async () => {
                const musicIdToDelete = deleteSelect.value;
                if (!musicIdToDelete) {
                    alert("Lütfen silinecek bir müzik seçin.");
                    return;
                }

                if (!confirm("Bu müziği silmek istediğinizden emin misiniz?")) {
                    return;
                }

                try {
                    // First, get the file_url and image_url to delete from storage
                    const { data: musicToDelete, error: fetchError } = await supabaseClient
                        .from('musics')
                        .select('file_url, image_url')
                        .eq('id', musicIdToDelete)
                        .single();

                    if (fetchError) throw fetchError;

                    // Delete from storage if URLs exist
                    if (musicToDelete.file_url) {
                        const filePath = musicToDelete.file_url.split('/music_files/')[1];
                        if (filePath) {
                            const { error: fileDeleteError } = await supabaseClient.storage
                                .from('music_files')
                                .remove([filePath]);
                            if (fileDeleteError) console.error("Müzik dosyası silinirken hata:", fileDeleteError);
                        }
                    }
                    if (musicToDelete.image_url) {
                        const imagePath = musicToDelete.image_url.split('/music_covers/')[1];
                        if (imagePath) {
                            const { error: imageDeleteError } = await supabaseClient.storage
                                .from('music_covers')
                                .remove([imagePath]);
                            if (imageDeleteError) console.error("Kapak resmi silinirken hata:", imageDeleteError);
                        }
                    }

                    // Then, delete from database
                    const { error } = await supabaseClient
                        .from('musics')
                        .delete()
                        .eq('id', musicIdToDelete);

                    if (error) throw error;

                    alert("Müzik başarıyla silindi!");
                    deleteSelect.value = ''; // Reset select
                    renderMusics(); // Refresh music list
                    fetchMusicForDelete(); // Refresh delete list
                    // If the deleted song was the one currently playing, stop playback and reset UI
                    if (currentMusicId === musicIdToDelete) {
                        audioPlayer.pause();
                        audioPlayer.src = '';
                        currentMusicId = null;
                        updatePlayerUIState();
                        // Plağı durdur ve gizle
                        if(plakCerceve) plakCerceve.classList.remove('plak-donuyor');
                        if(plakMerkez) plakMerkez.style.display = 'none';
                    }
                } catch (error) {
                    console.error("Müzik silinirken hata:", error);
                    alert(`Müzik silinirken bir hata oluştu: ${error.message}`);
                }
            });
        }


        // Navigation and Search
        if (sidebarSearchButton && homeButton && searchArea && mainContent) {
            sidebarSearchButton.addEventListener('click', () => {
                searchArea.classList.remove('hidden');
                mainContent.classList.add('hidden');
                sidebarSearchButton.classList.add('active-link');
                homeButton.classList.remove('active-link');
                searchInput.focus(); // Focus on search input
                searchResults.innerHTML = ''; // Clear previous search results
                searchInput.value = ''; // Clear search input
                renderMusics(); // Re-render all musics to show initial search state
            });

            homeButton.addEventListener('click', () => {
                searchArea.classList.add('hidden');
                mainContent.classList.remove('hidden');
                homeButton.classList.add('active-link');
                sidebarSearchButton.classList.remove('active-link');
                renderMusics(); // Re-render all musics for home view
            });
        }

        if (searchInput) {
            searchInput.addEventListener('input', () => {
                renderMusics(searchInput.value.trim()); // Pass search term to renderMusics
            });
        }

        // Upcoming Music Scroll Buttons
        if (upcomingPrevBtn && upcomingNextBtn && upcomingMusicContainerWrapper) {
            const scrollAmount = 200; // Adjust as needed
            upcomingPrevBtn.addEventListener('click', () => {
                upcomingMusicContainerWrapper.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
            });
            upcomingNextBtn.addEventListener('click', () => {
                upcomingMusicContainerWrapper.scrollBy({ left: scrollAmount, behavior: 'smooth' });
            });
        }


        // --- Initial Setup ---
        if (coverImage) coverImage.src = defaultCover;
        if (currentSongArtistElement) currentSongArtistElement.textContent = defaultArtist;
        if (audioPlayer && volumeBar) {
            audioPlayer.volume = parseFloat(volumeBar.value); // Ensure volume is number
            updateVolumeIcon(audioPlayer.volume);
            lastVolume = audioPlayer.volume; // Initialize lastVolume
        }
        updatePlayerUIState();
        await renderMusics(); // Fetch and render music on page load

    } catch (error) {
        console.error("DOMContentLoaded içinde yakalanan genel hata:", error);
        alert("Uygulama başlatılırken beklenmeyen bir hata oluştu. Konsolu kontrol edin.");
    }
});
