// Show loading spinner
function showLoading() {
  document.getElementById('loading').classList.remove('hidden');
}

function hideLoading() {
  document.getElementById('loading').classList.add('hidden');
}

const apiKey = 'bfba1b26baae46cda0dc6e06bfa95651';

const gameList = document.getElementById('game-list');
const searchInput = document.getElementById('search-input');
const searchButton = document.getElementById('search-button');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const pageInfo = document.getElementById('page-info');

const modal = document.getElementById('modal');
const modalBody = document.getElementById('modal-body');
const modalClose = document.getElementById('modal-close') || document.querySelector('.close');

let currentPage = 1;
let currentSearch = '';
let totalPages = 1;
const pageSize = 12;

// Fetch games
async function fetchGames(page = 1, search = '') {
  try {
    showLoading();
    let url = `https://api.rawg.io/api/games?key=${apiKey}&page=${page}&page_size=${pageSize}`;
    if (search.trim() !== '') {
      url += `&search=${encodeURIComponent(search)}`;
    }

    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch games');
    const data = await response.json();

    totalPages = Math.ceil(data.count / pageSize);
    pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;

    prevBtn.disabled = currentPage <= 1;
    nextBtn.disabled = currentPage >= totalPages;

    displayGames(data.results);
  } catch (error) {
    gameList.innerHTML = `<p>Error loading games: ${error.message}</p>`;
  } finally {
    hideLoading();
  }
}

function displayGames(games) {
  gameList.innerHTML = '';
  if (games.length === 0) {
    gameList.innerHTML = '<p>No games found.</p>';
    return;
  }

  games.forEach(game => {
    const card = document.createElement('article');
    card.className = 'game-card';
    card.innerHTML = `
      <img src="${game.background_image || 'https://via.placeholder.com/300x170?text=No+Image'}" alt="${game.name}" />
      <h2>${game.name}</h2>
      <p><strong>Released:</strong> ${game.released || 'Unknown'}</p>
      <p><strong>Rating:</strong> ${game.rating || 'N/A'}</p>
      <p><strong>Genres:</strong> ${game.genres.map(g => g.name).join(', ')}</p>
    `;
    card.addEventListener('click', () => showGameDetails(game.id));
    gameList.appendChild(card);
  });
}

async function showGameDetails(gameId) {
  try {
    modal.classList.remove('hidden');
    showLoading();
    modalBody.innerHTML = '<p>Loading details...</p>';

    const response = await fetch(`https://api.rawg.io/api/games/${gameId}?key=${apiKey}`);
    if (!response.ok) throw new Error('Failed to fetch game details');
    const game = await response.json();

    const favoriteKey = `favorite_${game.id}`;
    const isFavorite = localStorage.getItem(favoriteKey) === 'true';

    modalBody.innerHTML = `
      <h2>${game.name}</h2>
      <img src="${game.background_image || 'https://via.placeholder.com/600x300?text=No+Image'}" alt="${game.name}" style="width:100%; border-radius:8px;" />
      <p><strong>Released:</strong> ${game.released || 'Unknown'}</p>
      <p><strong>Rating:</strong> ${game.rating || 'N/A'}</p>
      <p><strong>Genres:</strong> ${game.genres.map(g => g.name).join(', ')}</p>
      <p><strong>Platforms:</strong> ${game.platforms.map(p => p.platform.name).join(', ')}</p>
      <p><strong>Description:</strong></p>
      <p>${game.description_raw || 'No description available.'}</p>
      <a href="${game.website || '#'}" target="_blank" rel="noopener noreferrer">Official Website</a>
      <div class="modal-actions">
        <button id="favorite-btn" class="favorite-btn">${isFavorite ? '💔 Remove from Favorites' : '❤️ Add to Favorites'}</button>
      </div>
      <div class="review-section">
        <h3>Submit a Review</h3>
        <form id="review-form">
          <textarea id="review-text" placeholder="Write your review..." required></textarea>
          <label for="review-rating">Rating:</label>
          <select id="review-rating" required>
            <option value="">Rate</option>
            <option value="1">⭐ 1</option>
            <option value="2">⭐⭐ 2</option>
            <option value="3">⭐⭐⭐ 3</option>
            <option value="4">⭐⭐⭐⭐ 4</option>
            <option value="5">⭐⭐⭐⭐⭐ 5</option>
          </select>
          <button type="submit">Submit Review</button>
        </form>
      </div>
      <div class="existing-reviews">
        <h3>Reviews</h3>
        <ul id="review-list"></ul>
      </div>
    `;

    const favBtn = document.getElementById('favorite-btn');
    favBtn.addEventListener('click', () => {
      const isFav = localStorage.getItem(favoriteKey) === 'true';
      localStorage.setItem(favoriteKey, !isFav);
      favBtn.textContent = !isFav ? '💔 Remove from Favorites' : '❤️ Add to Favorites';
    });

    const reviewForm = document.getElementById('review-form');
    const reviewList = document.getElementById('review-list');
    const reviewKey = `review_${game.id}`;

    function loadReviews() {
      reviewList.innerHTML = '';
      const reviews = JSON.parse(localStorage.getItem(reviewKey)) || [];
      reviews.forEach(r => {
        const li = document.createElement('li');
        li.textContent = `${r.rating}⭐ - ${r.text}`;
        reviewList.appendChild(li);
      });
    }

    reviewForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = document.getElementById('review-text').value;
      const rating = document.getElementById('review-rating').value;
      const reviews = JSON.parse(localStorage.getItem(reviewKey)) || [];
      reviews.push({ text, rating });
      localStorage.setItem(reviewKey, JSON.stringify(reviews));
      reviewForm.reset();
      loadReviews();
    });

    loadReviews();
  } catch (error) {
    modalBody.innerHTML = `<p>Error loading details: ${error.message}</p>`;
  } finally {
    hideLoading();
  }
}

async function populateGenres() {
  const res = await fetch(`https://api.rawg.io/api/genres?key=${apiKey}`);
  const data = await res.json();
  const genreSelect = document.getElementById('genre-filter');
  data.results.forEach(g => {
    const option = document.createElement('option');
    option.value = g.slug;
    option.textContent = g.name;
    genreSelect.appendChild(option);
  });
}

modalClose.addEventListener('click', () => {
  modal.classList.add('hidden');
});

window.addEventListener('click', e => {
  if (e.target === modal) {
    modal.classList.add('hidden');
  }
});

searchButton.addEventListener('click', () => {
  currentSearch = searchInput.value.trim();
  currentPage = 1;
  fetchGames(currentPage, currentSearch);
});

searchInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    searchButton.click();
  }
});

prevBtn.addEventListener('click', () => {
  if (currentPage > 1) {
    currentPage--;
    fetchGames(currentPage, currentSearch);
  }
});

nextBtn.addEventListener('click', () => {
  if (currentPage < totalPages) {
    currentPage++;
    fetchGames(currentPage, currentSearch);
  }
});

fetchGames();

const backToTopBtn = document.getElementById('back-to-top');
window.addEventListener('scroll', () => {
  if (window.scrollY > 300) {
    backToTopBtn.classList.remove('hidden');
  } else {
    backToTopBtn.classList.add('hidden');
  }
});

backToTopBtn.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});
// Theme toggle logic
const themeToggleBtn = document.getElementById("theme-toggle");
const rootElements = [document.body, document.querySelector("header")];

function applyTheme(theme) {
  const modeClass = theme === "dark" ? "dark-mode" : "light-mode";
  const removeClass = theme === "dark" ? "light-mode" : "dark-mode";

  rootElements.forEach(el => {
    el.classList.add(modeClass);
    el.classList.remove(removeClass);
  });

  document.querySelectorAll(".game-card, .modal-content, .review-display, .close, button, .favorite-button").forEach(el => {
    el.classList.add(modeClass);
    el.classList.remove(removeClass);
  });

  themeToggleBtn.textContent = theme === "dark" ? "☀️ Light Mode" : "🌙 Dark Mode";
  localStorage.setItem("theme", theme);
}

themeToggleBtn.addEventListener("click", () => {
  const currentTheme = localStorage.getItem("theme") === "dark" ? "light" : "dark";
  applyTheme(currentTheme);
});

// Load saved theme
window.addEventListener("DOMContentLoaded", () => {
  const savedTheme = localStorage.getItem("theme") || "dark";
  applyTheme(savedTheme);
});
