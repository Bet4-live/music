// --- Supabase Setup ---
// !! Buraya kendi Supabase Proje URL ve Public Anon Key bilgilerini GİRİN !!
const SUPABASE_URL = 'YOUR_SUPABASE_URL'; // <-- KENDİ URL'NİZİ GİRİN
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY'; // <-- KENDİ ANON KEY'İNİZİ GİRİN
// !! Supabase bilgilerini GİRDİĞİNİZDEN EMİN OLUN !!

const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- DOM Elements ---
const musicListDesktop = document.getElementById('musicListDesktop'); // Desktop list
const musicListMobile = document.getElementById('musicListMobile'); // Mobile list
const mobileMusicListModal = document.getElementById('mobileMusicListModal'); // Mobile modal
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

// Formats time in seconds to MM:SS format
function formatTime(seconds) {
    if (isNaN(seconds) || seconds < 0 || !isFinite(seconds)) return "0:00";
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
}

// Updates the volume icon based on the current volume level
function updateVolumeIcon(volume) {
     if (volume === 0) {
        volumeIcon.className = 'fa fa-volume-xmark text-gray-600 hover:text-gray-900 cursor-pointer w-5 text-center';
    } else if (volume < 0.5) {
        volumeIcon.className = 'fa fa-volume-low text-gray-600 hover:text-gray-900 cursor-pointer w-5 text-center';
    } else {
        volumeIcon.className = 'fa fa-volume-high text-gray-600 hover:text-gray-900 cursor-pointer w-5 text-center';
    }
}

// Updates the state of player UI elements (buttons, times, song title)
 function updatePlayerUIState() {
    // Enable/disable prev/next buttons based on list size
    const hasMultipleSongs = musicData.length > 1;
    prevBtn.disabled = !hasMultipleSongs;
    nextBtn.disabled = !hasMultipleSongs;

    // Update play/pause icon based on current audio state
    if (audioPlayer.paused) {
        playPauseIcon.className = 'fa fa-play fa-lg';
    } else {
        playPauseIcon.className = 'fa fa-pause fa-lg';
    }

     // Reset times and seek bar if no song is loaded
    if (currentMusicId === null) {
        currentTimeSpan.textContent = "0:00";
        totalDurationSpan.textContent = "0:00";
        seekBar.value = 0;
        seekBar.style.setProperty('--progress', `0%`);
         // Disable seek bar if no music is loaded
        seekBar.disabled = true;
         if(currentSongTitleElement) currentSongTitleElement.textContent = "Müzik Seçin"; // Reset song title
    } else {
         // Enable seek bar if music is loaded
         seekBar.disabled = false;
         // Song title is updated in loadAndPlayMusic
    }
}


// --- Player Event Listeners ---
playPauseBtn.addEventListener('click', togglePlayPause);
audioPlayer.addEventListener('timeupdate', updateSeekBar); // Update seek bar as music plays
audioPlayer.addEventListener('loadedmetadata', setDuration); // Set total duration when metadata is loaded
audioPlayer.addEventListener('play', () => updatePlayerUIState()); // Update UI when playback starts
audioPlayer.addEventListener('pause', () => updatePlayerUIState()); // Update UI when playback pauses
audioPlayer.addEventListener('ended', playNext); // Play next song when current ends
seekBar.addEventListener('input', seek); // Seek when the user drags the seek bar
volumeBar.addEventListener('input', changeVolume); // Change volume when the user drags the volume bar
volumeIcon.addEventListener('click', toggleMute); // Toggle mute on volume icon click
prevBtn.addEventListener('click', playPrevious); // Previous button listener
nextBtn.addEventListener('click', playNext); // Next button listener


// --- Player Control Functions ---

// Toggles between play and pause
function togglePlayPause() {
    if (!audioPlayer.src || currentMusicId === null) return; // Do nothing if no song is loaded
    if (audioPlayer.paused) {
        audioPlayer.play().catch(e => console.error("Oynatma hatası:", e)); // Handle potential autoplay errors
    } else {
        audioPlayer.pause();
    }
}

// Updates the seek bar position and current time display
function updateSeekBar() {
    if (audioPlayer.duration && isFinite(audioPlayer.duration)) {
        const percentage = (audioPlayer.currentTime / audioPlayer.duration) * 100;
        seekBar.value = percentage;
        // Update CSS variable for progress fill
        seekBar.style.setProperty('--progress', `${percentage}%`);
        currentTimeSpan.textContent = formatTime(audioPlayer.currentTime);
    } else {
         // Reset if duration is not available (e.g., before metadata loads)
         seekBar.value = 0;
         seekBar.style.setProperty('--progress', `0%`);
         currentTimeSpan.textContent = formatTime(0);
    }
}

// Sets the total duration display when music metadata is loaded
function setDuration() {
     if (audioPlayer.duration && isFinite(audioPlayer.duration)) {
        totalDurationSpan.textContent = formatTime(audioPlayer.duration);
        seekBar.value = 0; // Reset seek bar on new song load
        seekBar.style.setProperty('--progress', `0%`);
        currentTimeSpan.textContent = formatTime(0);
    } else {
        // Reset if duration is not valid
        totalDurationSpan.textContent = "0:00";
        currentTimeSpan.textContent = "0:00";
        seekBar.value = 0;
        seekBar.style.setProperty('--progress', `0%`);
    }
}

// Seeks to a specific position in the song based on the seek bar value
function seek() {
    if (!audioPlayer.src || !audioPlayer.duration || !isFinite(audioPlayer.duration)) return; // Do nothing if no song or invalid duration
    const time = (seekBar.value / 100) * audioPlayer.duration;
    audioPlayer.currentTime = time;
    // Update progress immediately while dragging
    seekBar.style.setProperty('--progress', `${seekBar.value}%`);
}

// Changes the volume based on the volume bar value
function changeVolume() {
    audioPlayer.volume = volumeBar.value;
    updateVolumeIcon(audioPlayer.volume);
     // Store volume if not muted
    if (audioPlayer.volume > 0) {
        lastVolume = audioPlayer.volume;
    }
}

// Toggles mute/unmute
function toggleMute() {
    if (audioPlayer.volume > 0) {
        // Mute: store current volume, set volume to 0
        lastVolume = audioPlayer.volume; // Store before muting
        audioPlayer.volume = 0;
        volumeBar.value = 0;
        updateVolumeIcon(0);
    } else {
        // Unmute: restore last volume
        audioPlayer.volume = lastVolume;
        volumeBar.value = lastVolume;
        updateVolumeIcon(lastVolume);
    }
}

// Loads and plays a music item by its index in the current musicData array
function loadAndPlayMusic(index) {
    if (index < 0 || index >= musicData.length) {
        console.log("Geçersiz müzik indexi:", index);
         // Stop player if index is out of bounds
         audioPlayer.pause();
         audioPlayer.src = ''; // Clear source
         coverImage.src = defaultCover; // Reset cover image
         currentMusicId = null;
         currentMusicIndex = -1; // Reset index
         if(currentSongTitleElement) currentSongTitleElement.textContent = "Müzik Seçin"; // Reset song title
         updatePlayerUIState(); // Reset UI
        return;
    }

    const music = musicData[index]; // music object now comes from Supabase data
    console.log(`Yükleniyor: ${music.name} (ID: ${music.id}, Index: ${index})`);

    // Set audio source and cover image using URLs from Supabase data
    audioPlayer.src = music.audio_url; // Use the Supabase Storage URL
    coverImage.src = music.image_url || defaultCover; // Use URL from Supabase or default

    currentMusicId = music.id; // Update current music ID using Supabase ID
    currentMusicIndex = index; // Update current music index
    if(currentSongTitleElement) currentSongTitleElement.textContent = music.name; // Update song title

    // Update active state styling in the music list sidebar (desktop)
    document.querySelectorAll('#musicListDesktop .music-item').forEach((item, idx) => {
        // Compare using the dataset.id which holds the Supabase ID
        item.classList.toggle('bg-indigo-600', item.dataset.id === currentMusicId.toString());
        item.classList.toggle('bg-gray-800', item.dataset.id !== currentMusicId.toString());
        if (item.dataset.id === currentMusicId.toString()) {
            item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    });
    // Update active state styling in the music list modal (mobile)
     document.querySelectorAll('#musicListMobile .music-item').forEach((item, idx) => {
         // Compare using the dataset.id which holds the Supabase ID
        item.classList.toggle('bg-indigo-600', item.dataset.id === currentMusicId.toString());
        item.classList.toggle('bg-gray-800', item.dataset.id !== currentMusicId.toString());
         if (item.dataset.id === currentMusicId.toString()) {
            item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
         }
    });

    // Load and play the new audio source
    audioPlayer.load(); // Important to load the new source
    audioPlayer.play().catch(e => {
        console.error("Otomatik oynatma engellendi veya hata:", e);
        // If autoplay fails, ensure play icon is shown
        playPauseIcon.className = 'fa fa-play fa-lg';
    });
    updatePlayerUIState(); // Update buttons etc. based on new state
    // closeMobileMusicList(); // Uncomment if you want modal to close automatically
}

// Plays the next song in the list, wrapping around to the beginning
function playNext() {
    if (musicData.length === 0) return; // Do nothing if list is empty
    let nextIndex = (currentMusicIndex + 1) % musicData.length; // Calculate next index (wraps around)
    loadAndPlayMusic(nextIndex); // Load and play the next song
}

// Plays the previous song in the list, wrapping around to the end
function playPrevious() {
     if (musicData.length === 0) return; // Do nothing if list is empty
     // If current time is > 3 seconds, restart current song, otherwise go to previous
     if (audioPlayer.currentTime > 3 && currentMusicIndex !== -1) {
         audioPlayer.currentTime = 0; // Restart current song
         audioPlayer.play().catch(e => console.error("Oynatma hatası:", e));
     } else {
        let prevIndex = (currentMusicIndex - 1 + musicData.length) % musicData.length; // Calculate previous index (wraps around)
        loadAndPlayMusic(prevIndex); // Load and play the previous song
     }
}

// --- Mobile Music List Modal Control ---
// These functions remain but are not triggered by a button in the mobile view anymore
function toggleMobileMusicList() {
     const modal = document.getElementById('mobileMusicListModal');
     if (modal) {
         modal.classList.toggle('open');
     } else {
         console.error("Mobile music list modal element not found!");
     }
}

function openMobileMusicList() {
     const modal = document.getElementById('mobileMusicListModal');
     if (modal) {
         modal.classList.add('open');
     } else {
          console.error("Mobile music list modal element not found!");
     }
}

function closeMobileMusicList() {
     const modal = document.getElementById('mobileMusicListModal');
     if (modal) {
         modal.classList.remove('open');
     } else {
         console.error("Mobile music list modal element not found!");
     }
}

// --- Render Music List (Fetch from Supabase) ---

// Fetches music data from Supabase and renders the list
async function renderMusics() {
    // Clear previous lists and data
    if (musicListDesktop) musicListDesktop.innerHTML = '';
    if (musicListMobile) musicListMobile.innerHTML = ''; // Clear mobile list as well
    if (deleteSelect) deleteSelect.innerHTML = '<option value="" disabled selected>Silmek için seçin...</option>';
    musicData = []; // Clear internal data array

    try {
        // Fetch data from the 'musics' table
        // You might add .order('created_at', { ascending: false }) or similar here
        const { data, error } = await supabase
            .from('musics')
            .select('id, name, audio_url, image_url')
             .order('created_at', { ascending: false }); // Order by creation date descending

        if (error) {
            console.error('Supabase fetch error:', error);
            const errorMessage = '<p class="text-red-400 text-center mt-4">Müzikler yüklenemedi.</p>';
            if (musicListDesktop) musicListDesktop.innerHTML = errorMessage;
            if (musicListMobile) musicListMobile.innerHTML = errorMessage;
            updatePlayerUIState();
            return;
        }

        musicData = data || []; // Store fetched data
        console.log(`Bulunan müzik sayısı: ${musicData.length}`);

        // Update song count displays
        if (songCountDesktop) songCountDesktop.textContent = `${musicData.length} Şarkı`;

        if (musicData.length === 0) {
            const noMusicMessage = '<p class="text-gray-400 text-center mt-4">Henüz müzik eklenmemiş.</p>';
            if (musicListDesktop) musicListDesktop.innerHTML = noMusicMessage;
            if (musicListMobile) musicListMobile.innerHTML = noMusicMessage;
            // Reset player state if no music is found
            if (currentMusicId !== null) {
                audioPlayer.pause();
                audioPlayer.src = ''; // Clear source
                coverImage.src = defaultCover; // Reset cover image
                currentMusicId = null;
                currentMusicIndex = -1; // Reset index
            }
             if(currentSongTitleElement) currentSongTitleElement.textContent = "Müzik Seçin"; // Reset song title
            updatePlayerUIState();
            return;
        }

        // Find the index of the currently playing song in the new list
        // Need to find by ID as the order might change
        const currentSongIndexInNewList = musicData.findIndex(music => music.id === currentMusicId);
        // If the song is found, update the current index
        if(currentSongIndexInNewList !== -1) {
            currentMusicIndex = currentSongIndexInNewList;
        } else {
            // If the current song was deleted or not found in the new list
            currentMusicId = null;
            currentMusicIndex = -1;
            // Reset player state if the song was playing
             if (!audioPlayer.paused || audioPlayer.currentTime > 0) {
                 audioPlayer.pause();
                 audioPlayer.src = '';
                 coverImage.src = defaultCover;
                 if(currentSongTitleElement) currentSongTitleElement.textContent = "Müzik Seçin";
             }
        }


        // Render each music item in both the desktop sidebar and mobile modal
        musicData.forEach((music, index) => {
            const createMusicItem = () => { // Removed listType param as it's not used in creation
                const div = document.createElement('div');
                // Apply active class if this is the currently loaded song
                 // Use music.id for comparison
                div.className = `music-item flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all transform hover:scale-[1.03] ${music.id === currentMusicId ? 'bg-indigo-600' : 'bg-gray-800 hover:bg-indigo-700'}`;
                div.dataset.id = music.id; // Store music ID for easy access

                const img = document.createElement('img');
                 // Use music.image_url from Supabase
                img.src = music.image_url || 'https://placehold.co/60x60/7f9cf5/ffffff?text=♪'; // Default icon if no image
                img.alt = "Kapak";
                img.className = "w-12 h-12 rounded-md object-cover flex-shrink-0";
                img.onerror = () => img.src = 'https://placehold.co/60x60/7f9cf5/ffffff?text=♪'; // Fallback image on error
                div.appendChild(img);

                const title = document.createElement('span');
                title.className = "font-medium truncate flex-grow";
                title.innerText = music.name;
                div.appendChild(title);

                // Add click event listener to load and play the music
                div.onclick = () => {
                     // Find the index of the clicked music item in the current musicData array
                     const clickedIndex = musicData.findIndex(item => item.id === music.id);
                     if (clickedIndex !== -1) {
                        loadAndPlayMusic(clickedIndex); // Load and play based on found index
                        closeMobileMusicList(); // Close modal after selecting on mobile
                     } else {
                         console.error("Tıklanan müzik listede bulunamadı:", music.id);
                     }
                };
                return div;
            };

            // Add to desktop list if element exists
            if (musicListDesktop) musicListDesktop.appendChild(createMusicItem());
            // Add to mobile list if element exists
            if (musicListMobile) musicListMobile.appendChild(createMusicItem());
            // Create option element for the delete dropdown if element exists
            if (deleteSelect) {
                const option = document.createElement('option');
                option.value = music.id; // Use music.id from Supabase
                option.text = music.name;
                deleteSelect.appendChild(option); // Add to delete dropdown
            }
        });

        // If a song was playing and is still in the list, re-select it and update UI
         if (currentMusicId !== null && currentMusicIndex !== -1) {
             // Re-highlight the active song in the UI lists
             document.querySelectorAll('.music-item').forEach(item => {
                 item.classList.toggle('bg-indigo-600', item.dataset.id === currentMusicId.toString());
                 item.classList.toggle('bg-gray-800', item.dataset.id !== currentMusicId.toString());
             });
             // Ensure player UI state (play/pause button, times) is correct for the loaded song
             updatePlayerUIState(); // Updates button states based on audioPlayer state
         } else {
              // If no song is loaded or the loaded song is no longer in the list, reset player UI
              updatePlayerUIState();
         }


    } catch (error) {
        console.error("renderMusics içinde hata:", error);
        const errorMessage = '<p class="text-red-400 text-center mt-4">Müzikler yüklenemedi.</p>';
        if (musicListDesktop) musicListDesktop.innerHTML = errorMessage;
        if (musicListMobile) musicListMobile.innerHTML = errorMessage;
        updatePlayerUIState();
    }
}

// --- Add Music (Upload to Storage & Insert to DB) ---

// Handles adding new music via the admin panel form
async function addMusic() {
    // Check if user is logged in before allowing add
    const user = await supabase.auth.getUser();
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

    // Show loading indicator on the button
    const addButton = document.getElementById('addMusicBtn'); // Use the button ID
    const originalButtonText = addButton.innerHTML;
    addButton.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Ekleniyor...';
    addButton.disabled = true;

    let audioUrl = null;
    let imageUrl = null;
    const filesToRemoveOnError = []; // Keep track of uploaded files in case of later failure

    try {
        // 1. Upload Audio File to Supabase Storage
        // Generate a unique path (e.g., using user ID, timestamp and original name)
        const userId = user.data.user.id; // Get logged-in user's ID
        const audioFileName = `${userId}/${Date.now()}_${audioFile.name.replace(/\s+/g, '_')}`; // Path within the bucket, potentially user-specific
        const audioFilePath = `public/${audioFileName}`; // Full path in storage bucket
        filesToRemoveOnError.push(audioFilePath);

        const { data: audioUploadData, error: audioUploadError } = await supabase.storage
            .from('music-files') // Your storage bucket name
            .upload(audioFilePath, audioFile);

        if (audioUploadError) {
            throw new Error(`Ses dosyası yükleme hatası: ${audioUploadError.message}`);
        }

        // Get the public URL for the uploaded audio file
        const { data: publicAudioUrlData } = supabase.storage
            .from('music-files')
            .getPublicUrl(audioFilePath);
        audioUrl = publicAudioUrlData.publicUrl;


        // 2. Upload Image File to Supabase Storage (if exists)
        if (imageFile) {
             if (imageFile.size > 5 * 1024 * 1024) { // 5MB image size limit
                throw new Error("Resim dosyası çok büyük! (Maksimum 5MB)");
            }
            const imageFileName = `${userId}/${Date.now()}_${imageFile.name.replace(/\s+/g, '_')}`; // Path within the bucket, potentially user-specific
            const imageFilePath = `public/${imageFileName}`; // Full path in storage bucket
            filesToRemoveOnError.push(imageFilePath); // Add to list in case DB insert fails

            const { data: imageUploadData, error: imageUploadError } = await supabase.storage
                .from('music-files') // Your storage bucket name
                .upload(imageFilePath, imageFile);

            if (imageUploadError) {
                 throw new Error(`Resim dosyası yükleme hatası: ${imageUploadError.message}`);
            }
            // Get the public URL for the uploaded image file
            const { data: publicImageUrlData } = supabase.storage
                .from('music-files')
                .getPublicUrl(imageFilePath);
            imageUrl = publicImageUrlData.publicUrl;
        }

        // 3. Insert Music Record into Supabase Database
        const { data: musicInsertData, error: musicInsertError } = await supabase
            .from('musics')
            .insert([{
                name: name,
                audio_url: audioUrl,
                image_url: imageUrl,
                user_id: userId // Associate music with the user who added it
            }])
            .select(); // Select the inserted data to get the new ID

        if (musicInsertError) {
             throw new Error(`Veritabanına kayıt hatası: ${musicInsertError.message}`);
        }

        console.log("Müzik başarıyla eklendi:", name, musicInsertData);
        renderMusics(); // Refresh lists after adding
        // Clear form fields
        nameInput.value = '';
        fileInput.value = '';
        imageInput.value = '';
        alert('Müzik başarıyla eklendi!');

    } catch (error) {
        console.error('Müzik eklenirken hata oluştu: ', error.message);
        alert(`Müzik eklenemedi: ${error.message}`);

        // Clean up uploaded files if there was an error during upload or DB insert
         if (filesToRemoveOnError.length > 0) {
             console.log("Hata oluştu, yüklenen dosyalar siliniyor:", filesToRemoveOnError);
              const { error: cleanupError } = await supabase.storage
                 .from('music-files')
                 .remove(filesToRemoveOnError);
              if (cleanupError) {
                 console.error("Dosya temizleme hatası:", cleanupError);
              } else {
                  console.log("Yüklenen dosyalar başarıyla temizlendi.");
              }
         }


    } finally {
        // Restore button state
        addButton.innerHTML = originalButtonText;
        addButton.disabled = false;
    }
}

// --- Delete Music (Delete from DB & Remove from Storage) ---

// Handles deleting a music item
async function deleteMusic() {
    // Check if user is logged in before allowing delete
    const user = await supabase.auth.getUser();
     if (user.error || !user.data.user) {
          alert('Müzik silmek için giriş yapmalısınız.');
          return;
     }

    const musicIdToDelete = deleteSelect.value; // Get the selected music ID (it's a string from Supabase)

    if (!musicIdToDelete) {
        alert('Lütfen silinecek bir müzik seçin.');
        return;
    }

    const musicNameToDelete = deleteSelect.options[deleteSelect.selectedIndex].text;
    if (!confirm(`"${musicNameToDelete}" adlı müziği silmek istediğinizden emin misiniz?`)) {
        return; // User cancelled
    }

     // Show loading indicator on the button
     const deleteButton = document.getElementById('deleteMusicBtn'); // Use the button ID
     const originalDeleteButtonText = deleteButton.innerHTML;
     deleteButton.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Siliniyor...';
     deleteButton.disabled = true;


    try {
        // 1. Get the music record and file paths before deleting
        const { data: musicToDelete, error: fetchError } = await supabase
            .from('musics')
            .select('id, audio_url, image_url, user_id') // Also fetch user_id for RLS check if needed
            .eq('id', musicIdToDelete)
            .single(); // Get a single matching record

        if (fetchError || !musicToDelete) {
             console.error('Silinecek müzik bilgisi alınamadı:', fetchError?.message);
             // If fetching info fails, throw error as we might not have permissions or record is gone
             throw new Error(`Silinecek müzik bulunamadı veya erişim reddedildi: ${fetchError?.message}`);
        }

         // Optional but recommended client-side check: Ensure the logged-in user is the owner (if user_id column exists)
         // This is better enforced by RLS, but a client-side check adds user experience
         // This relies on your RLS policy allowing users to SELECT rows where user_id = auth.uid()
         // If your RLS for DELETE is TRUE for authenticated, this check is just for UX
         const user = await supabase.auth.getUser(); // Get user again to be safe, though it should be in session
         if (musicToDelete.user_id && user.data?.user?.id && musicToDelete.user_id !== user.data.user.id) {
              alert("Sadece kendi eklediğiniz müzikleri silebilirsiniz."); // User-friendly message
               // Restore button state
               deleteButton.innerHTML = originalDeleteButtonText;
               deleteButton.disabled = false;
               // Don't proceed with delete
               return;
         }


        const filesToRemove = [];
        // Extract file paths from URLs. Assumes 'public' bucket. Adjust if needed.
        const baseUrl = `${SUPABASE_URL}/storage/v1/object/public/music-files/`;

        if (musicToDelete?.audio_url && musicToDelete.audio_url.startsWith(baseUrl)) {
             const audioFilePath = musicToDelete.audio_url.substring(baseUrl.length);
             if(audioFilePath) filesToRemove.push(audioFilePath);
         }

        if (musicToDelete?.image_url && musicToDelete.image_url.startsWith(baseUrl)) {
             const imageFilePath = musicToDelete.image_url.substring(baseUrl.length);
             if(imageFilePath) filesToRemove.push(imageFilePath);
        }


        // 2. Delete Music Record from Supabase Database
        // RLS policies should ensure only allowed users can delete
        const { error: dbDeleteError } = await supabase
            .from('musics')
            .delete()
            .eq('id', musicIdToDelete); // Ensure the ID matches the fetched one

        if (dbDeleteError) {
            // If DB delete fails, don't proceed with Storage delete
            throw new Error(`Veritabanından silme hatası: ${dbDeleteError.message}`);
        }

        console.log(`Müzik ID ${musicIdToDelete} veritabanından silindi.`);

        // 3. Delete files from Supabase Storage (only if DB delete was successful)
         if (filesToRemove.length > 0) {
             const { error: storageDeleteError } = await supabase.storage
                 .from('music-files') // Your storage bucket name
                 .remove(filesToRemove);

             if (storageDeleteError) {
                 console.error('Depolama alanından silinirken hata oluştu (veritabanı kaydı silindi):', storageDeleteError);
                 // It's okay to continue even if file deletion fails, the database record is gone
             } else {
                  console.log(`Dosyalar başarıyla silindi: ${filesToRemove.join(', ')}`);
             }
         }


        // Check if the deleted music was the currently playing one
        const wasCurrentMusicDeleted = (currentMusicId === musicIdToDelete);

        // Stop player and clear info if the current song was deleted
        if (wasCurrentMusicDeleted) {
            audioPlayer.pause();
            audioPlayer.src = ''; // Clear source
            coverImage.src = defaultCover; // Reset cover image
            currentMusicId = null;
            currentMusicIndex = -1; // Reset index
            if(currentSongTitleElement) currentSongTitleElement.textContent = "Müzik Seçin"; // Reset song title
        }

        // Re-render the music list
        await renderMusics(); // Ensure renderMusics completes before checking next song

        alert(`"${musicNameToDelete}" başarıyla silindi!`);

         // If the deleted song was playing and there are other songs, try to play the first one
         if (wasCurrentMusicDeleted && musicData.length > 0) {
             // The renderMusics function will have updated musicData
             // Load and play the first song in the updated list
             loadAndPlayMusic(0);
         } else if (musicData.length === 0) {
             // If the list is now empty, ensure player UI is fully reset
             updatePlayerUIState();
         }

    } catch (error) {
        console.error('Müzik silinirken hata oluştu: ', error.message);
        alert(`Müzik silinemedi: ${error.message}`);
    } finally {
         // Restore button state
        deleteButton.innerHTML = originalDeleteButtonText;
        deleteButton.disabled = false;
    }
}

// --- Admin Panel Visibility & Auth State Handling ---

// Shows the admin panel modal
function showAdminPanel() {
    adminPanelDiv.classList.remove('hidden');
    adminPanelDiv.classList.add('flex');
    // Supabase Auth state listener will handle which form is shown
     // Initially focus the email input if the login form is visible
     if (!loginForm.classList.contains('hidden') && authEmailInput) {
         authEmailInput.focus();
     }
}

// Hides the admin panel modal and resets the form
function closeAdminPanel() {
    adminPanelDiv.classList.add('hidden');
    adminPanelDiv.classList.remove('flex');
    // Clear add music form fields
    document.getElementById('musicName').value = '';
    document.getElementById('musicFile').value = '';
    document.getElementById('musicImage').value = '';
     // Reset delete select
    deleteSelect.value = ""; // Select the disabled option
     // Clear auth fields
     if(authEmailInput) authEmailInput.value = '';
     if(authPassInput) authPassInput.value = '';
}

// Supabase Auth State Listener: Manages visibility of login form and admin controls
supabase.auth.onAuthStateChange((event, session) => {
    console.log("Auth state changed:", event, session);
    if (session) {
        // User is logged in (session exists)
        loginForm.classList.add('hidden'); // Hide login form
        loginForm.classList.remove('flex', 'space-y-4'); // Remove flex and space-y for clean hide

        adminControlsDiv.classList.remove('hidden'); // Show admin controls
        adminControlsDiv.classList.add('flex', 'flex-col', 'space-y-4'); // Ensure flex properties for layout

         if(loggedInUserEmailSpan && session.user && session.user.email) {
             loggedInUserEmailSpan.textContent = `Giriş Yapıldı: ${session.user.email}`;
         } else if (loggedInUserEmailSpan) {
             loggedInUserEmailSpan.textContent = 'Giriş Yapıldı (Email Yok)'; // Fallback if email is missing
         }


         // Optional: Re-render music list if it depends on user authentication (e.g. showing only user's music)
         // renderMusics(); // Uncomment if needed
    } else {
        // User is logged out (no session)
        loginForm.classList.remove('hidden'); // Show login form
        loginForm.classList.add('flex', 'flex-col', 'space-y-4'); // Ensure flex properties for layout

        adminControlsDiv.classList.add('hidden'); // Hide admin controls
        adminControlsDiv.classList.remove('flex', 'flex-col', 'space-y-4'); // Remove flex and space-y for clean hide


        if(loggedInUserEmailSpan) {
            loggedInUserEmailSpan.textContent = ''; // Clear user email display
        }

        // Optional: Re-render music list to show only public items if applicable
        // renderMusics(); // Uncomment if needed
    }
});

// --- Supabase Authentication Functions ---

// Handles user sign-in with email and password
async function signIn() {
    const email = authEmailInput.value.trim();
    const password = authPassInput.value.trim();

    if (!email || !password) {
        alert("Lütfen email ve şifreyi girin.");
        return;
    }

    // Show loading state on button
    signInBtn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Giriş Yapılıyor...';
    signInBtn.disabled = true;

    const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
    });

    // Restore button state regardless of outcome
    signInBtn.innerHTML = '<i class="fa fa-sign-in-alt"></i> Giriş Yap';
    signInBtn.disabled = false;

    if (error) {
        console.error("Giriş hatası:", error.message);
        alert(`Giriş başarısız: ${error.message}`);
    } else {
        console.log("Giriş başarılı!", data.user);
         // Clear inputs on success
         authEmailInput.value = '';
         authPassInput.value = '';
        // Auth state listener will handle UI update
    }
}

// Handles user sign-out
async function signOut() {
     // Show loading state on button
     signOutBtn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Çıkılıyor...';
     signOutBtn.disabled = true;
     // adminButton.disabled = true; // Disable admin button too during sign out process (Optional)

    const { error } = await supabase.auth.signOut();

     // Restore button states regardless of outcome
     signOutBtn.innerHTML = '<i class="fa fa-sign-out-alt"></i> Çıkış Yap';
     signOutBtn.disabled = false;
     // adminButton.disabled = false; // Re-enable admin button (Optional)


    if (error) {
        console.error("Çıkış hatası:", error.message);
        alert(`Çıkış başarısız: ${error.message}`);
    } else {
        console.log("Başarıyla çıkış yapıldı.");
         // Auth state listener will handle UI update (show login form)
         // closeAdminPanel(); // Optional: Close the modal on sign out
    }
}

 // Optional: Handles user sign-up (needs signUpBtn in HTML)
 /*
async function signUp() {
     const email = authEmailInput.value.trim();
     const password = authPassInput.value.trim();

     if (!email || !password) {
         alert("Lütfen email ve şifreyi girin.");
         return;
     }

     // Show loading state on button
     const signUpBtn = document.getElementById('signUpBtn');
     const originalSignUpBtnText = signUpBtn.innerHTML;
     signUpBtn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Kayıt Olunuyor...';
     signUpBtn.disabled = true;

     const { data, error } = await supabase.auth.signUp({
         email: email,
         password: password,
     });

     // Restore button state
     signUpBtn.innerHTML = originalSignUpBtnText;
     signUpBtn.disabled = false;


     if (error) {
         console.error("Kayıt hatası:", error.message);
         alert(`Kayıt başarısız: ${error.message}`);
     } else {
         console.log("Kayıt başarılı!", data.user);
          // Depending on your Supabase settings, user might need email confirmation
         alert('Kayıt başarılı! Lütfen email adresinizi kontrol ederek hesabınızı aktifleştirin.');
         // Clear inputs on success
         authEmailInput.value = '';
         authPassInput.value = '';
         // You might want to automatically sign them in or prompt them to sign in
         // signIn(); // Example: Auto sign-in after sign-up
     }
}
*/


// --- Event Listeners for Auth Buttons and Admin Button ---

// Add event listener for the admin button AFTER the script and DOM elements are ready
// Removed onclick="showAdminPanel()" from HTML
if (adminButton) { // Make sure the element exists
    adminButton.addEventListener('click', showAdminPanel);
} else {
    console.error("Admin button element not found!");
}

if(signInBtn) signInBtn.addEventListener('click', signIn);
// If you added a signUpBtn, uncomment and add listener:
// const signUpBtn = document.getElementById('signUpBtn');
// if(signUpBtn) signUpBtn.addEventListener('click', signUp);
if(signOutBtn) signOutBtn.addEventListener('click', signOut);

// Add event listeners for player controls (play/pause, prev, next, volume, mute)
// These were in the HTML onclick attributes in the original IndexedDB code, moved here for organization and consistency
if(playPauseBtn) playPauseBtn.addEventListener('click', togglePlayPause);
if(prevBtn) prevBtn.addEventListener('click', playPrevious);
if(nextBtn) nextBtn.addEventListener('click', playNext);
if(volumeBar) volumeBar.addEventListener('input', changeVolume); // Volume bar input
if(volumeIcon) volumeIcon.addEventListener('click', toggleMute); // Volume icon click (for mute/unmute)
if(seekBar) seekBar.addEventListener('input', seek); // Seek bar input

// Add event listeners for modal close buttons
const closeMobileListBtn = document.getElementById('closeMobileListBtn');
if(closeMobileListBtn) closeMobileListBtn.addEventListener('click', closeMobileMusicList);
const closeAdminPanelBtn = document.getElementById('closeAdminPanelBtn');
if(closeAdminPanelBtn) closeAdminPanelBtn.addEventListener('click', closeAdminPanel);


// Make sure Add/Delete buttons trigger functions (using event listeners now)
 const addMusicBtn = document.getElementById('addMusicBtn');
 if(addMusicBtn) addMusicBtn.addEventListener('click', addMusic);

 const deleteMusicBtn = document.getElementById('deleteMusicBtn');
 if(deleteMusicBtn) deleteMusicBtn.addEventListener('click', deleteMusic);


// --- Initial Setup ---

// Code to run when the script loads
coverImage.src = defaultCover; // Set initial cover image
// Admin controls visibility is now handled by the Supabase Auth state listener
// Set initial volume bar value based on player's default volume
volumeBar.value = audioPlayer.volume;
updateVolumeIcon(audioPlayer.volume); // Update volume icon initially
// Player UI state will be updated by renderMusics, but initial state can be set here
updatePlayerUIState();

// Initial fetch and render of music list from Supabase
// This runs regardless of login state, RLS will determine what data is returned
renderMusics();