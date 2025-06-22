const NEWS_API_KEY = 'pub_479521869e790a727903df673ac804ca5f7dc';
const NEWS_API_BASE_URL = 'https://newsdata.io/api/1/news';

let currentCategory = 'top';
let allArticles = [];
let isLoading = false;

document.addEventListener('DOMContentLoaded', () => {
  initializeEventListeners();
  loadNews(currentCategory);
});

function initializeEventListeners() {
  document.querySelectorAll('.nav-btn, .category-btn, .mobile-nav-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const category = e.target.getAttribute('data-category');
      if (category) changeCategory(category);
    });
  });

  // Search Overlay
  document.getElementById('searchBtn').addEventListener('click', () => {
    document.getElementById('searchOverlay').classList.add('active');
  });
  document.getElementById('closeSearch').addEventListener('click', () => {
    document.getElementById('searchOverlay').classList.remove('active');
  });

  // Contact Overlay
  document.getElementById('contactBtn').addEventListener('click', () => {
    document.getElementById('contactOverlay').classList.add('active');
  });
  document.getElementById('closeContact').addEventListener('click', () => {
    document.getElementById('contactOverlay').classList.remove('active');
  });

  // Mailto form submission
  document.getElementById('contactForm').addEventListener('submit', function (e) {
    e.preventDefault();
    const name = this.name.value;
    const email = this.email.value;
    const message = this.message.value;

    const mailtoLink = `mailto:mdchild21@gmail.com?subject=Message from ${encodeURIComponent(name)}&body=${encodeURIComponent(message)}%0AFrom: ${encodeURIComponent(email)}`;
    window.location.href = mailtoLink;

    this.reset();
    document.getElementById('contactOverlay').classList.remove('active');
  });
}

function changeCategory(category) {
  if (category === currentCategory) return;
  currentCategory = category;
  allArticles = [];
  updateSectionTitle(category);
  loadNews(category);
}

function updateSectionTitle(category) {
  const titles = {
    'top': 'Latest News',
    'world': 'International News',
    'sports': 'Sports News',
    'technology': 'Technology News',
    'business': 'Business News',
    'entertainment': 'Entertainment News'
  };
  document.getElementById('sectionTitle').textContent = titles[category] || 'Latest News';
}

async function loadNews(category) {
  if (isLoading) return;
  isLoading = true;
  showLoading();

  try {
    const url = `${NEWS_API_BASE_URL}?apikey=${NEWS_API_KEY}&language=en${category !== 'top' ? `&category=${category}` : ''}`;
    const response = await fetch(url);
    const data = await response.json();

    console.log("API Response:", data); // Optional: keep this for debugging

    if (data.status === 'success' && Array.isArray(data.results)) {
      const filteredArticles = data.results.filter(article => article.title && article.link);
      allArticles = filteredArticles;
      displayArticles(allArticles);
      document.getElementById('articleCount').textContent = allArticles.length;

      // Hide load more (pagination removed)
      document.getElementById('loadMoreContainer').style.display = 'none';
    } else {
      showError("API Error: " + (data?.results?.message || 'Unexpected response format'));
    }
  } catch (error) {
    showError("API Error: " + error.message);
  } finally {
    isLoading = false;
    hideLoading();
  }
}

function displayArticles(articles) {
  const newsGrid = document.getElementById('newsGrid');
  const featuredContainer = document.getElementById('featuredArticle');
  newsGrid.innerHTML = '';

  if (articles.length === 0) return;

  const [first, ...rest] = articles;

  // Featured Article
  featuredContainer.innerHTML = `
    <div class="featured-grid">
      <img src="${first.image_url || getPlaceholderImage()}" class="featured-image">
      <div class="featured-content">
        <div class="featured-tag">FEATURED STORY</div>
        <h2 class="featured-title">${first.title}</h2>
        <p class="featured-description">${first.description || 'No description available.'}</p>
        <button class="btn-primary" onclick="window.open('${first.link}', '_blank')">Read More</button>
      </div>
    </div>`;
  featuredContainer.style.display = 'block';

  // Grid Articles
  rest.forEach(article => {
    newsGrid.innerHTML += `
      <div class="news-card">
        <div class="news-image-container">
          <img src="${article.image_url || getPlaceholderImage()}" alt="${article.title}" class="news-image">
          <div class="news-source-tag">${article.source_id}</div>
        </div>
        <div class="news-content">
          <h3 class="news-title">${article.title}</h3>
          <p class="news-description">${article.description || 'No description available.'}</p>
          <div class="news-footer">
            <button class="read-more-btn" onclick="window.open('${article.link}', '_blank')">Read More →</button>
          </div>
        </div>
      </div>`;
  });
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
  const errorElement = document.getElementById('error');
  errorElement.querySelector('p').textContent = message;
  errorElement.style.display = 'block';
  document.getElementById('featuredArticle').style.display = 'none';
  document.getElementById('newsGrid').innerHTML = '';
}

function getPlaceholderImage() {
  return 'https://via.placeholder.com/800x400?text=No+Image';
}
