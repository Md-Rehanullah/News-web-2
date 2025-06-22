// Configuration
const NEWS_API_KEY = 'e7eb2557a7794272b4ae7722c077e945';
const NEWS_API_BASE_URL = 'https://newsapi.org/v2';

// State
let currentCategory = 'general';
let currentPage = 1;
let allArticles = [];
let isLoading = false;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setCurrentDate();
    initializeEventListeners();
    loadNews(currentCategory);
    loadTrendingNews();
    initializeScrollListener();
});

function setCurrentDate() {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('currentDate').textContent = now.toLocaleDateString('en-US', options);
}

function initializeEventListeners() {
    document.querySelectorAll('.nav-btn, .category-btn, .mobile-nav-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const category = e.target.getAttribute('data-category');
            if (category && category !== currentCategory) {
                changeCategory(category);
            }
        });
    });

    document.getElementById('mobileMenuBtn').addEventListener('click', () => {
        document.getElementById('mobileMenuOverlay').classList.add('active');
    });

    document.getElementById('closeMobileMenu').addEventListener('click', () => {
        document.getElementById('mobileMenuOverlay').classList.remove('active');
    });

    document.getElementById('searchBtn').addEventListener('click', () => {
        document.getElementById('searchOverlay').classList.add('active');
    });

    document.getElementById('closeSearch').addEventListener('click', () => {
        document.getElementById('searchOverlay').classList.remove('active');
        clearSearchResults();
    });

    document.getElementById('searchSubmitBtn').addEventListener('click', performSearch);
    document.getElementById('searchInput').addEventListener('keypress', e => {
        if (e.key === 'Enter') performSearch();
    });

    document.getElementById('contactBtn').addEventListener('click', () => {
        document.getElementById('contactOverlay').classList.add('active');
    });

    document.getElementById('closeContact').addEventListener('click', () => {
        document.getElementById('contactOverlay').classList.remove('active');
    });

    document.getElementById('contactForm').addEventListener('submit', handleContactSubmit);

    document.getElementById('loadMoreBtn').addEventListener('click', loadMoreArticles);

    document.getElementById('goToTopBtn').addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('mobile-menu-overlay') || 
            e.target.classList.contains('search-overlay') || 
            e.target.classList.contains('contact-overlay')) {
            e.target.classList.remove('active');
        }
    });
}

function initializeScrollListener() {
    window.addEventListener('scroll', () => {
        const goToTopBtn = document.getElementById('goToTopBtn');
        goToTopBtn.classList.toggle('visible', window.pageYOffset > 300);
    });
}

function changeCategory(category) {
    currentCategory = category;
    currentPage = 1;
    allArticles = [];
    updateActiveButtons(category);
    updateSectionTitle(category);
    loadNews(category);
}

function updateActiveButtons(category) {
    document.querySelectorAll('.nav-btn, .category-btn, .mobile-nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelectorAll(`[data-category="${category}"]`).forEach(btn => {
        btn.classList.add('active');
    });
}

function updateSectionTitle(category) {
    const titles = {
        general: 'Latest News',
        world: 'International News',
        sports: 'Sports News',
        technology: 'Technology News',
        business: 'Business News',
        entertainment: 'Entertainment News',
        trending: 'Trending News'
    };
    document.getElementById('sectionTitle').textContent = titles[category] || 'Latest News';
}

async function loadNews(category, page = 1) {
    if (isLoading) return;
    isLoading = true;
    showLoading();

    try {
        const url = `${NEWS_API_BASE_URL}/top-headlines?country=us${category !== 'trending' ? `&category=${category}` : ''}&pageSize=12&page=${page}&apiKey=${NEWS_API_KEY}`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.status === 'ok') {
            const newArticles = filterArticles(data.articles);
            allArticles = page === 1 ? newArticles : [...allArticles, ...newArticles];
            displayArticles();
            updateArticleCount();
            document.getElementById('loadMoreContainer').style.display = newArticles.length >= 12 ? 'block' : 'none';
        } else {
            showError(`API Error: ${data.message}`);
        }
    } catch (error) {
        showError('Could not fetch articles. Try again later.');
        console.error(error);
    } finally {
        hideLoading();
        isLoading = false;
    }
}

async function loadTrendingNews() {
    try {
        const url = `${NEWS_API_BASE_URL}/top-headlines?country=us&pageSize=5&apiKey=${NEWS_API_KEY}`;
        const response = await fetch(url);
        const data = await response.json();
        if (data.status === 'ok') {
            displayTrendingArticles(filterArticles(data.articles));
        }
    } catch (error) {
        console.error('Error loading trending news:', error);
    }
}

function filterArticles(articles) {
    return articles.filter(article =>
        article.title && article.description &&
        article.title !== '[Removed]' &&
        article.description !== '[Removed]'
    );
}

function displayArticles() {
    if (!allArticles.length) return;
    displayFeaturedArticle(allArticles[0]);
    displayNewsGrid(allArticles.slice(1));
}

function displayFeaturedArticle(article) {
    const featured = document.getElementById('featuredArticle');
    const date = new Date(article.publishedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

    featured.innerHTML = `
        <div class="featured-grid">
            <div>
                <img src="${article.urlToImage || getPlaceholderImage()}" onerror="this.src='${getPlaceholderImage()}'" alt="${article.title}" class="featured-image">
            </div>
            <div class="featured-content">
                <div class="featured-tag">FEATURED STORY</div>
                <h2 class="featured-title">${article.title}</h2>
                <p class="featured-description">${article.description}</p>
                <div class="featured-meta">
                    <div class="article-meta">
                        <span>${article.source.name}</span> • <span>${date}</span>
                    </div>
                    <button class="btn-primary" onclick="readMore('${article.url}')">Read More</button>
                </div>
            </div>
        </div>
    `;
    featured.style.display = 'block';
}

function displayNewsGrid(articles) {
    const newsGrid = document.getElementById('newsGrid');
    newsGrid.innerHTML = articles.map(article => {
        const date = new Date(article.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        return `
            <div class="news-card">
                <div class="news-image-container">
                    <img src="${article.urlToImage || getPlaceholderImage()}" onerror="this.src='${getPlaceholderImage()}'" alt="${article.title}" class="news-image">
                    <div class="news-source-tag">${article.source.name}</div>
                </div>
                <div class="news-content">
                    <h3 class="news-title">${article.title}</h3>
                    <p class="news-description">${article.description}</p>
                    <div class="news-footer">
                        <span class="news-date">${date}</span>
                        <button class="read-more-btn" onclick="readMore('${article.url}')">Read More →</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function displayTrendingArticles(articles) {
    const trending = document.getElementById('trendingList');
    trending.innerHTML = articles.map((article, i) => `
        <div class="trending-item">
            <div class="trending-number">${i + 1}</div>
            <div class="trending-content">
                <h4 class="trending-title">${article.title}</h4>
                <div class="trending-footer">
                    <span class="trending-source">${article.source.name}</span>
                    <button class="read-more-btn" onclick="readMore('${article.url}')">Read →</button>
                </div>
            </div>
        </div>
    `).join('');
}

function loadMoreArticles() {
    currentPage++;
    loadNews(currentCategory, currentPage);
}

async function performSearch() {
    const query = document.getElementById('searchInput').value.trim();
    const resultsBox = document.getElementById('searchResults');

    if (!query) return;

    resultsBox.innerHTML = `<div class="loading"><div class="spinner"></div><p>Searching...</p></div>`;

    try {
        const url = `${NEWS_API_BASE_URL}/everything?q=${encodeURIComponent(query)}&pageSize=10&sortBy=relevancy&apiKey=${NEWS_API_KEY}`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.status === 'ok') {
            const results = filterArticles(data.articles);
            if (results.length === 0) {
                resultsBox.innerHTML = `<div class="text-center" style="padding: 2rem;">No results found for "${query}"</div>`;
            } else {
                resultsBox.innerHTML = results.map(article => `
                    <div class="search-result-item">
                        <h4 class="search-result-title" onclick="readMore('${article.url}')">${article.title}</h4>
                        <p class="search-result-description">${article.description}</p>
                        <div class="search-result-footer">
                            <span class="search-result-source">${article.source.name}</span>
                            <button class="read-more-btn" onclick="readMore('${article.url}')">Read More →</button>
                        </div>
                    </div>
                `).join('');
            }
        } else {
            resultsBox.innerHTML = `<div class="error">Search failed: ${data.message}</div>`;
        }
    } catch (error) {
        console.error(error);
        resultsBox.innerHTML = `<div class="error">Search failed. Please try again.</div>`;
    }
}

function clearSearchResults() {
    document.getElementById('searchInput').value = '';
    document.getElementById('searchResults').innerHTML = '';
}

function handleContactSubmit(e) {
    e.preventDefault();
    alert('Thank you for your message! We\'ll get back to you soon.');
    e.target.reset();
    document.getElementById('contactOverlay').classList.remove('active');
}

function readMore(url) {
    window.open(url, '_blank');
}

function showLoading() {
    document.getElementById('loading').style.display = 'block';
    document.getElementById('error').style.display = 'none';
    document.getElementById('featuredArticle').style.display = 'none';
    document.getElementById('newsGrid').innerHTML = '';
}

function hideLoading() {
    document.getElementById('loading').style.display = 'none';
}

function showError(message) {
    document.getElementById('loading').style.display = 'none';
    const errorBox = document.getElementById('error');
    errorBox.querySelector('p').textContent = message;
    errorBox.style.display = 'block';
    document.getElementById('featuredArticle').style.display = 'none';
    document.getElementById('newsGrid').innerHTML = '';
}

function updateArticleCount() {
    document.getElementById('articleCount').textContent = allArticles.length;
}

function getPlaceholderImage() {
    return 'https://via.placeholder.com/800x600?text=Image+Not+Available';
}
