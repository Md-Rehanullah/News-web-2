// Configuration
const NEWS_API_KEY = 'pub_479521869e790a727903df673ac804ca5f7dc';
const NEWS_API_BASE_URL = 'https://newsdata.io/api/1/news';

// State
let currentCategory = 'general';
let currentPage = 1;
let allArticles = [];
let isLoading = false;

// Initialize the application
document.addEventListener('DOMContentLoaded', initializeApp);

function initializeApp() {
    setCurrentDate();
    initializeEventListeners();
    loadNews(currentCategory);
    initializeScrollListener();
}

function setCurrentDate() {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('currentDate').textContent = now.toLocaleDateString('en-US', options);
}

function initializeEventListeners() {
    document.querySelectorAll('.nav-btn, .category-btn, .mobile-nav-btn').forEach(btn => {
        btn.addEventListener('click', e => {
            const category = e.target.getAttribute('data-category');
            if (category) changeCategory(category);
        });
    });

    document.getElementById('mobileMenuBtn').onclick = () => document.getElementById('mobileMenuOverlay').classList.add('active');
    document.getElementById('closeMobileMenu').onclick = () => document.getElementById('mobileMenuOverlay').classList.remove('active');

    document.getElementById('searchBtn').onclick = () => document.getElementById('searchOverlay').classList.add('active');
    document.getElementById('closeSearch').onclick = () => {
        document.getElementById('searchOverlay').classList.remove('active');
        clearSearchResults();
    };

    document.getElementById('searchSubmitBtn').onclick = performSearch;
    document.getElementById('searchInput').addEventListener('keypress', e => {
        if (e.key === 'Enter') performSearch();
    });

    document.getElementById('contactBtn').onclick = () => document.getElementById('contactOverlay').classList.add('active');
    document.getElementById('closeContact').onclick = () => document.getElementById('contactOverlay').classList.remove('active');
    document.getElementById('contactForm').addEventListener('submit', handleContactSubmit);

    document.getElementById('loadMoreBtn').onclick = loadMoreArticles;
    document.getElementById('goToTopBtn').onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' });

    document.addEventListener('click', e => {
        if (e.target.classList.contains('mobile-menu-overlay') || e.target.classList.contains('search-overlay') || e.target.classList.contains('contact-overlay')) {
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
    if (category === currentCategory) return;
    currentCategory = category;
    currentPage = 1;
    allArticles = [];
    updateActiveButtons(category);
    updateSectionTitle(category);
    loadNews(category);
}

function updateActiveButtons(category) {
    document.querySelectorAll('.nav-btn, .category-btn, .mobile-nav-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll(`[data-category="${category}"]`).forEach(btn => btn.classList.add('active'));
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
    const categoryMap = {
      general: 'top',
      world: 'world',
      sports: 'sports',
      technology: 'technology',
      business: 'business',
      entertainment: 'entertainment',
      trending: 'top'
    };
    const catParam = categoryMap[category] || 'top';
    const url = `https://newsdata.io/api/1/latest?apikey=${NEWS_API_KEY}&language=en&category=${catParam}&page=${page}`;
    console.log("→ Fetching:", url);

    const res = await fetch(url);
    const data = await res.json();
    console.log("← API response", data);

    if (data.status === 'success' && Array.isArray(data.results)) {
      const filtered = data.results.filter(a => a.title && a.link);
      allArticles = page === 1 ? filtered : allArticles.concat(filtered);
      displayArticles();
      updateArticleCount();
      document.getElementById('loadMoreContainer').style.display = filtered.length >= 10 ? 'block' : 'none';
    } else {
      showError(`API Error: ${data.message || 'Unexpected response format'}`);
    }
  } catch (err) {
    showError(`Network error: ${err.message}`);
    console.error(err);
  } finally {
    hideLoading();
    isLoading = false;
  }
}

function displayArticles() {
    const featured = allArticles[0];
    const others = allArticles.slice(1);
    if (featured) displayFeaturedArticle(featured);
    displayNewsGrid(others);
}

function displayFeaturedArticle(article) {
    const featured = document.getElementById('featuredArticle');
    const date = new Date(article.pubDate).toLocaleDateString('en-US');
    featured.innerHTML = `
        <div class="featured-grid">
            <div><img src="${article.image_url || getPlaceholderImage()}" class="featured-image" onerror="this.src='${getPlaceholderImage()}'"></div>
            <div class="featured-content">
                <div class="featured-tag">FEATURED STORY</div>
                <h2 class="featured-title">${article.title}</h2>
                <p class="featured-description">${article.description || 'No description available.'}</p>
                <div class="featured-meta">
                    <div class="article-meta">
                        <span>${article.source_id || 'News'}</span> • <span>${date}</span>
                    </div>
                    <button class="btn-primary" onclick="readMore('${article.link}')">Read More</button>
                </div>
            </div>
        </div>`;
    featured.style.display = 'block';
}

function displayNewsGrid(articles) {
    const grid = document.getElementById('newsGrid');
    grid.innerHTML = articles.map(article => {
        const date = new Date(article.pubDate).toLocaleDateString('en-US');
        return `
            <div class="news-card">
                <div class="news-image-container">
                    <img src="${article.image_url || getPlaceholderImage()}" class="news-image" onerror="this.src='${getPlaceholderImage()}'">
                    <div class="news-source-tag">${article.source_id}</div>
                </div>
                <div class="news-content">
                    <h3 class="news-title">${article.title}</h3>
                    <p class="news-description">${article.description || ''}</p>
                    <div class="news-footer">
                        <span class="news-date">${date}</span>
                        <button class="read-more-btn" onclick="readMore('${article.link}')">Read More →</button>
                    </div>
                </div>
            </div>`;
    }).join('');
}

function loadMoreArticles() {
    currentPage++;
    loadNews(currentCategory, currentPage);
}

async function performSearch() {
    const query = document.getElementById('searchInput').value.trim();
    if (!query) return;

    const resultsContainer = document.getElementById('searchResults');
    resultsContainer.innerHTML = '<div class="loading"><div class="spinner"></div><p>Searching...</p></div>';

    try {
        const url = `${NEWS_API_BASE_URL}?apikey=${NEWS_API_KEY}&q=${encodeURIComponent(query)}&language=en`;
        const response = await fetch(url);
        const data = await response.json();

        if (data && Array.isArray(data.results)) {
            displaySearchResults(data.results, query);
        } else {
            resultsContainer.innerHTML = `<p>No articles found for "${query}"</p>`;
        }
    } catch (error) {
        resultsContainer.innerHTML = '<p>Search failed. Please try again.</p>';
        console.error(error);
    }
}

function displaySearchResults(articles, query) {
    const results = document.getElementById('searchResults');
    if (articles.length === 0) {
        results.innerHTML = `<p>No results for "${query}"</p>`;
        return;
    }
    results.innerHTML = articles.map(a => `
        <div class="search-result-item">
            <h4 class="search-result-title" onclick="readMore('${a.link}')">${a.title}</h4>
            <p class="search-result-description">${a.description || ''}</p>
            <div class="search-result-footer">
                <span class="search-result-source">${a.source_id}</span>
                <button class="read-more-btn" onclick="readMore('${a.link}')">Read More →</button>
            </div>
        </div>`).join('');
}

function clearSearchResults() {
    document.getElementById('searchInput').value = '';
    document.getElementById('searchResults').innerHTML = '';
}

function handleContactSubmit(e) {
    e.preventDefault();
    alert('Thank you! We’ll get back to you soon.');
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
    const errorDiv = document.getElementById('error');
    errorDiv.querySelector('p').textContent = message;
    errorDiv.style.display = 'block';
    document.getElementById('featuredArticle').style.display = 'none';
    document.getElementById('newsGrid').innerHTML = '';
}

function updateArticleCount() {
    document.getElementById('articleCount').textContent = allArticles.length;
}

function getPlaceholderImage() {
    return 'https://via.placeholder.com/400x250?text=No+Image';
}
