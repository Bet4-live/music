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
            throw new Error("Supabase SDK'sı yüklenemedi. CDN bağlantısını kontrol edin.");
        }
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log("Supabase istemcisi başarıyla oluşturuldu.");

        // --- DOM Elemanları ---
        const audioPlayer = document.getElementById('audioPlayer');
        const playPauseBtn = document.getElementById('playPauseBtn');
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        const progressBar = document.getElementById('progressBar');
        const timeDisplay = document.getElementById('timeDisplay');
        const volumeBar = document.getElementById('volumeBar');
        const volumeIcon = document.getElementById('volumeIcon');
        const musicList = document.getElementById('musicList');
        const coverImage = document.getElementById('coverImage');
        const songTitle = document.getElementById('songTitle');
        const artistName = document.getElementById('artistName');
        const songCountContainer = document.getElementById('songCountContainer');
        const songCountSpan = document.getElementById('songCount');
        const upcomingSongsContainer = document.getElementById('upcomingSongsContainer');
        const scrollLeftUpcoming = document.getElementById('scrollLeftUpcoming');
        const scrollRightUpcoming = document.getElementById('scrollRightUpcoming');
        const mobileMenuButton = document.getElementById('mobileMenuButton');
        const openMobileListBtn = document.getElementById('openMobileListBtn');
        const mobileMusicListModal = document.getElementById('mobileMusicListModal');
        const mobileMusicListContent = document.getElementById('mobileMusicListContent');
        const adminButton = document.getElementById('adminButton');
        const adminButtonMobile = document.getElementById('adminButtonMobile');
        const adminPanelModal = document.getElementById('adminPanelModal');
        const musicTitleInput = document.getElementById('musicTitleInput');
        const artistInput = document.getElementById('artistInput');
        const musicFileInput = document.getElementById('musicFileInput');
        const musicImageInput = document.getElementById('musicImageInput');
        const addMusicBtn = document.getElementById('addMusicBtn');
        const deleteSelect = document.getElementById('deleteSelect');
        const deleteMusicBtn = document.getElementById('deleteMusicBtn');
        const alertMessage = document.getElementById('alertMessage');
        const loadingOverlay = document.getElementById('loadingOverlay');
        const homeButton = document.getElementById('homeButton'); // Yeni eklendi
        const themeToggleButton = document.getElementById('themeToggleButton'); // Yeni eklendi
        const emptyStateMessage = document.getElementById('emptyStateMessage'); // Yeni eklendi

        // --- Global Değişkenler ---
        let currentMusicIndex = 0;
        let musics = [];
        let isPlaying = false;
        const defaultCover = 'default-cover.jpg'; // Varsayılan kapak resmi

        // --- Yardımcı Fonksiyonlar ---
        function showLoading() {
            loadingOverlay.classList.remove('hidden');
        }

        function hideLoading() {
            loadingOverlay.classList.add('hidden');
        }

        function showAlert(message, type = 'success') {
            alertMessage.textContent = message;
            alertMessage.classList.remove('hidden', 'bg-green-600', 'bg-red-600', 'bg-yellow-500', 'animate-fade-in');
            alertMessage.classList.add('animate-fade-in'); // Add animation class
            if (type === 'success') {
                alertMessage.classList.add('bg-green-600');
            } else if (type === 'error') {
                alertMessage.classList.add('bg-red-600');
            } else if (type === 'warning') {
                alertMessage.classList.add('bg-yellow-500');
            }
            // Show with animation
            alertMessage.classList.remove('-translate-y-full', 'opacity-0');
            alertMessage.classList.add('translate-y-0', 'opacity-100');

            setTimeout(() => {
                alertMessage.classList.remove('translate-y-0', 'opacity-100');
                alertMessage.classList.add('-translate-y-full', 'opacity-0'); // Animate out
                setTimeout(() => {
                    alertMessage.classList.add('hidden'); // Hide after animation
                }, 300); // Match animation duration
            }, 3000); // Display for 3 seconds
        }


        function formatTime(seconds) {
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = Math.floor(seconds % 60);
            return `${minutes < 10 ? '0' : ''}${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
        }

        function resetPlayer() {
            audioPlayer.pause();
            audioPlayer.currentTime = 0;
            progressBar.value = 0;
            isPlaying = false;
            updatePlayerUIState();
            coverImage.src = defaultCover;
            songTitle.textContent = 'Başlık';
            artistName.textContent = 'Sanatçı';
            timeDisplay.textContent = '00:00 / 00:00';
            emptyStateMessage.classList.remove('hidden'); // Show "Müzik Seçin"
        }

        function updateVolumeIcon(volume) {
            volumeIcon.classList.remove('fa-volume-high', 'fa-volume-low', 'fa-volume-off');
            if (volume > 0.6) {
                volumeIcon.classList.add('fa-volume-high');
            } else if (volume > 0) {
                volumeIcon.classList.add('fa-volume-low');
            } else {
                volumeIcon.classList.add('fa-volume-off');
            }
        }

        function updatePlayerUIState() {
            if (isPlaying) {
                playPauseBtn.querySelector('i').classList.remove('fa-play');
                playPauseBtn.querySelector('i').classList.add('fa-pause');
            } else {
                playPauseBtn.querySelector('i').classList.remove('fa-pause');
                playPauseBtn.querySelector('i').classList.add('fa-play');
            }
        }

        // --- Oynatıcı İşlevleri ---
        function loadMusic(music) {
            audioPlayer.src = music.music_url;
            coverImage.src = music.image_url || defaultCover;
            songTitle.textContent = music.title;
            artistName.textContent = music.artist;
            emptyStateMessage.classList.add('hidden'); // Hide "Müzik Seçin"
            audioPlayer.load(); // Load the new source
            // Aktif şarkı vurgulama
            document.querySelectorAll('.music-list-item').forEach(item => {
                item.classList.remove('active');
            });
            const activeItem = document.querySelector(`.music-list-item[data-id="${music.id}"]`);
            if (activeItem) {
                activeItem.classList.add('active');
            }
        }

        async function playMusic() {
            if (musics.length === 0) {
                showAlert('Çalacak müzik bulunamadı. Lütfen önce bir müzik ekleyin.', 'warning');
                return;
            }
            try {
                await audioPlayer.play();
                isPlaying = true;
                updatePlayerUIState();
            } catch (error) {
                console.error("Müzik çalınırken hata oluştu:", error);
                showAlert('Müzik çalınamadı. Tarayıcı ayarlarınızı veya dosya formatını kontrol edin.', 'error');
            }
        }

        function pauseMusic() {
            audioPlayer.pause();
            isPlaying = false;
            updatePlayerUIState();
        }

        function togglePlayPause() {
            if (isPlaying) {
                pauseMusic();
            } else {
                playMusic();
            }
        }

        function playNextMusic() {
            if (musics.length === 0) return;
            currentMusicIndex = (currentMusicIndex + 1) % musics.length;
            loadMusic(musics[currentMusicIndex]);
            playMusic();
        }

        function playPrevMusic() {
            if (musics.length === 0) return;
            currentMusicIndex = (currentMusicIndex - 1 + musics.length) % musics.length;
            loadMusic(musics[currentMusicIndex]);
            playMusic();
        }

        function selectMusic(index) {
            if (index >= 0 && index < musics.length) {
                currentMusicIndex = index;
                loadMusic(musics[currentMusicIndex]);
                playMusic();
            }
        }

        function updateProgressBar() {
            const currentTime = audioPlayer.currentTime;
            const duration = audioPlayer.duration;

            if (isNaN(duration)) {
                progressBar.value = 0;
                timeDisplay.textContent = '00:00 / 00:00';
            } else {
                progressBar.value = (currentTime / duration) * 100;
                timeDisplay.textContent = `${formatTime(currentTime)} / ${formatTime(duration)}`;
            }
        }

        function setProgressBar() {
            const duration = audioPlayer.duration;
            if (isNaN(duration)) return;
            audioPlayer.currentTime = (progressBar.value / 100) * duration;
        }

        function setVolume() {
            audioPlayer.volume = volumeBar.value;
            updateVolumeIcon(audioPlayer.volume);
        }

        // --- Supabase Veri İşlemleri (CRUD) ---
        async function fetchMusics() {
            showLoading();
            const { data, error } = await supabaseClient
                .from('musics')
                .select('*')
                .order('id', { ascending: true }); // ID'ye göre sırala
            hideLoading();
            if (error) {
                console.error('Müzikler getirilirken hata:', error.message);
                showAlert('Müzikler yüklenirken bir hata oluştu.', 'error');
                return [];
            }
            return data;
        }

        async function renderMusics() {
            musics = await fetchMusics();
            musicList.innerHTML = ''; // Sidebar listesini temizle
            deleteSelect.innerHTML = '<option value="" disabled selected>Silmek için seçin...</option>'; // Silme select'i temizle

            if (musics.length === 0) {
                musicList.innerHTML = '<p class="text-gray-400 text-center py-4">Henüz müzik yok. Admin panelinden ekleyin.</p>';
                songCountSpan.textContent = 0;
                resetPlayer(); // Müzik yoksa oynatıcıyı sıfırla
                return;
            }

            songCountSpan.textContent = musics.length;

            musics.forEach((music, index) => {
                // Müzik listesi öğesi oluştur
                const musicItem = document.createElement('div');
                musicItem.classList.add(
                    'music-list-item', // Custom class for styling
                    'flex', 'items-center', 'gap-3', 'p-3', 'mb-2', 'rounded-lg',
                    'cursor-pointer', 'hover:bg-gray-700', 'transition-all', 'duration-200'
                );
                musicItem.dataset.id = music.id; // Supabase ID'sini kaydet

                musicItem.innerHTML = `
                    <img src="${music.image_url || defaultCover}" alt="${music.title}" class="w-12 h-12 rounded-md object-cover shadow-md">
                    <div class="flex-1 overflow-hidden">
                        <h4 class="text-gray-100 font-semibold truncate">${music.title}</h4>
                        <p class="text-gray-400 text-sm truncate">${music.artist}</p>
                    </div>
                `;
                musicItem.addEventListener('click', () => selectMusic(index));
                musicList.appendChild(musicItem);

                // Silme select kutusuna seçenek ekle
                const option = document.createElement('option');
                option.value = music.id;
                option.textContent = `${music.title} - ${music.artist}`;
                option.dataset.musicUrl = music.music_url; // Silme işlemi için URL'yi sakla
                option.dataset.imageUrl = music.image_url;
                deleteSelect.appendChild(option);
            });

            // Mobil müzik listesi modalını da güncelle
            // Önceki kopyayı kaldır
            const existingMobileList = mobileMusicListContent.querySelector('#musicList');
            if(existingMobileList) existingMobileList.remove();
            
            const clonedMusicList = musicList.cloneNode(true);
            clonedMusicList.id = 'mobileMusicList'; // ID çakışmasını önle
            clonedMusicList.classList.remove('custom-scrollbar', 'pr-2'); // Scrollbarı kendi modal'ı yönetecek
            mobileMusicListContent.appendChild(clonedMusicList);

            // Klonlanan öğeler için de olay dinleyicilerini yeniden atayın
            clonedMusicList.querySelectorAll('.music-list-item').forEach((item, originalIndex) => {
                item.addEventListener('click', () => {
                    // Orijinal dizin bilgisini kullanarak müziği seç
                    const musicId = item.dataset.id;
                    const foundIndex = musics.findIndex(m => m.id == musicId);
                    if (foundIndex !== -1) {
                         selectMusic(foundIndex);
                         closeMobileMusicList(); // Seçtikten sonra modalı kapat
                    }
                });
            });


            // Eğer şu an çalmakta olan bir müzik yoksa, ilkini yükle
            if (audioPlayer.src === "" || musics.length > 0 && musics[currentMusicIndex]?.id !== document.querySelector('.music-list-item.active')?.dataset.id) {
                selectMusic(0);
            } else if (musics.length > 0) {
                 // Eğer zaten bir şarkı yüklüyse ve müzik listesi güncellendiyse,
                 // aktif şarkıyı tekrar vurgula
                const activeItem = document.querySelector(`.music-list-item[data-id="${musics[currentMusicIndex].id}"]`);
                if (activeItem) {
                    activeItem.classList.add('active');
                }
            }
        }


        async function addMusic() {
            const title = musicTitleInput.value.trim();
            const artist = artistInput.value.trim();
            const musicFile = musicFileInput.files[0];
            const musicImage = musicImageInput.files[0];

            if (!title || !artist || !musicFile) {
                showAlert('Lütfen tüm zorunlu alanları (Şarkı Adı, Sanatçı Adı, Müzik Dosyası) doldurun.', 'warning');
                return;
            }

            showLoading();
            try {
                let musicUrl = '';
                let imageUrl = '';

                // Müzik dosyasını yükle
                const musicFileName = `music-${crypto.randomUUID()}-${musicFile.name}`;
                const { data: musicUploadData, error: musicUploadError } = await supabaseClient
                    .storage
                    .from('musics')
                    .upload(musicFileName, musicFile);

                if (musicUploadError) {
                    throw new Error(`Müzik yüklenirken hata: ${musicUploadError.message}`);
                }
                musicUrl = supabaseClient.storage.from('musics').getPublicUrl(musicFileName).data.publicUrl;

                // Resim dosyasını yükle (isteğe bağlı)
                if (musicImage) {
                    const imageFileName = `image-${crypto.randomUUID()}-${musicImage.name}`;
                    const { data: imageUploadData, error: imageUploadError } = await supabaseClient
                        .storage
                        .from('images')
                        .upload(imageFileName, musicImage);

                    if (imageUploadError) {
                        throw new Error(`Resim yüklenirken hata: ${imageUploadError.message}`);
                    }
                    imageUrl = supabaseClient.storage.from('images').getPublicUrl(imageFileName).data.publicUrl;
                }

                // Veritabanına kaydet
                const { data, error } = await supabaseClient
                    .from('musics')
                    .insert([{ title, artist, music_url: musicUrl, image_url: imageUrl }])
                    .select();

                if (error) {
                    throw new Error(`Veritabanına eklenirken hata: ${error.message}`);
                }

                showAlert('Müzik başarıyla eklendi!', 'success');
                musicTitleInput.value = '';
                artistInput.value = '';
                musicFileInput.value = '';
                musicImageInput.value = '';
                renderMusics();
                closeAdminPanel(); // Başarılı işlem sonrası modalı kapat
            } catch (error) {
                console.error('Müzik eklenirken genel hata:', error.message);
                showAlert(error.message, 'error');
            } finally {
                hideLoading();
            }
        }

        async function deleteMusic() {
            const selectedOption = deleteSelect.options[deleteSelect.selectedIndex];
            if (!selectedOption || selectedOption.value === "") {
                showAlert('Lütfen silinecek bir müzik seçin.', 'warning');
                return;
            }

            const musicId = selectedOption.value;
            const musicUrl = selectedOption.dataset.musicUrl;
            const imageUrl = selectedOption.dataset.imageUrl;

            if (!confirm(`"${selectedOption.textContent}" müziğini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz!`)) {
                return;
            }

            showLoading();
            try {
                // Veritabanından sil
                const { error: dbError } = await supabaseClient
                    .from('musics')
                    .delete()
                    .eq('id', musicId);

                if (dbError) {
                    throw new Error(`Veritabanından silinirken hata: ${dbError.message}`);
                }

                // Supabase Storage'dan müzik dosyasını sil
                if (musicUrl) {
                    const musicFileName = musicUrl.substring(musicUrl.lastIndexOf('/') + 1);
                    const { error: storageMusicError } = await supabaseClient
                        .storage
                        .from('musics')
                        .remove([musicFileName]);

                    if (storageMusicError) {
                        console.warn('Müzik dosyası Storage\'dan silinirken hata (devam ediyor):', storageMusicError.message);
                        // Kullanıcıya hata gösterme, işlemi devam ettir
                    }
                }

                // Supabase Storage'dan resim dosyasını sil (eğer varsa)
                if (imageUrl) {
                    const imageFileName = imageUrl.substring(imageUrl.lastIndexOf('/') + 1);
                    const { error: storageImageError } = await supabaseClient
                        .storage
                        .from('images')
                        .remove([imageFileName]);

                    if (storageImageError) {
                        console.warn('Resim dosyası Storage\'dan silinirken hata (devam ediyor):', storageImageError.message);
                        // Kullanıcıya hata gösterme, işlemi devam ettir
                    }
                }

                showAlert('Müzik başarıyla silindi!', 'success');
                renderMusics();
                resetPlayer(); // Oynatıcıyı sıfırla
                closeAdminPanel(); // Başarılı işlem sonrası modalı kapat
            } catch (error) {
                console.error('Müzik silinirken genel hata:', error.message);
                showAlert(error.message, 'error');
            } finally {
                hideLoading();
            }
        }

        // --- Modal ve UI Etkileşim Fonksiyonları ---
        function openMobileMusicList() {
            mobileMusicListModal.classList.remove('hidden');
            // Müzik listesini tekrar render etmek yerine, mevcut listeyi kopyala/taşı
            const existingMobileList = mobileMusicListContent.querySelector('#mobileMusicList');
            if(existingMobileList) existingMobileList.remove();
            
            const clonedMusicList = musicList.cloneNode(true);
            clonedMusicList.id = 'mobileMusicList';
            clonedMusicList.classList.remove('custom-scrollbar', 'pr-2');
            mobileMusicListContent.appendChild(clonedMusicList);

            // Klonlanan öğeler için de olay dinleyicilerini yeniden atayın
            clonedMusicList.querySelectorAll('.music-list-item').forEach((item, originalIndex) => {
                item.addEventListener('click', () => {
                    const musicId = item.dataset.id;
                    const foundIndex = musics.findIndex(m => m.id == musicId);
                    if (foundIndex !== -1) {
                         selectMusic(foundIndex);
                         closeMobileMusicList();
                    }
                });
            });
        }

        function closeMobileMusicList() {
            mobileMusicListModal.classList.add('hidden');
        }

        function openAdminPanel() {
            adminPanelModal.classList.remove('hidden');
            // Admin paneli açıldığında silme select kutusunu güncelleyelim
            renderMusics();
        }

        function closeAdminPanel() {
            adminPanelModal.classList.add('hidden');
        }

        // --- Gece/Gündüz Modu ---
        function toggleTheme() {
            const body = document.body;
            const icon = themeToggleButton.querySelector('i');

            if (body.classList.contains('light-mode')) {
                // Karanlık moda geç
                body.classList.remove('light-mode');
                body.classList.add('dark-mode'); // Opsiyonel: açıkça dark-mode sınıfı ekleyebiliriz
                icon.classList.remove('fa-sun');
                icon.classList.add('fa-moon');
                localStorage.setItem('theme', 'dark');
            } else {
                // Aydınlık moda geç
                body.classList.add('light-mode');
                body.classList.remove('dark-mode');
                icon.classList.remove('fa-moon');
                icon.classList.add('fa-sun');
                localStorage.setItem('theme', 'light');
            }
        }

        // Tema ayarını başlangıçta yükle
        function loadTheme() {
            const savedTheme = localStorage.getItem('theme') || 'dark'; // Varsayılan olarak karanlık mod
            const body = document.body;
            const icon = themeToggleButton.querySelector('i');

            if (savedTheme === 'light') {
                body.classList.add('light-mode');
                icon.classList.remove('fa-moon');
                icon.classList.add('fa-sun');
            } else {
                body.classList.remove('light-mode'); // Varsayılan dark, bu yüzden light-mode'u kaldır
                icon.classList.remove('fa-sun');
                icon.classList.add('fa-moon');
            }
        }


        // --- Olay Dinleyicileri (Event Listeners) ---
        playPauseBtn.addEventListener('click', togglePlayPause);
        prevBtn.addEventListener('click', playPrevMusic);
        nextBtn.addEventListener('click', playNextMusic);
        progressBar.addEventListener('input', setProgressBar);
        progressBar.addEventListener('change', setProgressBar); // Drop event
        volumeBar.addEventListener('input', setVolume);
        volumeBar.addEventListener('change', setVolume); // Drop event

        audioPlayer.addEventListener('timeupdate', updateProgressBar);
        audioPlayer.addEventListener('ended', playNextMusic); // Şarkı bitince sonraki şarkıyı çal
        audioPlayer.addEventListener('loadedmetadata', updateProgressBar); // Şarkı yüklendiğinde süreyi güncelle

        // Mobil menü butonları
        if (mobileMenuButton) mobileMenuButton.addEventListener('click', openMobileMusicList);
        if (openMobileListBtn) openMobileListBtn.addEventListener('click', openMobileMusicList);
        if (closeMobileListBtn) closeMobileListBtn.addEventListener('click', closeMobileMusicList);

        // Admin panel butonları
        if (adminButton) adminButton.addEventListener('click', openAdminPanel);
        if (adminButtonMobile) adminButtonMobile.addEventListener('click', openAdminPanel);
        if (closeAdminPanelBtn) closeAdminPanelBtn.addEventListener('click', closeAdminPanel);
        if (addMusicBtn) addMusicBtn.addEventListener('click', addMusic);
        if (deleteMusicBtn) deleteMusicBtn.addEventListener('click', deleteMusic);

        // Anasayfa butonu (yeni)
        if (homeButton) homeButton.addEventListener('click', () => {
            // Anasayfaya dönme işlevi (şu an zaten ana ekranda olduğundan modalsız bir reset gibi düşünebiliriz)
            // Eğer mobil listesi veya admin paneli açıksa kapat.
            closeMobileMusicList();
            closeAdminPanel();
            // Ekstra bir işlem gerekiyorsa buraya eklenebilir, örneğin oynatıcıyı durdurma
            // pauseMusic();
        });

        // Tema değiştirme butonu (yeni)
        if (themeToggleButton) themeToggleButton.addEventListener('click', toggleTheme);

        // Upcoming Songs Scroll Buttons (if they exist)
        if (scrollLeftUpcoming) {
            scrollLeftUpcoming.addEventListener('click', () => {
                upcomingSongsContainer.scrollBy({
                    left: -upcomingSongsContainer.offsetWidth / 2,
                    behavior: 'smooth'
                });
            });
        }
        if (scrollRightUpcoming) {
            scrollRightUpcoming.addEventListener('click', () => {
                upcomingSongsContainer.scrollBy({
                    left: upcomingSongsContainer.offsetWidth / 2,
                    behavior: 'smooth'
                });
            });
        }


        // --- Initial Setup ---
        loadTheme(); // Temayı başlangıçta yükle
        coverImage.src = defaultCover;
        volumeBar.value = audioPlayer.volume;
        updateVolumeIcon(audioPlayer.volume);
        updatePlayerUIState();
        emptyStateMessage.classList.remove('hidden'); // Sayfa yüklendiğinde "Müzik Seçin" göster

        renderMusics(); // Müzik listesini yükle ve render et

    } catch (error) {
        console.error("DOMContentLoaded içinde yakalanan genel hata:", error);
        showAlert("Uygulama başlatılırken beklenmeyen bir hata oluştu. Konsolu kontrol edin.", 'error');
    }
});
