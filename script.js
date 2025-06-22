// Configuration
const NEWS_API_KEY = 'e7eb2557a7794272b4ae7722c077e945'; // ✅ Your NewsAPI.org key
const NEWS_API_BASE_URL = 'https://newsapi.org/v2';      // ✅ Base URL for NewsAPI
// Check if API key is configured
function checkApiKey() {
    if (NEWS_API_KEY === 'pub_479521869e790a727903df673ac804ca5f7dc' || !NEWS_API_KEY) {
        showApiKeyError();
        return false;
    }
    return true;
}

// State
let currentCategory = 'general';
let currentPage = 1;
let allArticles = [];
let isLoading = false;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Set current date
    setCurrentDate();
    
    // Initialize event listeners
    initializeEventListeners();
    
    // Load initial news
    loadNews('general');
    
    // Load trending news
    loadTrendingNews();
    
    // Initialize scroll listener
    initializeScrollListener();
}

function setCurrentDate() {
    const now = new Date();
    const options = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    };
    document.getElementById('currentDate').textContent = now.toLocaleDateString('en-US', options);
}

function initializeEventListeners() {
    // Navigation buttons
    document.querySelectorAll('.nav-btn, .category-btn, .mobile-nav-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const category = e.target.getAttribute('data-category');
            if (category) {
                changeCategory(category);
            }
        });
    });

    // Mobile menu
    document.getElementById('mobileMenuBtn').addEventListener('click', () => {
        document.getElementById('mobileMenuOverlay').classList.add('active');
    });

    document.getElementById('closeMobileMenu').addEventListener('click', () => {
        document.getElementById('mobileMenuOverlay').classList.remove('active');
    });

    // Search functionality
    document.getElementById('searchBtn').addEventListener('click', () => {
        document.getElementById('searchOverlay').classList.add('active');
    });

    document.getElementById('closeSearch').addEventListener('click', () => {
        document.getElementById('searchOverlay').classList.remove('active');
        clearSearchResults();
    });

    document.getElementById('searchSubmitBtn').addEventListener('click', performSearch);
    document.getElementById('searchInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            performSearch();
        }
    });

    // Contact form
    document.getElementById('contactBtn').addEventListener('click', () => {
        document.getElementById('contactOverlay').classList.add('active');
    });

    document.getElementById('closeContact').addEventListener('click', () => {
        document.getElementById('contactOverlay').classList.remove('active');
    });

    document.getElementById('contactForm').addEventListener('submit', handleContactSubmit);

    // Load more button
    document.getElementById('loadMoreBtn').addEventListener('click', loadMoreArticles);

    // Go to top button
    document.getElementById('goToTopBtn').addEventListener('click', scrollToTop);

    // Close overlays when clicking outside
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
        if (window.pageYOffset > 300) {
            goToTopBtn.classList.add('visible');
        } else {
            goToTopBtn.classList.remove('visible');
        }
    });
}

function changeCategory(category) {
    if (category === currentCategory) return;
    
    currentCategory = category;
    currentPage = 1;
    allArticles = [];
    
    // Update active states
    updateActiveButtons(category);
    
    // Update section title
    updateSectionTitle(category);
    
    // Load news for new category
    loadNews(category);
}

function updateActiveButtons(category) {
    // Remove active class from all buttons
    document.querySelectorAll('.nav-btn, .category-btn, .mobile-nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Add active class to current category buttons
    document.querySelectorAll(`[data-category="${category}"]`).forEach(btn => {
        btn.classList.add('active');
    });
}

function updateSectionTitle(category) {
    const titles = {
        'general': 'Latest News',
        'world': 'International News',
        'sports': 'Sports News',
        'technology': 'Technology News',
        'business': 'Business News',
        'entertainment': 'Entertainment News',
        'trending': 'Trending News'
    };
    
    document.getElementById('sectionTitle').textContent = titles[category] || 'Latest News';
}

async function loadNews(category, page = 1) {
    if (isLoading) return;
    if (!checkApiKey()) return;

    isLoading = true;
    showLoading();

    try {
        let url;
        if (category === 'trending') {
            url = `${NEWS_API_BASE_URL}/top-headlines?country=us&pageSize=12&page=${page}&apiKey=${NEWS_API_KEY}`;
        } else {
            url = `${NEWS_API_BASE_URL}/top-headlines?category=${category}&country=us&pageSize=12&page=${page}&apiKey=${NEWS_API_KEY}`;
        }

        const response = await fetch(url);
        const data = await response.json();

        if (data.status === 'ok') {
            const filteredArticles = filterArticles(data.articles);

            if (page === 1) {
                allArticles = filteredArticles;
            } else {
                allArticles = [...allArticles, ...filteredArticles];
            }

            displayArticles();
            updateArticleCount();

            document.getElementById('loadMoreContainer').style.display =
                filteredArticles.length >= 12 ? 'block' : 'none';
        } else {
            showError(`API Error: ${data.message}`);
        }
    } catch (err) {
        showError('Failed to load news. Check your connection and try again.');
        console.error(err);
    } finally {
        isLoading = false;
        hideLoading();
    }
}

async function loadTrendingNews() {
    if (!checkApiKey()) return;

    try {
        const url = `${NEWS_API_BASE_URL}/top-headlines?country=us&pageSize=5&apiKey=${NEWS_API_KEY}`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.status === 'ok') {
            const filteredArticles = filterArticles(data.articles);
            displayTrendingArticles(filteredArticles.slice(0, 5));
        }
    } catch (error) {
        console.error('Error loading trending news:', error);
    }
}

function filterArticles(articles) {
    return articles.filter(article => 
        article.title && 
        article.description && 
        article.title !== '[Removed]' &&
        article.description !== '[Removed]'
    );
}

function displayArticles() {
    const featuredArticle = allArticles[0];
    const gridArticles = allArticles.slice(1);
    
    // Display featured article
    if (featuredArticle) {
        displayFeaturedArticle(featuredArticle);
    }
    
    // Display grid articles
    displayNewsGrid(gridArticles);
}

function displayFeaturedArticle(article) {
    const featuredContainer = document.getElementById('featuredArticle');
    const publishedDate = new Date(article.publishedAt).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    });
    
    featuredContainer.innerHTML = `
        <div class="featured-grid">
            <div>
                <img src="${article.urlToImage || getPlaceholderImage()}" 
                     alt="${article.title}" 
                     class="featured-image"
                     onerror="this.src='${getPlaceholderImage()}'">
            </div>
            <div class="featured-content">
                <div class="featured-tag">FEATURED STORY</div>
                <h2 class="featured-title">${article.title}</h2>
                <p class="featured-description">${article.description || 'No description available.'}</p>
                <div class="featured-meta">
                    <div class="article-meta">
                        <span>${article.source.name}</span> • <span>${publishedDate}</span>
                    </div>
                    <button class="btn-primary" onclick="readMore('${article.url}')">
                        Read More
                    </button>
                </div>
            </div>
        </div>
    `;
    
    featuredContainer.style.display = 'block';
}

function displayNewsGrid(articles) {
    const newsGrid = document.getElementById('newsGrid');
    
    newsGrid.innerHTML = articles.map(article => {
        const publishedDate = new Date(article.publishedAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
        
        return `
            <div class="news-card">
                <div class="news-image-container">
                    <img src="${article.urlToImage || getPlaceholderImage()}" 
                         alt="${article.title}" 
                         class="news-image"
                         onerror="this.src='${getPlaceholderImage()}'">
                    <div class="news-source-tag">${article.source.name}</div>
                </div>
                <div class="news-content">
                    <h3 class="news-title">${article.title}</h3>
                    <p class="news-description">${article.description || 'No description available.'}</p>
                    <div class="news-footer">
                        <span class="news-date">${publishedDate}</span>
                        <button class="read-more-btn" onclick="readMore('${article.url}')">
                            Read More →
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function displayTrendingArticles(articles) {
    const trendingList = document.getElementById('trendingList');
    
    trendingList.innerHTML = articles.map((article, index) => `
        <div class="trending-item">
            <div class="trending-number">${index + 1}</div>
            <div class="trending-content">
                <h4 class="trending-title">${article.title}</h4>
                <div class="trending-footer">
                    <span class="trending-source">${article.source.name}</span>
                    <button class="read-more-btn" onclick="readMore('${article.url}')">
                        Read →
                    </button>
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
    if (!query) return;
    if (!checkApiKey()) return;

    const searchResults = document.getElementById('searchResults');
    searchResults.innerHTML = '<div class="loading"><div class="spinner"></div><p>Searching...</p></div>';

    try {
        const url = `${NEWS_API_BASE_URL}/everything?q=${encodeURIComponent(query)}&pageSize=10&sortBy=relevancy&apiKey=${NEWS_API_KEY}`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.status === 'ok') {
            const filteredArticles = filterArticles(data.articles);
            displaySearchResults(filteredArticles, query);
        } else {
            searchResults.innerHTML = `<div class="error"><p>Search failed: ${data.message}</p></div>`;
        }
    } catch (error) {
        console.error('Search error:', error);
        searchResults.innerHTML = '<div class="error"><p>Search failed. Please try again.</p></div>';
    }
}

function displaySearchResults(articles, query) {
    const searchResults = document.getElementById('searchResults');
    
    if (articles.length === 0) {
        searchResults.innerHTML = `
            <div class="text-center" style="padding: 2rem; color: var(--news-gray);">
                <p>No articles found for "${query}"</p>
                <p style="font-size: 0.875rem; margin-top: 0.5rem;">Try searching with different keywords</p>
            </div>
        `;
        return;
    }
    
    searchResults.innerHTML = articles.map(article => `
        <div class="search-result-item">
            <h4 class="search-result-title" onclick="readMore('${article.url}')">${article.title}</h4>
            <p class="search-result-description">${article.description || 'No description available.'}</p>
            <div class="search-result-footer">
                <span class="search-result-source">${article.source.name}</span>
                <button class="read-more-btn" onclick="readMore('${article.url}')">
                    Read More →
                </button>
            </div>
        </div>
    `).join('');
}

function clearSearchResults() {
    document.getElementById('searchInput').value = '';
    document.getElementById('searchResults').innerHTML = '';
}

function handleContactSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const contactData = {
        name: formData.get('name'),
        email: formData.get('email'),
        message: formData.get('message')
    };
    
    // Since this is a static website, we'll simulate the contact form
    // In a real implementation, you would send this to your backend
    alert('Thank you for your message! We\'ll get back to you soon.');
    
    // Reset form
    e.target.reset();
    
    // Close modal
    document.getElementById('contactOverlay').classList.remove('active');
}

function readMore(url) {
    window.open(url, '_blank');
}

function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

function showError(message = 'Failed to load news articles') {
    document.getElementById('loading').style.display = 'none';
    const errorElement = document.getElementById('error');
    errorElement.querySelector('p').textContent = message;
    errorElement.style.display = 'block';
    document.getElementById('featuredArticle').style.display = 'none';
    document.getElementById('newsGrid').innerHTML = '';
}

function showApiKeyError() {
    document.getElementById('loading').style.display = 'none';
    const errorElement = document.getElementById('error');
    errorElement.innerHTML = `
        <div style="text-align: center; padding: 3rem 0;">
            <p style="color: var(--news-red); margin-bottom: 1rem;">API Key Required</p>
            <p style="margin-bottom: 1rem;">Please add your News API key to script.js:</p>
            <ol style="text-align: left; max-width: 400px; margin: 0 auto 1rem;">
                <li>Get a free API key from <a href="https://newsapi.org" target="_blank" style="color: var(--news-red);">NewsAPI.org</a></li>
                <li>Open script.js in a text editor</li>
                <li>Replace 'YOUR_NEWS_API_KEY_HERE' with your actual API key</li>
                <li>Save and reload the page</li>
            </ol>
        </div>
    `;
    errorElement.style.display = 'block';
    document.getElementById('featuredArticle').style.display = 'none';
    document.getElementById('newsGrid').innerHTML = '';
}

function updateArticleCount() {
    document.getElementById('articleCount').textContent = allArticles.length;
}

function getPlaceholderImage() {
    return 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600';
}
