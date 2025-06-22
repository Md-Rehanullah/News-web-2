// Configuration
const NEWS_API_KEY = 'pub_479521869e790a727903df673ac804ca5f7dc';
const NEWS_API_BASE_URL = 'https://newsdata.io/api/1/news';

// State
let currentCategory = 'top';
let currentPage = 1;
let allArticles = [];
let isLoading = false;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setCurrentDate();
    initializeEventListeners();
    loadNews(currentCategory);
    loadTrendingNews();
});

// Set current date
function setCurrentDate() {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('currentDate').textContent = now.toLocaleDateString('en-US', options);
}

// Event listeners
function initializeEventListeners() {
    document.querySelectorAll('[data-category]').forEach(btn => {
        btn.addEventListener('click', () => {
            const category = btn.getAttribute('data-category');
            changeCategory(category);
        });
    });

    document.getElementById('loadMoreBtn').addEventListener('click', () => {
        currentPage++;
        loadNews(currentCategory, currentPage);
    });

    document.getElementById('searchSubmitBtn').addEventListener('click', performSearch);
    document.getElementById('searchInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') performSearch();
    });

    document.getElementById('contactForm').addEventListener('submit', e => {
        e.preventDefault();
        alert('Thank you! Your message has been received.');
        e.target.reset();
        document.getElementById('contactOverlay').classList.remove('active');
    });
}

// Change category
function changeCategory(category) {
    if (category === currentCategory) return;
    currentCategory = category;
    currentPage = 1;
    allArticles = [];
    updateSectionTitle(category);
    updateActiveButtons(category);
    loadNews(category);
}

// Update UI
function updateSectionTitle(category) {
    const titles = {
        top: 'Top Headlines',
        sports: 'Sports News',
        business: 'Business News',
        entertainment: 'Entertainment News',
        technology: 'Technology News',
        world: 'World News'
    };
    document.getElementById('sectionTitle').textContent = titles[category] || 'Latest News';
}

function updateActiveButtons(category) {
    document.querySelectorAll('[data-category]').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelectorAll(`[data-category="${category}"]`).forEach(btn => {
        btn.classList.add('active');
    });
}

// Load News
async function loadNews(category, page = 1) {
    if (isLoading) return;
    isLoading = true;
    showLoading();

    try {
        const url = `${NEWS_API_BASE_URL}?apikey=${NEWS_API_KEY}&category=${category}&language=en&page=${page}`;
        const response = await fetch(url);
        const data = await response.json();

        if (!data.results || data.results.length === 0) {
            showError('No articles found.');
            return;
        }

        const newArticles = data.results.filter(a => a.title && a.link);
        allArticles = [...allArticles, ...newArticles];
        displayArticles();
        updateArticleCount();

        document.getElementById('loadMoreContainer').style.display =
            newArticles.length >= 10 ? 'block' : 'none';
    } catch (error) {
        showError('API Error: ' + (error.message || 'Unknown error'));
    } finally {
        hideLoading();
        isLoading = false;
    }
}

// Load Trending
async function loadTrendingNews() {
    try {
        const url = `${NEWS_API_BASE_URL}?apikey=${NEWS_API_KEY}&language=en&country=us&category=top&page=1`;
        const response = await fetch(url);
        const data = await response.json();

        const topArticles = (data.results || []).slice(0, 5);
        displayTrendingArticles(topArticles);
    } catch (err) {
        console.error('Trending news failed.', err);
    }
}

// Display Articles
function displayArticles() {
    const [featured, ...rest] = allArticles;
    if (featured) displayFeaturedArticle(featured);
    displayNewsGrid(rest);
}

function displayFeaturedArticle(article) {
    const featuredContainer = document.getElementById('featuredArticle');
    featuredContainer.innerHTML = `
        <div class="featured-grid">
            <div>
                <img src="${article.image_url || getPlaceholderImage()}" class="featured-image" onerror="this.src='${getPlaceholderImage()}'">
            </div>
            <div class="featured-content">
                <div class="featured-tag">FEATURED STORY</div>
                <h2 class="featured-title">${article.title}</h2>
                <p class="featured-description">${article.description || 'No description available.'}</p>
                <div class="featured-meta">
                    <div class="article-meta">
                        <span>${article.source_id}</span> • <span>${new Date(article.pubDate).toLocaleDateString()}</span>
                    </div>
                    <button class="btn-primary" onclick="readMore('${article.link}')">Read More</button>
                </div>
            </div>
        </div>
    `;
    featuredContainer.style.display = 'block';
}

function displayNewsGrid(articles) {
    const grid = document.getElementById('newsGrid');
    grid.innerHTML = articles.map(article => `
        <div class="news-card">
            <div class="news-image-container">
                <img src="${article.image_url || getPlaceholderImage()}" class="news-image" onerror="this.src='${getPlaceholderImage()}'">
                <div class="news-source-tag">${article.source_id}</div>
            </div>
            <div class="news-content">
                <h3 class="news-title">${article.title}</h3>
                <p class="news-description">${article.description || 'No description available.'}</p>
                <div class="news-footer">
                    <span class="news-date">${new Date(article.pubDate).toLocaleDateString()}</span>
                    <button class="read-more-btn" onclick="readMore('${article.link}')">Read More →</button>
                </div>
            </div>
        </div>
    `).join('');
}

function displayTrendingArticles(articles) {
    const list = document.getElementById('trendingList');
    list.innerHTML = articles.map((a, i) => `
        <div class="trending-item">
            <div class="trending-number">${i + 1}</div>
            <div class="trending-content">
                <h4 class="trending-title">${a.title}</h4>
                <div class="trending-footer">
                    <span class="trending-source">${a.source_id}</span>
                    <button class="read-more-btn" onclick="readMore('${a.link}')">Read →</button>
                </div>
            </div>
        </div>
    `).join('');
}

// Search
async function performSearch() {
    const query = document.getElementById('searchInput').value.trim();
    if (!query) return;

    const container = document.getElementById('searchResults');
    container.innerHTML = '<div class="loading"><p>Searching...</p></div>';

    try {
        const url = `${NEWS_API_BASE_URL}?apikey=${NEWS_API_KEY}&q=${encodeURIComponent(query)}&language=en`;
        const res = await fetch(url);
        const data = await res.json();

        if (data.results && data.results.length > 0) {
            container.innerHTML = data.results.map(article => `
                <div class="search-result-item">
                    <h4 class="search-result-title" onclick="readMore('${article.link}')">${article.title}</h4>
                    <p class="search-result-description">${article.description || ''}</p>
                    <div class="search-result-footer">
                        <span class="search-result-source">${article.source_id}</span>
                        <button class="read-more-btn" onclick="readMore('${article.link}')">Read More →</button>
                    </div>
                </div>
            `).join('');
        } else {
            container.innerHTML = `<p>No results for "${query}"</p>`;
        }
    } catch (e) {
        container.innerHTML = '<p>Error during search.</p>';
    }
}

// Utility
function updateArticleCount() {
    document.getElementById('articleCount').textContent = allArticles.length;
}

function readMore(url) {
    window.open(url, '_blank');
}

function showLoading() {
    document.getElementById('loading').style.display = 'block';
    document.getElementById('error').style.display = 'none';
}

function hideLoading() {
    document.getElementById('loading').style.display = 'none';
}

function showError(msg) {
    const errorBox = document.getElementById('error');
    errorBox.querySelector('p').textContent = msg;
    errorBox.style.display = 'block';
    document.getElementById('featuredArticle').style.display = 'none';
    document.getElementById('newsGrid').innerHTML = '';
}

function getPlaceholderImage() {
    return 'https://via.placeholder.com/800x600.png?text=No+Image';
}
