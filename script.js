// --- Supabase Setup ---
// !! Buraya kendi Supabase Proje URL ve Public Anon Key bilgilerini GİRİN !!
const SUPABASE_URL = 'https://skhbykqwdbwjcvqmwvft.supabase.co'; // <-- KENDİ URL'NİZİ GİRİN
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNraGJ5a3F3ZGJ3amN2cW13dmZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU3Nzg0NDYsImV4cCI6MjA2MTM1NDQ0Nn0.e8pbfF7O_rTtSKxtFzzc_zZTsegsxsNaluHNFBbWbMs'; // <-- KENDİ ANON KEY'İNİZİ GİRİN
// !! Supabase bilgilerini GİRDİĞİNİZDEN EMİN OLUN !!

// Supabase istemcisini tutacak değişkeni tanımlıyoruz
let supabaseClient;

// Tüm kodumuzu DOMContentLoaded olay dinleyicisi içine alıyoruz
document.addEventListener('DOMContentLoaded', async () => {
    console.log("DOMContentLoaded olayı tetiklendi. Script çalışıyor...");

    // Supabase kütüphanesinin global olarak tanımladığı 'supabase' objesine erişmeye çalışıyoruz
    try {
        // window.supabase varlığını kontrol edelim
        if (typeof window.supabase === 'undefined') {
            console.error("Hata: window.supabase tanımlanmamış. Supabase kütüphanesi yüklenemedi veya çalışmadı.");
            alert("Supabase kütüphanesi yüklenirken bir sorun oluştu.");
            return; // Eğer global Supabase objesi yoksa daha fazla ilerleme
        }

        // Supabase istemcisini DOĞRUDAN window.supabase objesinden oluşturuyoruz
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log("Supabase istemcisi başarıyla oluşturuldu.");

        // --- DOM Elements ---
        // DOM elementlerine burada erişiyoruz çünkü DOMContentLoaded tetiklendi
        const musicListDesktop = document.getElementById('musicListDesktop');
        const musicListMobile = document.getElementById('musicListMobile');
        const mobileMusicListModal = document.getElementById('mobileMusicListModal');
        const audioPlayer = document.getElementById('audioPlayer');
        const coverImage = document.getElementById('coverImage');
        const deleteSelect = document.getElementById('deleteSelect');
        const adminButton = document.getElementById('adminButton');
        const adminPanelDiv = document.getElementById('adminPanel');
        const adminControlsDiv = document.getElementById('adminControls');
        const loginForm = document.getElementById('loginForm');
        const songCountDesktop = document.getElementById('songCountDesktop');
        const currentSongTitleElement = document.getElementById('currentSongTitle');

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

        // State Variables
        const defaultCover = 'https://placehold.co/300x300/e2e8f0/94a3b8?text=Müzik+Seçin';
        let currentMusicId = null; // ID of the currently loaded music (Supabase ID)
        let currentMusicIndex = -1; // Index in the currently rendered musicData array
        let musicData = []; // Array to hold the current list of music objects from Supabase
        let lastVolume = 1; // Store volume before mute


        // --- Helper Functions ---
        function formatTime(seconds) {
            if (isNaN(seconds) || seconds < 0 || !isFinite(seconds)) return "0:00";
            const minutes = Math.floor(seconds / 60);
            const secs = Math.floor(seconds % 60);
            return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
        }

        function updateVolumeIcon(volume) {
             if (volume === 0) {
                volumeIcon.className = 'fa fa-volume-xmark text-gray-600 hover:text-gray-900 cursor-pointer w-5 text-center';
            } else if (volume < 0.5) {
                volumeIcon.className = 'fa fa-volume-low text-gray-600 hover:text-gray-900 cursor-pointer w-5 text-center';
            } else {
                volumeIcon.className = 'fa fa-volume-high text-gray-600 hover:text-gray-900 cursor-pointer w-5 text-center';
            }
        }

        function updatePlayerUIState() {
            const hasMultipleSongs = musicData.length > 1;
            prevBtn.disabled = !hasMultipleSongs;
            nextBtn.disabled = !hasMultipleSongs;

            if (audioPlayer.paused) {
                playPauseIcon.className = 'fa fa-play fa-lg';
            } else {
                playPauseIcon.className = 'fa fa-pause fa-lg';
            }

            if (currentMusicId === null) {
                currentTimeSpan.textContent = "0:00"; totalDurationSpan.textContent = "0:00";
                seekBar.value = 0; seekBar.style.setProperty('--progress', `0%`);
                seekBar.disabled = true;
                if(currentSongTitleElement) currentSongTitleElement.textContent = "Müzik Seçin";
            } else {
                seekBar.disabled = false;
            }
        }

        function togglePlayPause() {
            if (!audioPlayer.src || currentMusicId === null) return;
            if (audioPlayer.paused) {
                audioPlayer.play().catch(e => console.error("Oynatma hatası:", e));
            } else {
                audioPlayer.pause();
            }
        }

        // --- Buraya console.log ekledik ---
        function updateSeekBar() {
            console.log('timeupdate olayı tetiklendi. currentTime:', audioPlayer.currentTime, 'duration:', audioPlayer.duration); // <-- Bu satır eklendi

            if (audioPlayer.duration && isFinite(audioPlayer.duration)) {
                const percentage = (audioPlayer.currentTime / audioPlayer.duration) * 100;
                seekBar.value = percentage;
                // Update CSS variable for progress fill
                seekBar.style.setProperty('--progress', `${percentage}%`);
                currentTimeSpan.textContent = formatTime(audioPlayer.currentTime);
            } else {
                 seekBar.value = 0; seekBar.style.setProperty('--progress', `0%`);
                 currentTimeSpan.textContent = formatTime(0);
            }
        }

        function setDuration() {
             if (audioPlayer.duration && isFinite(audioPlayer.duration)) {
                totalDurationSpan.textContent = formatTime(audioPlayer.duration);
                seekBar.value = 0; seekBar.style.setProperty('--progress', `0%`);
                currentTimeSpan.textContent = formatTime(0);
            } else {
                totalDurationSpan.textContent = "0:00"; currentTimeSpan.textContent = "0:00";
                seekBar.value = 0; seekBar.style.setProperty('--progress', `0%`);
            }
        }

        function seek() {
            if (!audioPlayer.src || !audioPlayer.duration || !isFinite(audioPlayer.duration)) return;
            const time = (seekBar.value / 100) * audioPlayer.duration;
            audioPlayer.currentTime = time;
            seekBar.style.setProperty('--progress', `${seekBar.value}%`);
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
                audioPlayer.volume = 0; volumeBar.value = 0;
                updateVolumeIcon(0);
            } else {
                audioPlayer.volume = lastVolume;
                volumeBar.value = lastVolume;
                updateVolumeIcon(lastVolume);
            }
        }

        function loadAndPlayMusic(index) {
            if (index < 0 || index >= musicData.length) {
                console.log("Geçersiz müzik indexi:", index);
                 audioPlayer.pause(); audioPlayer.src = ''; coverImage.src = defaultCover;
                 currentMusicId = null; currentMusicIndex = -1;
                 if(currentSongTitleElement) currentSongTitleElement.textContent = "Müzik Seçin";
                 updatePlayerUIState();
                return;
            }

            const music = musicData[index];
            console.log(`Yükleniyor: ${music.name} (ID: ${music.id}, Index: ${index})`);

            audioPlayer.src = music.audio_url;
            coverImage.src = music.image_url || defaultCover;

            currentMusicId = music.id;
            currentMusicIndex = index;
            if(currentSongTitleElement) currentSongTitleElement.textContent = music.name;

            document.querySelectorAll('#musicListDesktop .music-item').forEach((item, idx) => {
                item.classList.toggle('bg-indigo-600', item.dataset.id === currentMusicId.toString());
                item.classList.toggle('bg-gray-800', item.dataset.id !== currentMusicId.toString());
                if (item.dataset.id === currentMusicId.toString()) {
                    item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
            });
             document.querySelectorAll('#musicListMobile .music-item').forEach((item, idx) => {
                item.classList.toggle('bg-indigo-600', item.dataset.id === currentMusicId.toString());
                item.classList.toggle('bg-gray-800', item.dataset.id !== currentMusicId.toString());
                 if (item.dataset.id === currentMusicId.toString()) {
                    item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                 }
            });

            audioPlayer.load();
            audioPlayer.play().catch(e => {
                console.error("Otomatik oynatma engellendi veya hata:", e);
                playPauseIcon.className = 'fa fa-play fa-lg';
            });
            updatePlayerUIState();
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

        // --- Mobile Music List Modal Control ---
        function toggleMobileMusicList() {
             const modal = document.getElementById('mobileMusicListModal');
             if (modal) { modal.classList.toggle('open'); } else { console.error("Mobile music list modal element not found!"); }
        }
        function openMobileMusicList() {
             const modal = document.getElementById('mobileMusicListModal');
             if (modal) { modal.classList.add('open'); } else { console.error("Mobile music list modal element not found!"); }
        }
        function closeMobileMusicList() {
             const modal = document.getElementById('mobileMusicListModal');
             if (modal) { modal.classList.remove('open'); } else { console.error("Mobile music list modal element not found!"); }
        }


        // --- Render Music List (Fetch from Supabase) ---
        async function renderMusics() {
            if (!supabaseClient) {
                console.error("Supabase istemcisi henüz hazır değil (renderMusics içinde).");
                 const errorMessage = '<p class="text-red-400 text-center mt-4">Supabase bağlantısı kurulamadı.</p>';
                 if (musicListDesktop) musicListDesktop.innerHTML = errorMessage;
                 if (musicListMobile) musicListMobile.innerHTML = errorMessage;
                 updatePlayerUIState();
                 return;
            }
             console.log("renderMusics çalışıyor...");

            if (musicListDesktop) musicListDesktop.innerHTML = '';
            if (musicListMobile) musicListMobile.innerHTML = '';
            if (deleteSelect) deleteSelect.innerHTML = '<option value="" disabled selected>Silmek için seçin...</option>';
            musicData = [];

            try {
                const { data, error } = await supabaseClient
                    .from('musics')
                    .select('id, name, audio_url, image_url')
                    .order('created_at', { ascending: false });

                if (error) {
                    console.error('Supabase fetch error:', error);
                    const errorMessage = '<p class="text-red-400 text-center mt-4">Müzikler yüklenemedi: ' + error.message + '</p>';
                    if (musicListDesktop) musicListDesktop.innerHTML = errorMessage;
                    if (musicListMobile) musicListMobile.innerHTML = errorMessage;
                    updatePlayerUIState();
                    return;
                }

                musicData = data || [];
                console.log(`Bulunan müzik sayısı: ${musicData.length}`);

                if (songCountDesktop) songCountDesktop.textContent = `${musicData.length} Şarkı`;

                if (musicData.length === 0) {
                    const noMusicMessage = '<p class="text-gray-400 text-center mt-4">Henüz müzik eklenmemiş.</p>';
                    if (musicListDesktop) musicListDesktop.innerHTML = noMusicMessage;
                    if (musicListMobile) musicListMobile.innerHTML = noMusicMessage;
                    if (currentMusicId !== null) {
                        audioPlayer.pause(); audioPlayer.src = ''; coverImage.src = defaultCover;
                        currentMusicId = null; currentMusicIndex = -1;
                    }
                    if(currentSongTitleElement) currentSongTitleElement.textContent = "Müzik Seçin";
                    updatePlayerUIState();
                    return;
                }

                const currentSongIndexInNewList = musicData.findIndex(music => music.id === currentMusicId);
                if(currentSongIndexInNewList !== -1) {
                    currentMusicIndex = currentSongIndexInNewList;
                } else {
                    currentMusicId = null; currentMusicIndex = -1;
                     if (!audioPlayer.paused || audioPlayer.currentTime > 0) {
                         audioPlayer.pause(); audioPlayer.src = ''; coverImage.src = defaultCover;
                         if(currentSongTitleElement) currentSongTitleElement.textContent = "Müzik Seçin";
                     }
                }

                musicData.forEach((music, index) => {
                    const createMusicItem = () => {
                         const div = document.createElement('div');
                         div.className = `music-item flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all transform hover:scale-[1.03] ${music.id === currentMusicId ? 'bg-indigo-600' : 'bg-gray-800 hover:bg-indigo-700'}`;
                         div.dataset.id = music.id;

                         const img = document.createElement('img');
                         img.src = music.image_url || 'https://placehold.co/60x60/7f9cf5/ffffff?text=♪';
                         img.alt = "Kapak"; img.className = "w-12 h-12 rounded-md object-cover flex-shrink-0";
                         img.onerror = () => img.src = 'https://placehold.co/60x60/7f9cf5/ffffff?text=♪';
                         div.appendChild(img);

                         const title = document.createElement('span');
                         title.className = "font-medium truncate flex-grow";
                         title.innerText = music.name;
                         div.appendChild(title);

                         div.onclick = () => {
                             const clickedIndex = musicData.findIndex(item => item.id === music.id);
                             if (clickedIndex !== -1) {
                                loadAndPlayMusic(clickedIndex);
                                closeMobileMusicList();
                             } else {
                                 console.error("Tıklanan müzik listede bulunamadı:", music.id);
                             }
                         };
                         return div;
                    };

                    if (musicListDesktop) musicListDesktop.appendChild(createMusicItem());
                    if (musicListMobile) musicListMobile.appendChild(createMusicItem());
                    if (deleteSelect) {
                        const option = document.createElement('option');
                        option.value = music.id;
                        option.text = music.name;
                        deleteSelect.appendChild(option);
                    }
                });

                 if (currentMusicId !== null && currentMusicIndex !== -1) {
                     document.querySelectorAll('.music-item').forEach(item => {
                         item.classList.toggle('bg-indigo-600', item.dataset.id === currentMusicId.toString());
                         item.classList.toggle('bg-gray-800', item.dataset.id !== currentMusicId.toString());
                     });
                     updatePlayerUIState();
                 } else {
                      updatePlayerUIState();
                 }

            } catch (error) {
                console.error("renderMusics içinde hata:", error);
                 const errorMessage = '<p class="text-red-400 text-center mt-4">Müzik listesini yüklerken bir sorun oluştu.</p>';
                if (musicListDesktop) musicListDesktop.innerHTML = errorMessage;
                if (musicListMobile) musicListMobile.innerHTML = errorMessage;
                updatePlayerUIState();
            }
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

             const addButton = document.getElementById('addMusicBtn');
             const originalButtonText = addButton.innerHTML;
             addButton.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Ekleniyor...';
             addButton.disabled = true;

             let audioUrl = null;
             let imageUrl = null;
             const filesToRemoveOnError = [];

             try {
                 const userId = user.data.user.id;
                 const audioFileName = `${userId}/${Date.now()}_${audioFile.name.replace(/\s+/g, '_')}`;
                 const audioFilePath = `public/${audioFileName}`;
                 filesToRemoveOnError.push(audioFilePath);

                 const { data: audioUploadData, error: audioUploadError } = await supabaseClient.storage
                     .from('music-files')
                     .upload(audioFilePath, audioFile);

                 if (audioUploadError) {
                     throw new Error(`Ses dosyası yükleme hatası: ${audioUploadError.message}`);
                 }

                 const { data: publicAudioUrlData } = supabaseClient.storage
                     .from('music-files')
                     .getPublicUrl(audioFilePath);
                 audioUrl = publicAudioUrlData.publicUrl;

                 if (imageFile) {
                      if (imageFile.size > 5 * 1024 * 1024) {
                         throw new Error("Resim dosyası çok büyük! (Maksimum 5MB)");
                     }
                     const imageFileName = `${userId}/${Date.now()}_${imageFile.name.replace(/\s+/g, '_')}`;
                     const imageFilePath = `public/${imageFileName}`;
                     filesToRemoveOnError.push(imageFilePath);

                     const { data: imageUploadData, error: imageUploadError } = await supabaseClient.storage
                         .from('music-files')
                         .upload(imageFilePath, imageFile);

                     if (imageUploadError) {
                          throw new Error(`Resim dosyası yükleme hatası: ${imageUploadError.message}`);
                     }
                     const { data: publicImageUrlData } = supabaseClient.storage
                         .from('music-files')
                         .getPublicUrl(imageFilePath);
                     imageUrl = publicImageUrlData.publicUrl;
                 }

                 const { data: musicInsertData, error: musicInsertError } = await supabaseClient
                     .from('musics')
                     .insert([{
                         name: name,
                         audio_url: audioUrl,
                         image_url: imageUrl,
                         user_id: userId
                     }])
                     .select();

                 if (musicInsertError) {
                      throw new Error(`Veritabanına kayıt hatası: ${musicInsertError.message}`);
                 }

                 console.log("Müzik başarıyla eklendi:", name, musicInsertData);
                 renderMusics();
                 nameInput.value = '';
                 fileInput.value = '';
                 imageInput.value = '';
                 alert('Müzik başarıyla eklendi!');

             } catch (error) {
                 console.error('Müzik eklenirken hata oluştu: ', error.message);
                 alert(`Müzik eklenemedi: ${error.message}`);

                  if (filesToRemoveOnError.length > 0) {
                      console.log("Hata oluştu, yüklenen dosyalar siliniyor:", filesToRemoveOnError);
                       const { error: cleanupError } = await supabaseClient.storage
                          .from('music-files')
                          .remove(filesToRemoveOnError);
                       if (cleanupError) {
                          console.error("Dosya temizleme hatası:", cleanupError);
                       } else {
                           console.log("Yüklenen dosyalar başarıyla temizlendi.");
                       }
                  }

             } finally {
                 addButton.innerHTML = originalButtonText;
                 addButton.disabled = false;
             }
        }

        // --- Delete Music (Delete from DB & Remove from Storage) ---
        async function deleteMusic() {
             const user = await supabaseClient.auth.getUser();
             if (user.error || !user.data.user) {
                  alert('Müzik silmek için giriş yapmalısınız.');
                  return;
             }

             const musicIdToDelete = deleteSelect.value;

             if (!musicIdToDelete) {
                 alert('Lütfen silinecek bir müzik seçin.');
                 return;
             }

             const musicNameToDelete = deleteSelect.options[deleteSelect.selectedIndex].text;
             if (!confirm(`"${musicNameToDelete}" adlı müziği silmek istediğinizden emin misiniz?`)) {
                 return;
             }

              const deleteButton = document.getElementById('deleteMusicBtn');
              const originalDeleteButtonText = deleteButton.innerHTML;
              deleteButton.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Siliniyor...';
              deleteButton.disabled = true;

             try {
                 const { data: musicToDelete, error: fetchError } = await supabaseClient
                     .from('musics')
                     .select('id, audio_url, image_url, user_id')
                     .eq('id', musicIdToDelete)
                     .single();

                 if (fetchError || !musicToDelete) {
                      console.error('Silinecek müzik bilgisi alınamadı:', fetchError?.message);
                      throw new Error(`Silinecek müzik bulunamadı veya erişim reddedildi: ${fetchError?.message}`);
                 }

                  const user = await supabaseClient.auth.getUser();
                  if (musicToDelete.user_id && user.data?.user?.id && musicToDelete.user_id !== user.data.user.id) {
                       alert("Sadece kendi eklediğiniz müzikleri silebilirsiniz.");
                        deleteButton.innerHTML = originalDeleteButtonText;
                        deleteButton.disabled = false;
                        return;
                  }

                 const filesToRemove = [];
                 const baseUrl = `${SUPABASE_URL}/storage/v1/object/public/music-files/`;

                 if (musicToDelete?.audio_url && musicToDelete.audio_url.startsWith(baseUrl)) {
                      const audioFilePath = musicToDelete.audio_url.substring(baseUrl.length);
                      if(audioFilePath) filesToRemove.push(audioFilePath);
                  }

                 if (musicToDelete?.image_url && musicToDelete.image_url.startsWith(baseUrl)) {
                      const imageFilePath = musicToDelete.image_url.substring(baseUrl.length);
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
                      const { error: storageDeleteError } = await supabaseClient.storage
                          .from('music-files')
                          .remove(filesToRemove);

                      if (storageDeleteError) {
                          console.error('Depolama alanından silinirken hata oluştu (veritabanı kaydı silindi):', storageDeleteError);
                      } else {
                           console.log(`Dosyalar başarıyla silindi: ${filesToRemove.join(', ')}`);
                       }
                  }

                 const wasCurrentMusicDeleted = (currentMusicId === musicIdToDelete);

                 if (wasCurrentMusicDeleted) {
                     audioPlayer.pause(); audioPlayer.src = ''; coverImage.src = defaultCover;
                     currentMusicId = null; currentMusicIndex = -1;
                     if(currentSongTitleElement) currentSongTitleElement.textContent = "Müzik Seçin";
                 }

                 await renderMusics();

                 alert(`"${musicNameToDelete}" başarıyla silindi!`);

                  if (wasCurrentMusicDeleted && musicData.length > 0) {
                      loadAndPlayMusic(0);
                  } else if (musicData.length === 0) {
                      updatePlayerUIState();
                  }

             } catch (error) {
                 console.error('Müzik silinirken hata oluştu: ', error.message);
                 alert(`Müzik silinemedi: ${error.message}`);
             } finally {
                  deleteButton.innerHTML = originalDeleteButtonText;
                 deleteButton.disabled = false;
             }
        }


        // --- Admin Panel Visibility & Auth State Handling ---

        function showAdminPanel() {
             adminPanelDiv.classList.remove('hidden');
             adminPanelDiv.classList.add('flex');
              if (!loginForm.classList.contains('hidden') && authEmailInput) {
                 authEmailInput.focus();
              }
        }

        function closeAdminPanel() {
             adminPanelDiv.classList.add('hidden');
             adminPanelDiv.classList.remove('flex');
             document.getElementById('musicName').value = '';
             document.getElementById('musicFile').value = '';
             document.getElementById('musicImage').value = '';
             deleteSelect.value = "";
              if(authEmailInput) authEmailInput.value = '';
              if(authPassInput) authPassInput.value = '';
        }

        supabaseClient.auth.onAuthStateChange((event, session) => {
            console.log("Auth state changed:", event, session);
            if (session) {
                loginForm.classList.add('hidden'); loginForm.classList.remove('flex', 'space-y-4');
                adminControlsDiv.classList.remove('hidden'); adminControlsDiv.classList.add('flex', 'flex-col', 'space-y-4');
                 if(loggedInUserEmailSpan && session.user && session.user.email) {
                     loggedInUserEmailSpan.textContent = `Giriş Yapıldı: ${session.user.email}`;
                 } else if (loggedInUserEmailSpan) {
                     loggedInUserEmailSpan.textContent = 'Giriş Yapıldı (Email Yok)';
                 }
            } else {
                loginForm.classList.remove('hidden'); loginForm.classList.add('flex', 'flex-col', 'space-y-4');
                adminControlsDiv.classList.add('hidden'); adminControlsDiv.classList.remove('flex', 'flex-col', 'space-y-4');
                if(loggedInUserEmailSpan) {
                    loggedInUserEmailSpan.textContent = '';
                }
            }
        });


        // --- Supabase Authentication Functions ---

        async function signIn() {
            const email = authEmailInput.value.trim();
            const password = authPassInput.value.trim();

            if (!email || !password) {
                alert("Lütfen email ve şifreyi girin.");
                return;
            }

            signInBtn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Giriş Yapılıyor...';
            signInBtn.disabled = true;

            const { data, error } = await supabaseClient.auth.signInWithPassword({
                email: email,
                password: password,
            });

            signInBtn.innerHTML = '<i class="fa fa-sign-in-alt"></i> Giriş Yap';
            signInBtn.disabled = false;

            if (error) {
                console.error("Giriş hatası:", error.message);
                alert(`Giriş başarısız: ${error.message}`);
            } else {
                console.log("Giriş başarılı!", data.user);
                authEmailInput.value = '';
                authPassInput.value = '';
            }
        }

        async function signOut() {
             signOutBtn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Çıkılıyor...';
             signOutBtn.disabled = true;

            const { error } = await supabaseClient.auth.signOut();

             signOutBtn.innerHTML = '<i class="fa fa-sign-out-alt"></i> Çıkış Yap';
             signOutBtn.disabled = false;


            if (error) {
                console.error("Çıkış hatası:", error.message);
                alert(`Çıkış başarısız: ${error.message}`);
            } else {
                console.log("Başarıyla çıkış yapıldı.");
            }
        }


        // --- Event Listeners for Auth Buttons and Admin Button ---

        if (adminButton) { adminButton.addEventListener('click', showAdminPanel); } else { console.error("Admin button element not found!"); }
        if(signInBtn) signInBtn.addEventListener('click', signIn);
        if(signOutBtn) signOutBtn.addEventListener('click', signOut);

        // Player control listeners
        if(playPauseBtn) playPauseBtn.addEventListener('click', togglePlayPause);
        if(prevBtn) prevBtn.addEventListener('click', playPrevious);
        if(nextBtn) nextBtn.addEventListener('click', playNext);
        if(volumeBar) volumeBar.addEventListener('input', changeVolume);
        if(volumeIcon) volumeIcon.addEventListener('click', toggleMute);
        if(seekBar) { seekBar.addEventListener('input', seek); }


        // Modal close listeners
        const closeMobileListBtn = document.getElementById('closeMobileListBtn');
        if(closeMobileListBtn) closeMobileListBtn.addEventListener('click', closeMobileMusicList);
        const closeAdminPanelBtn = document.getElementById('closeAdminPanelBtn');
        if(closeAdminPanelBtn) closeAdminPanelBtn.addEventListener('click', closeAdminPanel);

        // Add/Delete button listeners
         const addMusicBtn = document.getElementById('addMusicBtn');
         if(addMusicBtn) addMusicBtn.addEventListener('click', addMusic);

         const deleteMusicBtn = document.getElementById('deleteMusicBtn');
         if(deleteMusicBtn) deleteMusicBtn.addEventListener('click', deleteMusic);


        // --- Initial Setup ---
        coverImage.src = defaultCover;
        volumeBar.value = audioPlayer.volume;
        updateVolumeIcon(audioPlayer.volume);
        updatePlayerUIState();

        // Initial fetch and render of music list from Supabase (DOMContentLoaded içinde)
        renderMusics();


    } catch (error) {
        console.error("DOMContentLoaded içinde yakalanan genel hata:", error);
        alert("Uygulama başlatılırken beklenmeyen bir hata oluştu. Konsolu kontrol edin.");
    }
});

// Mobile menu button listener (HTML'de varsa ve DOMContentLoaded dışında tanımlanmalı)
// const mobileMenuButton = document.getElementById('mobileMenuButton');
// if (mobileMenuButton) {
//     mobileMenuButton.addEventListener('click', openMobileMusicList);
// }
