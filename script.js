document.addEventListener('DOMContentLoaded', () => {
    const API_ENABLED = false;
    const PLATFORM_TAGS = {
        'nowtv': 'NOW TV', 'showtv': 'Show TV', 'kanald': 'Kanal D', 'atv': 'ATV', 'trt': 'TRT',
        'star': 'Star TV', 'tv8': 'TV8', 'other': 'Diğer'
    };
    const VIDEOS_PER_PAGE = 12;
    const MAX_SUGGESTIONS = 5;

    class DiziTubeApp {
        constructor() {
            this.videos = [];
            this.filteredVideos = [];
            this.visibleVideoCount = VIDEOS_PER_PAGE;
            this.isSearching = false;
            this.init();
        }

        init() {
            this.loadVideosFromStorage();
            this.setupEventListeners();
            this.setTheme(localStorage.getItem('theme') || 'dark');

            if (document.getElementById('videoGrid')) {
                this.initializeMainPage();
            } else if (document.getElementById('video-player-container')) {
                this.initializeVideoPage();
            }
        }

        slugify(text) {
            const a = 'àáâäæãåāăąçćčđďèéêëēėęěğǵḧîïíīįìłḿñńǹňôöòóœøōõőṕŕřßśšşșťțûüùúūǘůűųẃẍÿýžźż·/_,:;'
            const b = 'aaaaaaaaaacccddeeeeeeeegghiiiiiilmnnnnoooooooooprrsssssttuuuuuuuuuwxyyzzz------'
            const p = new RegExp(a.split('').join('|'), 'g')

            return text.toString().toLowerCase()
                .replace(/\s+/g, '-') // Boşlukları - ile değiştir
                .replace(p, c => b.charAt(a.indexOf(c))) // Özel karakterleri değiştir
                .replace(/&/g, '-and-') // & karakterini 'and' ile değiştir
                .replace(/[^\w\-]+/g, '') // Kelime olmayan karakterleri kaldır
                .replace(/\-\-+/g, '-') // Birden çok -'yi tek - ile değiştir
                .replace(/^-+/, '') // Başlangıçtaki -'leri kaldır
                .replace(/-+$/, '') // Sondaki -'leri kaldır
        }

        initializeMainPage() {
            this.setupInfiniteScroll();
            const params = new URLSearchParams(window.location.search);
            const searchTerm = params.get('search');
            const searchInput = document.getElementById('searchInput');

            if (searchTerm && searchInput) {
                searchInput.value = searchTerm;
                this.searchVideos(searchTerm);
            } else {
                this.renderAll();
            }
        }

        initializeVideoPage() {
            const playerContainer = document.getElementById('video-player-container');
            const noVideoFound = document.getElementById('noVideoFound');
            const videoTitleEl = document.getElementById('video-title');
            const videoChannelEl = document.getElementById('video-channel');

            const params = new URLSearchParams(window.location.search);
            const videoSlug = params.get('slug');

            if (!videoSlug) {
                if (noVideoFound) noVideoFound.style.display = 'block';
                return;
            }

            const video = this.videos.find(v => v.slug === videoSlug);

            if (video && video.facebookEmbed) {
                document.title = video.title + " - Fragman.tv";
                if(videoTitleEl) videoTitleEl.textContent = video.title;
                if(videoChannelEl) videoChannelEl.textContent = video.channelTitle;
                if(playerContainer) playerContainer.innerHTML = video.facebookEmbed;

                this.updateMetaTags(video);
                this.setupVideoActions(video);
                this.setupCommentSection(video.id); // Yorumlar için hala ID kullanılıyor
                this.renderRecommendedVideos(video.id);

            } else {
                if (noVideoFound) noVideoFound.style.display = 'block';
            }
        }

        updateMetaTags(video) {
            const url = `${window.location.origin}${window.location.pathname}?slug=${video.slug}`;
            document.getElementById('ogTitle')?.setAttribute('content', video.title);
            document.getElementById('ogDescription')?.setAttribute('content', `${video.channelTitle} - Fragman.tv`);
            document.getElementById('ogImage')?.setAttribute('content', video.thumbnail);
            document.getElementById('ogUrl')?.setAttribute('content', url);
        }

        setupVideoActions(video) {
            const likeBtn = document.getElementById('likeBtn');
            const dislikeBtn = document.getElementById('dislikeBtn');
            const shareBtn = document.getElementById('shareBtn');
            const likeCountEl = document.getElementById('likeCount');
            const dislikeCountEl = document.getElementById('dislikeCount');

            let likeCount = video.likes || 0;
            let dislikeCount = video.dislikes || 0;
            if (likeCountEl) likeCountEl.textContent = this.formatNumber(likeCount);
            if (dislikeCountEl) dislikeCountEl.textContent = this.formatNumber(dislikeCount);

            likeBtn?.addEventListener('click', () => {
                video.likes = (video.likes || 0) + 1;
                if (likeCountEl) likeCountEl.textContent = this.formatNumber(video.likes);
                this.saveVideosToStorage();
            });

            dislikeBtn?.addEventListener('click', () => {
                video.dislikes = (video.dislikes || 0) + 1;
                if (dislikeCountEl) dislikeCountEl.textContent = this.formatNumber(video.dislikes);
                this.saveVideosToStorage();
            });

            shareBtn?.addEventListener('click', () => {
                const url = encodeURIComponent(window.location.href);
                const title = encodeURIComponent(video.title);

                const shareFacebook = document.getElementById('shareFacebook');
                if (shareFacebook) shareFacebook.href = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
                const shareTwitter = document.getElementById('shareTwitter');
                if (shareTwitter) shareTwitter.href = `https://twitter.com/intent/tweet?url=${url}&text=${title}`;
                const shareWhatsApp = document.getElementById('shareWhatsApp');
                if (shareWhatsApp) shareWhatsApp.href = `https://api.whatsapp.com/send?text=${title}%20${url}`;

                const videoUrlInput = document.getElementById('videoUrlInput');
                if (videoUrlInput) {
                    videoUrlInput.value = window.location.href;
                    videoUrlInput.onclick = () => {
                        videoUrlInput.select();
                        document.execCommand('copy');
                        alert('Link kopyalandı!');
                    };
                }

                this.showModal('shareModal');
            });
        }

        setupCommentSection(videoId) {
            const commentForm = document.getElementById('commentForm');
            this.loadComments(videoId);

            commentForm?.addEventListener('submit', (e) => {
                e.preventDefault();
                const nameInput = document.getElementById('commenterName');
                const textInput = document.getElementById('commentText');

                const name = nameInput.value.trim();
                const text = textInput.value.trim();

                if (name && text) {
                    this.saveComment(videoId, name, text);
                    this.loadComments(videoId);
                    nameInput.value = '';
                    textInput.value = '';
                }
            });
        }

        loadComments(videoId) {
            const commentsListEl = document.getElementById('commentsList');
            const commentCountEl = document.getElementById('commentCount');
            if (!commentsListEl || !commentCountEl) return;

            const allComments = JSON.parse(localStorage.getItem('diziTubeComments')) || {};
            const videoComments = allComments[videoId] || [];

            commentCountEl.textContent = videoComments.length;
            commentsListEl.innerHTML = '';

            if (videoComments.length === 0) {
                commentsListEl.innerHTML = '<p style="color: var(--text-secondary);">Henüz yorum yapılmamış. İlk yorumu siz yapın!</p>';
                return;
            }

            videoComments.sort((a,b) => new Date(b.date) - new Date(a.date));

            videoComments.forEach(comment => {
                const commentEl = document.createElement('div');
                commentEl.className = 'comment-item';
                commentEl.innerHTML = `
                    <div class="comment-avatar"><i class="fas fa-user"></i></div>
                    <div class="comment-body">
                        <div>
                            <span class="comment-author">${comment.name}</span>
                            <span class="comment-date">${this.getTimeAgo(new Date(comment.date))}</span>
                        </div>
                        <p class="comment-text">${comment.text}</p>
                    </div>
                `;
                commentsListEl.appendChild(commentEl);
            });
        }

        saveComment(videoId, name, text) {
            const allComments = JSON.parse(localStorage.getItem('diziTubeComments')) || {};
            if (!allComments[videoId]) {
                allComments[videoId] = [];
            }
            const newComment = {
                name: name,
                text: text,
                date: new Date().toISOString()
            };
            allComments[videoId].push(newComment);
            localStorage.setItem('diziTubeComments', JSON.stringify(allComments));
        }

        renderRecommendedVideos(currentVideoId) {
            const recommendedGrid = document.getElementById('recommendedGrid');
            if (!recommendedGrid) return;
            let otherVideos = this.videos.filter(v => v.id !== currentVideoId);
            for (let i = otherVideos.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [otherVideos[i], otherVideos[j]] = [otherVideos[j], otherVideos[i]];
            }
            const recommended = otherVideos.slice(0, 6);
            if (recommended.length > 0) {
                recommendedGrid.innerHTML = recommended.map(v => this.createVideoCard(v)).join('');
            }
        }

        setupEventListeners() {
            document.getElementById('menuBtn')?.addEventListener('click', () => document.body.classList.toggle('sidebar-collapsed'));
            document.getElementById('themeToggle')?.addEventListener('click', () => this.toggleTheme());
            document.getElementById('adminBtn')?.addEventListener('click', () => this.showModal('loginModal'));
            document.getElementById('statsBtn')?.addEventListener('click', () => this.showStatsModal());
            document.getElementById('ratingsLink')?.addEventListener('click', e => { e.preventDefault(); this.showModal('ratingsModal'); });

            document.querySelectorAll('.modal .close').forEach(btn => {
                btn.addEventListener('click', e => this.hideModal(e.target.closest('.modal').id));
            });

            document.getElementById('loginForm')?.addEventListener('submit', e => { e.preventDefault(); this.handleLogin(); });
            document.getElementById('addVideoForm')?.addEventListener('submit', e => { e.preventDefault(); this.handleFormSubmit(); });
            document.getElementById('youtubeForThumbnail')?.addEventListener('input', e => this.autoFillThumbnail(e.target.value));
            document.getElementById('generateSitemapBtn')?.addEventListener('click', () => this.generateSitemap());

            document.querySelectorAll('.tab-btn').forEach(btn => {
                btn.addEventListener('click', e => this.switchTab(e.target.dataset.tab));
            });

            document.querySelectorAll('.nav-link').forEach(link => {
                link.addEventListener('click', e => {
                    e.preventDefault();
                    const filter = e.currentTarget.dataset.filter;
                    if (document.getElementById('videoGrid')) {
                        this.setActiveFilter(filter);
                    } else {
                        window.location.href = `index.html#${filter}`;
                    }
                });
            });

            const searchInput = document.getElementById('searchInput');
            const searchBtn = document.getElementById('searchBtn');
            const searchResultsDropdown = document.getElementById('searchResultsDropdown');

            if (searchInput && searchBtn && searchResultsDropdown) {
                const performSearch = () => {
                    const searchTerm = searchInput.value.trim();
                    if (document.getElementById('videoGrid')) {
                        this.searchVideos(searchTerm);
                    } else {
                        window.location.href = `index.html?search=${encodeURIComponent(searchTerm)}`;
                    }
                };
                searchBtn.addEventListener('click', performSearch);
                searchInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        performSearch();
                    }
                });
                
                searchInput.addEventListener('input', () => this.handleSearchSuggestions(searchInput.value));
                
                document.addEventListener('click', (e) => {
                    if (!searchInput.contains(e.target) && !searchResultsDropdown.contains(e.target)) {
                        searchResultsDropdown.style.display = 'none';
                    }
                });
            }
        }

        handleSearchSuggestions(searchTerm) {
            const searchResultsDropdown = document.getElementById('searchResultsDropdown');
            if (!searchResultsDropdown) return;
        
            const trimmedTerm = searchTerm.trim().toLowerCase();
            
            if (trimmedTerm.length > 0) {
                const results = this.videos.filter(v => 
                    v.title.toLowerCase().includes(trimmedTerm) ||
                    v.channelTitle.toLowerCase().includes(trimmedTerm)
                ).slice(0, MAX_SUGGESTIONS);
        
                if (results.length > 0) {
                    searchResultsDropdown.innerHTML = results.map(video => `
                        <a href="video.html?slug=${video.slug}">
                            <img src="${video.thumbnail}" alt="${video.title}">
                            <div class="suggestion-text">
                                <h4>${video.title}</h4>
                                <p>${video.channelTitle}</p>
                            </div>
                        </a>
                    `).join('');
                    searchResultsDropdown.style.display = 'block';
                } else {
                    searchResultsDropdown.innerHTML = `<div class="no-results-suggestion">Sonuç bulunamadı.</div>`;
                    searchResultsDropdown.style.display = 'block';
                }
            } else {
                searchResultsDropdown.innerHTML = '';
                searchResultsDropdown.style.display = 'none';
            }
        }

        loadVideosFromStorage() {
            try {
                this.videos = JSON.parse(localStorage.getItem('diziTubeVideos')) || this.getDemoVideos();
            } catch (error) {
                console.error("localStorage'dan video verisi okunurken hata:", error);
                this.videos = this.getDemoVideos();
            }
            this.sortVideos('date');
        }

        saveVideosToStorage() {
            localStorage.setItem('diziTubeVideos', JSON.stringify(this.videos));
        }

        renderAll() {
            this.filteredVideos = [...this.videos];
            this.visibleVideoCount = VIDEOS_PER_PAGE;
            this.renderVideos();
        }

        renderVideos() {
            const grid = document.getElementById('videoGrid');
            const noResults = document.getElementById('noResults');
            const loadingIndicator = document.getElementById('loadingIndicator');

            if(!grid || !noResults || !loadingIndicator) return;

            if (this.filteredVideos.length === 0) {
                grid.innerHTML = '';
                noResults.style.display = 'block';
                loadingIndicator.style.display = 'none';
                return;
            }

            noResults.style.display = 'none';
            const videosToRender = this.filteredVideos.slice(0, this.visibleVideoCount);
            grid.innerHTML = videosToRender.map(v => this.createVideoCard(v)).join('');

            loadingIndicator.style.display = (this.visibleVideoCount < this.filteredVideos.length) ? 'block' : 'none';

            grid.querySelectorAll('.like-btn').forEach(btn => {
                btn.addEventListener('click', e => {
                    e.preventDefault();
                    e.stopPropagation();
                    const videoId = btn.closest('.video-card').dataset.videoId;
                    this.toggleLike(videoId);
                });
            });
        }

        setupInfiniteScroll() {
            const loadingIndicator = document.getElementById('loadingIndicator');
            if(!loadingIndicator) return;

            this.observer = new IntersectionObserver((entries) => {
                if (entries[0].isIntersecting && this.visibleVideoCount < this.filteredVideos.length && !this.isSearching) {
                    this.loadMoreVideos();
                }
            }, { threshold: 0.1 });
            this.observer.observe(loadingIndicator);
        }

        loadMoreVideos() {
            this.visibleVideoCount += VIDEOS_PER_PAGE;
            this.renderVideos();
        }

        createVideoCard(video) {
            const views = this.formatNumber(video.views || 0);
            const likes = this.formatNumber(video.likes || 0);
            const timeAgo = this.getTimeAgo(new Date(video.publishedAt));

            return `
                <a href="video.html?slug=${video.slug}" class="video-card" data-video-id="${video.id}">
                    <div class="video-thumbnail">
                        <img src="${video.thumbnail}" alt="${video.title}" loading="lazy">
                    </div>
                    <div class="video-details">
                        <div class="channel-avatar">
                            <i class="fas fa-tv"></i>
                        </div>
                        <div class="video-meta">
                            <h3>${video.title}</h3>
                            <p>${video.channelTitle}</p>
                            <p>${views} görüntüleme • ${timeAgo}</p>
                            <div class="video-stats-likes">
                                <button class="like-btn" title="Beğen"><i class="fas fa-thumbs-up"></i></button>
                                <span>${likes}</span>
                            </div>
                        </div>
                    </div>
                </a>
            `;
        }

        toggleLike(videoId) {
            const video = this.videos.find(v => v.id === videoId);
            if (video) {
                video.likes = (video.likes || 0) + 1;
                this.saveVideosToStorage();
                this.renderVideos();
            }
        }

        setActiveFilter(filter) {
            this.visibleVideoCount = VIDEOS_PER_PAGE;
            document.querySelectorAll('.nav-link.active').forEach(l => l.classList.remove('active'));
            const activeLink = document.querySelector(`.nav-link[data-filter="${filter}"]`);
            if(activeLink) activeLink.classList.add('active');

            this.filteredVideos = (filter === 'all') ? [...this.videos] : this.videos.filter(v => v.platform === filter);
            this.isSearching = false;
            this.renderVideos();
        }

        searchVideos(term) {
            this.isSearching = true;
            this.visibleVideoCount = VIDEOS_PER_PAGE;
            const lowerTerm = term.toLowerCase().trim();
            if (!lowerTerm) {
                this.isSearching = false;
                this.filteredVideos = [...this.videos];
            } else {
                this.filteredVideos = this.videos.filter(v =>
                    v.title.toLowerCase().includes(lowerTerm) ||
                    v.channelTitle.toLowerCase().includes(lowerTerm)
                );
            }
            this.renderVideos();
        }

        sortVideos(sortBy) {
            this.videos.sort((a, b) => {
                if (sortBy === 'date') return new Date(b.publishedAt) - new Date(a.publishedAt);
                return 0;
            });
        }

        showStatsModal() {
            const stats = this.calculateStats();
            const body = document.getElementById('statsBody');
            if(!body) return;

            const mostViewed = stats.mostViewedVideo;
            const mostLiked = stats.mostLikedVideo;

            body.innerHTML = `
                <div class="stats-grid">
                    <div class="stat-card"><div class="stat-card-value">${stats.totalVideos}</div><div class="stat-card-label">Toplam Video</div></div>
                    <div class="stat-card"><div class="stat-card-value">${this.formatNumber(stats.totalViews)}</div><div class="stat-card-label">Toplam İzlenme</div></div>
                    <div class="stat-card"><div class="stat-card-value">${this.formatNumber(stats.totalLikes)}</div><div class="stat-card-label">Toplam Beğeni</div></div>
                    <div class="stat-card"><div class="stat-card-value">${this.formatNumber(stats.avgViews)}</div><div class="stat-card-label">Ort. İzlenme</div></div>
                </div>
                <h3 class="stats-section-title">En İyiler</h3>
                <div class="top-videos-list">
                    ${mostViewed ? this.createTopVideoHTML('En Çok İzlenen', mostViewed, 'görüntüleme', mostViewed.views) : ''}
                    ${mostLiked ? this.createTopVideoHTML('En Çok Beğenilen', mostLiked, 'beğeni', mostLiked.likes) : ''}
                </div>
                <h3 class="stats-section-title">Kanallara Göre Dağılım</h3>
                <div class="channel-stats-list">
                    ${Object.entries(stats.channelCounts).sort(([,a],[,b]) => b-a).map(([platform, count]) => `
                        <div class="channel-item">
                            <span>${PLATFORM_TAGS[platform] || 'Bilinmeyen'}</span>
                            <strong>${count} Video</strong>
                        </div>
                    `).join('')}
                </div>
            `;
            this.showModal('statsModal');
        }

        calculateStats() {
            if (this.videos.length === 0) return { totalVideos: 0, totalViews: 0, totalLikes: 0, avgViews: 0, channelCounts: {}, mostViewedVideo: null, mostLikedVideo: null };
            let totalViews = 0, totalLikes = 0;
            let mostViewedVideo = this.videos[0], mostLikedVideo = this.videos[0];
            const channelCounts = {};
            for (const video of this.videos) {
                totalViews += video.views || 0;
                totalLikes += video.likes || 0;
                if ((video.views || 0) > (mostViewedVideo.views || 0)) mostViewedVideo = video;
                if ((video.likes || 0) > (mostLikedVideo.likes || 0)) mostLikedVideo = video;
                channelCounts[video.platform] = (channelCounts[video.platform] || 0) + 1;
            }
            return { totalVideos: this.videos.length, totalViews, totalLikes, avgViews: Math.round(totalViews / this.videos.length), channelCounts, mostViewedVideo, mostLikedVideo };
        }

        createTopVideoHTML(category, video, statName, statValue) {
            return `<div class="video-item"><img src="${video.thumbnail}" alt="${video.title}"><div><h4>${category}: ${video.title}</h4><p>${video.channelTitle}</p><p><strong>${this.formatNumber(statValue)} ${statName}</strong></p></div></div>`;
        }

        handleLogin() {
            const username = document.getElementById('username')?.value;
            const password = document.getElementById('password')?.value;
            if (username === 'gencer' && password === '12345') {
                this.hideModal('loginModal'); this.showModal('adminModal'); this.renderAdminList();
            } else { alert('Hatalı kullanıcı adı veya şifre'); }
        }

        switchTab(tabName) {
            document.querySelector('.admin-tabs .active')?.classList.remove('active');
            document.querySelector(`.tab-btn[data-tab="${tabName}"]`)?.classList.add('active');
            document.querySelectorAll('.tab-content.active').forEach(tc => tc.classList.remove('active'));
            document.getElementById(`${tabName}Tab`)?.classList.add('active');
        }

        renderAdminList() {
            const list = document.getElementById('adminVideoList');
            if(!list) return;
            list.innerHTML = this.videos.map(v => `
                <div class="admin-video-item" style="display:flex; justify-content:space-between; align-items:center; padding:8px; border-bottom:1px solid var(--border-color);">
                    <span>${v.title}</span>
                    <div>
                        <button class="header-btn" onclick="app.editVideo('${v.id}')" title="Düzenle"><i class="fas fa-edit"></i></button>
                        <button class="header-btn" onclick="app.deleteVideo('${v.id}')" title="Sil"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
            `).join('');
        }

        handleFormSubmit() {
            const form = document.getElementById('addVideoForm');
            if(!form) return;
            const videoId = document.getElementById('videoIdToUpdate').value;
            if (videoId) this.updateVideo(videoId, new FormData(form));
            else this.addVideo(new FormData(form));
            form.reset();
            document.getElementById('videoIdToUpdate').value = '';
        }

        addVideo(formData) {
            const newVideo = this.formDataToObject(formData, 'manual_' + Date.now());
            newVideo.publishedAt = new Date().toISOString();
            this.videos.unshift(newVideo);
            this.saveVideosToStorage();
            this.renderAll();
            this.renderAdminList();
            this.switchTab('list');
        }

        editVideo(videoId) {
            const video = this.videos.find(v => v.id === videoId);
            if (!video) return;
            this.switchTab('add');
            document.getElementById('videoIdToUpdate').value = video.id;
            document.getElementById('videoTitle').value = video.title;
            document.getElementById('facebookEmbed').value = video.facebookEmbed;
            document.getElementById('videoThumbnail').value = video.thumbnail;
            document.getElementById('videoChannel').value = video.channelTitle;
            document.getElementById('videoPlatform').value = video.platform;
            document.getElementById('videoViews').value = video.views;
            document.getElementById('videoLikes').value = video.likes;
        }

        updateVideo(videoId, formData) {
            const index = this.videos.findIndex(v => v.id === videoId);
            if (index === -1) return;
            const updatedVideo = this.formDataToObject(formData, videoId);
            this.videos[index] = { ...this.videos[index], ...updatedVideo };
            this.saveVideosToStorage();
            this.renderAll();
            this.renderAdminList();
            this.switchTab('list');
        }

        deleteVideo(videoId) {
            if (confirm('Bu videoyu silmek istediğinizden emin misiniz?')) {
                this.videos = this.videos.filter(v => v.id !== videoId);
                this.saveVideosToStorage();
                this.renderAll();
                this.renderAdminList();
            }
        }
        
        generateSitemap() {
            const baseUrl = window.location.origin;
            let sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>\n`;
            sitemapContent += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
            // Ana sayfa
            sitemapContent += `  <url>\n    <loc>${baseUrl}/</loc>\n    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n  </url>\n`;
            // Videolar
            this.videos.forEach(video => {
                // video.html yolunu dinamik olarak al
                const videoPagePath = window.location.pathname.replace('index.html', 'video.html');
                const videoUrl = `${baseUrl}${videoPagePath}?slug=${video.slug}`;
                sitemapContent += `  <url>\n`;
                sitemapContent += `    <loc>${this.encodeXml(videoUrl)}</loc>\n`;
                sitemapContent += `    <changefreq>monthly</changefreq>\n`;
                sitemapContent += `    <priority>0.8</priority>\n`;
                sitemapContent += `  </url>\n`;
            });
            sitemapContent += `</urlset>`;

            const sitemapTextarea = document.getElementById('sitemapContent');
            sitemapTextarea.value = sitemapContent;
            sitemapTextarea.style.display = 'block';
            alert('Sitemap içeriği oluşturuldu. Şimdi metni kopyalayıp sitemap.xml dosyanıza yapıştırabilirsiniz.');
        }

        encodeXml(url) {
            return url.replace(/&/g, '&amp;')
                      .replace(/</g, '&lt;')
                      .replace(/>/g, '&gt;')
                      .replace(/"/g, '&quot;')
                      .replace(/'/g, '&apos;');
        }

        showModal(modalId) {
            const modal = document.getElementById(modalId);
            if(modal) modal.style.display = 'block';
        }
        hideModal(modalId) {
            const modal = document.getElementById(modalId);
            if(modal) modal.style.display = 'none';
        }

        formDataToObject(formData, id) {
            const title = formData.get('title');
            return {
                id: id,
                title: title,
                slug: this.slugify(title), // Başlıktan slug oluştur
                facebookEmbed: formData.get('facebookEmbed'),
                thumbnail: formData.get('thumbnail'),
                channelTitle: formData.get('channel'),
                platform: formData.get('platform'),
                views: parseInt(formData.get('views')) || 0,
                likes: parseInt(formData.get('likes')) || 0,
            };
        }

        autoFillThumbnail(url) {
            const thumbnailInput = document.getElementById('videoThumbnail');
            if(!thumbnailInput) return;
            const idMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
            if (idMatch && idMatch[1]) {
                thumbnailInput.value = `https://i3.ytimg.com/vi/${idMatch[1]}/maxresdefault.jpg`;
            }
        }

        toggleTheme() {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            this.setTheme(newTheme);
        }

        setTheme(theme) {
            document.documentElement.setAttribute('data-theme', theme);
            localStorage.setItem('theme', theme);
            const themeIcon = document.querySelector('#themeToggle i');
            if(themeIcon) themeIcon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        }

        formatNumber(num) {
            if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
            if (num >= 1000) return (num / 1000).toFixed(0) + ' B';
            return num;
        }

        getTimeAgo(date) {
            const seconds = Math.floor((new Date() - date) / 1000);
            let interval = seconds / 31536000; if (interval > 1) return Math.floor(interval) + " yıl önce";
            interval = seconds / 2592000; if (interval > 1) return Math.floor(interval) + " ay önce";
            interval = seconds / 86400; if (interval > 1) return Math.floor(interval) + " gün önce";
            interval = seconds / 3600; if (interval > 1) return Math.floor(interval) + " saat önce";
            interval = seconds / 60; if (interval > 1) return Math.floor(interval) + " dakika önce";
            return "az önce";
        }

        getDemoVideos() {
            const now = new Date();
            const videos = [];
            for(let i=1; i<=20; i++) {
                const title = `Örnek Video ${i}`;
                videos.push({
                    id: `demo_${i}`,
                    title: title,
                    slug: this.slugify(title),
                    facebookEmbed: `<iframe src="https://www.facebook.com/plugins/video.php?height=314&href=https%3A%2F%2Fwww.facebook.com%2Fkanald%2Fvideos%2F1011116490393652%2F&show_text=false&t=0" style="border:none;overflow:hidden" scrolling="no" frameborder="0" allowfullscreen="true" allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share" allowFullScreen="true"></iframe>`,
                    thumbnail: `https://picsum.photos/480/270?random=${i}`,
                    channelTitle: `Demo Kanal ${i % 3 + 1}`,
                    platform: ['kanald', 'atv', 'trt', 'star'][i % 4],
                    views: Math.floor(Math.random() * 1000000),
                    likes: Math.floor(Math.random() * 50000),
                    publishedAt: new Date(new Date(now).setDate(now.getDate() - i)).toISOString()
                });
            }
            return videos;
        }
    }

    window.app = new DiziTubeApp();
});