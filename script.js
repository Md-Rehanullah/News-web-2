const apiKey = 'pub_479521869e790a727903df673ac804ca5f7dc'; // Replace with your actual API key
const newsContainer = document.getElementById('news-container');
const loadMoreButton = document.getElementById('load-more');
const searchInput = document.getElementById('search');
const contactForm = document.getElementById('contact-form');
let currentPage = 1;

async function fetchNews(page = 1) {
    const response = await fetch(`https://newsapi.org/v2/top-headlines?country=in&pageSize=6&page=${page}&apiKey=${apiKey}`);
    const data = await response.json();
    return data.articles;
}

function displayNews(articles) {
    articles.forEach(article => {
        const articleElement = document.createElement('article');
        articleElement.innerHTML = `
            <h2>${article.title}</h2>
            <p>${article.description}</p>
            <a href="${article.url}" target="_blank">Read more</a>
        `;
        newsContainer.appendChild(articleElement);
    });
}

async function loadNews() {
    const articles = await fetchNews(currentPage);
    displayNews(articles);
    currentPage++;
}

loadMoreButton.addEventListener('click', loadNews);

searchInput.addEventListener('input', async () => {
    const query = searchInput.value;
    const response = await fetch(`https://newsapi.org/v2/everything?q=${query}&apiKey=${apiKey}`);
    const data = await response.json();
    newsContainer.innerHTML = '';
    displayNews(data.articles);
});

contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const message = contactForm.querySelector('textarea').value;
    window.open(`mailto:mdchild21@gmail.com?subject=Message from News Website&body=${encodeURIComponent(message)}`);
    contactForm.reset();
});

document.getElementById('go-top').addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

// Initial load
loadNews();
