// --- Supabase Setup ---
// !! Buraya kendi Supabase Proje URL ve Public Anon Key bilgilerini GİRİN !!
const SUPABASE_URL = 'https://skhbykqwdbwjcvqmwvft.supabase.co'; // <-- KENDİ URL'NİZİ GİRİN
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNraGJ5a3F3ZGJ3amN2cW13dmZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU3Nzg0NDYsImV4cCI6MjA2MTM1NDQ0Nn0.e8pbfF7O_rTtSKxtFzzc_zZTsegsxsNaluHNFBbWbMs'; // <-- KENDİ ANON KEY'İNİZİ GİRİN
// !! Supabase bilgilerini GİRDİĞİNİZDEN EMİN OLUN !!

let supabaseClient;
let currentMusicIndex = 0;
let musics = [];
let defaultCover = 'https://via.placeholder.com/600x600?text=Albüm+Kapağı+Yok';
let defaultArtist = 'Bilinmeyen Sanatçı';

// Audio Player Elements
const audioPlayer = document.getElementById('audioPlayer');
const playPauseBtn = document.getElementById('playPauseBtn');
const playPauseIcon = document.getElementById('playPauseIcon');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const progressBar = document.getElementById('progressBar');
const currentTimeElement = document.getElementById('currentTime');
const durationElement = document.getElementById('duration');
const volumeBar = document.getElementById('volumeBar');
const volumeBtn = document.getElementById('volumeBtn');
const volumeIcon = document.getElementById('volumeIcon');
let lastVolume = 0.5; // Son ses seviyesini saklar

// Current Song Info Elements
const coverImage = document.getElementById('coverImage');
const currentSongNameElement = document.getElementById('currentSongName');
const currentSongArtistElement = document.getElementById('currentSongArtist');

// Admin Panel Elements
const adminButton = document.getElementById('adminButton');
const adminButtonSmallScreen = document.getElementById('adminButtonSmallScreen');
const adminPanel = document.getElementById('adminPanel');
const closeAdminPanel = document.getElementById('closeAdminPanel');
const addMusicBtn = document.getElementById('addMusicBtn');
const musicNameInput = document.getElementById('musicName');
const musicArtistInput = document.getElementById('musicArtist');
const musicFileInput = document.getElementById('musicFile');
const musicImageInput = document.getElementById('musicImage');
const deleteSelect = document.getElementById('deleteSelect');
const deleteMusicBtn = document.getElementById('deleteMusicBtn');

// Music List Elements
const musicListContainer = document.getElementById('musicListContainer');
const upcomingMusicContainer = document.getElementById('upcomingMusicContainer');
const upcomingPrevBtn = document.getElementById('upcomingPrevBtn');
const upcomingNextBtn = document.getElementById('upcomingNextBtn');
const upcomingMusicContainerWrapper = document.getElementById('upcomingMusicContainerWrapper');
const searchInput = document.getElementById('searchInput');

// Auth Elements
const authContainer = document.getElementById('authContainer');
const appContent = document.getElementById('appContent');
const authForm = document.getElementById('authForm');
const authTitle = document.getElementById('authTitle');
const authSubmitBtn = document.getElementById('authSubmitBtn');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const toggleAuthModeBtn = document.getElementById('toggleAuthMode');
const authMessage = document.getElementById('authMessage');
const logoutButton = document.getElementById('logoutButton');

let isLoginMode = true; // true = login, false = signup

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

        // --- Auth Durumunu Kontrol Et ---
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (session) {
            console.log("Kullanıcı oturum açmış:", session.user.email);
            showAppContent();
        } else {
            console.log("Kullanıcı oturum açmamış.");
            showAuthContainer();
        }

        // --- Event Listeners for Auth ---
        toggleAuthModeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            isLoginMode = !isLoginMode;
            if (isLoginMode) {
                authTitle.textContent = 'Giriş Yap';
                authSubmitBtn.innerHTML = '<i class="fa fa-sign-in-alt"></i> Giriş Yap';
                toggleAuthModeBtn.textContent = 'Şimdi Kaydol';
            } else {
                authTitle.textContent = 'Kaydol';
                authSubmitBtn.innerHTML = '<i class="fa fa-user-plus"></i> Kaydol';
                toggleAuthModeBtn.textContent = 'Giriş Yap';
            }
            authMessage.classList.add('hidden'); // Mesajı gizle
            authForm.reset(); // Formu temizle
        });

        authForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = emailInput.value;
            const password = passwordInput.value;
            authMessage.classList.add('hidden'); // Önceki mesajı temizle

            try {
                if (isLoginMode) {
                    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
                    if (error) throw error;
                    console.log('Giriş başarılı:', data.user);
                    showAppContent();
                } else {
                    const { data, error } = await supabaseClient.auth.signUp({ email, password });
                    if (error) throw error;
                    console.log('Kayıt başarılı:', data.user);
                    authMessage.textContent = 'Kayıt başarılı! Lütfen e-postanızı onaylayın ve giriş yapın.';
                    authMessage.classList.remove('hidden', 'text-red-500');
                    authMessage.classList.add('text-green-500');
                    isLoginMode = true; // Kayıt sonrası otomatik olarak giriş moduna geç
                    authTitle.textContent = 'Giriş Yap';
                    authSubmitBtn.innerHTML = '<i class="fa fa-sign-in-alt"></i> Giriş Yap';
                    toggleAuthModeBtn.textContent = 'Şimdi Kaydol';
                    authForm.reset();
                }
            } catch (error) {
                console.error('Kimlik doğrulama hatası:', error.message);
                authMessage.textContent = `Hata: ${error.message}`;
                authMessage.classList.remove('hidden', 'text-green-500');
                authMessage.classList.add('text-red-500');
            }
        });

        logoutButton.addEventListener('click', async () => {
            const { error } = await supabaseClient.auth.signOut();
            if (error) {
                console.error('Çıkış yaparken hata:', error.message);
                alert('Çıkış yapılırken bir hata oluştu: ' + error.message);
            } else {
                console.log('Başarıyla çıkış yapıldı.');
                showAuthContainer();
                // Oynatıcıyı durdur ve sıfırla
                audioPlayer.pause();
                audioPlayer.currentTime = 0;
                playPauseIcon.classList.remove('fa-pause');
                playPauseIcon.classList.add('fa-play');
                updatePlayerUIState();
            }
        });


        // --- Mevcut Müzik Çalar İşlevselliği (Oturum açmışsa çalışır) ---
        // Bu kısım sadece showAppContent() çağrıldığında çalışacak.

        if (playPauseBtn) {
            playPauseBtn.addEventListener('click', togglePlayPause);
        }
        if (prevBtn) {
            prevBtn.addEventListener('click', playPreviousMusic);
        }
        if (nextBtn) {
            nextBtn.addEventListener('click', playNextMusic);
        }

        if (audioPlayer && progressBar) {
            audioPlayer.addEventListener('timeupdate', updateProgressBar);
            audioPlayer.addEventListener('ended', playNextMusic); // Şarkı bitince sonraki şarkıya geç
        }
        if (progressBar) {
            progressBar.addEventListener('input', seekMusic);
        }

        if (audioPlayer && volumeBar) {
            volumeBar.addEventListener('input', () => {
                audioPlayer.volume = parseFloat(volumeBar.value);
                updateVolumeIcon(audioPlayer.volume);
                lastVolume = audioPlayer.volume; // Ses seviyesi değiştikçe günceller
            });
        }
        if (volumeBtn) {
            volumeBtn.addEventListener('click', toggleMute);
        }

        if (adminButton) {
            adminButton.addEventListener('click', () => {
                adminPanel.classList.remove('hidden');
                loadMusicsForDeletion(); // Silme için müzikleri yükle
            });
        }
        if (adminButtonSmallScreen) {
            adminButtonSmallScreen.addEventListener('click', () => {
                adminPanel.classList.remove('hidden');
                loadMusicsForDeletion(); // Silme için müzikleri yükle
            });
        }
        if (closeAdminPanel) {
            closeAdminPanel.addEventListener('click', () => {
                adminPanel.classList.add('hidden');
            });
        }

        // Müzik Ekle Formu
        if (addMusicBtn) {
            addMusicBtn.addEventListener('click', addMusic);
        }

        // Müzik Sil Butonu
        if (deleteMusicBtn) {
            deleteMusicBtn.addEventListener('click', deleteSelectedMusic);
        }

        // Search Input
        if (searchInput) {
            searchInput.addEventListener('input', () => {
                renderMusics(searchInput.value.trim()); // Arama terimini renderMusics'e gönder
            });
        }

        // Upcoming Music Scroll Buttons
        if (upcomingPrevBtn && upcomingNextBtn && upcomingMusicContainerWrapper) {
            const scrollAmount = 200; // Ayarlanabilir
            upcomingPrevBtn.addEventListener('click', () => {
                upcomingMusicContainerWrapper.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
            });
            upcomingNextBtn.addEventListener('click', () => {
                upcomingMusicContainerWrapper.scrollBy({ left: scrollAmount, behavior: 'smooth' });
            });
        }

        // --- Initial Setup (App içeriği göründüğünde çalışır) ---
        if (coverImage) coverImage.src = defaultCover;
        if (currentSongArtistElement) currentSongArtistElement.textContent = defaultArtist;
        if (audioPlayer && volumeBar) {
            audioPlayer.volume = parseFloat(volumeBar.value); // Ses seviyesinin sayı olduğundan emin ol
            updateVolumeIcon(audioPlayer.volume);
            lastVolume = audioPlayer.volume; // lastVolume'u başlat
        }
        updatePlayerUIState();
        // await renderMusics(); // İlk yüklemede müzikleri çek ve render et (artık showAppContent içinde)

    } catch (error) {
        console.error("DOMContentLoaded içinde yakalanan genel hata:", error);
        alert("Uygulama başlatılırken beklenmeyen bir hata oluştu. Konsolu kontrol edin.");
    }
});

// --- Auth UI Fonksiyonları ---
function showAuthContainer() {
    authContainer.classList.remove('hidden');
    appContent.classList.add('hidden');
}

async function showAppContent() {
    authContainer.classList.add('hidden');
    appContent.classList.remove('hidden');
    // Uygulama içeriği yüklendiğinde müzikleri yükle
    await renderMusics();
}

// --- Player Functions ---

function togglePlayPause() {
    if (audioPlayer.paused) {
        audioPlayer.play();
        playPauseIcon.classList.remove('fa-play');
        playPauseIcon.classList.add('fa-pause');
    } else {
        audioPlayer.pause();
        playPauseIcon.classList.remove('fa-pause');
        playPauseIcon.classList.add('fa-play');
    }
}

function updateProgressBar() {
    const { currentTime, duration } = audioPlayer;
    progressBar.value = (currentTime / duration) * 100 || 0;

    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
    };

    currentTimeElement.textContent = formatTime(currentTime);
    durationElement.textContent = formatTime(duration);
}

function seekMusic() {
    const seekTime = (progressBar.value / 100) * audioPlayer.duration;
    audioPlayer.currentTime = seekTime;
}

function updateVolumeIcon(volume) {
    if (volume === 0) {
        volumeIcon.classList.remove('fa-volume-up', 'fa-volume-down');
        volumeIcon.classList.add('fa-volume-mute');
    } else if (volume > 0 && volume <= 0.5) {
        volumeIcon.classList.remove('fa-volume-up', 'fa-volume-mute');
        volumeIcon.classList.add('fa-volume-down');
    } else {
        volumeIcon.classList.remove('fa-volume-down', 'fa-volume-mute');
        volumeIcon.classList.add('fa-volume-up');
    }
}

function toggleMute() {
    if (audioPlayer.volume === 0) {
        audioPlayer.volume = lastVolume > 0 ? lastVolume : 0.5; // Son ses seviyesine dön, sıfırsa varsayılan 0.5
    } else {
        lastVolume = audioPlayer.volume; // Şu anki ses seviyesini kaydet
        audioPlayer.volume = 0;
    }
    volumeBar.value = audioPlayer.volume;
    updateVolumeIcon(audioPlayer.volume);
}

async function playMusic(index) {
    if (index >= 0 && index < musics.length) {
        currentMusicIndex = index;
        const music = musics[currentMusicIndex];

        // Müzik dosyasını Supabase Storage'dan al
        const { data: musicFile, error: musicFileError } = await supabaseClient.storage
            .from('music_files') // Kovalarınızın adı
            .download(music.file_path);

        if (musicFileError) {
            console.error('Müzik dosyası yüklenirken hata:', musicFileError.message);
            alert('Müzik dosyası yüklenirken bir hata oluştu.');
            return;
        }

        const musicUrl = URL.createObjectURL(musicFile);
        audioPlayer.src = musicUrl;
        currentSongNameElement.textContent = music.name;
        currentSongArtistElement.textContent = music.artist;

        // Albüm kapağını Supabase Storage'dan al
        if (music.image_path) {
            const { data: imageUrl } = supabaseClient.storage
                .from('music_images') // Kovalarınızın adı
                .getPublicUrl(music.image_path);
            coverImage.src = imageUrl.publicUrl;
        } else {
            coverImage.src = defaultCover;
        }

        audioPlayer.play();
        playPauseIcon.classList.remove('fa-play');
        playPauseIcon.classList.add('fa-pause');
        updatePlayerUIState();
    } else {
        console.warn('Geçersiz müzik indeksi veya müzik yok.');
        // Oynatıcıyı durdur ve varsayılan hale getir
        audioPlayer.pause();
        audioPlayer.src = '';
        currentSongNameElement.textContent = 'Şarkı Adı';
        currentSongArtistElement.textContent = 'Sanatçı Adı';
        coverImage.src = defaultCover;
        playPauseIcon.classList.remove('fa-pause');
        playPauseIcon.classList.add('fa-play');
        updatePlayerUIState();
    }
}

function playNextMusic() {
    currentMusicIndex = (currentMusicIndex + 1) % musics.length;
    playMusic(currentMusicIndex);
}

function playPreviousMusic() {
    currentMusicIndex = (currentMusicIndex - 1 + musics.length) % musics.length;
    playMusic(currentMusicIndex);
}

function updatePlayerUIState() {
    if (musics.length === 0) {
        // Müzik yoksa oynatıcıyı devre dışı bırak
        playPauseBtn.disabled = true;
        prevBtn.disabled = true;
        nextBtn.disabled = true;
        progressBar.disabled = true;
        volumeBar.disabled = true;
        volumeBtn.disabled = true;
        currentSongNameElement.textContent = 'Müzik Yok';
        currentSongArtistElement.textContent = '-----';
        coverImage.src = defaultCover;
        currentTimeElement.textContent = '0:00';
        durationElement.textContent = '0:00';
    } else {
        playPauseBtn.disabled = false;
        prevBtn.disabled = false;
        nextBtn.disabled = false;
        progressBar.disabled = false;
        volumeBar.disabled = false;
        volumeBtn.disabled = false;
    }
}

// --- Supabase Operations ---

async function fetchMusics(searchTerm = '') {
    let query = supabaseClient
        .from('musics')
        .select('*')
        .order('created_at', { ascending: false });

    if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,artist.ilike.%${searchTerm}%`);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Müzikler getirilirken hata:', error.message);
        return [];
    }
    return data;
}

async function renderMusics(searchTerm = '') {
    musics = await fetchMusics(searchTerm);
    musicListContainer.innerHTML = '';
    upcomingMusicContainer.innerHTML = ''; // Yaklaşan müzikleri de temizle
    deleteSelect.innerHTML = '<option value="" disabled selected>Silmek için seçin...</option>';

    if (musics.length === 0) {
        musicListContainer.innerHTML = '<p class="text-gray-400 col-span-full text-center">Henüz müzik bulunamadı.</p>';
        upcomingMusicContainer.innerHTML = '<p class="text-gray-400 text-sm">Yaklaşan müzik yok.</p>';
        updatePlayerUIState();
        return;
    }

    musics.forEach((music, index) => {
        // Ana müzik listesi için kart oluştur
        const musicCard = createMusicCard(music, index, true);
        musicListContainer.appendChild(musicCard);

        // Silme selectbox'ı için seçenek oluştur
        const option = document.createElement('option');
        option.value = music.id;
        option.textContent = `${music.name} - ${music.artist}`;
        deleteSelect.appendChild(option);
    });

    // Yaklaşan müzikler için ayrı kartlar oluştur (ilk 5 veya daha az)
    musics.slice(0, 5).forEach((music, index) => {
        const upcomingCard = createMusicCard(music, index, false);
        upcomingMusicContainer.appendChild(upcomingCard);
    });

    // İlk müziği çal (veya oynatıcıyı güncelle)
    if (audioPlayer.src === '' || !audioPlayer.src.includes(musics[currentMusicIndex]?.file_path)) {
        playMusic(currentMusicIndex);
    }
    updatePlayerUIState();
}

function createMusicCard(music, index, isMainList) {
    const card = document.createElement('div');
    card.className = `bg-gray-700 rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden ${isMainList ? 'relative' : 'flex-shrink-0 w-40 md:w-48 lg:w-56'}`;

    card.innerHTML = `
        <img src="${music.image_path ? supabaseClient.storage.from('music_images').getPublicUrl(music.image_path).data.publicUrl : defaultCover}" 
             alt="${music.name}" class="w-full ${isMainList ? 'h-48' : 'h-32'} object-cover cursor-pointer" onclick="playMusic(${index})">
        <div class="p-4 ${isMainList ? '' : 'text-sm'}">
            <h3 class="font-semibold text-lg ${isMainList ? 'truncate' : 'truncate'}" title="${music.name}">${music.name}</h3>
            <p class="text-gray-400 ${isMainList ? 'truncate' : 'truncate'}" title="${music.artist}">${music.artist}</p>
            ${isMainList ? `<button class="absolute bottom-4 right-4 bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-full shadow-lg transition-transform transform hover:scale-110" onclick="playMusic(${index})">
                <i class="fa fa-play"></i>
            </button>` : ''}
        </div>
    `;
    return card;
}


async function addMusic(e) {
    e.preventDefault();

    const name = musicNameInput.value.trim();
    const artist = musicArtistInput.value.trim();
    const musicFile = musicFileInput.files[0];
    const musicImage = musicImageInput.files[0];

    if (!name || !artist || !musicFile) {
        alert('Lütfen tüm alanları doldurun ve bir müzik dosyası seçin.');
        return;
    }

    const uniqueMusicFileName = `${Date.now()}-${musicFile.name}`;
    let uniqueImageFileName = null;

    try {
        // Müzik dosyasını yükle
        const { data: musicUploadData, error: musicUploadError } = await supabaseClient.storage
            .from('music_files')
            .upload(uniqueMusicFileName, musicFile);

        if (musicUploadError) throw musicUploadError;

        // Albüm kapağı varsa yükle
        if (musicImage) {
            uniqueImageFileName = `${Date.now()}-${musicImage.name}`;
            const { data: imageUploadData, error: imageUploadError } = await supabaseClient.storage
                .from('music_images')
                .upload(uniqueImageFileName, musicImage);

            if (imageUploadError) throw imageUploadError;
        }

        // Supabase veritabanına müzik bilgilerini kaydet
        const { data, error: dbInsertError } = await supabaseClient
            .from('musics')
            .insert([
                {
                    name: name,
                    artist: artist,
                    file_path: uniqueMusicFileName,
                    image_path: uniqueImageFileName // Eğer resim yoksa null kalır
                }
            ]);

        if (dbInsertError) throw dbInsertError;

        alert('Müzik başarıyla eklendi!');
        musicNameInput.value = '';
        musicArtistInput.value = '';
        musicFileInput.value = '';
        musicImageInput.value = '';
        renderMusics(); // Müzik listesini güncelle
        adminPanel.classList.add('hidden'); // Paneli kapat
    } catch (error) {
        console.error('Müzik eklenirken hata:', error.message);
        alert('Müzik eklenirken bir hata oluştu: ' + error.message);
        // Hata durumunda yüklenen dosyaları temizlemek isteyebilirsiniz
        if (uniqueMusicFileName) {
            await supabaseClient.storage.from('music_files').remove([uniqueMusicFileName]);
        }
        if (uniqueImageFileName) {
            await supabaseClient.storage.from('music_images').remove([uniqueImageFileName]);
        }
    }
}

async function loadMusicsForDeletion() {
    const data = await fetchMusics(); // Tüm müzikleri tekrar çek
    deleteSelect.innerHTML = '<option value="" disabled selected>Silmek için seçin...</option>'; // Temizle

    if (data.length === 0) {
        const option = document.createElement('option');
        option.value = '';
        option.textContent = 'Henüz silinecek müzik yok.';
        option.disabled = true;
        deleteSelect.appendChild(option);
        deleteMusicBtn.disabled = true;
        return;
    }
    deleteMusicBtn.disabled = false;

    data.forEach(music => {
        const option = document.createElement('option');
        option.value = music.id;
        option.setAttribute('data-file-path', music.file_path);
        if (music.image_path) {
            option.setAttribute('data-image-path', music.image_path);
        }
        option.textContent = `${music.name} - ${music.artist}`;
        deleteSelect.appendChild(option);
    });
}

async function deleteSelectedMusic() {
    const selectedOption = deleteSelect.options[deleteSelect.selectedIndex];
    if (!selectedOption || !selectedOption.value) {
        alert('Lütfen silmek için bir müzik seçin.');
        return;
    }

    const musicId = selectedOption.value;
    const filePath = selectedOption.getAttribute('data-file-path');
    const imagePath = selectedOption.getAttribute('data-image-path');

    if (!confirm(`"${selectedOption.textContent}" adlı müziği silmek istediğinizden emin misiniz?`)) {
        return;
    }

    try {
        // Supabase Storage'dan müzik dosyasını sil
        const { error: fileDeleteError } = await supabaseClient.storage
            .from('music_files')
            .remove([filePath]);

        if (fileDeleteError) {
            console.error('Müzik dosyası silinirken hata:', fileDeleteError.message);
            // Hata olsa bile devam et, veritabanından silmeyi dene
        }

        // Eğer bir albüm kapağı varsa onu da sil
        if (imagePath) {
            const { error: imageDeleteError } = await supabaseClient.storage
                .from('music_images')
                .remove([imagePath]);

            if (imageDeleteError) {
                console.error('Albüm kapağı silinirken hata:', imageDeleteError.message);
                // Hata olsa bile devam et
            }
        }

        // Supabase veritabanından müzik kaydını sil
        const { error: dbDeleteError } = await supabaseClient
            .from('musics')
            .delete()
            .eq('id', musicId);

        if (dbDeleteError) throw dbDeleteError;

        alert('Müzik başarıyla silindi!');
        // Eğer silinen müzik o an çalınan müzikse, oynatıcıyı sıfırla
        if (musics[currentMusicIndex]?.id == musicId) {
            audioPlayer.pause();
            audioPlayer.src = '';
            currentSongNameElement.textContent = 'Şarkı Adı';
            currentSongArtistElement.textContent = 'Sanatçı Adı';
            coverImage.src = defaultCover;
            playPauseIcon.classList.remove('fa-pause');
            playPauseIcon.classList.add('fa-play');
        }
        await renderMusics(); // Müzik listesini ve silme seçeneklerini güncelle
        await loadMusicsForDeletion(); // Silme seçeneklerini de güncelle
        updatePlayerUIState();
    } catch (error) {
        console.error('Müzik silinirken hata:', error.message);
        alert('Müzik silinirken bir hata oluştu: ' + error.message);
    }
}
