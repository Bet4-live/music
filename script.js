// --- Supabase Setup ---
// !! Buraya kendi Supabase Proje URL ve Public Anon Key bilgilerini GİRİN !!
const SUPABASE_URL = 'https://skhbykqwdbwjcvqmwvft.supabase.co'; // <-- KENDİ URL'NİZİ GİRİN
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNraGJ5a3F3ZGJ3amN2cW13dmZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU3Nzg0NDYsImV4cCI6MjA2MTM1NDQ0Nn0.e8pbfF7O_rTtSKxtFzzc_zZTsegsxsNaluHNFBbWbMs'; // <-- KENDİ ANON KEY'İNİZİ GİRİN
// !! Supabase bilgilerini GİRDİĞİNİZDEN EMİN OLUN !!

// Supabase istemcisini tutacak değişkeni tanımlıyoruz (başlangıçta null)
let supabaseClient = null;


// --- DOM Elements (DOMContentLoaded içinde tanımlanacak) ---
let audioPlayer;
let coverImageSmall; // Spotify benzeri alt çubuk kapağı
let currentSongTitleSmall; // Spotify benzeri alt çubuk başlığı
let currentArtistSmall; // Spotify benzeri alt çubuk sanatçısı
let seekBar;
let currentTimeSpan;
let totalDurationSpan;
let volumeBar;
let volumeIcon;
let playPauseBtn;
let playPauseIcon; // playPauseBtn içindeki ikon
let prevBtn;
let nextBtn;
let musicListDesktop;
let songCountDesktop;
let mobileMusicListModal;
let mobileMusicListContent; // Modal içeriği
let musicListMobile; // Mobil liste içindeki müzik listesi
let adminButton;
let adminPanelDiv;
let loginForm;
let adminControlsDiv;
let authEmailInput;
let authPassInput;
let signInBtn;
let signOutBtn;
let loggedInUserEmailSpan;
let closeMobileListBtn;
let closeAdminPanelBtn;
let addMusicBtn;
let deleteSelect;
let deleteMusicBtn;
let musicNameInput; // Müzik adı inputu
let artistNameInput; // Sanatçı adı inputu
let musicFileInput; // Müzik dosyası inputu
let musicImageInput; // Kapak resmi inputu
let mouseEffectArea; // Fare takip alanı
// let welcomeMessageDiv; // Hoş geldiniz mesajı kaldırıldı


// --- State Variables ---
const defaultCover = 'https://placehold.co/50x50/191414/ffffff?text=Spot'; // Spotify varsayılan kapak boyutu
let currentMusicId = null; // ID of the currently loaded music (Supabase ID)
let currentMusicIndex = -1; // Index in the currently rendered musicData array
let musicData = []; // Array to hold the current list of music objects from Supabase
let lastVolume = 1; // Store volume before mute


// --- Mouse Following Dots Effect Variables ---
const numDots = 40; // Toplam nokta sayısı
const dots = [];
const easeFactor = 0.08; // Takip hassasiyeti (küçük değerler daha yavaş takip eder)
let mouseX = 0;
let mouseY = 0;


// Tüm kodumuzu DOMContentLoaded olay dinleyicisi içine alıyoruz
document.addEventListener('DOMContentLoaded', async () => {
    console.log("DOMContentLoaded olayı tetiklendi. Script çalışıyor...");

    // --- Supabase İstemcisini Başlat ---
    try {
         // Supabase global objesinin varlığını kontrol et
         if (typeof window.supabase === 'undefined') {
             console.error("Hata: window.supabase tanımlanmamış. Supabase kütüphanesi yüklenemedi veya çalışmadı.");
             alert("Supabase kütüphanesi yüklenirken bir sorun oluştu.");
             return; // Supabase yoksa devam etme
         }

        // Supabase istemcisini DOMContentLoaded içinde ve window objesi üzerinden oluştur
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log("Supabase istemcisi başarıyla oluşturuldu.");

         // İstemci oluşturulduktan sonra bağlantıyı test edebiliriz (isteğe bağlı)
         const { error: connectionError } = await supabaseClient.rpc('supabase_version');
         if (connectionError) {
             console.error("Supabase bağlantı testi hatası:", connectionError);
             alert("Supabase veritabanına bağlanılamadı. URL ve Anahtarınızı kontrol edin.");
             // Supabase bağlantısı yoksa bazı DOM elemanlarını devre dışı bırakabiliriz
             if(adminButton) adminButton.disabled = true;
              const errorMessage = '<p class="loading-message text-red-400">Supabase bağlantısı kurulamadı.</p>';
              if (musicListDesktop) musicListDesktop.innerHTML = errorMessage;
              if (musicListMobile) musicListMobile.innerHTML = errorMessage;
             updatePlayerUIState();
             return; // Bağlantı yoksa devam etme
         } else {
             console.log("Supabase bağlantısı başarılı.");
         }


        // --- DOM Elements'ı DOMContentLoaded içinde alıyoruz ---
        audioPlayer = document.getElementById('audioPlayer');
        coverImageSmall = document.getElementById('coverImageSmall');
        currentSongTitleSmall = document.getElementById('currentSongTitleSmall');
        currentArtistSmall = document.getElementById('currentArtistSmall');
        seekBar = document.getElementById('seekBar');
        currentTimeSpan = document.getElementById('currentTime');
        totalDurationSpan = document.getElementById('totalDuration');
        volumeBar = document.getElementById('volumeBar');
        volumeIcon = document.getElementById('volumeIcon');
        playPauseBtn = document.getElementById('playPauseBtn');
        playPauseIcon = playPauseBtn ? playPauseBtn.querySelector('i') : null;
        prevBtn = document.getElementById('prevBtn');
        nextBtn = document.getElementById('nextBtn');
        musicListDesktop = document.getElementById('musicListDesktop');
        songCountDesktop = document.getElementById('songCountDesktop');
        mobileMusicListModal = document.getElementById('mobileMusicListModal');
        mobileMusicListContent = document.getElementById('mobileMusicListContent');
        musicListMobile = document.getElementById('musicListMobile');
        adminButton = document.getElementById('adminButton');
        adminPanelDiv = document.getElementById('adminPanel');
        loginForm = document.getElementById('loginForm');
        adminControlsDiv = document.getElementById('adminControls');
        authEmailInput = document.getElementById('authEmail');
        authPassInput = document.getElementById('authPass');
        signInBtn = document.getElementById('signInBtn');
        signOutBtn = document.getElementById('signOutBtn');
        loggedInUserEmailSpan = document.getElementById('loggedInUserEmail');
        closeMobileListBtn = document.getElementById('closeMobileListBtn');
        closeAdminPanelBtn = document.getElementById('closeAdminPanelBtn');
        addMusicBtn = document.getElementById('addMusicBtn');
        deleteSelect = document.getElementById('deleteSelect');
        deleteMusicBtn = document.getElementById('deleteMusicBtn');
        musicNameInput = document.getElementById('musicName');
        artistNameInput = document.getElementById('artistName'); // Sanatçı inputu
        musicFileInput = document.getElementById('musicFile');
        musicImageInput = document.getElementById('musicImage');
        mouseEffectArea = document.querySelector('.mouse-effect-area'); // Fare takip alanı
        welcomeMessageDiv = document.getElementById('welcomeMessage'); // Hoş geldiniz mesajı div'i


        // Gerekli elementlerin varlığını kontrol et (fare takip alanı hariç, o isteğe bağlı olabilir)
        const requiredElements = [
            audioPlayer, coverImageSmall, currentSongTitleSmall, currentArtistSmall,
            seekBar, currentTimeSpan, totalDurationSpan, volumeBar, volumeIcon,
            playPauseBtn, prevBtn, nextBtn, musicListDesktop, songCountDesktop,
            mobileMusicListModal, mobileMusicListContent, musicListMobile, adminButton,
            adminPanelDiv, loginForm, adminControlsDiv, authEmailInput, authPassInput,
            signInBtn, signOutBtn, loggedInUserEmailSpan, closeMobileListBtn, closeAdminPanelBtn,
            addMusicBtn, deleteSelect, deleteMusicBtn, musicNameInput, musicFileInput, musicImageInput
        ];

         // artistNameInput varsa requiredElements'a ekle
         if(artistNameInput) requiredElements.push(artistNameInput);


        const allElementsFound = requiredElements.every(el => el !== null);

        if (!allElementsFound) {
            console.error("Hata: Gerekli bazı DOM elementleri bulunamadı. Lütfen HTML dosyasını kontrol edin.");
             // Hangi elementin bulunamadığını bulmak için
             requiredElements.forEach(el => {
                 if (el === null) {
                     console.error("Bulunamayan element:", el);
                 }
             });
             console.log("Bulunamayan elementler:", { // Element adlarıyla loglama
                 audioPlayer: audioPlayer ? 'var' : 'yok',
                 coverImageSmall: coverImageSmall ? 'var' : 'yok',
                 currentSongTitleSmall: currentSongTitleSmall ? 'var' : 'yok',
                 currentArtistSmall: currentArtistSmall ? 'var' : 'yok',
                 seekBar: seekBar ? 'var' : 'yok',
                 currentTimeSpan: currentTimeSpan ? 'var' : 'yok',
                 totalDurationSpan: totalDurationSpan ? 'var' : 'yok',
                 volumeBar: volumeBar ? 'var' : 'yok',
                 volumeIcon: volumeIcon ? 'var' : 'yok',
                 playPauseBtn: playPauseBtn ? 'var' : 'yok',
                 prevBtn: prevBtn ? 'var' : 'yok',
                 nextBtn: nextBtn ? 'var' : 'yok',
                 musicListDesktop: musicListDesktop ? 'var' : 'yok',
                 songCountDesktop: songCountDesktop ? 'var' : 'yok',
                 mobileMusicListModal: mobileMusicListModal ? 'var' : 'yok',
                 mobileMusicListContent: mobileMusicListContent ? 'var' : 'yok',
                 musicListMobile: musicListMobile ? 'var' : 'yok',
                 adminButton: adminButton ? 'var' : 'yok',
                 adminPanelDiv: adminPanelDiv ? 'var' : 'yok',
                 loginForm: loginForm ? 'var' : 'yok',
                 adminControlsDiv: adminControlsDiv ? 'var' : 'yok',
                 authEmailInput: authEmailInput ? 'var' : 'yok',
                 authPassInput: authPassInput ? 'var' : 'yok',
                 signInBtn: signInBtn ? 'var' : 'yok',
                 signOutBtn: signOutBtn ? 'var' : 'yok',
                 loggedInUserEmailSpan: loggedInUserEmailSpan ? 'var' : 'yok',
                 closeMobileListBtn: closeMobileListBtn ? 'var' : 'yok',
                 closeAdminPanelBtn: closeAdminPanelBtn ? 'var' : 'yok',
                 addMusicBtn: addMusicBtn ? 'var' : 'yok',
                 deleteSelect: deleteSelect ? 'var' : 'yok',
                 deleteMusicBtn: deleteMusicBtn ? 'var' : 'yok',
                 musicNameInput: musicNameInput ? 'var' : 'yok',
                 artistNameInput: artistNameInput ? 'var' : 'yok',
                 musicFileInput: musicFileInput ? 'var' : 'yok',
                 musicImageInput: musicImageInput ? 'var' : 'yok',
                 // fare takip alanı isteğe bağlı olduğu için burada kontrol etmiyoruz
             });
            alert("Uygulama başlatılırken bir hata oluştu. Geliştirici konsolunu kontrol edin.");
            return; // Eksik element varsa scripti durdur
        }


        // --- Helper Functions ---
        function formatTime(seconds) {
            if (isNaN(seconds) || seconds < 0 || !isFinite(seconds)) return "0:00";
            const minutes = Math.floor(seconds / 60);
            const secs = Math.floor(seconds % 60);
            return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
        }

        function updateVolumeIcon(volume) {
             if (volume === 0) {
                if(volumeIcon) volumeIcon.className = 'fa fa-volume-xmark';
            } else if (volume < 0.5) {
                 if(volumeIcon) volumeIcon.className = 'fa fa-volume-low';
            } else {
                 if(volumeIcon) volumeIcon.className = 'fa fa-volume-high';
            }
        }

        function updatePlayerUIState() {
            const hasMultipleSongs = musicData.length > 1;
            if(prevBtn) prevBtn.disabled = !hasMultipleSongs;
            if(nextBtn) nextBtn.disabled = !hasMultipleSongs;

            if (audioPlayer) {
                if (audioPlayer.paused) {
                    if(playPauseIcon) playPauseIcon.className = 'fa fa-play';
                } else {
                    if(playPauseIcon) playPauseIcon.className = 'fa fa-pause';
                }
            }


            if (currentMusicId === null) {
                if(currentTimeSpan) currentTimeSpan.textContent = "0:00";
                if(totalDurationSpan) totalDurationSpan.textContent = "0:00";
                if(seekBar) {
                    seekBar.value = 0;
                    seekBar.style.setProperty('--progress', `0%`);
                    seekBar.disabled = true;
                }
                if(currentSongTitleSmall) currentSongTitleSmall.textContent = "Şarkı Seçilmedi";
                if(currentArtistSmall) currentArtistSmall.textContent = "";
                if(coverImageSmall) coverImageSmall.src = defaultCover;
            } else {
                 if(seekBar) seekBar.disabled = false;
            }

             // Müzik listesi boşsa veya yüklendiyse hoş geldiniz mesajını yönet
             if (welcomeMessageDiv) {
                 if (musicData.length === 0) {
                     welcomeMessageDiv.style.display = 'block'; // Müzik yoksa göster
                 } else {
                     welcomeMessageDiv.style.display = 'none'; // Müzik varsa gizle
                 }
             }
        }

        function togglePlayPause() {
            if (!audioPlayer || !audioPlayer.src || currentMusicId === null) return;
            if (audioPlayer.paused) {
                audioPlayer.play().catch(e => console.error("Oynatma hatası:", e));
            } else {
                audioPlayer.pause();
            }
        }

        // --- Seek Bar ve Zaman Güncelleme ---
        function updateSeekBar() {
            if (!audioPlayer || !seekBar || !currentTimeSpan) return;
            if (audioPlayer.duration && isFinite(audioPlayer.duration)) {
                const percentage = (audioPlayer.currentTime / audioPlayer.duration) * 100;
                seekBar.value = percentage;
                // CSS değişkenini güncelle
                seekBar.style.setProperty('--progress', `${percentage}%`);
                currentTimeSpan.textContent = formatTime(audioPlayer.currentTime);
            } else {
                 seekBar.value = 0;
                 seekBar.style.setProperty('--progress', `0%`);
                 currentTimeSpan.textContent = formatTime(0);
            }
        }

        function setDuration() {
             if (!audioPlayer || !totalDurationSpan || !seekBar || !currentTimeSpan) return;
             if (audioPlayer.duration && isFinite(audioPlayer.duration)) {
                totalDurationSpan.textContent = formatTime(audioPlayer.duration);
                seekBar.value = 0;
                seekBar.style.setProperty('--progress', `0%`);
                currentTimeSpan.textContent = formatTime(0);
            } else {
                totalDurationSpan.textContent = "0:00"; currentTimeSpan.textContent = "0:00";
                seekBar.value = 0;
                seekBar.style.setProperty('--progress', `0%`);
            }
        }

        function seek() {
            if (!audioPlayer || !seekBar || !audioPlayer.duration || !isFinite(audioPlayer.duration)) return;
            const time = (seekBar.value / 100) * audioPlayer.duration;
            audioPlayer.currentTime = time;
            // Seek sırasında da CSS değişkenini güncelle
            seekBar.style.setProperty('--progress', `${seekBar.value}%`);
        }

        function changeVolume() {
            if (!audioPlayer || !volumeBar || !volumeIcon) return;
            audioPlayer.volume = volumeBar.value;
            updateVolumeIcon(audioPlayer.volume);
            if (audioPlayer.volume > 0) {
                lastVolume = audioPlayer.volume;
            }
        }

        function toggleMute() {
             if (!audioPlayer || !volumeBar || !volumeIcon) return;
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
            if (!audioPlayer || !coverImageSmall || !currentSongTitleSmall || !currentArtistSmall || !seekBar) return;

            if (index < 0 || index >= musicData.length) {
                console.log("Geçersiz müzik indexi:", index);
                 audioPlayer.pause(); audioPlayer.src = '';
                 if(coverImageSmall) coverImageSmall.src = defaultCover;
                 currentMusicId = null; currentMusicIndex = -1;
                 if(currentSongTitleSmall) currentSongTitleSmall.textContent = "Şarkı Seçilmedi";
                 if(currentArtistSmall) currentArtistSmall.textContent = "";
                 updatePlayerUIState();
                return;
            }

            const music = musicData[index];
            console.log(`Yükleniyor: ${music.name} (ID: ${music.id}, Index: ${index})`);

            audioPlayer.src = music.audio_url;
            if(coverImageSmall) coverImageSmall.src = music.image_url || defaultCover;

            currentMusicId = music.id;
            currentMusicIndex = index;
            if(currentSongTitleSmall) currentSongTitleSmall.textContent = music.name;
             // Sanatçı adını göstermek için (eğer varsa)
             if(currentArtistSmall) currentArtistSmall.textContent = music.artist_name || '';


            // Aktif şarkıyı listede işaretle (Desktop ve Mobile)
            document.querySelectorAll('.music-item').forEach((item) => {
                if (item.dataset.id === currentMusicId.toString()) {
                    item.classList.add('active');
                    // Aktif şarkıyı listelerde görünür yap
                     item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                } else {
                    item.classList.remove('active');
                }
            });


            audioPlayer.load(); // Müzik dosyasını yükle
            audioPlayer.play().catch(e => {
                console.error("Otomatik oynatma engellendi veya hata:", e);
                // Kullanıcıya oynatmanın engellendiğini belirtebiliriz
                // alert("Müzik otomatik oynatılamadı. Lütfen player butonuna tıklayın.");
                if(playPauseIcon) playPauseIcon.className = 'fa fa-play'; // Play ikonunu göster
            });
            updatePlayerUIState();
        }

        function playNext() {
            if (musicData.length === 0 || currentMusicIndex === -1) return;
            let nextIndex = (currentMusicIndex + 1) % musicData.length;
            loadAndPlayMusic(nextIndex);
        }

        function playPrevious() {
             if (musicData.length === 0 || currentMusicIndex === -1) return;
             // Eğer şarkının başındaysak veya 3 saniyeden az çalmışsak bir önceki şarkıya git
             if (audioPlayer && audioPlayer.currentTime < 3) {
                let prevIndex = (currentMusicIndex - 1 + musicData.length) % musicData.length;
                loadAndPlayMusic(prevIndex);
             } else {
                 // Şarkının başından biraz ilerideysek şarkıyı yeniden başlat
                  if (audioPlayer) {
                     audioPlayer.currentTime = 0;
                     audioPlayer.play().catch(e => console.error("Oynatma hatası:", e));
                  }
             }
        }


        // --- Mobile Music List Modal Control ---
        // HTML yapımızda mobil liste ayrı bir modal içinde
        // Mobil liste açma butonu sidebar'dan kaldırıldı, mobil görünümde gösterilebilir
        // Şimdilik sadece kapatma fonksiyonlarını tutalım
        function openMobileMusicList() {
             if (mobileMusicListModal) { mobileMusicListModal.classList.add('open'); } else { console.error("Mobile music list modal element not found!"); }
        }
        function closeMobileMusicList() {
             if (mobileMusicListModal) { mobileMusicListModal.classList.remove('open'); } else { console.error("Mobile music list modal element not found!"); }
        }


        // --- Render Music List (Fetch from Supabase) ---
        async function renderMusics() {
            if (!supabaseClient) {
                console.error("Supabase istemcisi henüz hazır değil (renderMusics içinde).");
                 const errorMessage = '<p class="loading-message">Supabase bağlantısı kurulamadı.</p>';
                 if (musicListDesktop) musicListDesktop.innerHTML = errorMessage;
                 if (musicListMobile) musicListMobile.innerHTML = errorMessage; // Mobil liste içeriği
                 updatePlayerUIState();
                 return;
            }
             console.log("renderMusics çalışıyor...");

            // Loading mesajlarını göster
             if (musicListDesktop) musicListDesktop.innerHTML = '<p class="loading-message">Yükleniyor...</p>';
             if (musicListMobile) musicListMobile.innerHTML = '<p class="loading-message">Yükleniyor...</p>'; // Mobil liste içeriği
             if (deleteSelect) deleteSelect.innerHTML = '<option value="" disabled selected>Silmek için seçin...</option>';
             musicData = [];


            try {
                // Sanatçı adı sütununu da seçiyoruz
                const { data, error } = await supabaseClient
                    .from('musics')
                    .select('id, name, artist_name, audio_url, image_url, user_id') // artist_name ve user_id eklendi
                    .order('created_at', { ascending: false });

                if (error) {
                    console.error('Supabase fetch error:', error);
                     // artist_name sütunu yoksa hata mesajı buna işaret edecektir
                    const errorMessage = `<p class="loading-message text-red-400">Müzikler yüklenemedi: ${error.message}. Supabase tablonuzda 'artist_name' ve 'user_id' sütunlarının varlığını kontrol edin.</p>`;
                    if (musicListDesktop) musicListDesktop.innerHTML = errorMessage;
                    if (musicListMobile) musicListMobile.innerHTML = errorMessage;
                    updatePlayerUIState();
                    return;
                }

                musicData = data || [];
                console.log(`Bulunan müzik sayısı: ${musicData.length}`);

                if (songCountDesktop) songCountDesktop.textContent = `${musicData.length} Şarkı`;

                if (musicData.length === 0) {
                    const noMusicMessage = '<p class="loading-message">Henüz müzik eklenmemiş.</p>';
                    if (musicListDesktop) musicListDesktop.innerHTML = noMusicMessage;
                    if (musicListMobile) musicListMobile.innerHTML = noMusicMessage;
                     // Eğer hiç müzik yoksa ve bir müzik seçiliyorsa, player'ı sıfırla
                    if (currentMusicId !== null) {
                        audioPlayer.pause(); audioPlayer.src = '';
                         if(coverImageSmall) coverImageSmall.src = defaultCover;
                        currentMusicId = null; currentMusicIndex = -1;
                         if(currentSongTitleSmall) currentSongTitleSmall.textContent = "Şarkı Seçilmedi";
                         if(currentArtistSmall) currentArtistSmall.textContent = "";
                    }
                    updatePlayerUIState();
                    return;
                }

                // Listeler boşaltılıyor
                 if (musicListDesktop) musicListDesktop.innerHTML = '';
                 if (musicListMobile) musicListMobile.innerHTML = ''; // Mobil liste içeriği

                 // Aktif şarkının yeni listedeki indexini bul
                 const currentSongIndexInNewList = musicData.findIndex(music => music.id === currentMusicId);
                 if(currentSongIndexInNewList !== -1) {
                     currentMusicIndex = currentSongIndexInNewList;
                 } else {
                      // Eğer seçili şarkı artık listede yoksa player'ı sıfırla
                     if (currentMusicId !== null) {
                         audioPlayer.pause(); audioPlayer.src = '';
                         if(coverImageSmall) coverImageSmall.src = defaultCover;
                         currentMusicId = null; currentMusicIndex = -1;
                         if(currentSongTitleSmall) currentSongTitleSmall.textContent = "Şarkı Seçilmedi";
                         if(currentArtistSmall) currentArtistSmall.textContent = "";
                     }
                 }


                musicData.forEach((music, index) => {
                    const createMusicItem = () => {
                         const div = document.createElement('div');
                         // Spotify benzeri aktif sınıflandırma
                         div.className = `music-item ${music.id === currentMusicId ? 'active' : ''}`;
                         div.dataset.id = music.id; // Supabase ID'sini sakla

                         const img = document.createElement('img');
                         img.src = music.image_url || 'https://placehold.co/40x40/191414/ffffff?text=♪';
                         img.alt = "Kapak";
                         div.appendChild(img);

                         const textInfo = document.createElement('div');
                         textInfo.className = 'track-text-info'; // Şarkı ve sanatçı için konteyner
                         const title = document.createElement('span');
                         title.className = "song-title";
                         title.innerText = music.name;
                         textInfo.appendChild(title);

                         if (music.artist_name) { // Sanatçı adı varsa göster
                              const artist = document.createElement('span');
                              artist.className = "artist-name";
                              artist.innerText = music.artist_name;
                              textInfo.appendChild(artist);
                         }

                         div.appendChild(textInfo);


                         // Tıklama olayı
                         div.onclick = () => {
                             const clickedIndex = musicData.findIndex(item => item.id === music.id);
                             if (clickedIndex !== -1) {
                                loadAndPlayMusic(clickedIndex);
                                 // Mobilde tıklayınca modalı kapat (eğer açıksa)
                                 if(mobileMusicListModal && mobileMusicListModal.classList.contains('open')) {
                                     closeMobileMusicList();
                                 }
                             } else {
                                 console.error("Tıklanan müzik listede bulunamadı:", music.id);
                             }
                         };
                         return div;
                    };

                    if (musicListDesktop) musicListDesktop.appendChild(createMusicItem());
                    if (musicListMobile) musicListMobile.appendChild(createMusicItem()); // Mobil liste içeriği

                    // Silme selectbox'ına ekle
                    if (deleteSelect) {
                        const option = document.createElement('option');
                        option.value = music.id;
                        option.text = music.name + (music.artist_name ? ` - ${music.artist_name}` : ''); // Sanatçı adını da ekle
                        deleteSelect.appendChild(option);
                    }
                });

                 // Listeler render edildikten sonra player UI durumunu güncelle
                 updatePlayerUIState();


            } catch (error) {
                console.error("renderMusics içinde hata:", error);
                 const errorMessage = `<p class="loading-message text-red-400">Müzik listesini yüklerken bir sorun oluştu: ${error.message}</p>`;
                if (musicListDesktop) musicListDesktop.innerHTML = errorMessage;
                if (musicListMobile) musicListMobile.innerHTML = errorMessage;
                updatePlayerUIState();
            }
        }


        // --- Add Music (Upload to Storage & Insert to DB) ---
        async function addMusic() {
             if (!supabaseClient) {
                  alert('Supabase bağlantısı henüz hazır değil.');
                  return;
             }
             const user = await supabaseClient.auth.getUser();
            if (user.error || !user.data.user) {
                 alert('Müzik eklemek için giriş yapmalısınız.');
                 return;
            }

             if (!musicNameInput || !artistNameInput || !musicFileInput || !musicImageInput || !addMusicBtn || !deleteSelect) {
                  console.error("Admin elementleri bulunamadı (addMusic).");
                  alert("Müzik ekleme arayüzü yüklenemedi.");
                  return;
             }

             const name = musicNameInput.value.trim();
             const artistName = artistNameInput.value.trim(); // Sanatçı adını al
             const audioFile = musicFileInput.files[0];
             const imageFile = musicImageInput.files[0];

             if (!audioFile || !name) {
                 alert('Müzik adı ve müzik dosyası alanları zorunludur!');
                 return;
             }

             const addButton = addMusicBtn;
             const originalButtonText = addButton.innerHTML;
             addButton.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Ekleniyor...';
             addButton.disabled = true;

             let audioUrl = null;
             let imageUrl = null;
             const filesToRemoveOnError = [];

             try {
                 const userId = user.data.user.id;
                 // Dosya isimlerine sanatçı adını da ekleyebiliriz isteğe bağlı
                 const audioFileName = `${userId}/${Date.now()}_${name.replace(/\s+/g, '_')}_${audioFile.name.replace(/\s+/g, '_')}`;
                 const audioFilePath = `public/${audioFileName}`;
                 filesToRemoveOnError.push(`public/${audioFileName}`); // Dosya yolunu storage'a göre ayarla

                 console.log("Ses dosyası yükleniyor:", audioFilePath);
                 const { data: audioUploadData, error: audioUploadError } = await supabaseClient.storage
                     .from('music-files')
                     .upload(audioFilePath, audioFile, {
                         cacheControl: '3600', // Cache süresi
                         upsert: false // Üzerine yazma
                     });

                 if (audioUploadError) {
                     throw new Error(`Ses dosyası yükleme hatası: ${audioUploadError.message}`);
                 }
                 console.log("Ses dosyası yüklendi:", audioUploadData);


                 const { data: publicAudioUrlData } = supabaseClient.storage
                     .from('music-files')
                     .getPublicUrl(audioFilePath);
                 audioUrl = publicAudioUrlData.publicUrl;
                 console.log("Public ses URL:", audioUrl);


                 if (imageFile) {
                      if (imageFile.size > 5 * 1024 * 1024) {
                         throw new Error("Resim dosyası çok büyük! (Maksimum 5MB)");
                     }
                      const imageFileName = `${userId}/${Date.now()}_${name.replace(/\s+/g, '_')}_cover_${imageFile.name.replace(/\s+/g, '_')}`;
                     const imageFilePath = `public/${imageFileName}`;
                     filesToRemoveOnError.push(`public/${imageFileName}`); // Dosya yolunu storage'a göre ayarla

                     console.log("Resim dosyası yükleniyor:", imageFilePath);
                     const { data: imageUploadData, error: imageUploadError } = await supabaseClient.storage
                         .from('music-files')
                         .upload(imageFilePath, imageFile, {
                             cacheControl: '3600', // Cache süresi
                             upsert: false // Üzerine yazma
                         });

                     if (imageUploadError) {
                          throw new Error(`Resim dosyası yükleme hatası: ${imageUploadError.message}`);
                     }
                     console.log("Resim dosyası yüklendi:", imageUploadData);

                     const { data: publicImageUrlData } = supabaseClient.storage
                         .from('music-files')
                         .getPublicUrl(imageFilePath);
                     imageUrl = publicImageUrlData.publicUrl;
                      console.log("Public resim URL:", imageUrl);

                 } else {
                      // Resim eklenmezse varsayılan kapak URL'ini kullanabiliriz veya null bırakabiliriz
                      imageUrl = null; // Varsayılan kapak CSS/HTML'de ayarlanıyor
                 }


                 const { data: musicInsertData, error: musicInsertError } = await supabaseClient
                     .from('musics')
                     .insert([{
                         name: name,
                         artist_name: artistName, // Sanatçı adı eklendi
                         audio_url: audioUrl,
                         image_url: imageUrl, // image_url'i burada null olabilir
                         user_id: userId // user_id'yi ekle
                     }])
                     .select(); // Eklenen kaydı geri almak için select kullanıyoruz

                 if (musicInsertError) {
                      // RLS politikası hatası burada oluşabilir (user_id ile ilgili)
                      console.error('Veritabanına kayıt hatası detay:', musicInsertError);
                      throw new Error(`Veritabanına kayıt hatası: ${musicInsertError.message}. Supabase RLS ve tablo sütunlarını kontrol edin.`);
                 }

                 console.log("Müzik başarıyla eklendi:", name, musicInsertData);
                 renderMusics(); // Listeyi yenile
                 // Inputları temizle
                 musicNameInput.value = '';
                 if(artistNameInput) artistNameInput.value = ''; // Sanatçı inputunu temizle
                 musicFileInput.value = '';
                 musicImageInput.value = '';

                 alert('Müzik başarıyla eklendi!');

             } catch (error) {
                 console.error('Müzik eklenirken hata oluştu: ', error.message);
                 alert(`Müzik eklenemedi: ${error.message}`);

                  // Hata durumunda yüklenen dosyaları temizle
                  if (filesToRemoveOnError.length > 0 && supabaseClient) { // supabaseClient kontrolü ekledim
                      console.log("Hata oluştu, yüklenen dosyalar temizleniyor:", filesToRemoveOnError);
                       // remove fonksiyonu public/ prefix'i olmadan dosya yolları ister
                       const pathsWithoutPublic = filesToRemoveOnError.map(path => path.replace(/^public\//, ''));
                       const { error: cleanupError } = await supabaseClient.storage
                          .from('music-files')
                          .remove(pathsWithoutPublic);
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
             if (!supabaseClient) {
                 alert('Supabase bağlantısı henüz hazır değil.');
                 return;
             }
             const user = await supabaseClient.auth.getUser();
             if (user.error || !user.data.user) {
                  alert('Müzik silmek için giriş yapmalısınız.');
                  return;
             }
             if (!deleteSelect || !deleteMusicBtn) {
                 console.error("Admin elementleri bulunamadı (deleteMusic).");
                 alert("Müzik silme arayüzü yüklenemedi.");
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

              const deleteButton = deleteMusicBtn;
              const originalDeleteButtonText = deleteButton.innerHTML;
              deleteButton.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Siliniyor...';
              deleteButton.disabled = true;

             try {
                 // Silinecek müziğin bilgilerini (özellikle dosya yollarını) al
                 const { data: musicToDelete, error: fetchError } = await supabaseClient
                     .from('musics')
                     .select('id, audio_url, image_url, user_id')
                     .eq('id', musicIdToDelete)
                     .single(); // Tek bir kayıt bekliyoruz

                 if (fetchError || !musicToDelete) {
                      console.error('Silinecek müzik bilgisi alınamadı:', fetchError?.message);
                      throw new Error(`Silinecek müzik bulunamadı veya erişim reddedildi: ${fetchError?.message}`);
                 }

                  // Sadece kendi eklediği müzikleri silmesini sağla (RLS'e ek olarak JS tarafında kontrol)
                  const loggedInUserId = user.data?.user?.id;
                  if (musicToDelete.user_id && loggedInUserId && musicToDelete.user_id !== loggedInUserId) {
                       alert("Sadece kendi eklediğiniz müzikleri silebilirsiniz.");
                        // Buton durumunu sıfırla
                        deleteButton.innerHTML = originalDeleteButtonText;
                        deleteButton.disabled = false;
                        return; // Silme işlemini durdur
                  }


                 const filesToRemove = [];
                 // Supabase Storage'daki dosya yolunu URL'den çıkar
                 const baseUrl = `${SUPABASE_URL}/storage/v1/object/public/music-files/`;

                 if (musicToDelete?.audio_url && musicToDelete.audio_url.startsWith(baseUrl)) {
                      // URL'den sonraki kısmı alıyoruz ve public/ prefix'ini kaldırıyoruz
                      const audioFilePath = musicToDelete.audio_url.substring(baseUrl.length).replace(/^public\//, '');
                       if(audioFilePath) filesToRemove.push(audioFilePath);
                 }

                 if (musicToDelete?.image_url && musicToDelete.image_url.startsWith(baseUrl)) {
                      const imageFilePath = musicToDelete.image_url.substring(baseUrl.length).replace(/^public\//, '');
                       if(imageFilePath) filesToRemove.push(imageFilePath);
                 }

                 // Veritabanından kaydı sil
                 const { error: dbDeleteError } = await supabaseClient
                     .from('musics')
                     .delete()
                     .eq('id', musicIdToDelete);

                 if (dbDeleteError) {
                     throw new Error(`Veritabanından silme hatası: ${dbDeleteError.message}`);
                 }

                 console.log(`Müzik ID ${musicIdToDelete} veritabanından silindi.`);

                  // Depolama alanından dosyaları sil
                  if (filesToRemove.length > 0 && supabaseClient) { // supabaseClient kontrolü ekledim
                      console.log("Silinecek dosyalar Storage'da:", filesToRemove);
                       const { error: storageDeleteError } = await supabaseClient.storage
                          .from('music-files')
                          .remove(filesToRemove);

                       if (storageDeleteError) {
                          console.error('Depolama alanından silinirken hata oluştu (veritabanı kaydı silindi):', storageDeleteError);
                          // Kullanıcıya bilgi ver ama işlemi durdurma
                          alert("Müzik veritabanından silindi ancak dosyaları depolama alanından silinirken bir sorun oluştu.");
                       } else {
                           console.log(`Dosyalar başarıyla silindi: ${filesToRemove.join(', ')}`);
                       }
                  }

                 // Eğer silinen şarkı o anda çalıyorsa player'ı durdur/sıfırla
                 const wasCurrentMusicDeleted = (currentMusicId === musicIdToDelete);

                 if (wasCurrentMusicDeleted) {
                     audioPlayer.pause(); audioPlayer.src = ''; // Player'ı sıfırla
                     if(coverImageSmall) coverImageSmall.src = defaultCover; // Varsayılan kapağı göster
                     currentMusicId = null; currentMusicIndex = -1; // Durumu sıfırla
                     if(currentSongTitleSmall) currentSongTitleSmall.textContent = "Şarkı Seçilmedi"; // Başlığı sıfırla
                     if(currentArtistSmall) currentArtistSmall.textContent = ""; // Sanatçıyı sıfırla
                     updatePlayerUIState(); // Player UI'ı güncelle
                 }

                 await renderMusics(); // Listeyi yenile

                 alert(`"${musicNameToDelete}" başarıyla silindi!`);

                  // Eğer çalan şarkı silindiyse ve listede başka şarkı varsa ilk şarkıyı çal
                  if (wasCurrentMusicDeleted && musicData.length > 0) {
                      loadAndPlayMusic(0);
                  } else if (musicData.length === 0) {
                      // Eğer hiç şarkı kalmadıysa player UI'ı güncelle
                      updatePlayerUIState();
                  }


             } catch (error) {
                 console.error('Müzik silinirken hata oluştu: ', error.message);
                 alert(`Müzik silinemedi: ${error.message}`);
             } finally {
                  // Buton durumunu sıfırla
                  deleteButton.innerHTML = originalDeleteButtonText;
                 deleteButton.disabled = false;
             }
        }


        // --- Admin Panel Visibility & Auth State Handling ---

        function showAdminPanel() {
             if (adminPanelDiv) {
                 adminPanelDiv.classList.add('open'); // CSS'teki .modal.open sınıfını kullan
                 // Login form alanını bul ve email inputuna odaklan
                 const emailInput = adminPanelDiv.querySelector('#authEmail');
                 if(emailInput) {
                      setTimeout(() => emailInput.focus(), 100); // Modanın açılmasını bekle
                 }
             } else { console.error("Admin panel element not found!"); }
        }

        function closeAdminPanel() {
            if (adminPanelDiv) {
                 adminPanelDiv.classList.remove('open'); // CSS'teki .modal.open sınıfını kaldır
                 // Form inputlarını temizle
                 if(musicNameInput) musicNameInput.value = '';
                 if(artistNameInput) artistNameInput.value = '';
                 if(musicFileInput) musicFileInput.value = '';
                 if(musicImageInput) musicImageInput.value = '';
                 if(deleteSelect) deleteSelect.value = ""; // Selectbox'ı sıfırla
                 if(authEmailInput) authEmailInput.value = ''; // Login inputlarını temizle
                 if(authPassInput) authPassInput.value = '';
             } else { console.error("Admin panel element not found!"); }
        }

        // Supabase kimlik doğrulama durumu değiştiğinde
        if (supabaseClient) { // SupabaseClient başlatıldıysa dinlemeye başla
             supabaseClient.auth.onAuthStateChange((event, session) => {
                 console.log("Auth state changed:", event, session);
                 const isLoggedIn = !!session; // Session varsa giriş yapılmıştır

                 if (loginForm) {
                      loginForm.style.display = isLoggedIn ? 'none' : 'flex'; // Giriş yaptıysa gizle
                 }
                 if (adminControlsDiv) {
                      adminControlsDiv.style.display = isLoggedIn ? 'flex' : 'none'; // Giriş yaptıysa göster
                 }

                 if (loggedInUserEmailSpan) {
                      loggedInUserEmailSpan.textContent = isLoggedIn && session.user?.email
                         ? `Giriş Yapıldı: ${session.user.email}`
                         : ''; // Kullanıcı emailini göster veya boşalt
                 }
             });
        }


        // --- Supabase Authentication Functions ---

        async function signIn() {
             if (!supabaseClient) {
                 alert('Supabase bağlantısı henüz hazır değil.');
                 return;
             }
             if (!authEmailInput || !authPassInput || !signInBtn) {
                 console.error("Auth elementleri bulunamadı (signIn).");
                 alert("Giriş arayüzü yüklenemedi.");
                 return;
             }

            const email = authEmailInput.value.trim();
            const password = authPassInput.value.trim();

            if (!email || !password) {
                alert("Lütfen email ve şifreyi girin.");
                return;
            }

            const originalButtonText = signInBtn.innerHTML;
            signInBtn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Giriş Yapılıyor...';
            signInBtn.disabled = true;


            const { data, error } = await supabaseClient.auth.signInWithPassword({
                email: email,
                password: password,
            });

            signInBtn.innerHTML = originalButtonText;
            signInBtn.disabled = false;


            if (error) {
                console.error("Giriş hatası:", error.message);
                alert(`Giriş başarısız: ${error.message}`);
            } else {
                console.log("Giriş başarılı!", data.user);
                // Giriş başarılı olunca inputları temizle
                if(authEmailInput) authEmailInput.value = '';
                if(authPassInput) authPassInput.value = '';
                // Auth state listener otomatik olarak paneli gösterecektir
            }
        }

        async function signOut() {
             if (!supabaseClient) {
                 alert('Supabase bağlantısı henüz hazır değil.');
                 return;
             }
              if (!signOutBtn) {
                 console.error("Auth elementleri bulunamadı (signOut).");
                 alert("Çıkış arayüzü yüklenemedi.");
                 return;
             }
             const originalButtonText = signOutBtn.innerHTML;
             signOutBtn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Çıkılıyor...';
             signOutBtn.disabled = true;


            const { error } = await supabaseClient.auth.signOut();

             signOutBtn.innerHTML = originalButtonText;
             signOutBtn.disabled = false;


            if (error) {
                console.error("Çıkış hatası:", error.message);
                alert(`Çıkış başarısız: ${error.message}`);
            } else {
                console.log("Başarıyla çıkış yapıldı.");
                 // Auth state listener otomatik olarak paneli gizleyecektir
            }
        }


        // --- Event Listeners ---

        // Admin butonu ve modal kapatma butonları
        if (adminButton) adminButton.addEventListener('click', showAdminPanel);
        if (closeAdminPanelBtn) closeAdminPanelBtn.addEventListener('click', closeAdminPanel);
        if (closeMobileListBtn) closeMobileListBtn.addEventListener('click', closeMobileMusicList); // Mobil liste kapatma

        // Auth butonları
        if(signInBtn) signInBtn.addEventListener('click', signIn);
        if(signOutBtn) signOutBtn.addEventListener('click', signOut);

        // Admin fonksiyon butonları
         if(addMusicBtn) addMusicBtn.addEventListener('click', addMusic);
         if(deleteMusicBtn) deleteMusicBtn.addEventListener('click', deleteMusic);


        // Player control listeners
        if(playPauseBtn) playPauseBtn.addEventListener('click', togglePlayPause);
        // timeupdate listener (seek bar güncelleme)
        if(audioPlayer) audioPlayer.addEventListener('timeupdate', updateSeekBar);
        // loadedmetadata listener (süre bilgisini ayarla)
        if(audioPlayer) audioPlayer.addEventListener('loadedmetadata', setDuration);
        // play/pause olaylarında UI durumunu güncelle
        if(audioPlayer) audioPlayer.addEventListener('play', () => updatePlayerUIState());
        if(audioPlayer) audioPlayer.addEventListener('pause', () => updatePlayerUIState());
        // Şarkı bittiğinde sonraki şarkıya geç
        if(audioPlayer) audioPlayer.addEventListener('ended', playNext);

        // Seek bar ve volume bar input olayları
        if(seekBar) {
            seekBar.addEventListener('input', updateSeekBar); // Sürüklerken görseli güncelle
            seekBar.addEventListener('change', seek); // Bırakınca zamanı ayarla
        }
        if(volumeBar) volumeBar.addEventListener('input', changeVolume);
        if(volumeIcon) volumeIcon.addEventListener('click', toggleMute);
        if(prevBtn) prevBtn.addEventListener('click', playPrevious);
        if(nextBtn) nextBtn.addEventListener('click', playNext);


        // --- Fare Takip Eden Noktalar Efekti ---
        // Noktaları oluştur ve alana ekle
        if (mouseEffectArea) {
             console.log("Fare takip alanı bulundu, noktalar oluşturuluyor.");
             for (let i = 0; i < numDots; i++) {
                 const dot = document.createElement('div');
                 dot.classList.add('mouse-dot');

                 // Rastgele boyut ata (CSS sınıflarını kullan)
                 if (Math.random() < 0.7) { // %70 küçük nokta
                     dot.classList.add('dot-small');
                 } else { // %30 büyük nokta
                     dot.classList.add('dot-large');
                 }

                 // Rastgele başlangıç konumu (area içinde yüzde olarak)
                 dot.style.left = `${Math.random() * 100}%`;
                 dot.style.top = `${Math.random() * 100}%`;

                 dots.push(dot);
                 mouseEffectArea.appendChild(dot);
             }

             // Fare koordinatlarını takip et ve noktaları güncelleme döngüsünü başlat
             document.addEventListener('mousemove', (e) => {
                 // Fare pozisyonunu al (viewport'a göre)
                 mouseX = e.clientX;
                 mouseY = e.clientY;
             });

             // Noktaların pozisyonunu animasyonlu olarak güncelleme fonksiyonu
             function updateDots() {
                 dots.forEach((dot, index) => {
                     // Noktanın mevcut pozisyonunu al (pixel cinsinden)
                     // Eğer nokta ilk kez konumlanıyorsa 0 alacak
                     let currentX = parseFloat(dot.style.left);
                     let currentY = parseFloat(dot.style.top);

                      // Eğer style.left/top yüzde olarak ayarlıysa piksel değerine çevir
                     if (dot.style.left.endsWith('%')) {
                          currentX = parseFloat(dot.style.left) / 100 * window.innerWidth;
                     }
                      if (dot.style.top.endsWith('%')) {
                          currentY = parseFloat(dot.style.top) / 100 * window.innerHeight;
                     }


                     const targetX = mouseX;
                     const targetY = mouseY;

                     // Yavaşlatılmış hareket formülü
                     currentX += (targetX - currentX) * easeFactor; // * (1 + index * 0.005); // İsteğe bağlı hız farkı
                     currentY += (targetY - currentY) * easeFactor; // * (1 + index * 0.005);


                     // Yeni pozisyonu elemente uygula (pixel cinsinden)
                     dot.style.left = `${currentX}px`;
                     dot.style.top = `${currentY}px`;
                 });
                 // Bir sonraki karede tekrar güncelle
                 requestAnimationFrame(updateDots);
             }

             // Update döngüsünü başlat
             updateDots();

        } else {
            console.warn("'.mouse-effect-area' elementi bulunamadığı için fare takip efekti başlatılamadı.");
        }


        // --- Initial Setup ---
        // Script yüklendiğinde ve DOM hazır olduğunda çalışacak ilk kodlar
        if(coverImageSmall) coverImageSmall.src = defaultCover; // Başlangıç kapağını ayarla
        if(audioPlayer && volumeBar) {
            volumeBar.value = audioPlayer.volume; // Ses çubuğunun değerini ayarla
            updateVolumeIcon(audioPlayer.volume); // Ses ikonunu ayarla
        }
        // updatePlayerUIState() renderMusics içinde çağrılacak, ama başlangıç için burada da çağırılabilir
        // updatePlayerUIState();

        // Müzik listesini Supabase'ten çek ve render et
        renderMusics();


    } catch (error) {
        console.error("DOMContentLoaded içinde yakalanan genel hata:", error);
        alert("Uygulama başlatılırken beklenmeyen bir hata oluştu. Konsolu kontrol edin.");
    }
});
