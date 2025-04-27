// --- Supabase Setup ---
// !! Buraya kendi Supabase Proje URL ve Public Anon Key bilgilerini GİRİN !!
const SUPABASE_URL = 'YOUR_SUPABASE_URL'; // <-- KENDİ URL'NİZİ GİRİN
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY'; // <-- KENDİ ANON KEY'İNİZİ GİRİN
// !! Supabase bilgilerini GİRDİĞİNİZDEN EMİN OLUN !!

// Supabase istemcisini burada tanımlıyoruz
let supabaseClient; // İsim çakışmasını önlemek için farklı bir isim kullanalım

// Tüm kodumuzu DOMContentLoaded olay dinleyicisi içine alıyoruz
document.addEventListener('DOMContentLoaded', async () => {
    console.log("DOMContentLoaded olayı tetiklendi. Script çalışıyor...");

    // Supabase istemcisini burada oluşturuyoruz, DOĞRUDAN window.supabase kullanarak
    try {
        // Supabase kütüphanesinin global olarak tanımladığı 'supabase' objesini kullanıyoruz
        if (typeof window.supabase === 'undefined') {
            console.error("Hata: window.supabase tanımlanmamış. Supabase kütüphanesi yüklenemedi veya çalışmadı.");
            alert("Supabase kütüphanesi yüklenirken bir sorun oluştu.");
            return; // Eğer supabase objesi yoksa daha fazla ilerleme
        }
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log("Supabase istemcisi başarıyla oluşturuldu.");

        // Şimdi kodun geri kalanını DOMContentLoaded listener'ının içine taşıyoruz
        // Tüm fonksiyon tanımları (renderMusics, addMusic, deleteMusic, signIn, signOut, showAdminPanel, closeAdminPanel vb.)
        // ve event listener atamaları buraya gelecek.
        // Önceki script.js dosyasının içindeki TÜM kod bu listener'ın içine girmeli.

        // --- DOM Elements ---
        const musicListDesktop = document.getElementById('musicListDesktop');
        const musicListMobile = document.getElementById('musicListMobile');
        const mobileMusicListModal = document.getElementById('mobileMusicListModal');
        const audioPlayer = document.getElementById('audioPlayer');
        const coverImage = document.getElementById('coverImage');
        const deleteSelect = document.getElementById('deleteSelect');
        const adminButton = document.getElementById('adminButton'); // Admin button referansı
        const adminPanelDiv = document.getElementById('adminPanel'); // Admin panel modalı
        const adminControlsDiv = document.getElementById('adminControls'); // Admin controls div
        const loginForm = document.getElementById('loginForm'); // Login form div
        const songCountDesktop = document.getElementById('songCountDesktop'); // Desktop song count element
        const currentSongTitleElement = document.getElementById('currentSongTitle'); // Current song title element

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
        // Bu fonksiyonlar da DOMContentLoaded içinde tanımlanacak
        function formatTime(seconds) { /* ... kod ... */ }
        function updateVolumeIcon(volume) { /* ... kod ... */ }
        function updatePlayerUIState() { /* ... kod ... */ }
        function togglePlayPause() { /* ... kod ... */ }
        function updateSeekBar() { /* ... kod ... */ }
        function setDuration() { /* ... kod ... */ }
        function seek() { /* ... kod ... */ }
        function changeVolume() { /* ... kod ... */ }
        function toggleMute() { /* ... kod ... */ }
        function loadAndPlayMusic(index) { /* ... kod ... */ }
        function playNext() { /* ... kod ... */ }
        function playPrevious() { /* ... kod ... */ }

        // --- Mobile Music List Modal Control ---
        function toggleMobileMusicList() { /* ... kod ... */ }
        function openMobileMusicList() { /* ... kod ... */ }
        function closeMobileMusicList() { /* ... kod ... */ }

        // --- Render Music List (Fetch from Supabase) ---
        async function renderMusics() {
            // Supabase istemcisine supabaseClient değişkeni ile erişin
            if (!supabaseClient) {
                 console.error("Supabase istemcisi henüz hazır değil (renderMusics içinde).");
                  const errorMessage = '<p class="text-red-400 text-center mt-4">Supabase bağlantısı kurulamadı.</p>';
                 if (musicListDesktop) musicListDesktop.innerHTML = errorMessage;
                 if (musicListMobile) musicListMobile.innerHTML = errorMessage;
                 updatePlayerUIState();
                 return;
            }
             console.log("renderMusics çalışıyor...");


            // Clear previous lists and data
            if (musicListDesktop) musicListDesktop.innerHTML = '';
            if (musicListMobile) musicListMobile.innerHTML = '';
            if (deleteSelect) deleteSelect.innerHTML = '<option value="" disabled selected>Silmek için seçin...</option>';
            musicData = [];

            try {
                // Fetch data from the 'musics' table using supabaseClient
                const { data, error } = await supabaseClient
                    .from('musics')
                    .select('id, name, audio_url, image_url')
                    .order('created_at', { ascending: false });

                if (error) { /* ... hata yönetimi ... */
                     console.error('Supabase fetch error:', error);
                    const errorMessage = '<p class="text-red-400 text-center mt-4">Müzikler yüklenemedi: ' + error.message + '</p>';
                    if (musicListDesktop) musicListDesktop.innerHTML = errorMessage;
                    if (musicListMobile) musicListMobile.innerHTML = errorMessage;
                    updatePlayerUIState();
                    return;
                 }

                musicData = data || [];
                console.log(`Bulunan müzik sayısı: ${musicData.length}`);

                // Update song count
                 if (songCountDesktop) songCountDesktop.textContent = `${musicData.length} Şarkı`;


                if (musicData.length === 0) { /* ... müzik yok durumu ... */
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

                // Find current music index
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


                // Render music items
                musicData.forEach((music, index) => {
                    const createMusicItem = () => { /* ... element oluşturma kodu ... */
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

                 // Re-highlight active song and update player state
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
             // Check if user is logged in using supabaseClient
            const user = await supabaseClient.auth.getUser();
            if (user.error || !user.data.user) {
                 alert('Müzik eklemek için giriş yapmalısınız.');
                 return;
            }
            // ... (Kalan addMusic fonksiyon kodu aynı kalacak, supabase yerine supabaseClient kullanın)

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
             // Check if user is logged in using supabaseClient
            const user = await supabaseClient.auth.getUser();
             if (user.error || !user.data.user) {
                  alert('Müzik silmek için giriş yapmalısınız.');
                  return;
             }
            // ... (Kalan deleteMusic fonksiyon kodu aynı kalacak, supabase yerine supabaseClient kullanın)
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

        function showAdminPanel() { /* ... kod ... */
             adminPanelDiv.classList.remove('hidden');
             adminPanelDiv.classList.add('flex');
              if (!loginForm.classList.contains('hidden') && authEmailInput) {
                 authEmailInput.focus();
              }
        }

        function closeAdminPanel() { /* ... kod ... */
             adminPanelDiv.classList.add('hidden');
             adminPanelDiv.classList.remove('flex');
             document.getElementById('musicName').value = '';
             document.getElementById('musicFile').value = '';
             document.getElementById('musicImage').value = '';
             deleteSelect.value = "";
              if(authEmailInput) authEmailInput.value = '';
              if(authPassInput) authPassInput.value = '';
        }

        // Supabase Auth State Listener: supabase yerine supabaseClient kullanın
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
            // supabase yerine supabaseClient kullanın
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
            // supabase yerine supabaseClient kullanın
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

        // Player control listeners (already correct)
        if(playPauseBtn) playPauseBtn.addEventListener('click', togglePlayPause);
        if(prevBtn) prevBtn.addEventListener('click', playPrevious);
        if(nextBtn) nextBtn.addEventListener('click', playNext);
        if(volumeBar) volumeBar.addEventListener('input', changeVolume);
        if(volumeIcon) volumeIcon.addEventListener('click', toggleMute);
        if(seekBar) { seekBar.addEventListener('input', seek); }

        // Modal close listeners (already correct)
        const closeMobileListBtn = document.getElementById('closeMobileListBtn');
        if(closeMobileListBtn) closeMobileListBtn.addEventListener('click', closeMobileMusicList);
        const closeAdminPanelBtn = document.getElementById('closeAdminPanelBtn');
        if(closeAdminPanelBtn) closeAdminPanelBtn.addEventListener('click', closeAdminPanel);

        // Add/Delete button listeners (supabase yerine supabaseClient kullanın)
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
        // Eğer supabase = window.supabase.createClient(...) hatası burada olursa yakalanır
        alert("Uygulama başlatılırken beklenmeyen bir hata oluştu. Konsolu kontrol edin.");
    }
}); // DOMContentLoaded sonu


// Mobile menu button listener (HTML'de varsa ve DOMContentLoaded dışında tanımlanmalı)
// const mobileMenuButton = document.getElementById('mobileMenuButton');
// if (mobileMenuButton) {
//     mobileMenuButton.addEventListener('click', openMobileMusicList);
// }
