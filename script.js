// Configuration for NewsData.io
const NEWS_API_KEY = 'pub_479521869e790a727903df673ac804ca5f7dc';
const NEWS_API_BASE_URL = 'https://newsdata.io/api/1/news';

// Supported categories by NewsData.io
const validCategories = ['top', 'world', 'sports', 'technology', 'business', 'entertainment'];

// State variables
let currentCategory = 'top';
let currentPage = 1;
let allArticles = [];
let isLoading = false;
let nextPageToken = null;

document.addEventListener('DOMContentLoaded', function () {
    loadNews(currentCategory);
});

function changeCategory(category) {
    if (category === currentCategory) return;
    currentCategory = category;
    currentPage = 1;
    nextPageToken = null;
    allArticles = [];
    loadNews(currentCategory);
}

async function loadNews(category, pageToken = null) {
    if (isLoading) return;
    isLoading = true;
    showLoading();

    try {
        const categoryParam = validCategories.includes(category) ? `&category=${category}` : '';
        const pageParam = pageToken ? `&page=${pageToken}` : '';
        const url = `${NEWS_API_BASE_URL}?apikey=${NEWS_API_KEY}&language=en${categoryParam}${pageParam}`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.status === 'success' && Array.isArray(data.results)) {
            const filteredArticles = data.results.filter(article => article.title && article.link);
            allArticles = allArticles.concat(filteredArticles);
            displayArticles(allArticles);
            nextPageToken = data.nextPage || null;
            document.getElementById('loadMoreContainer').style.display = nextPageToken ? 'block' : 'none';
        } else {
            showError('API Error: Unexpected response format');
            console.error('API Error:', data);
        }
    } catch (error) {
        showError('API Error: ' + error.message);
        console.error(error);
    } finally {
        isLoading = false;
        hideLoading();
    }
}

function loadMoreArticles() {
    if (nextPageToken) {
        loadNews(currentCategory, nextPageToken);
    }
}

function displayArticles(articles) {
    const newsGrid = document.getElementById('newsGrid');
    newsGrid.innerHTML = articles.map(article => `
        <div class="news-card">
            <div class="news-image-container">
                <img src="${article.image_url || 'https://via.placeholder.com/300x200'}" alt="${article.title}">
            </div>
            <div class="news-content">
                <h3 class="news-title">${article.title}</h3>
                <p class="news-description">${article.description || 'No description available.'}</p>
                <a href="${article.link}" target="_blank" class="read-more-btn">Read More â</a>
            </div>
        </div>
    `).join('');
}

function showLoading() {
    document.getElementById('loading').style.display = 'block';
    document.getElementById('error').style.display = 'none';
}

function hideLoading() {
    document.getElementById('loading').style.display = 'none';
}

function showError(message) {
    const errorEl = document.getElementById('error');
    errorEl.style.display = 'block';
    errorEl.querySelector('p').textContent = message;
}
