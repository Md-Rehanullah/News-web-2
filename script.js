// Configuration
const API_KEY = 'pub_479521869e790a727903df673ac804ca5f7dc';
const BASE_URL = 'https://newsdata.io/api/1/news';

// App State
let currentCategory = 'top'; // Default category
let currentPage = 1;
let allArticles = [];
let isLoading = false;

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
  initializeEventListeners();
  loadNews(currentCategory);
});

function initializeEventListeners() {
  document.querySelectorAll('[data-category]').forEach(btn => {
    btn.addEventListener('click', () => {
      const category = btn.dataset.category;
      if (category && category !== currentCategory) {
        currentCategory = category;
        currentPage = 1;
        allArticles = [];
        loadNews(currentCategory);
      }
    });
  });

  document.getElementById('loadMoreBtn').addEventListener('click', () => {
    currentPage++;
    loadNews(currentCategory, currentPage);
  });
}

async function loadNews(category, page = 1) {
  if (isLoading) return;
  isLoading = true;

  showLoading();

  try {
    const url = `${BASE_URL}?apikey=${API_KEY}&language=en&category=${category}&page=${page}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'success' && Array.isArray(data.results)) {
      const filtered = data.results.filter(a => a.title && a.link);
      allArticles = [...allArticles, ...filtered];
      renderArticles();
      updateArticleCount();
    } else {
      showError(`API Error: ${data?.results?.message || 'Unexpected response format'}`);
    }
  } catch (err) {
    showError('Failed to fetch articles. Please check your internet or try again.');
    console.error(err);
  } finally {
    isLoading = false;
    hideLoading();
  }
}

function renderArticles() {
  const grid = document.getElementById('newsGrid');
  grid.innerHTML = allArticles.map(article => `
    <div class="news-card">
      <div class="news-image-container">
        <img src="${article.image_url || getPlaceholderImage()}" onerror="this.src='${getPlaceholderImage()}'" class="news-image">
      </div>
      <div class="news-content">
        <h3 class="news-title">${article.title}</h3>
        <p class="news-description">${article.description || 'No description available.'}</p>
        <div class="news-footer">
          <span class="news-date">${new Date(article.pubDate).toLocaleDateString()}</span>
          <a href="${article.link}" target="_blank" class="read-more-btn">Read More →</a>
        </div>
      </div>
    </div>
  `).join('');
}

function updateArticleCount() {
  document.getElementById('articleCount').textContent = allArticles.length;
}

function showLoading() {
  document.getElementById('loading').style.display = 'block';
  document.getElementById('error').style.display = 'none';
  document.getElementById('newsGrid').innerHTML = '';
}

function hideLoading() {
  document.getElementById('loading').style.display = 'none';
}

function showError(msg) {
  const errorBox = document.getElementById('error');
  errorBox.querySelector('p').textContent = msg;
  errorBox.style.display = 'block';
}

function getPlaceholderImage() {
  return 'https://via.placeholder.com/600x400.png?text=No+Image';
}
