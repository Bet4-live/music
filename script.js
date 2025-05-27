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
        console.log("Supabase istemcisi başarıyla oluşturuldu.");

        // --- DOM Elements ---
        const musicListDesktop = document.getElementById('musicListDesktop');
        const musicCardsContainer = document.getElementById('musicCardsContainer');
        const upcomingMusicContainerWrapper = document.getElementById('upcomingMusicContainerWrapper');
        const upcomingMusicContainer = document.getElementById('upcomingMusicContainer');
        const upcomingPrevBtn = document.getElementById('upcomingPrevBtn');
        const upcomingNextBtn = document.getElementById('upcomingNextBtn');

        const audioPlayer = document.getElementById('audioPlayer');
        const coverImage = document.getElementById('coverImage');
        const currentSongTitleElement = document.getElementById('currentSongTitle');
        const currentSongArtistElement = document.getElementById('currentSongArtist');
        const deleteSelect = document.getElementById('deleteSelect');

        // Admin Panel
        const adminButton = document.getElementById('adminButton');
        const adminPanelDiv = document.getElementById('adminPanel');
        const adminControlsDiv = document.getElementById('adminControls');
        const loginForm = document.getElementById('loginForm');
        const closeAdminPanelBtn = document.getElementById('closeAdminPanelBtn');
        const addMusicBtn = document.getElementById('addMusicBtn');
        const deleteMusicBtn = document.getElementById('deleteMusicBtn');


        // Auth related elements
        const authEmailInput = document.getElementById('authEmail');
        const authPassInput = document.getElementById('authPass');
        const signInBtn = document.getElementById('signInBtn');
        const signOutBtn = document.getElementById('signOutBtn');
        const loggedInUserEmailSpan = document.getElementById('loggedInUserEmail');

        // Custom Player Elements
        const playPauseBtn = document.getElementById('playPauseBtn');
        const playPauseIcon = playPauseBtn.querySelector('i');
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        const seekBar = document.getElementById('seekBar');
        const currentTimeSpan = document.getElementById('currentTime');
        const totalDurationSpan = document.getElementById('totalDuration');
        const volumeBar = document.getElementById('volumeBar');
        const volumeIcon = document.getElementById('volumeIcon');

        // Search Elements
        const sidebarSearchButton = document.getElementById('sidebarSearchButton');
        const searchArea = document.getElementById('searchArea');
        const searchInput = document.getElementById('searchInput');
        const searchResultsContainer = document.getElementById('searchResults');
        const mainContentArea = document.getElementById('mainContent');
        const homeButton = document.getElementById('homeButton');


        // State Variables
        const defaultCover = 'https://placehold.co/60x60/e2e8f0/94a3b8?text=Müzik+Seçin';
        const defaultArtist = 'Bilinmeyen Sanatçı';
        let currentMusicId = null;
        let currentMusicIndex = -1;
        let musicData = [];
        let lastVolume = 1;
        let isSearchActive = false;


        // --- Helper Functions ---
        function formatTime(seconds) {
            if (isNaN(seconds) || seconds < 0 || !isFinite(seconds)) return "0:00";
            const minutes = Math.floor(seconds / 60);
            const secs = Math.floor(seconds % 60);
            return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
        }

        function updateVolumeIcon(volume) {
             if (volume === 0) {
                volumeIcon.className = 'fa fa-volume-xmark text-gray-400 hover:text-white cursor-pointer w-5 text-center transition-colors';
            } else if (volume < 0.5) {
                volumeIcon.className = 'fa fa-volume-low text-gray-400 hover:text-white cursor-pointer w-5 text-center transition-colors';
            } else {
                volumeIcon.className = 'fa fa-volume-high text-gray-400 hover:text-white cursor-pointer w-5 text-center transition-colors';
            }
        }

        function updatePlayerUIState() {
            const hasSongs = musicData.length > 0;
            const hasMultipleSongs = musicData.length > 1;

            prevBtn.disabled = !hasSongs || (currentMusicIndex <= 0 && !hasMultipleSongs);
            nextBtn.disabled = !hasSongs || (currentMusicIndex >= musicData.length - 1 && !hasMultipleSongs);


            if (audioPlayer.paused) {
                playPauseIcon.className = 'fa fa-play fa-xl';
            } else {
                playPauseIcon.className = 'fa fa-pause fa-xl';
            }

            if (currentMusicId === null || !hasSongs) {
                currentTimeSpan.textContent = "0:00";
                totalDurationSpan.textContent = "0:00";
                seekBar.value = 0;
                seekBar.style.setProperty('--progress', `0%`);
                seekBar.disabled = true;
                if(currentSongTitleElement) currentSongTitleElement.textContent = "Müzik Seçin";
                if(currentSongArtistElement) currentSongArtistElement.textContent = defaultArtist;
                if(coverImage) coverImage.src = defaultCover;
            } else {
                seekBar.disabled = false;
                // Artist ve kapak bilgisi loadAndPlayMusic içinde zaten set ediliyor.
                // Burada sadece butonların durumunu güncelleyebiliriz.
                const currentSong = musicData.find(m => m.id === currentMusicId);
                 if (currentSong) {
                    if(currentSongTitleElement) currentSongTitleElement.textContent = currentSong.name;
                    if(currentSongArtistElement) currentSongArtistElement.textContent = currentSong.artist || defaultArtist;
                    if(coverImage) coverImage.src = currentSong.image_url || defaultCover;
                }
            }

            document.querySelectorAll('.music-item').forEach(item => {
                item.classList.remove('active-song');
            });
            document.querySelectorAll('.music-card').forEach(card => {
                card.classList.remove('playing-song');
            });

            if (currentMusicId !== null && hasSongs) {
                const currentSidebarItem = document.querySelector(`.music-item[data-id="${currentMusicId}"]`);
                if (currentSidebarItem) {
                    currentSidebarItem.classList.add('active-song');
                }
                const currentMusicCard = document.querySelector(`.music-card[data-id="${currentMusicId}"]`);
                if (currentMusicCard) {
                    currentMusicCard.classList.add('playing-song');
                }
            }
        }

        function togglePlayPause() {
            if (!audioPlayer.src || currentMusicId === null) {
                if (musicData.length > 0) loadAndPlayMusic(0);
                return;
            }
            if (audioPlayer.paused) {
                audioPlayer.play().catch(e => console.error("Oynatma hatası:", e));
            } else {
                audioPlayer.pause();
            }
            updatePlayerUIState();
        }

        function updateSeekBar() {
            if (audioPlayer.duration && isFinite(audioPlayer.duration)) {
                const percentage = (audioPlayer.currentTime / audioPlayer.duration) * 100;
                seekBar.value = percentage;
                seekBar.style.setProperty('--progress', `${percentage}%`);
                currentTimeSpan.textContent = formatTime(audioPlayer.currentTime);
            } else {
                 seekBar.value = 0;
                 seekBar.style.setProperty('--progress', `0%`);
                 currentTimeSpan.textContent = formatTime(0);
            }
        }

        function setDuration() {
             if (audioPlayer.duration && isFinite(audioPlayer.duration)) {
                totalDurationSpan.textContent = formatTime(audioPlayer.duration);
                seekBar.value = 0;
                seekBar.style.setProperty('--progress', `0%`);
                currentTimeSpan.textContent = formatTime(0);
            } else {
                totalDurationSpan.textContent = "0:00";
                 currentTimeSpan.textContent = "0:00";
                 seekBar.value = 0;
                 seekBar.style.setProperty('--progress', `0%`);
            }
            updatePlayerUIState();
        }

        function seek() {
            if (!audioPlayer.src || !audioPlayer.duration || !isFinite(audioPlayer.duration)) return;
            const time = (seekBar.value / 100) * audioPlayer.duration;
            audioPlayer.currentTime = time;
        }

        function changeVolume() {
            audioPlayer.volume = volumeBar.value;
            updateVolumeIcon(audioPlayer.volume);
            if (audioPlayer.volume > 0) {
                lastVolume = audioPlayer.volume;
            }
        }

        function toggleMute() {
            if (audioPlayer.volume > 0) {
                lastVolume = audioPlayer.volume;
                audioPlayer.volume = 0;
                volumeBar.value = 0;
            } else {
                audioPlayer.volume = lastVolume;
                volumeBar.value = lastVolume;
            }
            updateVolumeIcon(audioPlayer.volume);
        }

        function loadAndPlayMusic(indexOrId) {
            let musicToPlay;
            let musicIndex;

            if (typeof indexOrId === 'number') {
                 if (indexOrId < 0 || indexOrId >= musicData.length) {
                    console.warn("Geçersiz müzik indexi:", indexOrId, "Müzik listesi boş olabilir veya index hatalı.");
                    if (musicData.length > 0) return loadAndPlayMusic(0); // İlk şarkıyı çalmayı dene
                    // Müzik yoksa oynatıcıyı sıfırla
                    audioPlayer.pause(); audioPlayer.src = ''; currentMusicId = null; currentMusicIndex = -1;
                    updatePlayerUIState();
                    return;
                }
                musicToPlay = musicData[indexOrId];
                musicIndex = indexOrId;
            } else {
                musicToPlay = musicData.find(m => m.id === indexOrId);
                musicIndex = musicData.findIndex(m => m.id === indexOrId);
                if (!musicToPlay) {
                    console.error("Müzik ID ile bulunamadı:", indexOrId);
                    return;
                }
            }

            console.log(`Yükleniyor: ${musicToPlay.name} (ID: ${musicToPlay.id}, Index: ${musicIndex})`);

            audioPlayer.src = musicToPlay.audio_url;
            currentMusicId = musicToPlay.id;
            currentMusicIndex = musicIndex;

            if(currentSongTitleElement) currentSongTitleElement.textContent = musicToPlay.name;
            if(currentSongArtistElement) currentSongArtistElement.textContent = musicToPlay.artist || defaultArtist;
            if(coverImage) coverImage.src = musicToPlay.image_url || defaultCover;

            updatePlayerUIState();

            audioPlayer.load();
            audioPlayer.play().catch(e => {
                console.error("Otomatik oynatma engellendi veya hata:", e);
                updatePlayerUIState();
            });
        }

        function playNext() {
            if (musicData.length === 0) return;
            let nextIndex = (currentMusicIndex + 1) % musicData.length;
            loadAndPlayMusic(nextIndex);
        }

        function playPrevious() {
             if (musicData.length === 0) return;
             if (audioPlayer.currentTime > 3 && currentMusicIndex !== -1) {
                 audioPlayer.currentTime = 0;
                 audioPlayer.play().catch(e => console.error("Oynatma hatası:", e));
             } else {
                let prevIndex = (currentMusicIndex - 1 + musicData.length) % musicData.length;
                loadAndPlayMusic(prevIndex);
             }
        }

        async function renderMusics(searchTerm = '') {
            if (!supabaseClient) {
                console.error("Supabase istemcisi henüz hazır değil (renderMusics içinde).");
                const errorMsg = '<p class="text-red-400 text-center mt-4">Supabase bağlantısı kurulamadı.</p>';
                if (musicListDesktop) musicListDesktop.innerHTML = errorMsg;
                if (musicCardsContainer) musicCardsContainer.innerHTML = errorMsg;
                if (upcomingMusicContainer) upcomingMusicContainer.innerHTML = '<p class="text-gray-400 text-center col-span-full">Yüklenemedi.</p>';
                updatePlayerUIState();
                return;
            }
            console.log(`renderMusics çalışıyor... Arama terimi: "${searchTerm}"`);

            if (musicListDesktop) musicListDesktop.innerHTML = '<p class="text-gray-400 text-center mt-4">Müzikler yükleniyor...</p>';
            if (musicCardsContainer && !isSearchActive) musicCardsContainer.innerHTML = '';
            if (upcomingMusicContainer) upcomingMusicContainer.innerHTML = '';
            if (deleteSelect) deleteSelect.innerHTML = '<option value="" disabled selected>Silmek için seçin...</option>';
            
            const previouslyPlayingId = currentMusicId;

            try {
                let query = supabaseClient
                    .from('musics')
                    .select('id, name, audio_url, image_url, artist') // artist sütununu seçiyoruz
                    .order('created_at', { ascending: false });

                if (searchTerm) {
                    query = query.ilike('name', `%${searchTerm}%`);
                }

                const { data, error } = await query;

                if (error) {
                    console.error('Supabase fetch error:', error);
                    const errorMsg = `<p class="text-red-400 text-center mt-4">Müzikler yüklenemedi: ${error.message}</p>`;
                    if (musicListDesktop) musicListDesktop.innerHTML = errorMsg;
                    if (musicCardsContainer && !isSearchActive) musicCardsContainer.innerHTML = errorMsg;
                    if (upcomingMusicContainer) upcomingMusicContainer.innerHTML = `<p class="text-gray-400 text-center col-span-full">Müzikler yüklenemedi: ${error.message}</p>`;
                    musicData = []; // Hata durumunda müzik verisini sıfırla
                    updatePlayerUIState();
                    return;
                }

                musicData = data || [];
                console.log(`Bulunan müzik sayısı: ${musicData.length}`);

                if (musicListDesktop) musicListDesktop.innerHTML = ''; // Yükleniyor mesajını temizle

                if (musicData.length === 0) {
                    const noMusicMessage = '<p class="text-gray-400 text-center mt-4">Henüz müzik eklenmemiş.</p>';
                    if (musicListDesktop && !isSearchActive) musicListDesktop.innerHTML = noMusicMessage;
                    if (musicCardsContainer && !isSearchActive) musicCardsContainer.innerHTML = `<p class="text-gray-400 text-center col-span-full">${noMusicMessage}</p>`;
                    if (upcomingMusicContainer && !isSearchActive) upcomingMusicContainer.innerHTML = '<p class="text-gray-400 text-center w-full">Yaklaşan şarkı bulunmamaktadır.</p>';
                    
                    if (isSearchActive && searchResultsContainer) {
                        searchResultsContainer.innerHTML = '<p class="text-gray-400 text-center p-4">Sonuç bulunamadı.</p>';
                    }

                    if (currentMusicId !== null) {
                        audioPlayer.pause(); audioPlayer.src = ''; currentMusicId = null; currentMusicIndex = -1;
                    }
                    updatePlayerUIState();
                    return;
                }

                if (isSearchActive) {
                    renderSearchResults(musicData);
                } else {
                    musicData.forEach((music, index) => {
                        const div = document.createElement('div');
                        div.className = `music-item p-3 rounded-lg cursor-pointer flex items-center gap-3 hover:bg-slate-700 transition-colors ${music.id === currentMusicId ? 'active-song' : ''}`;
                        div.dataset.id = music.id;
                        imgSrc = music.image_url || `https://placehold.co/40x40/7f9cf5/ffffff?text=${encodeURIComponent(music.name[0] || '♪')}`;
                        div.innerHTML = `
                            <img src="${imgSrc}" alt="${music.name}" class="w-10 h-10 rounded-md object-cover flex-shrink-0">
                            <span class="font-medium truncate flex-grow text-slate-300">${music.name}</span>`;
                        div.onclick = () => loadAndPlayMusic(index);
                        if (musicListDesktop) musicListDesktop.appendChild(div);

                        if (deleteSelect) {
                            const option = document.createElement('option');
                            option.value = music.id;
                            option.text = music.name;
                            deleteSelect.appendChild(option);
                        }
                    });

                    if (musicCardsContainer) {
                        musicData.slice(0, 10).forEach((music) => {
                            const card = createMusicCardElement(music, music.id === currentMusicId);
                            card.onclick = () => {
                                const clickedIndex = musicData.findIndex(item => item.id === music.id);
                                if (clickedIndex !== -1) loadAndPlayMusic(clickedIndex);
                            };
                            musicCardsContainer.appendChild(card);
                        });
                    }

                    if (upcomingMusicContainer) {
                        upcomingMusicContainer.innerHTML = '';
                        let upcomingCount = 0;
                        if (musicData.length > 0) {
                            let startIndex = (currentMusicIndex !== -1 && currentMusicIndex < musicData.length) ? (currentMusicIndex + 1) % musicData.length : 0;
                            for (let i = 0; i < musicData.length; i++) {
                                const musicIndexToDisplay = (startIndex + i) % musicData.length;
                                if (musicData[musicIndexToDisplay].id === currentMusicId && currentMusicId !== null) continue;
                                if (upcomingCount >= 10) break;

                                const music = musicData[musicIndexToDisplay];
                                const card = createMusicCardElement(music, false);
                                card.style.minWidth = '160px';
                                card.onclick = () => loadAndPlayMusic(musicIndexToDisplay);
                                upcomingMusicContainer.appendChild(card);
                                upcomingCount++;
                            }
                        }
                        if (upcomingCount === 0 && musicData.length > 0) { // Eğer sadece 1 şarkı varsa veya hepsi çalıyorsa
                             upcomingMusicContainer.innerHTML = '<p class="text-gray-400 text-center w-full">Başka şarkı yok.</p>';
                        } else if (upcomingCount === 0 && musicData.length === 0) {
                             upcomingMusicContainer.innerHTML = '<p class="text-gray-400 text-center w-full">Yaklaşan şarkı bulunmamaktadır.</p>';
                        }

                        const visibleCardsApproximation = Math.floor(upcomingMusicContainerWrapper.offsetWidth / 170); // 160px card + 10px gap
                        upcomingPrevBtn.disabled = upcomingCount <= visibleCardsApproximation || upcomingMusicContainerWrapper.scrollLeft === 0;
                        upcomingNextBtn.disabled = upcomingCount <= visibleCardsApproximation || (upcomingMusicContainerWrapper.scrollWidth - upcomingMusicContainerWrapper.scrollLeft <= upcomingMusicContainerWrapper.clientWidth +5);

                    }
                }

                const currentSongStillExists = musicData.some(m => m.id === previouslyPlayingId);
                if (previouslyPlayingId && !currentSongStillExists && !audioPlayer.paused) {
                    // Optionally, play next available or just update UI
                    console.log("Mevcut şarkı filtrelendi veya silindi.");
                    // currentMusicId = null; currentMusicIndex = -1; // Player state will be updated by updatePlayerUIState
                } else if (previouslyPlayingId && currentSongStillExists) {
                    currentMusicIndex = musicData.findIndex(m => m.id === previouslyPlayingId);
                }
                
                // Eğer hiçbir şarkı seçili değilse ve müzik varsa, oynatıcıyı ilk şarkı için hazırla ama çalma
                if(currentMusicId === null && musicData.length > 0) {
                    const firstSong = musicData[0];
                    if(currentSongTitleElement) currentSongTitleElement.textContent = firstSong.name;
                    if(currentSongArtistElement) currentSongArtistElement.textContent = firstSong.artist || defaultArtist;
                    if(coverImage) coverImage.src = firstSong.image_url || defaultCover;
                    // currentMusicId ve currentMusicIndex ayarlanmadı, bu yüzden çalmayacak.
                    // Sadece UI'da ilk şarkının bilgisi görünecek.
                }


                updatePlayerUIState();

            } catch (errorCatch) { // Catch block'u için farklı bir değişken adı
                console.error("renderMusics içinde yakalanan hata:", errorCatch);
                if (musicListDesktop) musicListDesktop.innerHTML = `<p class="text-red-400 text-center mt-4">Bir hata oluştu: ${errorCatch.message}</p>`;
                musicData = [];
                updatePlayerUIState();
            }
        }

        function createMusicCardElement(music, isPlaying) {
            const card = document.createElement('div');
            card.className = `music-card bg-slate-800 p-4 rounded-lg shadow-lg flex flex-col items-center text-center transition-all cursor-pointer hover:bg-slate-700 ${isPlaying ? 'playing-song' : ''}`;
            card.dataset.id = music.id;
            const imgSrc = music.image_url || `https://placehold.co/150x150/7f9cf5/ffffff?text=${encodeURIComponent(music.name[0] || '♪')}`;

            card.innerHTML = `
                <img src="${imgSrc}" alt="${music.name}" class="w-full h-auto rounded-md mb-3 object-cover aspect-square"/>
                <h4 title="${music.name}" class="font-semibold text-lg truncate w-full">${music.name}</h4>
                <p class="text-sm text-gray-400 truncate w-full">${music.artist || defaultArtist}</p> `;
            return card;
        }

        async function addMusic() {
            const userResponse = await supabaseClient.auth.getUser();
            if (userResponse.error || !userResponse.data.user) {
                 alert('Müzik eklemek için giriş yapmalısınız.'); return;
            }
            const currentUser = userResponse.data.user;

             const nameInput = document.getElementById('musicName');
             const fileInput = document.getElementById('musicFile');
             const imageInput = document.getElementById('musicImage');
             // const artistInput = document.getElementById('musicArtist'); // Eğer sanatçı için input eklerseniz

             const name = nameInput.value.trim();
             const audioFile = fileInput.files[0];
             const imageFile = imageInput.files[0];
             // const artistName = artistInput ? artistInput.value.trim() : defaultArtist; // Sanatçı adı

             if (!audioFile || !name) {
                 alert('Müzik adı ve müzik dosyası alanları zorunludur!'); return;
             }

             const originalAddButtonText = addMusicBtn.innerHTML;
             addMusicBtn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Ekleniyor...';
             addMusicBtn.disabled = true;

             let audioUrl = null; let imageUrl = null; const filesToRemoveOnError = [];

             try {
                 const userId = currentUser.id;
                 const safeAudioFileName = audioFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
                 const audioFileName = `${userId}/${Date.now()}_${safeAudioFileName}`;
                 const audioFilePath = `public/${audioFileName}`;
                 filesToRemoveOnError.push(audioFilePath);

                 const { error: audioUploadError } = await supabaseClient.storage
                     .from('music-files').upload(audioFilePath, audioFile);
                 if (audioUploadError) throw new Error(`Ses dosyası yükleme hatası: ${audioUploadError.message}`);
                 const { data: publicAudioUrlData } = supabaseClient.storage.from('music-files').getPublicUrl(audioFilePath);
                 audioUrl = publicAudioUrlData.publicUrl;

                 if (imageFile) {
                      if (imageFile.size > 5 * 1024 * 1024) throw new Error("Resim dosyası çok büyük! (Maksimum 5MB)");
                      const safeImageFileName = imageFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
                      const imageFileName = `${userId}/${Date.now()}_${safeImageFileName}`;
                      const imageFilePath = `public/${imageFileName}`;
                      filesToRemoveOnError.push(imageFilePath);
                      const { error: imageUploadError } = await supabaseClient.storage.from('music-files').upload(imageFilePath, imageFile);
                      if (imageUploadError) throw new Error(`Resim dosyası yükleme hatası: ${imageUploadError.message}`);
                      const { data: publicImageUrlData } = supabaseClient.storage.from('music-files').getPublicUrl(imageFilePath);
                      imageUrl = publicImageUrlData.publicUrl;
                 }

                 const { error: musicInsertError } = await supabaseClient
                     .from('musics')
                     .insert([{ name, audio_url: audioUrl, image_url: imageUrl, user_id: userId, artist: "Sample Artist" /*artistName*/ }]) // artist: artistName eklendi
                     .select();
                 if (musicInsertError) throw new Error(`Veritabanına kayıt hatası: ${musicInsertError.message}`);

                 await renderMusics();
                 nameInput.value = ''; fileInput.value = ''; imageInput.value = ''; // if(artistInput) artistInput.value = '';
                 alert('Müzik başarıyla eklendi!');
             } catch (error) {
                 console.error('Müzik eklenirken hata oluştu: ', error);
                 alert(`Müzik eklenemedi: ${error.message}`);
                  if (filesToRemoveOnError.length > 0) {
                       const { error: cleanupError } = await supabaseClient.storage.from('music-files').remove(filesToRemoveOnError);
                       if (cleanupError) console.error("Dosya temizleme hatası:", cleanupError);
                  }
             } finally {
                 addMusicBtn.innerHTML = originalAddButtonText; addMusicBtn.disabled = false;
             }
        }

        async function deleteMusic() {
             const userResponse = await supabaseClient.auth.getUser();
             if (userResponse.error || !userResponse.data.user) {
                  alert('Müzik silmek için giriş yapmalısınız.'); return;
             }
             const currentUser = userResponse.data.user;
             const musicIdToDelete = deleteSelect.value;
             if (!musicIdToDelete) { alert('Lütfen silinecek bir müzik seçin.'); return; }
             const musicNameToDelete = deleteSelect.options[deleteSelect.selectedIndex].text;
             if (!confirm(`"${musicNameToDelete}" adlı müziği silmek istediğinizden emin misiniz?`)) return;

              const originalDeleteButtonText = deleteMusicBtn.innerHTML;
              deleteMusicBtn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Siliniyor...';
              deleteMusicBtn.disabled = true;

             try {
                 const { data: musicToDelete, error: fetchError } = await supabaseClient
                     .from('musics').select('id, audio_url, image_url, user_id').eq('id', musicIdToDelete).single();
                 if (fetchError || !musicToDelete) throw new Error(`Silinecek müzik bulunamadı: ${fetchError?.message || ''}`);
                 if (musicToDelete.user_id !== currentUser.id) {
                       alert("Sadece kendi eklediğiniz müzikleri silebilirsiniz.");
                       deleteMusicBtn.innerHTML = originalDeleteButtonText; deleteMusicBtn.disabled = false; return;
                 }

                 const filesToRemove = [];
                 const storageBaseUrl = `${SUPABASE_URL}/storage/v1/object/public/music-files/`;
                 if (musicToDelete.audio_url?.startsWith(storageBaseUrl)) filesToRemove.push(decodeURIComponent(musicToDelete.audio_url.substring(storageBaseUrl.length)));
                 if (musicToDelete.image_url?.startsWith(storageBaseUrl)) filesToRemove.push(decodeURIComponent(musicToDelete.image_url.substring(storageBaseUrl.length)));

                 const { error: dbDeleteError } = await supabaseClient.from('musics').delete().eq('id', musicIdToDelete);
                 if (dbDeleteError) throw new Error(`Veritabanından silme hatası: ${dbDeleteError.message}`);

                  if (filesToRemove.length > 0) {
                      const { error: storageDeleteError } = await supabaseClient.storage.from('music-files').remove(filesToRemove);
                      if (storageDeleteError) console.error('Depolamadan silinirken hata (DB kaydı silindi):', storageDeleteError);
                  }

                 if (currentMusicId === musicIdToDelete) {
                     audioPlayer.pause(); audioPlayer.src = ''; currentMusicId = null; currentMusicIndex = -1;
                 }
                 await renderMusics();
                 alert(`"${musicNameToDelete}" başarıyla silindi!`);
                 if (currentMusicId === musicIdToDelete && musicData.length > 0) loadAndPlayMusic(0);
                 else updatePlayerUIState();
             } catch (error) {
                 console.error('Müzik silinirken hata: ', error); alert(`Müzik silinemedi: ${error.message}`);
             } finally {
                 deleteMusicBtn.innerHTML = originalDeleteButtonText; deleteMusicBtn.disabled = false;
             }
        }

        function showAdminPanel() {
             adminPanelDiv.classList.remove('hidden'); adminPanelDiv.classList.add('flex');
             if (!loginForm.classList.contains('hidden') && authEmailInput) authEmailInput.focus();
        }
        function closeAdminPanel() {
             adminPanelDiv.classList.add('hidden'); adminPanelDiv.classList.remove('flex');
             document.getElementById('musicName').value = ''; document.getElementById('musicFile').value = ''; document.getElementById('musicImage').value = '';
             if(deleteSelect) deleteSelect.value = ""; if(authEmailInput) authEmailInput.value = ''; if(authPassInput) authPassInput.value = '';
        }

        supabaseClient.auth.onAuthStateChange((event, session) => {
            console.log("Auth state changed:", event, session);
            if (session) {
                loginForm.classList.add('hidden'); loginForm.classList.remove('flex');
                adminControlsDiv.classList.remove('hidden'); adminControlsDiv.classList.add('flex');
                if(loggedInUserEmailSpan) loggedInUserEmailSpan.textContent = `Giriş: ${session.user.email || 'Bilinmeyen kullanıcı'}`;
            } else {
                loginForm.classList.remove('hidden'); loginForm.classList.add('flex');
                adminControlsDiv.classList.add('hidden'); adminControlsDiv.classList.remove('flex');
                if(loggedInUserEmailSpan) loggedInUserEmailSpan.textContent = '';
            }
        });

        async function signIn() {
            const email = authEmailInput.value.trim(); const password = authPassInput.value.trim();
            if (!email || !password) { alert("Email ve şifre girin."); return; }
            signInBtn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Giriş Yapılıyor...'; signInBtn.disabled = true;
            const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
            signInBtn.innerHTML = '<i class="fa fa-sign-in-alt"></i> Giriş Yap'; signInBtn.disabled = false;
            if (error) alert(`Giriş başarısız: ${error.message}`);
            else { authEmailInput.value = ''; authPassInput.value = ''; }
        }
        async function signOut() {
            signOutBtn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Çıkılıyor...'; signOutBtn.disabled = true;
            const { error } = await supabaseClient.auth.signOut();
            signOutBtn.innerHTML = '<i class="fa fa-sign-out-alt"></i> Çıkış Yap'; signOutBtn.disabled = false;
            if (error) alert(`Çıkış başarısız: ${error.message}`);
        }

        function toggleSearch(showSearch) {
            isSearchActive = showSearch;
            if (showSearch) {
                searchArea.classList.remove('hidden'); mainContentArea.classList.add('hidden');
                searchInput.focus();
                homeButton.classList.remove('active-link'); sidebarSearchButton.classList.add('active-link');
                renderMusics(searchInput.value.trim());
            } else {
                searchArea.classList.add('hidden'); mainContentArea.classList.remove('hidden');
                searchResultsContainer.innerHTML = ''; searchInput.value = '';
                sidebarSearchButton.classList.remove('active-link'); homeButton.classList.add('active-link');
                renderMusics();
            }
        }

        function renderSearchResults(results) {
            searchResultsContainer.innerHTML = '';
            if (results.length === 0) {
                searchResultsContainer.innerHTML = '<p class="text-gray-400 text-center p-4">Sonuç bulunamadı.</p>'; return;
            }
            results.forEach(music => {
                const item = document.createElement('div');
                item.className = 'search-result-item';
                const imgSrc = music.image_url || `https://placehold.co/40x40/7f9cf5/ffffff?text=${encodeURIComponent(music.name[0] || '♪')}`;
                item.innerHTML = `<img src="${imgSrc}" alt="${music.name}"><span>${music.name}</span>`;
                item.onclick = () => { loadAndPlayMusic(music.id); toggleSearch(false); };
                searchResultsContainer.appendChild(item);
            });
        }

        // Event Listeners
        if (adminButton) adminButton.addEventListener('click', showAdminPanel);
        if (closeAdminPanelBtn) closeAdminPanelBtn.addEventListener('click', closeAdminPanel);
        if (signInBtn) signInBtn.addEventListener('click', signIn);
        if (signOutBtn) signOutBtn.addEventListener('click', signOut);
        if (addMusicBtn) addMusicBtn.addEventListener('click', addMusic);
        if (deleteMusicBtn) deleteMusicBtn.addEventListener('click', deleteMusic);

        if (playPauseBtn) playPauseBtn.addEventListener('click', togglePlayPause);
        if (audioPlayer) {
            audioPlayer.addEventListener('timeupdate', updateSeekBar);
            audioPlayer.addEventListener('loadedmetadata', setDuration);
            audioPlayer.addEventListener('play', () => updatePlayerUIState());
            audioPlayer.addEventListener('pause', () => updatePlayerUIState());
            audioPlayer.addEventListener('ended', playNext);
        }
        if (seekBar) seekBar.addEventListener('input', seek);
        if (volumeBar) volumeBar.addEventListener('input', changeVolume);
        if (volumeIcon) volumeIcon.addEventListener('click', toggleMute);
        if (prevBtn) prevBtn.addEventListener('click', playPrevious);
        if (nextBtn) nextBtn.addEventListener('click', playNext);

        if (sidebarSearchButton) sidebarSearchButton.addEventListener('click', (e) => { e.preventDefault(); toggleSearch(true); });
        if (homeButton) homeButton.addEventListener('click', (e) => { e.preventDefault(); if(isSearchActive) toggleSearch(false); });
        if (searchInput) searchInput.addEventListener('input', () => renderMusics(searchInput.value.trim()));

        if (upcomingPrevBtn && upcomingNextBtn && upcomingMusicContainerWrapper) {
            const scrollAmount = 200;
            upcomingPrevBtn.addEventListener('click', () => upcomingMusicContainerWrapper.scrollBy({ left: -scrollAmount, behavior: 'smooth' }));
            upcomingNextBtn.addEventListener('click', () => upcomingMusicContainerWrapper.scrollBy({ left: scrollAmount, behavior: 'smooth' }));
            
            // Update arrow button states on scroll
            upcomingMusicContainerWrapper.addEventListener('scroll', () => {
                const { scrollLeft, scrollWidth, clientWidth } = upcomingMusicContainerWrapper;
                upcomingPrevBtn.disabled = scrollLeft <= 0;
                upcomingNextBtn.disabled = scrollLeft >= (scrollWidth - clientWidth - 5); // 5px buffer
            });
        }

        // Initial Setup
        if (coverImage) coverImage.src = defaultCover;
        if (currentSongArtistElement) currentSongArtistElement.textContent = defaultArtist;
        if (audioPlayer && volumeBar) {
            audioPlayer.volume = parseFloat(volumeBar.value);
            updateVolumeIcon(audioPlayer.volume); lastVolume = audioPlayer.volume;
        }
        // İlk yüklemede player UI durumunu ayarla
        updatePlayerUIState(); // Bu satırı renderMusics'ten önce çağırarak UI'ın başlangıçta doğru görünmesini sağlayalım.
        await renderMusics(); // Verileri çek ve arayüzü güncelle

    } catch (error) {
        console.error("DOMContentLoaded içinde yakalanan genel hata:", error);
        alert("Uygulama başlatılırken beklenmeyen bir hata oluştu. Konsolu kontrol edin.");
        // Hata durumunda temel UI elemanlarını sıfırla veya hata mesajı göster
        if (musicListDesktop) musicListDesktop.innerHTML = '<p class="text-red-500 text-center p-4">Uygulama yüklenirken bir sorun oluştu.</p>';
        updatePlayerUIState(); // Hata olsa bile player UI'ını ayarla
    }
});
