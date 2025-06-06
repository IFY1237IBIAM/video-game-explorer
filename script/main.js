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

// Fetch games (popular or search)
async function fetchGames(page = 1, search = '') {
  try {
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
  }
}

// Display games as cards
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

// Show detailed info modal
async function showGameDetails(gameId) {
  try {
    modal.classList.remove('hidden');
    modalBody.innerHTML = '<p>Loading details...</p>';

    const response = await fetch(`https://api.rawg.io/api/games/${gameId}?key=${apiKey}`);
    if (!response.ok) throw new Error('Failed to fetch game details');
    const game = await response.json();

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
    `;
  } catch (error) {
    modalBody.innerHTML = `<p>Error loading details: ${error.message}</p>`;
  }
}

// Close modal
modalClose.addEventListener('click', () => {
  modal.classList.add('hidden');
});

// Close modal on outside click
window.addEventListener('click', e => {
  if (e.target === modal) {
    modal.classList.add('hidden');
  }
});

// Search button click
searchButton.addEventListener('click', () => {
  currentSearch = searchInput.value.trim();
  currentPage = 1;
  fetchGames(currentPage, currentSearch);
});

// Enter key triggers search
searchInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    searchButton.click();
  }
});

// Pagination buttons
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

// Initial fetch of popular games on load
fetchGames();
