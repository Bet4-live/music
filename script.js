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
        const currentSongArtistElement = document.getElementById('currentSongArtist'); // Artist name in footer
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
        const mainContentArea = document.getElementById('mainContent'); // To hide/show main content during search
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
            const hasMultipleSongs = musicData.length > 1;
            prevBtn.disabled = !hasMultipleSongs || currentMusicIndex <= 0 && musicData.length <=1 ; // Simplified logic
            nextBtn.disabled = !hasMultipleSongs || currentMusicIndex >= musicData.length -1 && musicData.length <=1; // Simplified logic

            if (audioPlayer.paused) {
                playPauseIcon.className = 'fa fa-play fa-xl';
            } else {
                playPauseIcon.className = 'fa fa-pause fa-xl';
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
            } else {
                seekBar.disabled = false;
                const currentSong = musicData.find(m => m.id === currentMusicId);
                if (currentSong) {
                    if(currentSongTitleElement) currentSongTitleElement.textContent = currentSong.name;
                    if(currentSongArtistElement) currentSongArtistElement.textContent = currentSong.artist || defaultArtist; // Assuming an artist field
                    if(coverImage) coverImage.src = currentSong.image_url || defaultCover;
                }
            }

            document.querySelectorAll('.music-item').forEach(item => {
                item.classList.remove('active-song');
            });
            document.querySelectorAll('.music-card').forEach(card => {
                card.classList.remove('playing-song');
            });

            if (currentMusicId !== null) {
                const currentSidebarItem = document.querySelector(`.music-item[data-id="${currentMusicId}"]`);
                if (currentSidebarItem) {
                    currentSidebarItem.classList.add('active-song');
                    // currentSidebarItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); // Can be disruptive
                }
                const currentMusicCard = document.querySelector(`.music-card[data-id="${currentMusicId}"]`);
                if (currentMusicCard) {
                    currentMusicCard.classList.add('playing-song');
                }
            }
        }

        function togglePlayPause() {
            if (!audioPlayer.src || currentMusicId === null) {
                if (musicData.length > 0) loadAndPlayMusic(0); // Play first song if nothing is loaded
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
                seekBar.value = 0; // Reset seek bar on new song
                seekBar.style.setProperty('--progress', `0%`);
                currentTimeSpan.textContent = formatTime(0);
            } else {
                totalDurationSpan.textContent = "0:00"; // Fallback if duration is not available
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
            if (audioPlayer.volume > 0) { // Update lastVolume only if not muted by this action
                lastVolume = audioPlayer.volume;
            }
        }

        function toggleMute() {
            if (audioPlayer.volume > 0) {
                lastVolume = audioPlayer.volume; // Store current volume before muting
                audioPlayer.volume = 0;
                volumeBar.value = 0;
            } else {
                audioPlayer.volume = lastVolume; // Restore to last known volume
                volumeBar.value = lastVolume;
            }
            updateVolumeIcon(audioPlayer.volume);
        }

        function loadAndPlayMusic(indexOrId) {
            let musicToPlay;
            let musicIndex;

            if (typeof indexOrId === 'number') { // If an index is passed
                 if (indexOrId < 0 || indexOrId >= musicData.length) {
                    console.log("Geçersiz müzik indexi:", indexOrId);
                    // Optionally stop player or play first song
                    if (musicData.length > 0) return loadAndPlayMusic(0);
                    else { /* handle no music case */ return; }
                }
                musicToPlay = musicData[indexOrId];
                musicIndex = indexOrId;
            } else { // If an ID is passed (e.g., from search results)
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

            // Update footer info
            if(currentSongTitleElement) currentSongTitleElement.textContent = musicToPlay.name;
            if(currentSongArtistElement) currentSongArtistElement.textContent = musicToPlay.artist || defaultArtist;
            if(coverImage) coverImage.src = musicToPlay.image_url || defaultCover;

            updatePlayerUIState(); // Handles highlighting and button states

            audioPlayer.load(); // Important to call load()
            audioPlayer.play().catch(e => {
                console.error("Otomatik oynatma engellendi veya hata:", e);
                updatePlayerUIState(); // Ensure UI reflects paused state if autoplay fails
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

        // --- Render Music List (Fetch from Supabase) ---
        async function renderMusics(searchTerm = '') {
            if (!supabaseClient) {
                console.error("Supabase istemcisi henüz hazır değil (renderMusics içinde).");
                // ... (error messages for UI)
                return;
            }
            console.log(`renderMusics çalışıyor... Arama terimi: "${searchTerm}"`);

            // Clear relevant containers
            if (musicListDesktop) musicListDesktop.innerHTML = '';
            if (musicCardsContainer && !isSearchActive) musicCardsContainer.innerHTML = '';
            if (upcomingMusicContainer) upcomingMusicContainer.innerHTML = '';
            if (deleteSelect) deleteSelect.innerHTML = '<option value="" disabled selected>Silmek için seçin...</option>';
            
            // Temporarily store current playing music details
            const previouslyPlayingId = currentMusicId;
            let wasCurrentlyPlayingVisible = false;

            try {
                let query = supabaseClient
                    .from('musics')
                    .select('id, name, audio_url, image_url, artist') // Assuming artist field
                    .order('created_at', { ascending: false });

                // If there's a search term, apply filtering (basic example)
                // For more advanced search, Supabase offers full-text search
                if (searchTerm) {
                    query = query.ilike('name', `%${searchTerm}%`); // Case-insensitive search
                }

                const { data, error } = await query;

                if (error) {
                    console.error('Supabase fetch error:', error);
                    // ... (error messages for UI)
                    updatePlayerUIState();
                    return;
                }

                musicData = data || []; // Update the global musicData
                console.log(`Bulunan müzik sayısı: ${musicData.length}`);


                if (musicData.length === 0 && !isSearchActive) {
                    const noMusicMessage = '<p class="text-gray-400 text-center mt-4">Henüz müzik eklenmemiş.</p>';
                    if (musicListDesktop) musicListDesktop.innerHTML = noMusicMessage;
                    if (musicCardsContainer) musicCardsContainer.innerHTML = `<p class="text-gray-400 text-center col-span-full">${noMusicMessage}</p>`;
                    if (upcomingMusicContainer) upcomingMusicContainer.innerHTML = '<p class="text-gray-400 text-center w-full">Yaklaşan şarkı bulunmamaktadır.</p>';
                    if (currentMusicId !== null) { // Stop player if no music found and something was playing
                        audioPlayer.pause();
                        audioPlayer.src = '';
                        currentMusicId = null; currentMusicIndex = -1;
                    }
                    updatePlayerUIState();
                    return;
                }


                // If search is active, render into search results, otherwise normal render
                if (isSearchActive) {
                    renderSearchResults(musicData); // musicData is already filtered by the query
                } else {
                    // Populate sidebar music list and admin delete select
                    musicData.forEach((music, index) => {
                        // Sidebar music item
                        const div = document.createElement('div');
                        div.className = `music-item p-3 rounded-lg cursor-pointer flex items-center gap-3 hover:bg-slate-700 transition-colors ${music.id === currentMusicId ? 'active-song' : ''}`;
                        div.dataset.id = music.id;

                        const img = document.createElement('img');
                        img.src = music.image_url || 'https://placehold.co/40x40/7f9cf5/ffffff?text=♪';
                        img.alt = "Kapak";
                        img.className = "w-10 h-10 rounded-md object-cover flex-shrink-0";
                        img.onerror = () => img.src = 'https://placehold.co/40x40/7f9cf5/ffffff?text=♪';
                        div.appendChild(img);

                        const title = document.createElement('span');
                        title.className = "font-medium truncate flex-grow text-slate-300";
                        title.innerText = music.name;
                        div.appendChild(title);

                        div.onclick = () => loadAndPlayMusic(index);
                        if (musicListDesktop) musicListDesktop.appendChild(div);

                        // Admin delete select option
                        if (deleteSelect) {
                            const option = document.createElement('option');
                            option.value = music.id;
                            option.text = music.name;
                            deleteSelect.appendChild(option);
                        }
                        if (music.id === previouslyPlayingId) wasCurrentlyPlayingVisible = true;
                    });

                    // Populate main music cards for "Senin için Hazırlandı"
                    if (musicCardsContainer) {
                        if (musicData.length > 0) {
                            musicData.slice(0, 10).forEach((music) => { // Show up to 10 cards or so
                                const card = createMusicCardElement(music, music.id === currentMusicId);
                                card.onclick = () => {
                                    const clickedIndex = musicData.findIndex(item => item.id === music.id);
                                    if (clickedIndex !== -1) loadAndPlayMusic(clickedIndex);
                                };
                                musicCardsContainer.appendChild(card);
                                if (music.id === previouslyPlayingId) wasCurrentlyPlayingVisible = true;
                            });
                        } else {
                            musicCardsContainer.innerHTML = '<p class="text-gray-400 text-center col-span-full">Henüz müzik eklenmemiş.</p>';
                        }
                    }

                    // Populate "Yaklaşan Şarkılar" (Upcoming Music)
                    if (upcomingMusicContainer) {
                        upcomingMusicContainer.innerHTML = ''; // Clear previous content
                        let upcomingCount = 0;
                        if (musicData.length > 1) { // Only show upcoming if there's more than one song
                            // Start from the song after the current one, or from the beginning if no song is playing
                            let startIndex = (currentMusicIndex !== -1) ? (currentMusicIndex + 1) % musicData.length : 0;

                            for (let i = 0; i < musicData.length; i++) {
                                const musicIndexToDisplay = (startIndex + i) % musicData.length;
                                if (musicData[musicIndexToDisplay].id === currentMusicId && currentMusicId !== null) continue; // Don't show current song as upcoming
                                if (upcomingCount >= 10) break; // Limit to a reasonable number for horizontal scroll

                                const music = musicData[musicIndexToDisplay];
                                const card = createMusicCardElement(music, false); // Not 'playing-song'
                                card.style.minWidth = '160px'; // Ensure consistent card width for scrolling
                                card.onclick = () => loadAndPlayMusic(musicIndexToDisplay);
                                upcomingMusicContainer.appendChild(card);
                                upcomingCount++;
                                 if (music.id === previouslyPlayingId) wasCurrentlyPlayingVisible = true;
                            }
                        }
                        if (upcomingCount === 0) {
                            upcomingMusicContainer.innerHTML = '<p class="text-gray-400 text-center w-full">Yaklaşan başka şarkı bulunmamaktadır.</p>';
                        }
                        upcomingPrevBtn.disabled = upcomingCount <= 3; // Disable if not enough to scroll
                        upcomingNextBtn.disabled = upcomingCount <= 3; // Example: disable if fewer than visible items
                    }
                }


                // Restore player state if the currently playing song was removed by a filter then re-appeared
                const currentSongStillExists = musicData.some(m => m.id === previouslyPlayingId);
                if (previouslyPlayingId && !currentSongStillExists && !audioPlayer.paused) {
                    // If current song disappeared (e.g. filtered out by search)
                    // Option: pause or play next available. Here, we pause.
                    // audioPlayer.pause();
                    // currentMusicId = null; currentMusicIndex = -1;
                    // console.log("Mevcut şarkı filtrelendi, oynatıcı duraklatıldı.");
                } else if (previouslyPlayingId && currentSongStillExists) {
                    // Ensure index is updated if list order changed
                    currentMusicIndex = musicData.findIndex(m => m.id === previouslyPlayingId);
                }


                // If no song was playing or current song removed, and music is available, select first.
                if (!currentMusicId && musicData.length > 0 && !isSearchActive) {
                    // updatePlayerUIState will handle UI for "Müzik Seçin"
                } else if (!currentMusicId && musicData.length === 0 && !isSearchActive){
                    // No music, UI updated in the length check
                }

                updatePlayerUIState();

            } catch (error) {
                console.error("renderMusics içinde hata:", error);
                // ... (error messages for UI)
                updatePlayerUIState();
            }
        }

        function createMusicCardElement(music, isPlaying) {
            const card = document.createElement('div');
            // Added 'music-card' class to ensure animations apply from style.css
            card.className = `music-card bg-slate-800 p-4 rounded-lg shadow-lg flex flex-col items-center text-center transition-all cursor-pointer hover:bg-slate-700 ${isPlaying ? 'playing-song' : ''}`;
            card.dataset.id = music.id;

            card.innerHTML = `
                <img src="${music.image_url || 'https://placehold.co/150x150/7f9cf5/ffffff?text=♪'}" alt="Albüm Kapağı" class="w-full h-auto rounded-md mb-3 object-cover aspect-square"/>
                <h4 title="${music.name}" class="font-semibold text-lg truncate w-full">${music.name}</h4>
                <p class="text-sm text-gray-400 truncate w-full">${music.artist || defaultArtist}</p> `;
            return card;
        }


        // --- Add Music (Upload to Storage & Insert to DB) ---
        async function addMusic() {
            const user = await supabaseClient.auth.getUser();
            if (user.error || !user.data.user) {
                 alert('Müzik eklemek için giriş yapmalısınız.');
                 return;
            }

             const nameInput = document.getElementById('musicName');
             const fileInput = document.getElementById('musicFile');
             const imageInput = document.getElementById('musicImage');

             const name = nameInput.value.trim();
             const audioFile = fileInput.files[0];
             const imageFile = imageInput.files[0];

             if (!audioFile || !name) {
                 alert('Müzik adı ve müzik dosyası alanları zorunludur!');
                 return;
             }

             addMusicBtn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Ekleniyor...';
             addMusicBtn.disabled = true;

             let audioUrl = null;
             let imageUrl = null;
             const filesToRemoveOnError = [];

             try {
                 const userId = user.data.user.id;
                 // Sanitize file names before uploading
                 const safeAudioFileName = audioFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
                 const audioFileName = `${userId}/${Date.now()}_${safeAudioFileName}`;
                 const audioFilePath = `public/${audioFileName}`;
                 filesToRemoveOnError.push(audioFilePath);

                 const { data: audioUploadData, error: audioUploadError } = await supabaseClient.storage
                     .from('music-files') // Make sure this bucket exists and has correct policies
                     .upload(audioFilePath, audioFile);

                 if (audioUploadError) {
                     throw new Error(`Ses dosyası yükleme hatası: ${audioUploadError.message}`);
                 }
                 const { data: publicAudioUrlData } = supabaseClient.storage.from('music-files').getPublicUrl(audioFilePath);
                 audioUrl = publicAudioUrlData.publicUrl;


                 if (imageFile) {
                      if (imageFile.size > 5 * 1024 * 1024) { // 5MB limit
                         throw new Error("Resim dosyası çok büyük! (Maksimum 5MB)");
                     }
                     const safeImageFileName = imageFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
                     const imageFileName = `${userId}/${Date.now()}_${safeImageFileName}`;
                     const imageFilePath = `public/${imageFileName}`;
                     filesToRemoveOnError.push(imageFilePath);

                     const { data: imageUploadData, error: imageUploadError } = await supabaseClient.storage
                         .from('music-files')
                         .upload(imageFilePath, imageFile);

                     if (imageUploadError) {
                          throw new Error(`Resim dosyası yükleme hatası: ${imageUploadError.message}`);
                     }
                     const { data: publicImageUrlData } = supabaseClient.storage.from('music-files').getPublicUrl(imageFilePath);
                     imageUrl = publicImageUrlData.publicUrl;
                 }

                 const { data: musicInsertData, error: musicInsertError } = await supabaseClient
                     .from('musics')
                     .insert([{
                         name: name,
                         audio_url: audioUrl,
                         image_url: imageUrl,
                         user_id: userId,
                         // artist: "Sample Artist" // Add artist field if you have one
                     }])
                     .select();

                 if (musicInsertError) {
                      throw new Error(`Veritabanına kayıt hatası: ${musicInsertError.message}`);
                 }

                 console.log("Müzik başarıyla eklendi:", name, musicInsertData);
                 await renderMusics(); // Refresh lists
                 nameInput.value = '';
                 fileInput.value = '';
                 imageInput.value = '';
                 alert('Müzik başarıyla eklendi!');

             } catch (error) {
                 console.error('Müzik eklenirken hata oluştu: ', error);
                 alert(`Müzik eklenemedi: ${error.message}`);
                  if (filesToRemoveOnError.length > 0) {
                      console.log("Hata oluştu, yüklenen dosyalar siliniyor:", filesToRemoveOnError);
                       const { error: cleanupError } = await supabaseClient.storage
                          .from('music-files')
                          .remove(filesToRemoveOnError);
                       if (cleanupError) console.error("Dosya temizleme hatası:", cleanupError);
                       else console.log("Yüklenen dosyalar başarıyla temizlendi.");
                  }
             } finally {
                 addMusicBtn.innerHTML = originalButtonText || '<i class="fa fa-plus"></i> Müziği Ekle';
                 addMusicBtn.disabled = false;
             }
        }
        const originalButtonText = addMusicBtn ? addMusicBtn.innerHTML : ''; // Store original button text

        // --- Delete Music (Delete from DB & Remove from Storage) ---
        async function deleteMusic() {
             const userResponse = await supabaseClient.auth.getUser(); // Correctly get user
             if (userResponse.error || !userResponse.data.user) {
                  alert('Müzik silmek için giriş yapmalısınız.');
                  return;
             }
             const currentUser = userResponse.data.user;

             const musicIdToDelete = deleteSelect.value;
             if (!musicIdToDelete) {
                 alert('Lütfen silinecek bir müzik seçin.');
                 return;
             }

             const musicNameToDelete = deleteSelect.options[deleteSelect.selectedIndex].text;
             if (!confirm(`"${musicNameToDelete}" adlı müziği silmek istediğinizden emin misiniz?`)) {
                 return;
             }

              const originalDeleteButtonText = deleteMusicBtn.innerHTML;
              deleteMusicBtn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Siliniyor...';
              deleteMusicBtn.disabled = true;

             try {
                 const { data: musicToDelete, error: fetchError } = await supabaseClient
                     .from('musics')
                     .select('id, audio_url, image_url, user_id')
                     .eq('id', musicIdToDelete)
                     .single();

                 if (fetchError || !musicToDelete) {
                      throw new Error(`Silinecek müzik bulunamadı: ${fetchError?.message || 'Bilinmeyen hata'}`);
                 }

                  // Check if the current user is the owner of the music
                  if (musicToDelete.user_id !== currentUser.id) {
                       alert("Sadece kendi eklediğiniz müzikleri silebilirsiniz.");
                       deleteMusicBtn.innerHTML = originalDeleteButtonText;
                       deleteMusicBtn.disabled = false;
                       return;
                  }

                 const filesToRemove = [];
                 const storageBaseUrl = `${SUPABASE_URL}/storage/v1/object/public/music-files/`;

                 if (musicToDelete.audio_url && musicToDelete.audio_url.startsWith(storageBaseUrl)) {
                      const audioFilePath = decodeURIComponent(musicToDelete.audio_url.substring(storageBaseUrl.length));
                      if(audioFilePath) filesToRemove.push(audioFilePath);
                 }
                 if (musicToDelete.image_url && musicToDelete.image_url.startsWith(storageBaseUrl)) {
                      const imageFilePath = decodeURIComponent(musicToDelete.image_url.substring(storageBaseUrl.length));
                      if(imageFilePath) filesToRemove.push(imageFilePath);
                 }

                 const { error: dbDeleteError } = await supabaseClient
                     .from('musics')
                     .delete()
                     .eq('id', musicIdToDelete);

                 if (dbDeleteError) {
                     throw new Error(`Veritabanından silme hatası: ${dbDeleteError.message}`);
                 }
                 console.log(`Müzik ID ${musicIdToDelete} veritabanından silindi.`);

                  if (filesToRemove.length > 0) {
                      console.log("Depolamadan silinecek dosyalar:", filesToRemove);
                      const { data: deleteData, error: storageDeleteError } = await supabaseClient.storage
                          .from('music-files')
                          .remove(filesToRemove);
                      if (storageDeleteError) {
                          console.error('Depolama alanından silinirken hata oluştu (veritabanı kaydı silindi):', storageDeleteError);
                          // Not throwing error here as DB record is already deleted
                      } else {
                           console.log(`Dosyalar başarıyla silindi:`, deleteData);
                       }
                  }

                 const wasCurrentMusicDeleted = (currentMusicId === musicIdToDelete);
                 if (wasCurrentMusicDeleted) {
                     audioPlayer.pause();
                     audioPlayer.src = '';
                     currentMusicId = null; currentMusicIndex = -1;
                 }

                 await renderMusics(); // Re-render the lists

                 alert(`"${musicNameToDelete}" başarıyla silindi!`);

                  if (wasCurrentMusicDeleted && musicData.length > 0) {
                      loadAndPlayMusic(0); // Play the first song if current was deleted and list not empty
                  } else {
                      updatePlayerUIState(); // Update UI if no songs left or different song is now "first"
                  }

             } catch (error) {
                 console.error('Müzik silinirken hata oluştu: ', error);
                 alert(`Müzik silinemedi: ${error.message}`);
             } finally {
                 deleteMusicBtn.innerHTML = originalDeleteButtonText;
                 deleteMusicBtn.disabled = false;
             }
        }


        // --- Admin Panel Visibility & Auth State Handling ---
        function showAdminPanel() {
             adminPanelDiv.classList.remove('hidden');
             adminPanelDiv.classList.add('flex');
             if (!loginForm.classList.contains('hidden') && authEmailInput) authEmailInput.focus();
        }
        function closeAdminPanel() {
             adminPanelDiv.classList.add('hidden');
             adminPanelDiv.classList.remove('flex');
             // Clear inputs in admin panel
             document.getElementById('musicName').value = '';
             document.getElementById('musicFile').value = '';
             document.getElementById('musicImage').value = '';
             if(deleteSelect) deleteSelect.value = "";
             if(authEmailInput) authEmailInput.value = '';
             if(authPassInput) authPassInput.value = '';
        }

        supabaseClient.auth.onAuthStateChange((event, session) => {
            console.log("Auth state changed:", event, session);
            if (session) {
                loginForm.classList.add('hidden'); loginForm.classList.remove('flex');
                adminControlsDiv.classList.remove('hidden'); adminControlsDiv.classList.add('flex');
                if(loggedInUserEmailSpan && session.user && session.user.email) {
                     loggedInUserEmailSpan.textContent = `Giriş Yapıldı: ${session.user.email}`;
                } else if (loggedInUserEmailSpan) {
                     loggedInUserEmailSpan.textContent = 'Giriş Yapıldı';
                }
            } else {
                loginForm.classList.remove('hidden'); loginForm.classList.add('flex');
                adminControlsDiv.classList.add('hidden'); adminControlsDiv.classList.remove('flex');
                if(loggedInUserEmailSpan) loggedInUserEmailSpan.textContent = '';
            }
        });

        // --- Supabase Authentication Functions ---
        async function signIn() {
            const email = authEmailInput.value.trim();
            const password = authPassInput.value.trim();
            if (!email || !password) {
                alert("Lütfen email ve şifreyi girin."); return;
            }
            signInBtn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Giriş Yapılıyor...';
            signInBtn.disabled = true;
            const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
            signInBtn.innerHTML = '<i class="fa fa-sign-in-alt"></i> Giriş Yap';
            signInBtn.disabled = false;
            if (error) alert(`Giriş başarısız: ${error.message}`);
            else { authEmailInput.value = ''; authPassInput.value = ''; }
        }
        async function signOut() {
            signOutBtn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Çıkılıyor...';
            signOutBtn.disabled = true;
            const { error } = await supabaseClient.auth.signOut();
            signOutBtn.innerHTML = '<i class="fa fa-sign-out-alt"></i> Çıkış Yap';
            signOutBtn.disabled = false;
            if (error) alert(`Çıkış başarısız: ${error.message}`);
        }


        // --- Search Functionality ---
        function toggleSearch(showSearch) {
            isSearchActive = showSearch;
            if (showSearch) {
                searchArea.classList.remove('hidden');
                mainContentArea.classList.add('hidden'); // Hide main content like "Merhaba"
                searchInput.focus();
                renderMusics(searchInput.value); // Initial search render if any text already in input
                homeButton.classList.remove('active-link'); // Deactivate home button
                sidebarSearchButton.classList.add('active-link'); // Activate search button
            } else {
                searchArea.classList.add('hidden');
                mainContentArea.classList.remove('hidden');
                searchResultsContainer.innerHTML = ''; // Clear search results
                searchInput.value = ''; // Clear search input
                sidebarSearchButton.classList.remove('active-link'); // Deactivate search
                homeButton.classList.add('active-link'); // Activate home
                renderMusics(); // Re-render the main page content
            }
        }

        function renderSearchResults(results) {
            searchResultsContainer.innerHTML = ''; // Clear previous results
            if (results.length === 0) {
                searchResultsContainer.innerHTML = '<p class="text-gray-400 text-center p-4">Sonuç bulunamadı.</p>';
                return;
            }
            results.forEach(music => {
                const item = document.createElement('div');
                item.className = 'search-result-item'; // Tailwind classes in CSS
                item.innerHTML = `
                    <img src="${music.image_url || 'https://placehold.co/40x40/7f9cf5/ffffff?text=♪'}" alt="${music.name}">
                    <span>${music.name}</span>
                `;
                item.onclick = () => {
                    const musicIndex = musicData.findIndex(m => m.id === music.id); // musicData should be the full list here
                    if(musicIndex !== -1) {
                        // We need to fetch the full musicData again if search filtered it, or pass the full object
                        // For simplicity, assuming loadAndPlayMusic can handle an ID directly
                        // Or, ensure musicData isn't overwritten by search-filtered data globally
                        // The current renderMusics call with search term updates musicData, so this should work
                        loadAndPlayMusic(music.id); // Pass ID directly
                        toggleSearch(false); // Hide search after selection
                    } else {
                        // Fallback: refetch all and then play. This ensures musicData is complete.
                        renderMusics().then(() => {
                            const newIndex = musicData.findIndex(m => m.id === music.id);
                            if (newIndex !== -1) loadAndPlayMusic(newIndex);
                            toggleSearch(false);
                        });
                    }
                };
                searchResultsContainer.appendChild(item);
            });
        }


        // --- Event Listeners ---
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
        if (seekBar) seekBar.addEventListener('input', seek); // 'input' for live seeking
        if (volumeBar) volumeBar.addEventListener('input', changeVolume);
        if (volumeIcon) volumeIcon.addEventListener('click', toggleMute);
        if (prevBtn) prevBtn.addEventListener('click', playPrevious);
        if (nextBtn) nextBtn.addEventListener('click', playNext);

        // Search Listeners
        if (sidebarSearchButton) {
            sidebarSearchButton.addEventListener('click', (e) => {
                e.preventDefault();
                toggleSearch(true);
            });
        }
        if (homeButton) { // Assuming home button takes you out of search
            homeButton.addEventListener('click', (e) => {
                e.preventDefault();
                if(isSearchActive) toggleSearch(false);
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
