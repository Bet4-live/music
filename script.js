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
        const upcomingSongsContainer = document.getElementById('upcomingSongsContainer'); // Saklı kalacak
        const scrollLeftUpcoming = document.getElementById('scrollLeftUpcoming'); // Saklı kalacak
        const scrollRightUpcoming = document.getElementById('scrollRightUpcoming'); // Saklı kalacak
        const mobileMenuButton = document.getElementById('mobileMenuButton');
        const openMobileListBtn = document.getElementById('openMobileListBtn'); // Şimdilik hidden, mobil menü için kullanılabilir
        const mobileMusicListModal = document.getElementById('mobileMusicListModal');
        const mobileMusicListContent = document.getElementById('mobileMusicListContent');
        const adminButton = document.getElementById('adminButton');
        const adminButtonMobile = document.getElementById('adminButtonMobile'); // Şimdilik hidden
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
        const homeButton = document.getElementById('homeButton');
        const themeToggleButton = document.getElementById('themeToggleButton');
        const emptyStateMessage = document.getElementById('emptyStateMessage');

        // --- Global Değişkenler ---
        let currentMusicIndex = 0;
        let musics = [];
        let isPlaying = false;
        const defaultCover = 'default-cover.jpg';

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
            alertMessage.classList.add('animate-fade-in');
            if (type === 'success') {
                alertMessage.classList.add('bg-green-600');
            } else if (type === 'error') {
                alertMessage.classList.add('bg-red-600');
            } else if (type === 'warning') {
                alertMessage.classList.add('bg-yellow-500');
            }
            alertMessage.classList.remove('-translate-y-full', 'opacity-0');
            alertMessage.classList.add('translate-y-0', 'opacity-100');

            setTimeout(() => {
                alertMessage.classList.remove('translate-y-0', 'opacity-100');
                alertMessage.classList.add('-translate-y-full', 'opacity-0');
                setTimeout(() => {
                    alertMessage.classList.add('hidden');
                }, 300);
            }, 3000);
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
            emptyStateMessage.classList.remove('hidden'); // "Müzik Seçin" mesajını göster
            document.querySelectorAll('.music-list-item').forEach(item => item.classList.remove('active')); // Tüm aktif vurguları kaldır
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
            emptyStateMessage.classList.add('hidden'); // "Müzik Seçin" mesajını gizle
            audioPlayer.load();

            // Aktif şarkı vurgulama ve listeyi kaydırma
            document.querySelectorAll('.music-list-item').forEach(item => {
                item.classList.remove('active');
            });
            const activeItem = document.querySelector(`.music-list-item[data-id="${music.id}"]`);
            if (activeItem) {
                activeItem.classList.add('active');
                // Aktif şarkıyı listenin en üstüne (veya görünen alana) kaydır
                activeItem.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
            // Şarkı bittiğinde veya ileri geçildiğinde, çalınan şarkıyı listenin en sonuna ekle
            // ve bir sonraki şarkıyı çalmak için listeyi güncelle.
            // Bu, oynatma listesi mantığına uygun bir kaydırma yapar.
            
            const currentSong = musics[currentMusicIndex];
            musics.splice(currentMusicIndex, 1); // Çalan şarkıyı listeden çıkar
            musics.push(currentSong); // Listenin sonuna ekle

            currentMusicIndex = 0; // Bir sonraki şarkı yeni listenin başında olacak
            
            renderMusics(false); // Yeni listeyi render et, ancak ilk müziği otomatik seçme
            selectMusic(currentMusicIndex); // Yeni ilk müziği seç ve çal
            playMusic();
        }

        function playPrevMusic() {
            if (musics.length === 0) return;
            // Geri tuşu: listenin sonundaki şarkıyı başa getir ve çal
            const lastSong = musics.pop(); // Son şarkıyı çıkar
            musics.unshift(lastSong); // Başa ekle

            currentMusicIndex = 0; // Yeni ilk müziği seçmek için
            renderMusics(false); // Listeyi render et, ilk müziği otomatik seçme
            selectMusic(currentMusicIndex); // Yeni ilk müziği seç ve çal
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

        async function renderMusics(shouldSelectFirst = true) {
            const fetchedMusics = await fetchMusics();
            // Eğer müzik listesi zaten doluysa ve yeni müzikler gelmediyse,
            // sadece aktif şarkının yerini değiştirmek için listeyi yeniden oluşturmayız.
            // Ancak CRUD işlemleri sonrası tam yenileme için her zaman yeniden render ederiz.
            if (!shouldSelectFirst && musics.length === fetchedMusics.length && musics.every((m, i) => m.id === fetchedMusics[i].id)) {
                // Sadece aktif vurguyu ve kaydırmayı güncellemek için yeterli.
                const activeItem = document.querySelector(`.music-list-item[data-id="${musics[currentMusicIndex]?.id}"]`);
                if (activeItem) {
                    document.querySelectorAll('.music-list-item').forEach(item => item.classList.remove('active'));
                    activeItem.classList.add('active');
                    activeItem.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
                return;
            }

            musics = fetchedMusics; // Güncel müzik listesini ata
            musicList.innerHTML = '';
            deleteSelect.innerHTML = '<option value="" disabled selected>Silmek için seçin...</option>';

            if (musics.length === 0) {
                musicList.innerHTML = '<p class="text-gray-400 text-center py-4">Henüz müzik yok. Admin panelinden ekleyin.</p>';
                songCountSpan.textContent = 0;
                resetPlayer();
                return;
            }

            songCountSpan.textContent = musics.length;

            musics.forEach((music, index) => {
                const musicItem = document.createElement('div');
                musicItem.classList.add(
                    'music-list-item' // Özel CSS sınıfımız
                );
                musicItem.dataset.id = music.id; // Supabase ID'sini kaydet

                musicItem.innerHTML = `
                    <img src="${music.image_url || defaultCover}" alt="${music.title}">
                    <div class="flex-1 overflow-hidden">
                        <h4>${music.title}</h4>
                        <p>${music.artist}</p>
                    </div>
                `;
                musicItem.addEventListener('click', () => selectMusic(index));
                musicList.appendChild(musicItem);

                const option = document.createElement('option');
                option.value = music.id;
                option.textContent = `${music.title} - ${music.artist}`;
                option.dataset.musicUrl = music.music_url;
                option.dataset.imageUrl = music.image_url;
                deleteSelect.appendChild(option);
            });

            // Mobil müzik listesi modalını da güncelle
            const existingMobileList = mobileMusicListContent.querySelector('#mobileMusicList');
            if(existingMobileList) existingMobileList.remove();
            
            const clonedMusicList = musicList.cloneNode(true);
            clonedMusicList.id = 'mobileMusicList';
            clonedMusicList.classList.remove('custom-scrollbar', 'pr-2');
            mobileMusicListContent.appendChild(clonedMusicList);

            clonedMusicList.querySelectorAll('.music-list-item').forEach((item) => {
                item.addEventListener('click', () => {
                    const musicId = item.dataset.id;
                    const foundIndex = musics.findIndex(m => m.id == musicId);
                    if (foundIndex !== -1) {
                         selectMusic(foundIndex);
                         closeMobileMusicList();
                    }
                });
            });

            if (shouldSelectFirst && musics.length > 0) {
                selectMusic(0); // İlk müziği seç ve çal
            } else if (musics.length > 0 && currentMusicIndex < musics.length) {
                // Eğer zaten bir şarkı yüklüyse ve müzik listesi güncellendiyse,
                // aktif şarkıyı tekrar vurgula ve kaydır
                const activeItem = document.querySelector(`.music-list-item[data-id="${musics[currentMusicIndex].id}"]`);
                if (activeItem) {
                    activeItem.classList.add('active');
                    activeItem.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            } else {
                 resetPlayer(); // Hiç müzik kalmadıysa veya index dışıysa sıfırla
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

                const musicFileName = `music-${crypto.randomUUID()}-${musicFile.name}`;
                const { data: musicUploadData, error: musicUploadError } = await supabaseClient
                    .storage
                    .from('musics')
                    .upload(musicFileName, musicFile);

                if (musicUploadError) {
                    throw new Error(`Müzik yüklenirken hata: ${musicUploadError.message}`);
                }
                musicUrl = supabaseClient.storage.from('musics').getPublicUrl(musicFileName).data.publicUrl;

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
                renderMusics(); // Yeni müzik eklenince listeyi yeniden render et
                closeAdminPanel();
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
                const { error: dbError } = await supabaseClient
                    .from('musics')
                    .delete()
                    .eq('id', musicId);

                if (dbError) {
                    throw new Error(`Veritabanından silinirken hata: ${dbError.message}`);
                }

                if (musicUrl) {
                    const musicFileName = musicUrl.substring(musicUrl.lastIndexOf('/') + 1);
                    const { error: storageMusicError } = await supabaseClient
                        .storage
                        .from('musics')
                        .remove([musicFileName]);

                    if (storageMusicError) {
                        console.warn('Müzik dosyası Storage\'dan silinirken hata (devam ediyor):', storageMusicError.message);
                    }
                }

                if (imageUrl) {
                    const imageFileName = imageUrl.substring(imageUrl.lastIndexOf('/') + 1);
                    const { error: storageImageError } = await supabaseClient
                        .storage
                        .from('images')
                        .remove([imageFileName]);

                    if (storageImageError) {
                        console.warn('Resim dosyası Storage\'dan silinirken hata (devam ediyor):', storageImageError.message);
                    }
                }

                showAlert('Müzik başarıyla silindi!', 'success');
                renderMusics(); // Müzik silinince listeyi yeniden render et
                resetPlayer();
                closeAdminPanel();
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
            const existingMobileList = mobileMusicListContent.querySelector('#mobileMusicList');
            if(existingMobileList) existingMobileList.remove();
            
            const clonedMusicList = musicList.cloneNode(true);
            clonedMusicList.id = 'mobileMusicList';
            clonedMusicList.classList.remove('custom-scrollbar', 'pr-2');
            mobileMusicListContent.appendChild(clonedMusicList);

            clonedMusicList.querySelectorAll('.music-list-item').forEach((item) => {
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
            renderMusics(); // Admin paneli açıldığında silme select kutusunu güncelleyelim
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
                body.classList.add('dark-mode');
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
                body.classList.remove('light-mode');
                icon.classList.remove('fa-sun');
                icon.classList.add('fa-moon');
            }
        }


        // --- Olay Dinleyicileri (Event Listeners) ---
        playPauseBtn.addEventListener('click', togglePlayPause);
        prevBtn.addEventListener('click', playPrevMusic);
        nextBtn.addEventListener('click', playNextMusic);
        progressBar.addEventListener('input', setProgressBar);
        progressBar.addEventListener('change', setProgressBar);
        volumeBar.addEventListener('input', setVolume);
        volumeBar.addEventListener('change', setVolume);

        audioPlayer.addEventListener('timeupdate', updateProgressBar);
        audioPlayer.addEventListener('ended', playNextMusic); // Şarkı bitince sonraki şarkıyı çal
        audioPlayer.addEventListener('loadedmetadata', updateProgressBar);

        // Mobil menü butonları
        if (mobileMenuButton) mobileMenuButton.addEventListener('click', openMobileMusicList);
        if (openMobileListBtn) openMobileListBtn.addEventListener('click', openMobileMusicList);
        if (closeMobileListBtn) closeMobileListBtn.addEventListener('click', closeMobileMusicList);

        // Admin panel butonları
        if (adminButton) adminButton.addEventListener('click', openAdminPanel);
        if (adminButtonMobile) adminButtonMobile.addEventListener('click', openAdminPanel); // If still exists
        if (closeAdminPanelBtn) closeAdminPanelBtn.addEventListener('click', closeAdminPanel);
        if (addMusicBtn) addMusicBtn.addEventListener('click', addMusic);
        if (deleteMusicBtn) deleteMusicBtn.addEventListener('click', deleteMusic);

        // Anasayfa butonu (yeni)
        if (homeButton) homeButton.addEventListener('click', () => {
            // Anasayfaya dönme işlevi:
            closeMobileMusicList();
            closeAdminPanel();
            // İsteğe bağlı olarak, ilk şarkıya geri dönebilir veya sadece çalmakta olanı vurgulayabilir
            if (musics.length > 0) {
                selectMusic(0); // Listenin başına geri dön ve çal
            } else {
                resetPlayer();
            }
        });

        // Tema değiştirme butonu
        if (themeToggleButton) themeToggleButton.addEventListener('click', toggleTheme);

        // Initial Setup
        loadTheme();
        coverImage.src = defaultCover;
        volumeBar.value = audioPlayer.volume;
        updateVolumeIcon(audioPlayer.volume);
        updatePlayerUIState();
        emptyStateMessage.classList.remove('hidden'); // Başlangıçta "Müzik Seçin" mesajını göster

        renderMusics(); // Müzik listesini yükle ve render et

    } catch (error) {
        console.error("DOMContentLoaded içinde yakalanan genel hata:", error);
        showAlert("Uygulama başlatılırken beklenmeyen bir hata oluştu. Konsolu kontrol edin.", 'error');
    }
});
