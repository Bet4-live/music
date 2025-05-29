// --- Supabase Setup ---
// !! Buraya kendi Supabase Proje URL ve Public Anon Key bilgilerini GİRİN !!
const SUPABASE_URL = 'https://skhbykqwdbwjcvqmwvft.supabase.co'; // <-- KENDİ URL'NİZİ GİRİN
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNraGJ5a3F3ZGJ3amN2cW13dmZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU3Nzg0NDYsImV4cCI6MjA2MTM1NDQ0Nn0.e8pbfF7O_rTtSKxtFzzc_zZTsegsxsNaluHNFBbWbMs'; // <-- KENDİ ANON KEY'İNİZİ GİRİN
// !! Supabase bilgilerini GİRDİĞİNİZDEN EMİN OLUN !!

let supabaseClient;

// --- DOM Elementleri ---
const audioPlayer = document.getElementById('audioPlayer');
const playPauseButton = document.getElementById('playPauseButton');
const playPauseIcon = document.getElementById('playPauseIcon');
const prevButton = document.getElementById('prevButton');
const nextButton = document.getElementById('nextButton');
const progressBar = document.getElementById('progressBar');
const currentTimeElement = document.getElementById('currentTime');
const durationTimeElement = document.getElementById('durationTime');
const volumeBar = document.getElementById('volumeBar');
const volumeIconButton = document.getElementById('volumeIconButton');
const volumeIcon = document.getElementById('volumeIcon');
const coverImage = document.getElementById('coverImage');
const currentSongTitleElement = document.getElementById('currentSongTitle');
const currentSongArtistElement = document.getElementById('currentSongArtist');
const popularMusicContainer = document.getElementById('popularMusicContainer');
const upcomingMusicContainer = document.getElementById('upcomingMusicContainer');
const upcomingPrevBtn = document.getElementById('upcomingPrevBtn');
const upcomingNextBtn = document.getElementById('upcomingNextBtn');
const upcomingMusicContainerWrapper = document.getElementById('upcomingMusicContainerWrapper');
const searchInput = document.getElementById('searchInput');
const homeLink = document.getElementById('homeLink');
const adminButton = document.getElementById('adminButton'); // Admin butonu referansı (yine de tutalım, başka yerde kullanılabilir)
const adminPanel = document.getElementById('adminPanel');

// Admin Panel Elementleri
const musicTitleInput = document.getElementById('musicTitle');
const musicArtistInput = document.getElementById('musicArtist');
const musicFileInput = document.getElementById('musicFile');
const musicImageInput = document.getElementById('musicImage');
const addMusicBtn = document.getElementById('addMusicBtn');
const deleteSelect = document.getElementById('deleteSelect');
const deleteMusicBtn = document.getElementById('deleteMusicBtn');

const openSidebarBtn = document.getElementById('openSidebar');
const closeSidebarBtn = document.getElementById('closeSidebar');
const sidebar = document.querySelector('aside');

// --- Değişkenler ---
let currentPlayList = [];
let currentSongIndex = -1;
let isPlaying = false;
let updateProgressBarInterval;
let lastVolume = 0.7; // Varsayılan başlangıç ses seviyesi

// Varsayılan kapak resmi ve sanatçı (Sanatçı boş bırakıldı)
const defaultCover = 'music.png';
const defaultArtist = ''; // Bilinmeyen Sanatçı yazısı kaldırıldı

// --- Yardımcı Fonksiyonlar ---

// Zaman formatlama (örn: 3:45)
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
}

// Ses ikonunu güncelle
function updateVolumeIcon(volume) {
    if (volume === 0) {
        volumeIcon.className = 'fa fa-volume-off text-xl';
    } else if (volume < 0.5) {
        volumeIcon.className = 'fa fa-volume-down text-xl';
    } else {
        volumeIcon.className = 'fa fa-volume-up text-xl';
    }
}

// Player UI durumunu güncelle (Oynat/Duraklat butonu, şarkı bilgileri)
function updatePlayerUIState() {
    if (isPlaying) {
        playPauseIcon.className = 'fa fa-pause text-2xl';
    } else {
        playPauseIcon.className = 'fa fa-play text-2xl';
    }

    if (currentSongIndex > -1 && currentPlayList.length > 0) {
        const currentSong = currentPlayList[currentSongIndex];
        currentSongTitleElement.textContent = currentSong.title;
        currentSongArtistElement.textContent = currentSong.artist || ''; // Sanatçı boşsa boş bırak
        coverImage.src = currentSong.image_url || defaultCover;
    } else {
        currentSongTitleElement.textContent = 'Müzik Yükleniyor...';
        currentSongArtistElement.textContent = defaultArtist;
        coverImage.src = defaultCover;
    }
}

// Müziği oynat
function playMusic() {
    if (audioPlayer.paused) {
        audioPlayer.play();
        isPlaying = true;
        updatePlayerUIState();
        startProgressBarUpdate();
    }
}

// Müziği duraklat
function pauseMusic() {
    if (!audioPlayer.paused) {
        audioPlayer.pause();
        isPlaying = false;
        updatePlayerUIState();
        stopProgressBarUpdate();
    }
}

// Müziği durdur ve sıfırla
function stopMusic() {
    audioPlayer.pause();
    audioPlayer.currentTime = 0;
    isPlaying = false;
    updatePlayerUIState();
    stopProgressBarUpdate();
    progressBar.value = 0;
    currentTimeElement.textContent = '0:00';
    durationTimeElement.textContent = '0:00';
}

// İlerleme çubuğunu güncelleme
function startProgressBarUpdate() {
    clearInterval(updateProgressBarInterval); // Önceki intervali temizle
    updateProgressBarInterval = setInterval(() => {
        if (!isNaN(audioPlayer.duration)) {
            const progress = (audioPlayer.currentTime / audioPlayer.duration) * 100;
            progressBar.value = progress;
            currentTimeElement.textContent = formatTime(audioPlayer.currentTime);
        }
    }, 1000);
}

// İlerleme çubuğu güncellemesini durdur
function stopProgressBarUpdate() {
    clearInterval(updateProgressBarInterval);
}

// Belirli bir şarkıyı çal
async function playSpecificSong(index) {
    if (index >= 0 && index < currentPlayList.length) {
        currentSongIndex = index;
        const song = currentPlayList[currentSongIndex];
        audioPlayer.src = song.music_url;
        audioPlayer.load(); // Ses dosyasını yükle
        await audioPlayer.play(); // Oynatmayı dene
        isPlaying = true;
        updatePlayerUIState();
        startProgressBarUpdate();
    } else {
        console.warn("Geçersiz şarkı indeksi:", index);
        stopMusic(); // Geçersiz indeks durumunda müziği durdur
    }
}

// Sonraki şarkıyı çal
function playNextSong() {
    if (currentPlayList.length === 0) return;
    currentSongIndex = (currentSongIndex + 1) % currentPlayList.length;
    playSpecificSong(currentSongIndex);
}

// Önceki şarkıyı çal
function playPrevSong() {
    if (currentPlayList.length === 0) return;
    currentSongIndex = (currentSongIndex - 1 + currentPlayList.length) % currentPlayList.length;
    playSpecificSong(currentSongIndex);
}

// Supabase'den müzikleri getir ve render et
async function renderMusics(searchTerm = '') {
    try {
        let query = supabaseClient.from('musics').select('*');

        if (searchTerm) {
            // Hem başlık hem de sanatçıda arama yap
            query = query.or(`title.ilike.%${searchTerm}%,artist.ilike.%${searchTerm}%`);
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) {
            console.error('Müzikler getirilirken hata:', error.message);
            alert('Müzikler yüklenirken bir hata oluştu.');
            return;
        }

        currentPlayList = data;
        popularMusicContainer.innerHTML = '';
        upcomingMusicContainer.innerHTML = '';
        deleteSelect.innerHTML = '<option value="" disabled selected>Silmek için seçin...</option>'; // Seçenekleri temizle

        if (currentPlayList.length === 0) {
            popularMusicContainer.innerHTML = '<p class="col-span-full text-center text-gray-400">Henüz hiç müzik bulunmuyor.</p>';
            upcomingMusicContainer.innerHTML = '<p class="text-gray-400">Yüklenecek müzik yok.</p>';
            return;
        }

        currentPlayList.forEach((music, index) => {
            const musicCardHTML = `
                <div class="bg-gray-800 rounded-lg shadow-lg overflow-hidden transform hover:scale-105 transition-transform duration-300 cursor-pointer music-card" data-index="${index}">
                    <img src="${music.image_url || defaultCover}" alt="${music.title}" class="w-full h-40 object-cover">
                    <div class="p-4">
                        <h3 class="text-lg font-semibold text-white truncate">${music.title}</h3>
                        <p class="text-sm text-gray-400 truncate">${music.artist || ''}</p>
                    </div>
                </div>
            `;
            popularMusicContainer.innerHTML += musicCardHTML;
            upcomingMusicContainer.innerHTML += musicCardHTML;

            // Silme select box'ını doldur
            const option = document.createElement('option');
            option.value = music.id;
            option.textContent = `${music.title} - ${music.artist || ''}`;
            deleteSelect.appendChild(option);
        });

        // Yeni müzik kartlarına olay dinleyici ekle
        document.querySelectorAll('.music-card').forEach(card => {
            card.addEventListener('click', (event) => {
                const index = parseInt(event.currentTarget.dataset.index);
                playSpecificSong(index);
            });
        });

        // Eğer hiçbir şarkı çalmıyorsa, ilk şarkıyı seçilebilir yap
        if (currentSongIndex === -1 && currentPlayList.length > 0) {
            currentSongIndex = 0; // İlk şarkıyı varsayılan olarak seç
            updatePlayerUIState();
        }

    } catch (error) {
        console.error('Müzikleri render ederken hata:', error);
        alert('Müzikler yüklenirken beklenmeyen bir hata oluştu.');
    }
}

// Supabase'e müzik yükle
async function uploadMusic() {
    const title = musicTitleInput.value.trim();
    const artist = musicArtistInput.value.trim();
    const musicFile = musicFileInput.files[0];
    const musicImage = musicImageInput.files[0];

    if (!title || !musicFile) {
        alert('Lütfen başlık ve müzik dosyası seçin.');
        return;
    }

    // Yükleme sırasında butonu devre dışı bırak
    addMusicBtn.disabled = true;
    addMusicBtn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Yükleniyor...';

    try {
        // Müzik dosyasını yükle
        const musicFileName = `${Date.now()}-${musicFile.name}`;
        const { data: musicUploadData, error: musicUploadError } = await supabaseClient.storage
            .from('music_files')
            .upload(musicFileName, musicFile);

        if (musicUploadError) {
            throw musicUploadError;
        }

        const { data: musicPublicUrlData } = supabaseClient.storage
            .from('music_files')
            .getPublicUrl(musicUploadData.path);
        const music_url = musicPublicUrlData.publicUrl;

        let image_url = defaultCover;
        if (musicImage) {
            // Resim dosyasını yükle
            const imageFileName = `${Date.now()}-${musicImage.name}`;
            const { data: imageUploadData, error: imageUploadError } = await supabaseClient.storage
                .from('music_images')
                .upload(imageFileName, musicImage);

            if (imageUploadError) {
                console.warn('Resim yüklenirken hata oluştu (müzik yüklenecek):', imageUploadError.message);
                // Resim yüklemede hata olsa bile müziği kaydetmeye devam et
            } else {
                const { data: imagePublicUrlData } = supabaseClient.storage
                    .from('music_images')
                    .getPublicUrl(imageUploadData.path);
                image_url = imagePublicUrlData.publicUrl;
            }
        }

        // Supabase veritabanına müzik bilgilerini ekle
        const { data, error: insertError } = await supabaseClient
            .from('musics')
            .insert([{ title, artist, music_url, image_url }]);

        if (insertError) {
            throw insertError;
        }

        alert('Müzik başarıyla eklendi!');
        musicTitleInput.value = '';
        musicArtistInput.value = '';
        musicFileInput.value = '';
        musicImageInput.value = '';
        await renderMusics(); // Müzikleri yeniden yükle

    } catch (error) {
        console.error('Müzik yükleme hatası:', error.message);
        alert(`Müzik yüklenirken bir hata oluştu: ${error.message}`);
    } finally {
        addMusicBtn.disabled = false;
        addMusicBtn.innerHTML = '<i class="fa fa-plus"></i> Müziği Ekle';
    }
}

// Supabase'den müzik sil
async function deleteMusic() {
    const musicId = deleteSelect.value;
    if (!musicId) {
        alert('Lütfen silmek için bir müzik seçin.');
        return;
    }

    if (!confirm('Bu müziği silmek istediğinizden emin misiniz?')) {
        return;
    }

    deleteMusicBtn.disabled = true;
    deleteMusicBtn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Siliniyor...';

    try {
        // Önce müziğin bilgilerini alalım (url'leri silmek için)
        const { data: musicData, error: fetchError } = await supabaseClient
            .from('musics')
            .select('music_url, image_url')
            .eq('id', musicId)
            .single();

        if (fetchError || !musicData) {
            throw new Error('Silinecek müzik bulunamadı veya getirilemedi.');
        }

        // Veritabanından kaydı sil
        const { error: deleteError } = await supabaseClient
            .from('musics')
            .delete()
            .eq('id', musicId);

        if (deleteError) {
            throw deleteError;
        }

        // Storage'dan dosyaları sil
        if (musicData.music_url) {
            const musicPath = musicData.music_url.split('/').pop();
            const { error: musicDeleteError } = await supabaseClient.storage
                .from('music_files')
                .remove([musicPath]);
            if (musicDeleteError) {
                console.warn('Müzik dosyası silinirken hata:', musicDeleteError.message);
            }
        }
        if (musicData.image_url && musicData.image_url !== defaultCover) { // Varsayılan görseli silme
            const imagePath = musicData.image_url.split('/').pop();
            const { error: imageDeleteError } = await supabaseClient.storage
                .from('music_images')
                .remove([imagePath]);
            if (imageDeleteError) {
                console.warn('Resim dosyası silinirken hata:', imageDeleteError.message);
            }
        }

        alert('Müzik başarıyla silindi!');
        await renderMusics(); // Müzikleri yeniden yükle
        stopMusic(); // Çalan şarkı silinirse durdur
    } catch (error) {
        console.error('Müzik silme hatası:', error.message);
        alert(`Müzik silinirken bir hata oluştu: ${error.message}`);
    } finally {
        deleteMusicBtn.disabled = false;
        deleteMusicBtn.innerHTML = '<i class="fa fa-trash"></i> Müziği Sil';
    }
}


// --- Event Listeners ---
document.addEventListener('DOMContentLoaded', async () => {
    console.log("DOMContentLoaded olayı tetiklendi. Script çalışıyor...");

    try {
        if (typeof window.supabase === 'undefined') {
            console.error("Hata: window.supabase tanımlanmamış. Supabase kütüphanesi yüklenemedi veya çalışmadı.");
            alert("Supabase kütüphanesi yüklenirken bir sorun oluştu.");
            return;
        }
        supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log("Supabase Client başarıyla oluşturuldu.");

        // Oynat/Duraklat butonu
        if (playPauseButton) {
            playPauseButton.addEventListener('click', () => {
                if (currentPlayList.length === 0) {
                    alert('Çalınacak müzik yok. Lütfen önce müzik ekleyin.');
                    return;
                }
                if (isPlaying) {
                    pauseMusic();
                } else {
                    if (audioPlayer.src) { // Eğer bir kaynak atanmışsa devam et
                        playMusic();
                    } else if (currentSongIndex > -1) { // Hiçbir şey çalmıyorsa ama bir şarkı seçiliyse onu çal
                        playSpecificSong(currentSongIndex);
                    } else if (currentPlayList.length > 0) { // Hiç şarkı seçili değilse ilk şarkıyı çal
                        playSpecificSong(0);
                    }
                }
            });
        }

        // Sonraki şarkı butonu
        if (nextButton) {
            nextButton.addEventListener('click', playNextSong);
        }

        // Önceki şarkı butonu
        if (prevButton) {
            prevButton.addEventListener('click', playPrevSong);
        }

        // İlerleme çubuğu değişimi
        if (progressBar) {
            progressBar.addEventListener('input', () => {
                const seekTime = (progressBar.value / 100) * audioPlayer.duration;
                audioPlayer.currentTime = seekTime;
            });
        }

        // Ses seviyesi kontrolü
        if (volumeBar) {
            volumeBar.addEventListener('input', () => {
                audioPlayer.volume = parseFloat(volumeBar.value);
                updateVolumeIcon(audioPlayer.volume);
                lastVolume = audioPlayer.volume; // Son ses seviyesini kaydet
            });
        }

        // Ses kapatma/açma butonu
        if (volumeIconButton) {
            volumeIconButton.addEventListener('click', () => {
                if (audioPlayer.volume > 0) {
                    lastVolume = audioPlayer.volume; // Şu anki sesi kaydet
                    audioPlayer.volume = 0;
                    volumeBar.value = 0;
                } else {
                    audioPlayer.volume = lastVolume > 0 ? lastVolume : 0.7; // Kaydedilmiş sese veya varsayılana dön
                    volumeBar.value = audioPlayer.volume;
                }
                updateVolumeIcon(audioPlayer.volume);
            });
        }

        // Şarkı bitince sonraki şarkıya geç
        if (audioPlayer) {
            audioPlayer.addEventListener('ended', playNextSong);
            audioPlayer.addEventListener('loadedmetadata', () => {
                if (!isNaN(audioPlayer.duration)) {
                    durationTimeElement.textContent = formatTime(audioPlayer.duration);
                }
            });
        }


        // Admin Paneli Yönetimi
        // Admin butonu kaldırıldığı için bu kısım yorum satırına alındı veya kaldırıldı.
        // if (adminButton) {
        //     adminButton.addEventListener('click', (e) => {
        //         e.preventDefault();
        //         adminPanel.classList.toggle('hidden');
        //     });
        // }

        if (addMusicBtn) {
            addMusicBtn.addEventListener('click', uploadMusic);
        }

        if (deleteMusicBtn) {
            deleteMusicBtn.addEventListener('click', deleteMusic);
        }

        // Yan menü açma/kapama (mobil)
        if (openSidebarBtn && closeSidebarBtn && sidebar) {
            openSidebarBtn.addEventListener('click', () => {
                sidebar.classList.add('translate-x-0');
                sidebar.classList.remove('-translate-x-full');
            });

            closeSidebarBtn.addEventListener('click', () => {
                sidebar.classList.remove('translate-x-0');
                sidebar.classList.add('-translate-x-full');
            });
        }

        // Arama çubuğu
        if (searchInput) {
            searchInput.addEventListener('input', () => {
                renderMusics(searchInput.value.trim()); // Arama terimini renderMusics'e gönder
            });

            // Arama çubuğu dışına tıklanınca kapanması
            document.addEventListener('click', (event) => {
                const isClickInsideSearch = searchInput.contains(event.target) || event.target.classList.contains('fa-search');
                if (!isClickInsideSearch && searchInput.value === '') {
                    // Eğer arama çubuğu boşsa ve dışarıya tıklandıysa, herhangi bir özel kapanma davranışına gerek yok.
                    // Tailwind'in default davranışı veya diğer elementlerin odak kaybetme durumları yeterli.
                    // Eğer arama çubuğunun kendisini gizleyen bir "kapat" davranışı olsaydı, burada yönetilirdi.
                    // Şu anki durumda, sadece değeri boşaltıldığında visual bir değişiklik yok.
                }
            });
        }

        // Upcoming Music Scroll Buttons
        if (upcomingPrevBtn && upcomingNextBtn && upcomingMusicContainerWrapper) {
            const scrollAmount = 200; // İhtiyaca göre ayarla
            upcomingPrevBtn.addEventListener('click', () => {
                upcomingMusicContainerWrapper.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
            });
            upcomingNextBtn.addEventListener('click', () => {
                upcomingMusicContainerWrapper.scrollBy({ left: scrollAmount, behavior: 'smooth' });
            });
        }

        // --- Initial Setup ---
        if (coverImage) coverImage.src = defaultCover;
        if (currentSongArtistElement) currentSongArtistElement.textContent = defaultArtist; // Sanatçı boş bırakıldı
        if (audioPlayer && volumeBar) {
            audioPlayer.volume = parseFloat(volumeBar.value); // Ses seviyesini numara olarak ayarla
            updateVolumeIcon(audioPlayer.volume);
            lastVolume = audioPlayer.volume; // lastVolume'ı başlat
        }
        updatePlayerUIState();
        await renderMusics(); // Sayfa yüklendiğinde müzikleri getir ve render et

    } catch (error) {
        console.error("DOMContentLoaded içinde yakalanan genel hata:", error);
        alert("Uygulama başlatılırken beklenmeyen bir hata oluştu. Konsolu kontrol edin.");
    }
});
