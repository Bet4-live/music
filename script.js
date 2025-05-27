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
            console.error("Hata: window.supabase tanımlanmamış. Supabase kütüphanesi yüklenemedi veya çalışmadı.");
            alert("Supabase kütüphanesi yüklenirken bir sorun oluştu.");
            return;
        }

        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log("Supabase istemcisi başarıyla oluşturuldu.");

        // UI Elementleri
        const adminButton = document.getElementById('adminButton');
        const adminPanel = document.getElementById('adminPanel');
        const closeAdminPanel = document.getElementById('closeAdminPanel');
        const musicFile = document.getElementById('musicFile');
        const musicTitle = document.getElementById('musicTitle');
        const musicArtist = document.getElementById('musicArtist');
        const musicImage = document.getElementById('musicImage');
        const addMusicBtn = document.getElementById('addMusicBtn');
        const deleteSelect = document.getElementById('deleteSelect');
        const deleteMusicBtn = document.getElementById('deleteMusicBtn');

        const musicListDesktop = document.getElementById('musicListDesktop');
        const audioPlayer = document.getElementById('audioPlayer');
        const playPauseBtn = document.getElementById('playPauseBtn');
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        const progressBar = document.getElementById('progressBar');
        const currentTimeElement = document.getElementById('currentTime');
        const durationElement = document.getElementById('duration');
        const volumeBar = document.getElementById('volumeBar');
        const volumeIcon = document.getElementById('volumeIcon');
        const coverImage = document.getElementById('coverImage'); // Plak şeklindeki kapak
        const footerCoverImage = document.getElementById('footerCoverImage'); // Footer'daki küçük kapak
        const currentSongTitleElement = document.getElementById('currentSongTitle');
        const currentSongArtistElement = document.getElementById('currentSongArtist');

        // Yeni Eklenen UI Elementleri
        const welcomeScreen = document.getElementById('welcomeScreen');
        const albumCoverContainer = document.getElementById('albumCoverContainer');
        const welcomeText = document.getElementById('welcomeText');


        // Varsayılan Değerler
        const defaultCover = 'https://via.placeholder.com/300/1a202c/cbd5e0?text=NO+COVER'; // Gri tonlu, koyu arkaplanlı
        const defaultFooterCover = 'https://via.placeholder.com/100/1a202c/cbd5e0?text=NO+COVER';
        const defaultTitle = 'Şarkı Seçilmedi';
        const defaultArtist = 'Bilinmiyor';

        let currentPlayingIndex = -1; // -1: Hiçbir şarkı çalmıyor
        let musicData = []; // Tüm müzik verilerini tutacak dizi
        let lastVolume = 0.75; // Ses çubuğunun son değerini tutmak için

        // Admin Paneli Fonksiyonları
        adminButton.addEventListener('click', () => {
            adminPanel.classList.add('visible');
        });

        closeAdminPanel.addEventListener('click', () => {
            adminPanel.classList.remove('visible');
        });

        // Supabase Storage Helper
        const uploadFile = async (bucket, filePath, file) => {
            const { data, error } = await supabaseClient.storage.from(bucket).upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
            });
            if (error) throw error;
            return data.path;
        };

        const getPublicUrl = (bucket, filePath) => {
            const { data } = supabaseClient.storage.from(bucket).getPublicUrl(filePath);
            return data.publicUrl;
        };

        // Müzik Ekleme
        addMusicBtn.addEventListener('click', async () => {
            const file = musicFile.files[0];
            const image = musicImage.files[0];
            const title = musicTitle.value;
            const artist = musicArtist.value;

            if (!file || !title || !artist) {
                alert('Lütfen tüm alanları doldurun ve dosya seçin.');
                return;
            }

            try {
                // Dosya uzantılarını al
                const audioExtension = file.name.split('.').pop();
                const imageExtension = image ? image.name.split('.').pop() : 'png';

                // Benzersiz dosya adları oluştur
                const audioFileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
                const imageFileName = image ? `${Date.now()}-${image.name.replace(/[^a-zA-Z0-9.]/g, '_')}` : null;

                // Storage'a yükle
                const audioPath = await uploadFile('music_files', audioFileName, file);
                const imageUrl = image ? getPublicUrl('music_images', await uploadFile('music_images', imageFileName, image)) : defaultCover;

                // Public URL'leri al
                const audioUrl = getPublicUrl('music_files', audioPath);

                // Veritabanına kaydet
                const { data, error } = await supabaseClient
                    .from('musics')
                    .insert([
                        { title: title, artist: artist, audio_url: audioUrl, image_url: imageUrl }
                    ]);

                if (error) throw error;

                alert('Müzik başarıyla eklendi!');
                musicTitle.value = '';
                musicArtist.value = '';
                musicFile.value = '';
                musicImage.value = '';
                await renderMusics(); // Listeyi güncelle
            } catch (error) {
                console.error('Müzik eklenirken hata oluştu:', error.message);
                alert('Müzik eklenirken bir hata oluştu: ' + error.message);
            }
        });

        // Müzik Silme
        deleteMusicBtn.addEventListener('click', async () => {
            const musicId = deleteSelect.value;
            if (!musicId) {
                alert('Lütfen silmek için bir müzik seçin.');
                return;
            }

            // Silinecek müziğin bilgilerini bul (storage'dan silmek için)
            const musicToDelete = musicData.find(m => m.id == musicId);
            if (!musicToDelete) {
                alert('Silinecek müzik bulunamadı.');
                return;
            }

            const confirmDelete = confirm(`"${musicToDelete.title}" adlı müziği silmek istediğinize emin misiniz?`);
            if (!confirmDelete) {
                return;
            }

            try {
                // Supabase Storage'dan dosyaları sil
                // Dosya adını URL'den al
                const audioFileName = musicToDelete.audio_url.split('/').pop();
                const { error: audioError } = await supabaseClient.storage.from('music_files').remove([audioFileName]);
                if (audioError && audioError.statusCode !== '404') { // 404 hatasını yoksay, dosya zaten olmayabilir
                    console.error('Ses dosyası silinirken hata oluştu (göz ardı edilebilir):', audioError.message);
                }

                // Resim dosyası default değilse sil
                if (musicToDelete.image_url && musicToDelete.image_url !== defaultCover) {
                    const imageFileName = musicToDelete.image_url.split('/').pop();
                    const { error: imageError } = await supabaseClient.storage.from('music_images').remove([imageFileName]);
                    if (imageError && imageError.statusCode !== '404') { // 404 hatasını yoksay
                        console.error('Resim dosyası silinirken hata oluştu (göz ardı edilebilir):', imageError.message);
                    }
                }


                // Veritabanından sil
                const { error } = await supabaseClient
                    .from('musics')
                    .delete()
                    .eq('id', musicId);

                if (error) throw error;

                alert('Müzik başarıyla silindi!');
                await renderMusics(); // Listeyi güncelle
                if (currentPlayingIndex === -1) { // Eğer hiçbir şarkı çalmıyorsa UI'ı sıfırla
                    resetPlayerUI();
                } else if (musicId == musicData[currentPlayingIndex]?.id) { // Eğer silinen şarkı çalıyorsa
                    audioPlayer.pause();
                    audioPlayer.src = '';
                    currentPlayingIndex = -1; // Çalan şarkı yok
                    resetPlayerUI(); // UI'ı sıfırla ve hoş geldiniz ekranını göster
                } else if (musicData.length > 0 && currentPlayingIndex >= musicData.length) {
                    // Eğer silinen şarkı yüzünden index dışı kalırsa
                    currentPlayingIndex = 0; // İlk şarkıya ayarla
                    loadAndPlayMusic(currentPlayingIndex); // İlk şarkıyı yükle ve çal
                } else {
                    // Sadece UI'ı güncelle
                    updatePlayerUIState();
                }
            } catch (error) {
                console.error('Müzik silinirken hata oluştu:', error.message);
                alert('Müzik silinirken bir hata oluştu: ' + error.message);
            }
        });


        // Müzikleri Çek ve Listele (Hem Desktop hem de Delete Select için)
        const renderMusics = async () => {
            console.log("renderMusics çağrıldı...");
            try {
                const { data, error } = await supabaseClient
                    .from('musics')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (error) throw error;

                musicData = data; // Global değişkene ata
                console.log("Müzik verileri çekildi:", musicData);

                // Masaüstü Müzik Listesi
                if (musicListDesktop) {
                    musicListDesktop.innerHTML = ''; // Önceki listeyi temizle
                    if (musicData.length === 0) {
                        musicListDesktop.innerHTML = '<p class="text-center text-gray-400 col-span-full">Henüz hiç müzik eklenmemiş.</p>';
                    } else {
                        musicData.forEach((music, index) => {
                            const musicCard = `
                                <div class="bg-gray-800 rounded-lg shadow-md hover:bg-gray-700 transition-all cursor-pointer p-4 flex items-center gap-4 border border-gray-700" data-index="${index}">
                                    <img src="${music.image_url || defaultCover}" alt="${music.title}" class="w-16 h-16 rounded-md object-cover shadow-sm">
                                    <div class="flex-grow">
                                        <h4 class="text-lg font-semibold text-white truncate">${music.title}</h4>
                                        <p class="text-gray-400 text-sm truncate">${music.artist}</p>
                                    </div>
                                    <button class="play-btn text-indigo-400 hover:text-indigo-300 text-2xl" data-index="${index}">
                                        <i class="fa fa-play-circle"></i>
                                    </button>
                                </div>
                            `;
                            musicListDesktop.insertAdjacentHTML('beforeend', musicCard);
                        });
                    }
                } else {
                    console.warn("musicListDesktop bulunamadı.");
                }


                // Silme Seçimi Doldurma
                if (deleteSelect) {
                    deleteSelect.innerHTML = '<option value="" disabled selected>Silmek için seçin...</option>';
                    musicData.forEach(music => {
                        const option = document.createElement('option');
                        option.value = music.id;
                        option.textContent = `${music.title} - ${music.artist}`;
                        deleteSelect.appendChild(option);
                    });
                } else {
                    console.warn("deleteSelect bulunamadı.");
                }

                // Çalma düğmelerine event listener ekle
                document.querySelectorAll('.play-btn').forEach(button => {
                    button.addEventListener('click', (e) => {
                        e.stopPropagation(); // Kartın kendi click olayını engelle
                        const index = parseInt(e.currentTarget.dataset.index);
                        loadAndPlayMusic(index);
                    });
                });

                // Kartların kendisine tıklayarak çalma
                document.querySelectorAll('#musicListDesktop > div').forEach(card => {
                    card.addEventListener('click', (e) => {
                        const index = parseInt(e.currentTarget.dataset.index);
                        loadAndPlayMusic(index);
                    });
                });

                // Eğer welcomeScreen görünürse, player UI'ı başlangıç durumuna getir
                if (!welcomeScreen.classList.contains('hidden')) {
                    resetPlayerUI();
                } else {
                    // Welcome ekranı görünmüyorsa (yani bir şarkı çalmaya başlamışsa)
                    // ve player boşta değilse, UI'ı güncel tut.
                    updatePlayerUIState();
                }

            } catch (error) {
                console.error('Müzikler çekilirken hata oluştu:', error.message);
                musicListDesktop.innerHTML = '<p class="text-red-500 text-center p-4">Müzikler yüklenirken bir sorun oluştu.</p>';
            }
        };

        // Müzik Yükle ve Çal
        const loadAndPlayMusic = (index) => {
            if (index < 0 || index >= musicData.length) {
                console.warn("Geçersiz müzik indeksi:", index);
                return;
            }

            // Hoş geldiniz ekranını gizle, albüm kapağını göster
            welcomeScreen.classList.add('hidden');
            albumCoverContainer.classList.remove('hidden');

            currentPlayingIndex = index;
            const song = musicData[currentPlayingIndex];

            audioPlayer.src = song.audio_url;
            coverImage.src = song.image_url || defaultCover;
            footerCoverImage.src = song.image_url || defaultFooterCover;
            currentSongTitleElement.textContent = song.title;
            currentSongArtistElement.textContent = song.artist;
            playAudio();
            updatePlayerUIState();
        };

        // UI Durumunu Güncelle
        const updatePlayerUIState = () => {
            if (currentPlayingIndex === -1 || musicData.length === 0) {
                // Hiçbir şarkı seçili değilse veya müzik yoksa
                playPauseBtn.innerHTML = '<i class="fa fa-play"></i>';
                currentSongTitleElement.textContent = defaultTitle;
                currentSongArtistElement.textContent = defaultArtist;
                coverImage.src = defaultCover;
                footerCoverImage.src = defaultFooterCover;
                progressBar.value = 0;
                currentTimeElement.textContent = '0:00';
                durationElement.textContent = '0:00';
                progressBar.disabled = true;
                prevBtn.disabled = true;
                nextBtn.disabled = true;
                albumCoverContainer.classList.remove('playing'); // Durdur animasyonu
            } else {
                progressBar.disabled = false;
                prevBtn.disabled = false;
                nextBtn.disabled = false;

                // Play/Pause durumuna göre ikon ve animasyon
                if (audioPlayer.paused) {
                    playPauseBtn.innerHTML = '<i class="fa fa-play"></i>';
                    albumCoverContainer.classList.remove('playing'); // Durdur animasyonu
                } else {
                    playPauseBtn.innerHTML = '<i class="fa fa-pause"></i>';
                    albumCoverContainer.classList.add('playing'); // Başlat animasyonu
                }
            }
        };

        // Player UI'ı sıfırlayan yardımcı fonksiyon
        const resetPlayerUI = () => {
            audioPlayer.pause();
            audioPlayer.src = '';
            currentPlayingIndex = -1;
            updatePlayerUIState();
            progressBar.value = 0;
            currentTimeElement.textContent = '0:00';
            durationElement.textContent = '0:00';
            coverImage.src = defaultCover;
            footerCoverImage.src = defaultFooterCover;
            currentSongTitleElement.textContent = defaultTitle;
            currentSongArtistElement.textContent = defaultArtist;
            // Welcome ekranını tekrar göster, albüm kapağını gizle
            welcomeScreen.classList.remove('hidden');
            albumCoverContainer.classList.add('hidden');
        };

        // Ses Çalma / Duraklatma
        const playAudio = () => {
            if (audioPlayer.paused) {
                audioPlayer.play();
            } else {
                audioPlayer.pause();
            }
            updatePlayerUIState(); // Durum değişikliğini yansıt
        };

        // İleri Sarma
        const seekAudio = () => {
            audioPlayer.currentTime = progressBar.value;
        };

        // Ses Düzeyi Güncelleme
        const updateVolume = () => {
            audioPlayer.volume = parseFloat(volumeBar.value);
            updateVolumeIcon(audioPlayer.volume);
            lastVolume = audioPlayer.volume; // Son ses değerini kaydet
        };

        // Ses İkonunu Güncelle
        const updateVolumeIcon = (volume) => {
            if (volume === 0) {
                volumeIcon.className = 'fa fa-volume-off text-gray-400 text-lg';
            } else if (volume > 0 && volume <= 0.5) {
                volumeIcon.className = 'fa fa-volume-down text-gray-400 text-lg';
            } else {
                volumeIcon.className = 'fa fa-volume-up text-gray-400 text-lg';
            }
        };

        // Ses Açma/Kapatma (Mute/Unmute)
        volumeIcon.addEventListener('click', () => {
            if (audioPlayer.volume === 0) {
                audioPlayer.volume = lastVolume > 0 ? lastVolume : 0.75; // Son sesi veya varsayılanı kullan
            } else {
                audioPlayer.volume = 0;
            }
            volumeBar.value = audioPlayer.volume;
            updateVolumeIcon(audioPlayer.volume);
        });

        // Event Listener'lar
        playPauseBtn.addEventListener('click', playAudio);
        progressBar.addEventListener('input', seekAudio);
        volumeBar.addEventListener('input', updateVolume);

        audioPlayer.addEventListener('timeupdate', () => {
            const current = audioPlayer.currentTime;
            const duration = audioPlayer.duration;

            if (isNaN(duration)) { // Şarkı yüklenmediyse veya geçerli değilse
                progressBar.value = 0;
                currentTimeElement.textContent = '0:00';
                durationElement.textContent = '0:00';
            } else {
                progressBar.value = (current / duration) * progressBar.max;
                currentTimeElement.textContent = formatTime(current);
                durationElement.textContent = formatTime(duration);
            }
        });

        audioPlayer.addEventListener('loadedmetadata', () => {
            progressBar.max = audioPlayer.duration;
            durationElement.textContent = formatTime(audioPlayer.duration);
        });

        audioPlayer.addEventListener('ended', () => {
            playNext(); // Şarkı bittiğinde sonraki şarkıya geç
        });

        // Zaman Formatlama Fonksiyonu
        const formatTime = (seconds) => {
            const minutes = Math.floor(seconds / 60);
            const secs = Math.floor(seconds % 60);
            return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
        };

        // Sonraki Şarkı
        const playNext = () => {
            if (musicData.length === 0) {
                resetPlayerUI();
                return;
            }
            currentPlayingIndex = (currentPlayingIndex + 1) % musicData.length;
            loadAndPlayMusic(currentPlayingIndex);
        };

        // Önceki Şarkı
        const playPrev = () => {
            if (musicData.length === 0) {
                resetPlayerUI();
                return;
            }
            currentPlayingIndex = (currentPlayingIndex - 1 + musicData.length) % musicData.length;
            loadAndPlayMusic(currentPlayingIndex);
        };

        nextBtn.addEventListener('click', playNext);
        prevBtn.addEventListener('click', playPrev);


        // Initial Setup
        if (coverImage) coverImage.src = defaultCover;
        if (footerCoverImage) footerCoverImage.src = defaultFooterCover;
        if (currentSongArtistElement) currentSongArtistElement.textContent = defaultArtist;
        if (currentSongTitleElement) currentSongTitleElement.textContent = defaultTitle;

        if (audioPlayer && volumeBar) {
            audioPlayer.volume = parseFloat(volumeBar.value);
            updateVolumeIcon(audioPlayer.volume);
            lastVolume = audioPlayer.volume;
        }

        // Sayfa yüklendiğinde hoş geldiniz ekranını göster
        welcomeScreen.classList.remove('hidden');
        albumCoverContainer.classList.add('hidden'); // Albüm kapağını gizle

        // İlk yüklemede player UI durumunu ayarla
        updatePlayerUIState();
        await renderMusics(); // Verileri çek ve arayüzü güncelle

    } catch (error) {
        console.error("DOMContentLoaded içinde yakalanan genel hata:", error);
        alert("Uygulama başlatılırken beklenmeyen bir hata oluştu. Konsolu kontrol edin.");
        // Hata durumunda temel UI elemanlarını sıfırla veya hata mesajı göster
        if (musicListDesktop) musicListDesktop.innerHTML = '<p class="text-red-500 text-center p-4">Uygulama yüklenirken bir sorun oluştu.</p>';
        updatePlayerUIState(); // Hata olsa bile player
    }
});
