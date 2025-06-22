// Configuration
const NEWS_API_KEY = 'pub_479521869e790a727903df673ac804ca5f7dc';
const NEWS_API_BASE_URL = 'https://newsdata.io/api/1/news';

// State
let currentCategory = 'top';
let currentPage = 1;
let allArticles = [];
let isLoading = false;

// Initialize
document.addEventListener('DOMContentLoaded', function () {
    setCurrentDate();
    initializeEventListeners();
    loadNews(currentCategory);
    initializeScrollListener();
});

// Set current date
function setCurrentDate() {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('currentDate').textContent = now.toLocaleDateString('en-US', options);
}

// Change category
function changeCategory(category) {
    currentCategory = category;
    currentPage = 1;
    allArticles = [];
    updateActiveButtons(category);
    updateSectionTitle(category);
    loadNews(category);
}

// Update buttons
function updateActiveButtons(category) {
    document.querySelectorAll('.nav-btn, .category-btn, .mobile-nav-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.category === category) btn.classList.add('active');
    });
}

// Section titles
function updateSectionTitle(category) {
    const titles = {
        general: 'General News',
        world: 'International News',
        sports: 'Sports News',
        technology: 'Technology News',
        business: 'Business News',
        entertainment: 'Entertainment News',
        trending: 'Trending News',
        top: 'Top Headlines'
    };
    document.getElementById('sectionTitle').textContent = titles[category] || 'Latest News';
}

// Load news
async function loadNews(category = 'top', page = 1) {
    isLoading = true;
    showLoading();
    try {
        let url = `${NEWS_API_BASE_URL}?apikey=${NEWS_API_KEY}&language=en&page=${page}&category=${category}`;
        const response = await fetch(url);
        const data = await response.json();

        if (!data.results || !Array.isArray(data.results)) {
            showError("Unexpected response format");
            return;
        }

        const filtered = data.results.filter(a => a.title && a.link);
        allArticles = page === 1 ? filtered : [...allArticles, ...filtered];

        displayArticles();
        updateArticleCount();
        document.getElementById('loadMoreContainer').style.display = filtered.length >= 10 ? 'block' : 'none';
    } catch (err) {
        console.error(err);
        showError('Failed to fetch news');
    } finally {
        isLoading = false;
        hideLoading();
    }
}

// Display articles
function displayArticles() {
    const featured = allArticles[0];
    const rest = allArticles.slice(1);

    if (featured) displayFeaturedArticle(featured);
    displayNewsGrid(rest);
}

// Featured
function displayFeaturedArticle(article) {
    const container = document.getElementById('featuredArticle');
    const date = new Date(article.pubDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

    container.innerHTML = `
        <div class="featured-grid">
            <div>
                <img src="${article.image_url || getPlaceholderImage()}" alt="${article.title}" class="featured-image">
            </div>
            <div class="featured-content">
                <div class="featured-tag">FEATURED STORY</div>
                <h2 class="featured-title">${article.title}</h2>
                <p class="featured-description">${article.description || 'No description available.'}</p>
                <div class="featured-meta">
                    <div class="article-meta"><span>${article.source_id}</span> • <span>${date}</span></div>
                    <button class="btn-primary" onclick="readMore('${article.link}')">Read More</button>
                </div>
            </div>
        </div>
    `;
    container.style.display = 'block';
}

// Grid
function displayNewsGrid(articles) {
    const grid = document.getElementById('newsGrid');
    grid.innerHTML = articles.map(article => `
        <div class="news-card">
            <div class="news-image-container">
                <img src="${article.image_url || getPlaceholderImage()}" alt="${article.title}" class="news-image">
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

// Load More
function loadMoreArticles() {
    currentPage++;
    loadNews(currentCategory, currentPage);
}

// Helpers
function updateArticleCount() {
    document.getElementById('articleCount').textContent = allArticles.length;
}

function getPlaceholderImage() {
    return 'https://via.placeholder.com/800x600?text=No+Image';
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

function showError(message = 'API Error') {
    document.getElementById('loading').style.display = 'none';
    const error = document.getElementById('error');
    error.querySelector('p').textContent = message;
    error.style.display = 'block';
}

// Scroll to top
function initializeScrollListener() {
    window.addEventListener('scroll', () => {
        document.getElementById('goToTopBtn').classList.toggle('visible', window.scrollY > 300);
    });
}

function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Event listeners
function initializeEventListeners() {
    document.querySelectorAll('.nav-btn, .category-btn, .mobile-nav-btn').forEach(btn => {
        btn.addEventListener('click', e => {
            const category = e.target.getAttribute('data-category');
            if (category) changeCategory(category);
        });
    });

    document.getElementById('loadMoreBtn').addEventListener('click', loadMoreArticles);
    document.getElementById('goToTopBtn').addEventListener('click', scrollToTop);
}
