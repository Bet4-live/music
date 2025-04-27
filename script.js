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

    // Supabase istemcisini DOĞRUDAN window.supabase objesinden oluşturuyoruz
    try {
        if (typeof window.supabase === 'undefined') {
            console.error("Hata: window.supabase tanımlanmamış. Supabase kütüphanesi yüklenemedi veya çalışmadı.");
            alert("Supabase kütüphanesi yüklenirken bir sorun oluştu.");
            return;
        }
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log("Supabase istemcisi başarıyla oluşturuldu.");

        // --- DOM Elements ---
        // DOM elementlerine burada erişiyoruz çünkü DOMContentLoaded tetiklendi
        const musicListDesktop = document.getElementById('musicListDesktop');
        const musicListMobile = document.getElementById('musicListMobile');
        const mobileMusicListModal = document.getElementById('mobileMusicListModal');
        const audioPlayer = document.getElementById('audioPlayer'); // <-- audioPlayer elementi burada alınıyor
        console.log("audioPlayer elementi bulundu:", audioPlayer); // <-- Bu log eklendi

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
        function formatTime(seconds) { /* ... */ }
        function updateVolumeIcon(volume) { /* ... */ }
        function updatePlayerUIState() { /* ... */ }
        function togglePlayPause() { /* ... */ }

        // updateSeekBar fonksiyonu ve içindeki log (önceki adımdan)
        function updateSeekBar() {
            console.log('timeupdate olayı tetiklendi. currentTime:', audioPlayer.currentTime, 'duration:', audioPlayer.duration);
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
         function setDuration() { /* ... */ }
         function seek() { /* ... */ }
         function changeVolume() { /* ... */ }
         function toggleMute() { /* ... */ }
         function loadAndPlayMusic(index) { /* ... */ }
         function playNext() { /* ... */ }
         function playPrevious() { /* ... */ }
         function toggleMobileMusicList() { /* ... */ }
         function openMobileMusicList() { /* ... */ }
         function closeMobileMusicList() { /* ... */ }
         async function renderMusics() { /* ... */ }
         async function addMusic() { /* ... */ }
         async function deleteMusic() { /* ... */ }
         function showAdminPanel() { /* ... */ }
         function closeAdminPanel() { /* ... */ }
         async function signIn() { /* ... */ }
         async function signOut() { /* ... */ }

        // --- Player Event Listeners ---
        if(playPauseBtn) playPauseBtn.addEventListener('click', togglePlayPause);
        // timeupdate listener buraya ekleniyor
        if(audioPlayer) { // audioPlayer elementinin var olduğundan emin olalım
            audioPlayer.addEventListener('timeupdate', updateSeekBar);
            console.log("timeupdate listener audioPlayer elementine eklendi."); // <-- Bu log eklendi
        } else {
             console.error("audioPlayer elementi bulunamadı, timeupdate listener eklenemedi."); // <-- Bu log eklendi
        }

        if(audioPlayer) audioPlayer.addEventListener('loadedmetadata', setDuration);
        if(audioPlayer) audioPlayer.addEventListener('play', () => updatePlayerUIState());
        if(audioPlayer) audioPlayer.addEventListener('pause', () => updatePlayerUIState());
        if(audioPlayer) audioPlayer.addEventListener('ended', playNext);
        if(seekBar) seekBar.addEventListener('input', seek);
        if(volumeBar) volumeBar.addEventListener('input', changeVolume);
        if(volumeIcon) volumeIcon.addEventListener('click', toggleMute);
        if(prevBtn) prevBtn.addEventListener('click', playPrevious);
        if(nextBtn) nextBtn.addEventListener('click', playNext);


        // ... (Auth state listener ve diğer event listener atamaları aynı kalacak)
        supabaseClient.auth.onAuthStateChange((event, session) => { /* ... */ });
        if (adminButton) { adminButton.addEventListener('click', showAdminPanel); } else { console.error("Admin button element not found!"); }
        if(signInBtn) signInBtn.addEventListener('click', signIn);
        if(signOutBtn) signOutBtn.addEventListener('click', signOut);
        const closeMobileListBtn = document.getElementById('closeMobileListBtn');
        if(closeMobileListBtn) closeMobileListBtn.addEventListener('click', closeMobileMusicList);
        const closeAdminPanelBtn = document.getElementById('closeAdminPanelBtn');
        if(closeAdminPanelBtn) closeAdminPanelBtn.addEventListener('click', closeAdminPanel);
        const addMusicBtn = document.getElementById('addMusicBtn');
        if(addMusicBtn) addMusicBtn.addEventListener('click', addMusic);
        const deleteMusicBtn = document.getElementById('deleteMusicBtn');
        if(deleteMusicBtn) deleteMusicBtn.addEventListener('click', deleteMusic);


        // --- Initial Setup ---
        coverImage.src = defaultCover;
        volumeBar.value = audioPlayer.volume;
        updateVolumeIcon(audioPlayer.volume);
        updatePlayerUIState();

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
