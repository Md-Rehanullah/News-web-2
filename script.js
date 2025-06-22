const NEWS_API_KEY = 'pub_479521869e790a727903df673ac804ca5f7dc';
const NEWS_API_BASE_URL = 'https://newsdata.io/api/1/news';

let currentCategory = 'top';
let currentPage = 1;
let allArticles = [];
let isLoading = false;

document.addEventListener('DOMContentLoaded', () => {
    setCurrentDate();
    initializeEventListeners();
    loadNews('top');
    initializeScrollListener();
});

function setCurrentDate() {
    const now = new Date();
    document.getElementById('currentDate').textContent = now.toDateString();
}

function initializeEventListeners() {
    document.querySelectorAll('.nav-btn, .category-btn, .mobile-nav-btn').forEach(btn => {
        btn.addEventListener('click', e => {
            const category = e.target.getAttribute('data-category');
            if (category) changeCategory(category);
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

    document.getElementById('contactForm').addEventListener('submit', e => {
        e.preventDefault();
        alert('Thank you for your message! We\'ll get back to you soon.');
        e.target.reset();
        document.getElementById('contactOverlay').classList.remove('active');
    });

    document.getElementById('loadMoreBtn').addEventListener('click', loadMoreArticles);
    document.getElementById('goToTopBtn').addEventListener('click', scrollToTop);

    document.addEventListener('click', e => {
        if (e.target.classList.contains('mobile-menu-overlay') || 
            e.target.classList.contains('search-overlay') || 
            e.target.classList.contains('contact-overlay')) {
            e.target.classList.remove('active');
        }
    });
}

function initializeScrollListener() {
    window.addEventListener('scroll', () => {
        const btn = document.getElementById('goToTopBtn');
        btn.classList.toggle('visible', window.pageYOffset > 300);
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
    document.querySelectorAll('.nav-btn, .category-btn, .mobile-nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelectorAll(`[data-category="${category}"]`).forEach(btn => {
        btn.classList.add('active');
    });
}

function updateSectionTitle(category) {
    const titles = {
        'top': 'Latest News',
        'business': 'Business News',
        'sports': 'Sports News',
        'technology': 'Technology News',
        'entertainment': 'Entertainment News',
        'world': 'World News',
        'trending': 'Trending News'
    };
    document.getElementById('sectionTitle').textContent = titles[category] || 'Latest News';
}

async function loadNews(category, page = 1) {
    isLoading = true;
    showLoading();

    let url = `${NEWS_API_BASE_URL}?apikey=${NEWS_API_KEY}&language=en&page=${page}`;
    if (category !== 'top') url += `&category=${category}`;
    url += `&country=in`;

    try {
        const res = await fetch(url);
        const data = await res.json();
        if (data.status === 'success') {
            const articles = filterArticles(data.results);
            if (page === 1) allArticles = articles;
            else allArticles.push(...articles);

            displayArticles();
            updateArticleCount();
            document.getElementById('loadMoreContainer').style.display = articles.length === 10 ? 'block' : 'none';
        } else {
            showError(`API Error: ${data.message}`);
        }
    } catch (err) {
        showError('Failed to load news. Check your internet connection.');
    } finally {
        hideLoading();
        isLoading = false;
    }
}

function filterArticles(articles) {
    return articles.filter(a => a.title && a.description && a.link);
}

function displayArticles() {
    if (allArticles.length > 0) {
        displayFeaturedArticle(allArticles[0]);
        displayNewsGrid(allArticles.slice(1));
    }
}

function displayFeaturedArticle(article) {
    const container = document.getElementById('featuredArticle');
    const date = new Date(article.pubDate).toLocaleDateString();
    container.innerHTML = `
        <div class="featured-grid">
            <div>
                <img src="${article.image_url || getPlaceholderImage()}" alt="${article.title}" class="featured-image" onerror="this.src='${getPlaceholderImage()}'">
            </div>
            <div class="featured-content">
                <div class="featured-tag">FEATURED STORY</div>
                <h2 class="featured-title">${article.title}</h2>
                <p class="featured-description">${article.description}</p>
                <div class="featured-meta">
                    <div class="article-meta">
                        <span>${article.source_id}</span> • <span>${date}</span>
                    </div>
                    <button class="btn-primary" onclick="readMore('${article.link}')">Read More</button>
                </div>
            </div>
        </div>
    `;
    container.style.display = 'block';
}

function displayNewsGrid(articles) {
    const newsGrid = document.getElementById('newsGrid');
    newsGrid.innerHTML = articles.map(article => {
        const date = new Date(article.pubDate).toLocaleDateString();
        return `
            <div class="news-card">
                <div class="news-image-container">
                    <img src="${article.image_url || getPlaceholderImage()}" alt="${article.title}" class="news-image" onerror="this.src='${getPlaceholderImage()}'">
                    <div class="news-source-tag">${article.source_id}</div>
                </div>
                <div class="news-content">
                    <h3 class="news-title">${article.title}</h3>
                    <p class="news-description">${article.description}</p>
                    <div class="news-footer">
                        <span class="news-date">${date}</span>
                        <button class="read-more-btn" onclick="readMore('${article.link}')">Read More →</button>
                    </div>
                </div>
            </div>
        `;
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
    resultsContainer.innerHTML = `<p>Searching...</p>`;

    try {
        const url = `${NEWS_API_BASE_URL}?apikey=${NEWS_API_KEY}&q=${encodeURIComponent(query)}&language=en`;
        const response = await fetch(url);
        const data = await response.json();
        if (data.status === 'success') {
            const articles = filterArticles(data.results);
            displaySearchResults(articles, query);
        } else {
            resultsContainer.innerHTML = `<p>Search failed: ${data.message}</p>`;
        }
    } catch (error) {
        resultsContainer.innerHTML = `<p>Search failed. Try again.</p>`;
    }
}

function displaySearchResults(articles, query) {
    const resultsContainer = document.getElementById('searchResults');
    if (articles.length === 0) {
        resultsContainer.innerHTML = `<p>No results for "${query}"</p>`;
        return;
    }
    resultsContainer.innerHTML = articles.map(article => `
        <div class="search-result-item">
            <h4 class="search-result-title" onclick="readMore('${article.link}')">${article.title}</h4>
            <p class="search-result-description">${article.description}</p>
            <div class="search-result-footer">
                <span class="search-result-source">${article.source_id}</span>
                <button class="read-more-btn" onclick="readMore('${article.link}')">Read More →</button>
            </div>
        </div>
    `).join('');
}

function clearSearchResults() {
    document.getElementById('searchInput').value = '';
    document.getElementById('searchResults').innerHTML = '';
}

function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

function showError(msg) {
    document.getElementById('loading').style.display = 'none';
    const error = document.getElementById('error');
    error.querySelector('p').textContent = msg;
    error.style.display = 'block';
    document.getElementById('featuredArticle').style.display = 'none';
    document.getElementById('newsGrid').innerHTML = '';
}

function updateArticleCount() {
    document.getElementById('articleCount').textContent = allArticles.length;
}

function getPlaceholderImage() {
    return 'https://via.placeholder.com/800x600.png?text=No+Image';
}
