// --- Supabase Setup ---
// !! Buraya kendi Supabase Proje URL ve Public Anon Key bilgilerini GİRİN !!
const SUPABASE_URL = 'https://skhbykqwdbwjcvqmwvft.supabase.co'; // <-- KENDİ URL'NİZİ GİRİN
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNraGJ5a3F3ZGJ3amN2cW13dmZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU3Nzg0NDYsImV4cCI6MjA2MTM1NDQ0Nn0.e8pbfF7O_rTtSKxtFzzc_zZTsegsxsNaluHNFBbWbMs'; // <-- KENDİ ANON KEY'İNİZİ GİRİN
// !! Supabase bilgilerini GİRDİĞİNİZDEN EMİN OLUN !!

let supabaseClient;

// --- Global DOM Elements ---
const audioPlayer = document.getElementById('audioPlayer');
const playPauseBtn = document.getElementById('playPauseBtn');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const progressBar = document.getElementById('progressBar');
const volumeBar = document.getElementById('volumeBar');
const volumeIcon = document.getElementById('volumeIcon');
const currentSongTitleElement = document.getElementById('currentSongTitle');
const currentSongArtistElement = document.getElementById('currentSongArtist');
const coverImage = document.getElementById('coverImage');
const musicListContainer = document.getElementById('musicListContainer');
const searchInput = document.getElementById('searchInput');
const upcomingMusicContainerWrapper = document.getElementById('upcomingMusicContainerWrapper');
const upcomingPrevBtn = document.getElementById('upcomingPrevBtn');
const upcomingNextBtn = document.getElementById('upcomingNextBtn');
const currentSongTime = document.getElementById('currentSongTime');
const totalSongTime = document.getElementById('totalSongTime');

// Admin Panel Elements
const adminButton = document.getElementById('adminButton'); // Desktop admin button
const adminButtonMobile = document.getElementById('adminButtonMobile'); // Mobile admin button
const adminPanel = document.getElementById('adminPanel');
const closeAdminPanelBtn = document.getElementById('closeAdminPanelBtn');

const addMusicTab = document.getElementById('addMusicTab');
const manageMusicTab = document.getElementById('manageMusicTab');
const addMusicContent = document.getElementById('addMusicContent');
const manageMusicContent = document.getElementById('manageMusicContent');
const musicNameInput = document.getElementById('musicName');
const artistNameInput = document.getElementById('artistName');
const musicFileInput = document.getElementById('musicFile');
const musicImageInput = document.getElementById('musicImage');
const addMusicBtn = document.getElementById('addMusicBtn');
const addMusicMessage = document.getElementById('addMusicMessage');
const deleteSelect = document.getElementById('deleteSelect'); // Keep for old method for now
const deleteMusicBtn = document.getElementById('deleteMusicBtn'); // Keep for old method for now
const deleteMusicMessage = document.getElementById('deleteMusicMessage'); // Keep for old method for now
const musicManagementTableBody = document.getElementById('musicManagementTableBody');
const adminMusicSearchInput = document.getElementById('adminMusicSearch');
const manageMusicMessage = document.getElementById('manageMusicMessage');

// Edit Music Modal Elements
const editMusicModal = document.getElementById('editMusicModal');
const closeEditModalBtn = document.getElementById('closeEditModalBtn');
const editMusicIdInput = document.getElementById('editMusicId');
const editMusicNameInput = document.getElementById('editMusicName');
const editArtistNameInput = document.getElementById('editArtistName');
const editMusicFileInput = document.getElementById('editMusicFile');
const editMusicImageInput = document.getElementById('editMusicImage');
const currentMusicFileNameElement = document.getElementById('currentMusicFileName');
const currentMusicImagePreview = document.getElementById('currentMusicImagePreview');
const saveEditMusicBtn = document.getElementById('saveEditMusicBtn');
const editMusicMessage = document.getElementById('editMusicMessage');


// --- Variables ---
let currentPlayingIndex = -1;
let musics = []; // Array to store all fetched music data
let currentPlaylist = []; // Array of music objects currently being played/displayed (e.g., after search)
let defaultCover = 'https://via.placeholder.com/150/0f172a/94a3b8?text=Müzik';
let defaultArtist = 'Bilinmeyen Sanatçı';
let lastVolume = 1.0; // To store last volume before mute

// --- Helper Functions ---

// Function to display messages (success/error)
function displayMessage(element, message, type = 'info') {
    element.textContent = message;
    element.className = `mt-4 text-center text-sm font-medium ${
        type === 'success' ? 'text-green-400' :
        type === 'error' ? 'text-red-400' :
        'text-gray-400'
    }`;
    setTimeout(() => {
        element.textContent = '';
        element.className = 'mt-4 text-center text-sm font-medium';
    }, 5000);
}

// Supabase Storage URL helper
function getPublicUrl(path) {
    if (!supabaseClient) return null; // Ensure client is initialized
    const { data } = supabaseClient.storage.from('music_files').getPublicUrl(path);
    return data.publicUrl;
}

// --- Music Player Functions ---

async function fetchMusics(searchTerm = '') {
    try {
        let query = supabaseClient.from('musics').select('*');

        if (searchTerm) {
            query = query.or(`title.ilike.%${searchTerm}%,artist.ilike.%${searchTerm}%`);
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) throw error;
        musics = data;
        currentPlaylist = data; // Initially, playlist is all musics
        renderMusics(); // Re-render main music list
        populateDeleteSelect(); // Update delete dropdown
        renderMusicManagementTable(); // Update admin management table
    } catch (error) {
        console.error('Müzikler yüklenirken hata oluştu:', error.message);
        displayMessage(document.getElementById('musicListContainer').parentElement, `Müzikler yüklenirken hata oluştu: ${error.message}`, 'error');
    }
}

function renderMusics(searchTerm = '') {
    musicListContainer.innerHTML = '';
    upcomingMusicContainerWrapper.innerHTML = ''; // Clear upcoming list too

    const filteredMusics = searchTerm
        ? musics.filter(music =>
            music.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            music.artist.toLowerCase().includes(searchTerm.toLowerCase())
        )
        : musics;

    if (filteredMusics.length === 0) {
        musicListContainer.innerHTML = '<p class="text-gray-400 text-center col-span-full">Hiç müzik bulunamadı.</p>';
        upcomingMusicContainerWrapper.innerHTML = '<p class="text-gray-400 text-center w-full">Yaklaşan müzik yok.</p>';
        return;
    }

    filteredMusics.forEach((music, index) => {
        // Main music list item
        const musicItem = document.createElement('div');
        musicItem.className = 'music-item flex items-center bg-gray-800 p-3 rounded-lg shadow-md cursor-pointer hover:bg-gray-700 transition-colors group';
        musicItem.dataset.index = index;
        musicItem.dataset.id = music.id; // Store ID for player
        musicItem.innerHTML = `
            <img src="${music.cover_url || defaultCover}" alt="${music.title}" class="w-12 h-12 rounded-md object-cover mr-4">
            <div class="flex-grow">
                <h4 class="text-gray-100 font-semibold text-sm">${music.title}</h4>
                <p class="text-gray-400 text-xs">${music.artist}</p>
            </div>
            <button class="play-btn text-indigo-400 hover:text-indigo-300 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100">
                <i class="fa fa-play"></i>
            </button>
        `;
        musicListContainer.appendChild(musicItem);

        // Upcoming music list item
        const upcomingMusicItem = document.createElement('div');
        upcomingMusicItem.className = 'flex-shrink-0 w-44 bg-gray-800 rounded-lg shadow-md overflow-hidden text-center cursor-pointer hover:bg-gray-700 transition-colors group';
        upcomingMusicItem.dataset.index = index;
        upcomingMusicItem.dataset.id = music.id; // Store ID for player
        upcomingMusicItem.innerHTML = `
            <img src="${music.cover_url || defaultCover}" alt="${music.title}" class="w-full h-32 object-cover">
            <div class="p-3">
                <h4 class="text-gray-100 font-semibold text-sm truncate">${music.title}</h4>
                <p class="text-gray-400 text-xs truncate">${music.artist}</p>
            </div>
            <button class="play-btn-upcoming absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 text-indigo-400 hover:text-indigo-300 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 text-2xl">
                <i class="fa fa-play"></i>
            </button>
        `;
        upcomingMusicContainerWrapper.appendChild(upcomingMusicItem);
    });

    attachPlayEventListeners();
}

function attachPlayEventListeners() {
    document.querySelectorAll('.music-item, .flex-shrink-0').forEach(item => {
        item.addEventListener('click', (event) => {
            const index = parseInt(item.dataset.index);
            const musicId = item.dataset.id;
            // Check if click was on the button itself or the container
            if (event.target.closest('.play-btn') || event.target.closest('.play-btn-upcoming')) {
                playMusic(index);
            } else if (index !== currentPlayingIndex) {
                 // If clicked on the item itself and it's not the current song
                playMusic(index);
            } else if (audioPlayer.paused) {
                audioPlayer.play();
            } else {
                audioPlayer.pause();
            }
        });
    });
}


function playMusic(index) {
    if (index < 0 || index >= currentPlaylist.length) return;

    currentPlayingIndex = index;
    const music = currentPlaylist[currentPlayingIndex];

    if (!music) {
        console.error("Müzik bulunamadı:", index);
        return;
    }

    audioPlayer.src = music.music_url;
    currentSongTitleElement.textContent = music.title;
    currentSongArtistElement.textContent = music.artist;
    coverImage.src = music.cover_url || defaultCover;
    audioPlayer.play();
    updatePlayerUIState();
}

function updatePlayerUIState() {
    if (audioPlayer.paused) {
        playPauseBtn.innerHTML = '<i class="fa fa-play"></i>';
    } else {
        playPauseBtn.innerHTML = '<i class="fa fa-pause"></i>';
    }

    // Highlight current playing song in the list
    document.querySelectorAll('.music-item').forEach(item => {
        if (item.dataset.index == currentPlayingIndex) {
            item.classList.add('bg-indigo-700', 'hover:bg-indigo-600', 'shadow-lg');
            item.classList.remove('bg-gray-800', 'hover:bg-gray-700');
            item.querySelector('.play-btn').innerHTML = '<i class="fa fa-pause"></i>';
        } else {
            item.classList.remove('bg-indigo-700', 'hover:bg-indigo-600', 'shadow-lg');
            item.classList.add('bg-gray-800', 'hover:bg-gray-700');
            item.querySelector('.play-btn').innerHTML = '<i class="fa fa-play"></i>';
        }
    });

    // Highlight current playing song in upcoming list
    document.querySelectorAll('.flex-shrink-0').forEach(item => {
        if (item.dataset.index == currentPlayingIndex) {
            item.classList.add('border-2', 'border-indigo-500'); // Add a border for visual cue
            item.querySelector('.play-btn-upcoming').innerHTML = '<i class="fa fa-pause"></i>';
        } else {
            item.classList.remove('border-2', 'border-indigo-500');
            item.querySelector('.play-btn-upcoming').innerHTML = '<i class="fa fa-play"></i>';
        }
    });
}

function updateProgressBar() {
    const duration = audioPlayer.duration;
    const currentTime = audioPlayer.currentTime;
    if (duration > 0) {
        const progress = (currentTime / duration) * 100;
        progressBar.value = progress;
        currentSongTime.textContent = formatTime(currentTime);
        totalSongTime.textContent = formatTime(duration);
    } else {
        progressBar.value = 0;
        currentSongTime.textContent = '0:00';
        totalSongTime.textContent = '0:00';
    }
}

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
}

function updateVolumeIcon(volume) {
    if (volume === 0) {
        volumeIcon.className = 'fa fa-volume-mute';
    } else if (volume < 0.5) {
        volumeIcon.className = 'fa fa-volume-down';
    } else {
        volumeIcon.className = 'fa fa-volume-up';
    }
}

// --- Admin Panel Functions ---

// Populate delete select (old method, will be largely replaced by table)
function populateDeleteSelect() {
    deleteSelect.innerHTML = '<option value="" disabled selected>Silmek için seçin...</option>';
    musics.forEach(music => {
        const option = document.createElement('option');
        option.value = music.id;
        option.textContent = `${music.title} - ${music.artist}`;
        deleteSelect.appendChild(option);
    });
}

async function addMusic() {
    const title = musicNameInput.value.trim();
    const artist = artistNameInput.value.trim();
    const musicFile = musicFileInput.files[0];
    const musicImage = musicImageInput.files[0];

    if (!title || !artist || !musicFile) {
        displayMessage(addMusicMessage, 'Lütfen müzik adı, sanatçı ve müzik dosyası girin.', 'error');
        return;
    }

    addMusicBtn.disabled = true;
    addMusicBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Yükleniyor...';
    displayMessage(addMusicMessage, 'Müzik yükleniyor...', 'info');

    try {
        // Upload Music File
        const musicFileName = `${Date.now()}_${musicFile.name}`;
        const { data: musicUploadData, error: musicUploadError } = await supabaseClient.storage
            .from('music_files')
            .upload(`musics/${musicFileName}`, musicFile);

        if (musicUploadError) throw musicUploadError;

        const musicUrl = getPublicUrl(`musics/${musicFileName}`);

        // Upload Cover Image (Optional)
        let coverUrl = defaultCover;
        if (musicImage) {
            const coverFileName = `${Date.now()}_${musicImage.name}`;
            const { data: imageUploadData, error: imageUploadError } = await supabaseClient.storage
                .from('music_files')
                .upload(`covers/${coverFileName}`, musicImage);

            if (imageUploadError) throw imageUploadError;
            coverUrl = getPublicUrl(`covers/${coverFileName}`);
        }

        // Insert into Supabase table
        const { data, error } = await supabaseClient
            .from('musics')
            .insert([
                { title, artist, music_url: musicUrl, cover_url: coverUrl }
            ]);

        if (error) throw error;

        displayMessage(addMusicMessage, 'Müzik başarıyla eklendi!', 'success');
        musicNameInput.value = '';
        artistNameInput.value = '';
        musicFileInput.value = ''; // Clear file input
        musicImageInput.value = ''; // Clear file input
        await fetchMusics(); // Refresh music list

    } catch (error) {
        console.error('Müzik eklenirken hata:', error.message);
        displayMessage(addMusicMessage, `Müzik eklenirken hata oluştu: ${error.message}`, 'error');
    } finally {
        addMusicBtn.disabled = false;
        addMusicBtn.innerHTML = '<i class="fa fa-plus"></i> Müziği Ekle';
    }
}

async function deleteMusic(musicIdToDelete) {
    if (!confirm('Bu müziği silmek istediğinizden emin misiniz?')) {
        return;
    }

    // Determine which message element to use
    const messageElement = adminPanel.classList.contains('hidden') ? document.getElementById('deleteMusicMessage') : document.getElementById('manageMusicMessage');
    
    // Disable the delete button that was clicked or the old delete button
    if (event.target.closest('.delete-btn')) {
        event.target.closest('.delete-btn').disabled = true;
        event.target.closest('.delete-btn').innerHTML = '<i class="fas fa-spinner fa-spin"></i> Siliniyor...';
    } else if (deleteMusicBtn) { // For the old delete button
        deleteMusicBtn.disabled = true;
        deleteMusicBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Siliniyor...';
    }

    displayMessage(messageElement, 'Müzik siliniyor...', 'info');

    try {
        // First, get the music data to delete files from storage
        const { data: musicData, error: fetchError } = await supabaseClient
            .from('musics')
            .select('music_url, cover_url')
            .eq('id', musicIdToDelete)
            .single();

        if (fetchError) throw fetchError;

        // Delete music file from storage
        if (musicData.music_url) {
            const musicPath = musicData.music_url.split('/public/music_files/')[1];
            const { error: musicDeleteError } = await supabaseClient.storage
                .from('music_files')
                .remove([musicPath]);
            if (musicDeleteError) console.warn('Müzik dosyası silinirken hata oluştu:', musicDeleteError.message);
        }

        // Delete cover image from storage (if not default)
        if (musicData.cover_url && musicData.cover_url !== defaultCover) {
            const coverPath = musicData.cover_url.split('/public/music_files/')[1];
            const { error: coverDeleteError } = await supabaseClient.storage
                .from('music_files')
                .remove([coverPath]);
            if (coverDeleteError) console.warn('Kapak resmi silinirken hata oluştu:', coverDeleteError.message);
        }

        // Delete from database
        const { error } = await supabaseClient
            .from('musics')
            .delete()
            .eq('id', musicIdToDelete);

        if (error) throw error;

        displayMessage(messageElement, 'Müzik başarıyla silindi!', 'success');
        await fetchMusics(); // Refresh music list
    } catch (error) {
        console.error('Müzik silinirken hata:', error.message);
        displayMessage(messageElement, `Müzik silinirken hata oluştu: ${error.message}`, 'error');
    } finally {
        // Re-enable the appropriate delete button
        if (event.target.closest('.delete-btn')) {
            event.target.closest('.delete-btn').disabled = false;
            event.target.closest('.delete-btn').innerHTML = '<i class="fa fa-trash"></i> Sil';
        } else if (deleteMusicBtn) {
            deleteMusicBtn.disabled = false;
            deleteMusicBtn.innerHTML = '<i class="fa fa-trash"></i> Seçilen Müziği Sil';
        }
    }
}


// New: Render Music Management Table
function renderMusicManagementTable(searchTerm = '') {
    musicManagementTableBody.innerHTML = '';
    const filteredMusics = searchTerm
        ? musics.filter(music =>
            music.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            music.artist.toLowerCase().includes(searchTerm.toLowerCase())
        )
        : musics;

    if (filteredMusics.length === 0) {
        musicManagementTableBody.innerHTML = '<tr><td colspan="4" class="px-6 py-4 whitespace-nowrap text-center text-gray-400">Hiç müzik bulunamadı.</td></tr>';
        return;
    }

    filteredMusics.forEach(music => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-700 transition-colors';
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap">
                <img src="${music.cover_url || defaultCover}" alt="${music.title}" class="w-12 h-12 rounded-md object-cover">
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-gray-100">${music.title}</td>
            <td class="px-6 py-4 whitespace-nowrap text-gray-300">${music.artist}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button data-id="${music.id}" class="edit-btn text-indigo-400 hover:text-indigo-300 mr-3">
                    <i class="fa fa-edit"></i> Düzenle
                </button>
                <button data-id="${music.id}" class="delete-btn text-red-500 hover:text-red-400">
                    <i class="fa fa-trash"></i> Sil
                </button>
            </td>
        `;
        musicManagementTableBody.appendChild(row);
    });

    // Attach event listeners for edit and delete buttons in the table
    musicManagementTableBody.querySelectorAll('.edit-btn').forEach(button => {
        button.addEventListener('click', (e) => openEditModal(e.currentTarget.dataset.id));
    });
    musicManagementTableBody.querySelectorAll('.delete-btn').forEach(button => {
        button.addEventListener('click', (e) => deleteMusic(e.currentTarget.dataset.id));
    });
}

// Open Edit Modal
async function openEditModal(musicId) {
    const music = musics.find(m => m.id === musicId);
    if (!music) {
        displayMessage(editMusicMessage, 'Düzenlenecek müzik bulunamadı!', 'error');
        return;
    }

    editMusicIdInput.value = music.id;
    editMusicNameInput.value = music.title;
    editArtistNameInput.value = music.artist;
    
    // Display current music file name, stripping timestamp and path
    if (music.music_url) {
        const urlParts = music.music_url.split('/');
        const fileNameWithTimestamp = urlParts[urlParts.length - 1].split('?')[0]; // Get filename and remove query params
        const originalFileName = fileNameWithTimestamp.substring(fileNameWithTimestamp.indexOf('_') + 1); // Remove timestamp
        currentMusicFileNameElement.textContent = `Mevcut Dosya: ${originalFileName}`;
    } else {
        currentMusicFileNameElement.textContent = 'Mevcut Dosya: Yok';
    }
    
    currentMusicImagePreview.src = music.cover_url || defaultCover;

    // Reset file inputs
    editMusicFileInput.value = '';
    editMusicImageInput.value = '';

    editMusicModal.classList.remove('hidden');
    editMusicMessage.textContent = ''; // Clear previous messages
}

// Close Edit Modal
function closeEditModal() {
    editMusicModal.classList.add('hidden');
}

// Save Edited Music
async function saveEditedMusic() {
    const musicId = editMusicIdInput.value;
    const newTitle = editMusicNameInput.value.trim();
    const newArtist = editArtistNameInput.value.trim();
    const newMusicFile = editMusicFileInput.files[0];
    const newMusicImage = editMusicImageInput.files[0];

    if (!newTitle || !newArtist) {
        displayMessage(editMusicMessage, 'Müzik adı ve sanatçı boş bırakılamaz.', 'error');
        return;
    }

    saveEditMusicBtn.disabled = true;
    saveEditMusicBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Kaydediliyor...';
    displayMessage(editMusicMessage, 'Değişiklikler kaydediliyor...', 'info');

    try {
        let musicUrl = musics.find(m => m.id === musicId)?.music_url;
        let coverUrl = musics.find(m => m.id === musicId)?.cover_url || defaultCover;

        // Handle new music file upload
        if (newMusicFile) {
            // First, delete old music file from storage if it exists and is not default
            const oldMusic = musics.find(m => m.id === musicId);
            if (oldMusic && oldMusic.music_url) {
                const oldMusicPath = oldMusic.music_url.split('/public/music_files/')[1];
                // Check if path exists and is not a default path (to prevent deleting non-uploaded assets)
                if (oldMusicPath && !oldMusicPath.startsWith('http')) { 
                    await supabaseClient.storage.from('music_files').remove([oldMusicPath]);
                }
            }

            const musicFileName = `${Date.now()}_${newMusicFile.name}`;
            const { data: musicUploadData, error: musicUploadError } = await supabaseClient.storage
                .from('music_files')
                .upload(`musics/${musicFileName}`, newMusicFile);
            if (musicUploadError) throw musicUploadError;
            musicUrl = getPublicUrl(`musics/${musicFileName}`);
        }

        // Handle new cover image upload
        if (newMusicImage) {
            // First, delete old cover image from storage if it exists and is not default
            const oldMusic = musics.find(m => m.id === musicId);
            if (oldMusic && oldMusic.cover_url && oldMusic.cover_url !== defaultCover) {
                const oldCoverPath = oldMusic.cover_url.split('/public/music_files/')[1];
                // Check if path exists and is not a default path
                if (oldCoverPath && !oldCoverPath.startsWith('http')) {
                    await supabaseClient.storage.from('music_files').remove([oldCoverPath]);
                }
            }

            const coverFileName = `${Date.now()}_${newMusicImage.name}`;
            const { data: imageUploadData, error: imageUploadError } = await supabaseClient.storage
                .from('music_files')
                .upload(`covers/${coverFileName}`, newMusicImage);
            if (imageUploadError) throw imageUploadError;
            coverUrl = getPublicUrl(`covers/${coverFileName}`);
        }

        // Update database record
        const { error: updateError } = await supabaseClient
            .from('musics')
            .update({
                title: newTitle,
                artist: newArtist,
                music_url: musicUrl,
                cover_url: coverUrl
            })
            .eq('id', musicId);

        if (updateError) throw updateError;

        displayMessage(editMusicMessage, 'Müzik başarıyla güncellendi!', 'success');
        await fetchMusics(); // Refresh music list
        closeEditModal();
    } catch (error) {
        console.error('Müzik güncellenirken hata:', error.message);
        displayMessage(editMusicMessage, `Müzik güncellenirken hata oluştu: ${error.message}`, 'error');
    } finally {
        saveEditMusicBtn.disabled = false;
        saveEditMusicBtn.innerHTML = '<i class="fa fa-save"></i> Değişiklikleri Kaydet';
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
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log("Supabase client oluşturuldu.");

        // Admin Panel Toggle (Desktop and Mobile buttons)
        if (adminButton && adminPanel && closeAdminPanelBtn) {
            adminButton.addEventListener('click', () => {
                adminPanel.classList.toggle('hidden');
                addMusicTab.click(); // Default to Add Music tab
            });
            adminButtonMobile.addEventListener('click', () => { // Add listener for mobile button
                adminPanel.classList.toggle('hidden');
                addMusicTab.click(); // Default to Add Music tab
            });
            closeAdminPanelBtn.addEventListener('click', () => {
                adminPanel.classList.add('hidden');
            });
        }

        // Admin Panel Tab Switching
        if (addMusicTab && manageMusicTab && addMusicContent && manageMusicContent) {
            const adminSections = document.querySelectorAll('.admin-content-section');
            const adminTabs = document.querySelectorAll('[id$="Tab"]'); // Select all elements ending with 'Tab'

            const showAdminSection = (sectionId) => {
                adminSections.forEach(section => {
                    section.classList.add('hidden');
                });
                document.getElementById(sectionId).classList.remove('hidden');

                adminTabs.forEach(tab => {
                    if (tab.id.replace('Tab', 'Content') === sectionId) {
                        tab.classList.add('border-indigo-500', 'text-indigo-400');
                        tab.classList.remove('border-transparent', 'text-gray-400', 'hover:text-gray-200', 'hover:border-gray-300');
                    } else {
                        tab.classList.remove('border-indigo-500', 'text-indigo-400');
                        tab.classList.add('border-transparent', 'text-gray-400', 'hover:text-gray-200', 'hover:border-gray-300');
                    }
                });
            };

            addMusicTab.addEventListener('click', (e) => {
                e.preventDefault();
                showAdminSection('addMusicContent');
            });
            manageMusicTab.addEventListener('click', (e) => {
                e.preventDefault();
                showAdminSection('manageMusicContent');
                renderMusicManagementTable(adminMusicSearchInput.value.trim()); // Refresh table when tab is opened
            });

            // Default to 'Müzik Ekle' tab
            showAdminSection('addMusicContent');
        }

        // Add Music Button
        if (addMusicBtn) {
            addMusicBtn.addEventListener('click', addMusic);
        }

        // Delete Music Button (Old Method)
        if (deleteMusicBtn) {
            deleteMusicBtn.addEventListener('click', () => {
                const selectedMusicId = deleteSelect.value;
                if (selectedMusicId) {
                    deleteMusic(selectedMusicId);
                } else {
                    displayMessage(deleteMusicMessage, 'Lütfen silmek için bir müzik seçin.', 'error');
                }
            });
        }

        // Admin Music Search
        if (adminMusicSearchInput) {
            adminMusicSearchInput.addEventListener('input', () => {
                renderMusicManagementTable(adminMusicSearchInput.value.trim());
            });
        }

        // Edit Music Modal Buttons
        if (closeEditModalBtn) {
            closeEditModalBtn.addEventListener('click', closeEditModal);
        }
        if (saveEditMusicBtn) {
            saveEditMusicBtn.addEventListener('click', saveEditedMusic);
        }

        // Player Controls
        if (playPauseBtn) {
            playPauseBtn.addEventListener('click', () => {
                if (audioPlayer.paused) {
                    audioPlayer.play();
                } else {
                    audioPlayer.pause();
                }
            });
        }

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                if (currentPlayingIndex > 0) {
                    playMusic(currentPlayingIndex - 1);
                } else {
                    playMusic(currentPlaylist.length - 1); // Loop to end
                }
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                if (currentPlayingIndex < currentPlaylist.length - 1) {
                    playMusic(currentPlayingIndex + 1);
                } else {
                    playMusic(0); // Loop to beginning
                }
            });
        }

        if (progressBar) {
            progressBar.addEventListener('input', () => {
                const seekTime = (progressBar.value / 100) * audioPlayer.duration;
                audioPlayer.currentTime = seekTime;
            });
        }

        if (volumeBar) {
            volumeBar.addEventListener('input', () => {
                audioPlayer.volume = parseFloat(volumeBar.value);
                updateVolumeIcon(audioPlayer.volume);
                lastVolume = audioPlayer.volume;
            });
        }

        if (volumeIcon) {
            volumeIcon.addEventListener('click', () => {
                if (audioPlayer.volume > 0) {
                    lastVolume = audioPlayer.volume; // Store current volume
                    audioPlayer.volume = 0;
                    volumeBar.value = 0;
                } else {
                    audioPlayer.volume = lastVolume; // Restore last volume
                    volumeBar.value = lastVolume;
                }
                updateVolumeIcon(audioPlayer.volume);
            });
        }

        // Audio Player Events
        audioPlayer.addEventListener('play', updatePlayerUIState);
        audioPlayer.addEventListener('pause', updatePlayerUIState);
        audioPlayer.addEventListener('timeupdate', updateProgressBar);
        audioPlayer.addEventListener('ended', () => {
            if (currentPlayingIndex < currentPlaylist.length - 1) {
                playMusic(currentPlayingIndex + 1);
            } else {
                // Optionally loop or stop
                audioPlayer.pause();
                progressBar.value = 0;
                currentSongTime.textContent = '0:00';
                updatePlayerUIState();
            }
        });

        // Search functionality
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
        await fetchMusics(); // Fetch and render music on page load

    } catch (error) {
        console.error("DOMContentLoaded içinde yakalanan genel hata:", error);
        alert("Uygulama başlatılırken beklenmeyen bir hata oluştu. Konsolu kontrol edin.");
    }
});
