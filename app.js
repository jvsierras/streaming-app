// Configuración
const API_KEY = '686e8f50b2135e3c32f670ec018df888'; // Reemplaza con tu API key
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/';
const PLACEHOLDER_IMAGE = 'images/placeholder.jpg';

// Variables de estado
let currentPage = {
    movies: 1,
    series: 1,
    search: 1
};
let currentContent = {};
let currentType = '';
let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
let genres = {
    movie: [],
    tv: []
};
let years = generateYearOptions();

// Elementos del DOM
const sections = {
    home: document.getElementById('home'),
    movies: document.getElementById('movies'),
    series: document.getElementById('series'),
    favorites: document.getElementById('favorites'),
    'search-results': document.getElementById('search-results'),
    details: document.getElementById('details')
};

const heroSection = document.getElementById('hero');
const heroTitle = document.getElementById('hero-title');
const heroDescription = document.getElementById('hero-description');
const heroPlayButton = document.getElementById('hero-play');
const heroFavoriteButton = document.getElementById('hero-favorite');
const heroInfoButton = document.getElementById('hero-info');

const popularMoviesCarousel = document.getElementById('popular-movies');
const popularSeriesCarousel = document.getElementById('popular-series');
const moviesGrid = document.getElementById('movies-grid');
const seriesGrid = document.getElementById('series-grid');
const favoritesGrid = document.getElementById('favorites-grid');
const noFavoritesMessage = document.getElementById('no-favorites');
const searchResultsGrid = document.getElementById('search-results-grid');
const searchResultsTitle = document.getElementById('search-results-title');
const searchResultsCount = document.getElementById('search-results-count');
const noResultsMessage = document.getElementById('no-results');
const detailsContainer = document.getElementById('details-container');

const searchInput = document.getElementById('search-input');
const searchButton = document.getElementById('search-button');
const searchType = document.getElementById('search-type');
const searchGenre = document.getElementById('search-genre');
const searchYear = document.getElementById('search-year');

const movieGenre = document.getElementById('movie-genre');
const movieYear = document.getElementById('movie-year');
const movieSort = document.getElementById('movie-sort');
const loadMoreMoviesButton = document.getElementById('load-more-movies');

const seriesGenre = document.getElementById('series-genre');
const seriesYear = document.getElementById('series-year');
const seriesSort = document.getElementById('series-sort');
const loadMoreSeriesButton = document.getElementById('load-more-series');

const modal = document.getElementById('player-modal');
const playerIframe = document.getElementById('player-iframe');
const closeModal = document.querySelector('.close');
const providerButtons = document.getElementById('provider-buttons');

const themeToggle = document.getElementById('theme-toggle');
const toast = document.getElementById('toast');

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    // Cargar géneros
    fetchGenres();
    
    // Llenar opciones de año
    fillYearOptions();
    
    // Cargar contenido inicial
    loadFeaturedContent();
    loadPopularMovies();
    loadPopularSeries();
    loadMovies();
    loadSeries();
    loadFavorites();
    
    // Configurar event listeners
    setupEventListeners();
    
    // Verificar tema guardado
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeToggleIcon(savedTheme);
});

// Funciones de utilidad
function generateYearOptions() {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = currentYear; year >= 1900; year--) {
        years.push(year);
    }
    return years;
}

function fillYearOptions() {
    // Para búsqueda
    years.forEach(year => {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        searchYear.appendChild(option);
    });
    
    // Para películas
    years.forEach(year => {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        movieYear.appendChild(option);
    });
    
    // Para series
    years.forEach(year => {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        seriesYear.appendChild(option);
    });
}

async function fetchGenres() {
    try {
        // Géneros de películas
        const movieResponse = await fetch(`${BASE_URL}/genre/movie/list?api_key=${API_KEY}&language=es`);
        const movieData = await movieResponse.json();
        genres.movie = movieData.genres;
        
        // Géneros de series
        const tvResponse = await fetch(`${BASE_URL}/genre/tv/list?api_key=${API_KEY}&language=es`);
        const tvData = await tvResponse.json();
        genres.tv = tvData.genres;
        
        // Llenar selectores de género
        fillGenreOptions();
    } catch (error) {
        console.error('Error fetching genres:', error);
    }
}

function fillGenreOptions() {
    // Para búsqueda
    genres.movie.forEach(genre => {
        const option = document.createElement('option');
        option.value = genre.id;
        option.textContent = genre.name;
        searchGenre.appendChild(option);
    });
    
    // Para películas
    genres.movie.forEach(genre => {
        const option = document.createElement('option');
        option.value = genre.id;
        option.textContent = genre.name;
        movieGenre.appendChild(option);
    });
    
    // Para series
    genres.tv.forEach(genre => {
        const option = document.createElement('option');
        option.value = genre.id;
        option.textContent = genre.name;
        seriesGenre.appendChild(option);
    });
}

function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

function updateThemeToggleIcon(theme) {
    const icon = themeToggle.querySelector('i');
    icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
}

// Funciones de contenido
async function loadFeaturedContent() {
    try {
        const response = await fetch(`${BASE_URL}/trending/all/week?api_key=${API_KEY}&language=es`);
        const data = await response.json();
        
        if (!data.results || data.results.length === 0) return;
        
        const featured = data.results[0];
        currentContent = featured;
        currentType = featured.media_type;
        
        // Actualizar hero section
        heroTitle.textContent = featured.title || featured.name;
        heroDescription.textContent = featured.overview || 'Descripción no disponible';
        
        if (featured.backdrop_path) {
            heroSection.style.backgroundImage = `url(${IMAGE_BASE_URL}original${featured.backdrop_path})`;
        }
        
        // Configurar botones
        heroPlayButton.onclick = () => openPlayer(featured.id, currentType);
        heroInfoButton.onclick = () => showDetails(featured.id, currentType);
        
        // Actualizar botón de favoritos
        updateFavoriteButton();
    } catch (error) {
        console.error('Error loading featured content:', error);
    }
}

async function loadPopularMovies() {
    try {
        const response = await fetch(`${BASE_URL}/movie/popular?api_key=${API_KEY}&language=es&page=1`);
        const data = await response.json();
        
        if (!data.results) return;
        
        popularMoviesCarousel.innerHTML = data.results.slice(0, 10).map(movie => createCard(movie, 'movie')).join('');
    } catch (error) {
        console.error('Error loading popular movies:', error);
    }
}

async function loadPopularSeries() {
    try {
        const response = await fetch(`${BASE_URL}/tv/popular?api_key=${API_KEY}&language=es&page=1`);
        const data = await response.json();
        
        if (!data.results) return;
        
        popularSeriesCarousel.innerHTML = data.results.slice(0, 10).map(series => createCard(series, 'tv')).join('');
    } catch (error) {
        console.error('Error loading popular series:', error);
    }
}

async function loadMovies() {
    try {
        const genre = movieGenre.value !== 'all' ? `&with_genres=${movieGenre.value}` : '';
        const year = movieYear.value !== 'all' ? `&primary_release_year=${movieYear.value}` : '';
        const sort = movieSort.value ? `&sort_by=${movieSort.value}` : '';
        
        const response = await fetch(`${BASE_URL}/discover/movie?api_key=${API_KEY}&language=es&page=${currentPage.movies}${genre}${year}${sort}`);
        const data = await response.json();
        
        if (!data.results) return;
        
        if (currentPage.movies === 1) {
            moviesGrid.innerHTML = data.results.map(movie => createCard(movie, 'movie')).join('');
        } else {
            moviesGrid.innerHTML += data.results.map(movie => createCard(movie, 'movie')).join('');
        }
        
        // Mostrar u ocultar botón de cargar más
        loadMoreMoviesButton.style.display = data.page < data.total_pages ? 'block' : 'none';
    } catch (error) {
        console.error('Error loading movies:', error);
    }
}

async function loadSeries() {
    try {
        const genre = seriesGenre.value !== 'all' ? `&with_genres=${seriesGenre.value}` : '';
        const year = seriesYear.value !== 'all' ? `&first_air_date_year=${seriesYear.value}` : '';
        const sort = seriesSort.value ? `&sort_by=${seriesSort.value}` : '';
        
        const response = await fetch(`${BASE_URL}/discover/tv?api_key=${API_KEY}&language=es&page=${currentPage.series}${genre}${year}${sort}`);
        const data = await response.json();
        
        if (!data.results) return;
        
        if (currentPage.series === 1) {
            seriesGrid.innerHTML = data.results.map(series => createCard(series, 'tv')).join('');
        } else {
            seriesGrid.innerHTML += data.results.map(series => createCard(series, 'tv')).join('');
        }
        
        // Mostrar u ocultar botón de cargar más
        loadMoreSeriesButton.style.display = data.page < data.total_pages ? 'block' : 'none';
    } catch (error) {
        console.error('Error loading series:', error);
    }
}

function loadFavorites() {
    if (favorites.length === 0) {
        noFavoritesMessage.style.display = 'flex';
        favoritesGrid.style.display = 'none';
        return;
    }
    
    noFavoritesMessage.style.display = 'none';
    favoritesGrid.style.display = 'grid';
    favoritesGrid.innerHTML = favorites.map(item => createCard(item, item.media_type)).join('');
}

async function searchContent(query) {
    if (!query || query.length < 3) {
        noResultsMessage.style.display = 'flex';
        searchResultsGrid.style.display = 'none';
        return;
    }
    
    try {
        const type = searchType.value !== 'all' ? searchType.value : 'multi';
        const genre = searchGenre.value !== 'all' ? `&with_genres=${searchGenre.value}` : '';
        const year = searchYear.value !== 'all' ? `&year=${searchYear.value}` : '';
        
        const response = await fetch(`${BASE_URL}/search/${type}?api_key=${API_KEY}&language=es&query=${query}&page=${currentPage.search}${genre}${year}`);
        const data = await response.json();
        
        showSearchResults();
        searchResultsTitle.textContent = `Resultados para: "${query}"`;
        
        if (!data.results || data.results.length === 0) {
            noResultsMessage.style.display = 'flex';
            searchResultsGrid.style.display = 'none';
            searchResultsCount.textContent = '0 resultados';
            return;
        }
        
        noResultsMessage.style.display = 'none';
        searchResultsGrid.style.display = 'grid';
        searchResultsCount.textContent = `${data.total_results} resultados`;
        
        if (currentPage.search === 1) {
            searchResultsGrid.innerHTML = data.results.map(item => {
                const mediaType = item.media_type || type;
                return createCard(item, mediaType);
            }).join('');
        } else {
            searchResultsGrid.innerHTML += data.results.map(item => {
                const mediaType = item.media_type || type;
                return createCard(item, mediaType);
            }).join('');
        }
    } catch (error) {
        console.error('Error searching content:', error);
    }
}

async function showDetails(id, type) {
    try {
        const response = await fetch(`${BASE_URL}/${type}/${id}?api_key=${API_KEY}&language=es&append_to_response=${type === 'tv' ? 'credits,content_ratings,external_ids' : 'credits,release_dates,external_ids'}`);
        const data = await response.json();
        
        // Ocultar todas las secciones
        Object.values(sections).forEach(section => {
            section.classList.remove('active');
        });
        
        // Mostrar sección de detalles
        sections.details.classList.add('active');
        
        // Crear contenido de detalles
        detailsContainer.innerHTML = createDetailsContent(data, type);
        
        // Configurar botones
        document.getElementById('details-play').onclick = () => openPlayer(id, type);
        document.getElementById('details-favorite').onclick = () => toggleFavorite(data, type);
        
        // Si es una serie, cargar temporadas
        if (type === 'tv') {
            loadSeasons(id);
        }
    } catch (error) {
        console.error('Error loading details:', error);
    }
}

async function loadSeasons(seriesId) {
    try {
        const response = await fetch(`${BASE_URL}/tv/${seriesId}?api_key=${API_KEY}&language=es`);
        const data = await response.json();
        
        const seasonsContainer = document.getElementById('seasons-container');
        if (!seasonsContainer) return;
        
        // Crear selector de temporadas
        const seasonSelector = document.createElement('div');
        seasonSelector.className = 'season-selector';
        seasonSelector.innerHTML = `
            <h3>Temporadas</h3>
            <div class="season-buttons" id="season-buttons"></div>
        `;
        
        const seasonButtons = seasonSelector.querySelector('#season-buttons');
        data.seasons.forEach(season => {
            const button = document.createElement('button');
            button.className = 'season-button';
            button.textContent = season.season_number === 0 ? 'Especiales' : `Temporada ${season.season_number}`;
            button.onclick = () => loadEpisodes(seriesId, season.season_number);
            
            // Marcar primera temporada como activa por defecto
            if (season.season_number === 1) {
                button.classList.add('active');
                loadEpisodes(seriesId, 1);
            }
            
            seasonButtons.appendChild(button);
        });
        
        seasonsContainer.appendChild(seasonSelector);
    } catch (error) {
        console.error('Error loading seasons:', error);
    }
}

async function loadEpisodes(seriesId, seasonNumber) {
    try {
        // Actualizar botones de temporada
        document.querySelectorAll('.season-button').forEach(button => {
            button.classList.remove('active');
        });
        event.target.classList.add('active');
        
        const response = await fetch(`${BASE_URL}/tv/${seriesId}/season/${seasonNumber}?api_key=${API_KEY}&language=es`);
        const data = await response.json();
        
        const episodesContainer = document.getElementById('episodes-container');
        if (!episodesContainer) return;
        
        episodesContainer.innerHTML = `
            <h3>Episodios</h3>
            <div class="episodes-grid" id="episodes-grid"></div>
        `;
        
        const episodesGrid = episodesContainer.querySelector('#episodes-grid');
        episodesGrid.innerHTML = data.episodes.map(episode => createEpisodeCard(episode, seriesId, seasonNumber)).join('');
    } catch (error) {
        console.error('Error loading episodes:', error);
    }
}

// Funciones para crear elementos
function createCard(item, type) {
    const isFavorite = favorites.some(fav => fav.id === item.id && fav.media_type === type);
    
    return `
        <div class="card" onclick="showDetails(${item.id}, '${type}')">
            <img src="${item.poster_path ? IMAGE_BASE_URL + 'w300' + item.poster_path : PLACEHOLDER_IMAGE}" 
                 alt="${item.title || item.name}" 
                 onerror="this.src='${PLACEHOLDER_IMAGE}'">
            <div class="info">
                <div class="title">${item.title || item.name}</div>
                <div class="meta">
                    <span>${type === 'movie' ? item.release_date?.substring(0, 4) || 'N/A' : item.first_air_date?.substring(0, 4) || 'N/A'}</span>
                    <span class="rating"><i class="fas fa-star"></i> ${item.vote_average?.toFixed(1) || 'N/A'}</span>
                </div>
            </div>
            <button class="favorite ${isFavorite ? 'favorited' : ''}" 
                    onclick="event.stopPropagation(); toggleFavorite(${JSON.stringify(item)}, '${type}')">
                <i class="fas fa-heart"></i>
            </button>
        </div>
    `;
}

function createDetailsContent(data, type) {
    const isFavorite = favorites.some(fav => fav.id === data.id && fav.media_type === type);
    const year = type === 'movie' ? data.release_date?.substring(0, 4) : data.first_air_date?.substring(0, 4);
    const runtime = type === 'movie' ? 
        `${Math.floor(data.runtime / 60)}h ${data.runtime % 60}m` : 
        `${data.number_of_seasons} temporada${data.number_of_seasons !== 1 ? 's' : ''}, ${data.number_of_episodes} episodio${data.number_of_episodes !== 1 ? 's' : ''}`;
    
    const genres = data.genres?.map(genre => genre.name).join(', ') || 'N/A';
    const cast = data.credits?.cast.slice(0, 5).map(person => person.name).join(', ') || 'N/A';
    
    return `
        <div class="details-backdrop" style="background-image: url(${IMAGE_BASE_URL}original${data.backdrop_path})"></div>
        <div class="details-content">
            <div class="details-poster">
                <img src="${IMAGE_BASE_URL}w300${data.poster_path}" alt="${data.title || data.name}">
            </div>
            <div class="details-info">
                <h1 class="details-title">${data.title || data.name}</h1>
                <div class="details-meta">
                    <span><i class="fas fa-star"></i> ${data.vote_average?.toFixed(1) || 'N/A'}</span>
                    <span><i class="fas fa-calendar-alt"></i> ${year || 'N/A'}</span>
                    <span><i class="fas fa-clock"></i> ${runtime || 'N/A'}</span>
                    <span><i class="fas fa-tag"></i> ${genres}</span>
                </div>
                <div class="details-actions">
                    <button id="details-play" class="play-button"><i class="fas fa-play"></i> Reproducir</button>
                    <button id="details-favorite" class="favorite-button ${isFavorite ? 'favorited' : ''}">
                        <i class="fas fa-heart"></i> Favorito
                    </button>
                </div>
                <p class="details-overview">${data.overview || 'Descripción no disponible.'}</p>
                <div class="details-facts">
                    <div class="details-fact">
                        <h4>Reparto</h4>
                        <p>${cast}</p>
                    </div>
                    <div class="details-fact">
                        <h4>Estado</h4>
                        <p>${data.status || 'N/A'}</p>
                    </div>
                    <div class="details-fact">
                        <h4>Idioma original</h4>
                        <p>${data.original_language ? data.original_language.toUpperCase() : 'N/A'}</p>
                    </div>
                    ${type === 'movie' ? `
                    <div class="details-fact">
                        <h4>Presupuesto</h4>
                        <p>${data.budget ? '$' + data.budget.toLocaleString() : 'N/A'}</p>
                    </div>
                    <div class="details-fact">
                        <h4>Recaudación</h4>
                        <p>${data.revenue ? '$' + data.revenue.toLocaleString() : 'N/A'}</p>
                    </div>
                    ` : ''}
                </div>
                ${type === 'tv' ? '<div class="seasons-container" id="seasons-container"></div>' : ''}
            </div>
        </div>
        ${type === 'tv' ? '<div id="episodes-container"></div>' : ''}
    `;
}

function createEpisodeCard(episode, seriesId, seasonNumber) {
    return `
        <div class="episode-card" onclick="openPlayer(${seriesId}, 'tv', ${seasonNumber}, ${episode.episode_number})">
            <img src="${episode.still_path ? IMAGE_BASE_URL + 'w300' + episode.still_path : PLACEHOLDER_IMAGE}" 
                 alt="${episode.name}" 
                 onerror="this.src='${PLACEHOLDER_IMAGE}'">
            <div class="episode-info">
                <div class="episode-title">
                    <span>${episode.episode_number}. ${episode.name}</span>
                    <span><i class="fas fa-star"></i> ${episode.vote_average?.toFixed(1) || 'N/A'}</span>
                </div>
                <p class="episode-overview">${episode.overview || 'Descripción no disponible.'}</p>
            </div>
        </div>
    `;
}

// Funciones de interacción
function showSection(sectionId) {
    // Actualizar navegación
    document.querySelectorAll('nav a').forEach(link => {
        link.classList.remove('active');
    });
    
    if (sectionId !== 'search-results') {
        event.target.classList.add('active');
    }
    
    // Mostrar sección seleccionada
    Object.values(sections).forEach(section => {
        section.classList.remove('active');
    });
    
    sections[sectionId].classList.add('active');
    
    // Scroll al inicio
    window.scrollTo(0, 0);
}

function showSearchResults() {
    showSection('search-results');
    currentPage.search = 1;
}

function openPlayer(id, type, season = 1, episode = 1) {
    // Configurar proveedores
    providerButtons.innerHTML = '';
    
    if (type === 'movie') {
        const providers = [
            { name: 'MultiEmbed', url: `https://multiembed.mov/?video_id=${id}&tmdb=1` },
            { name: 'VidSrc', url: `https://vidsrc.xyz/embed/movie?tmdb=${id}&ds_lang=Spanish` },
            { name: '2Embed', url: `https://www.2embed.cc/embed/${id}` },
            { name: 'AutoEmbed', url: `https://autoembed.co/movie/tmdb/${id}` }
        ];
        
        providers.forEach(provider => {
            const button = document.createElement('button');
            button.className = 'provider-button';
            button.textContent = provider.name;
            button.onclick = () => {
                playerIframe.src = provider.url;
                providerButtons.querySelectorAll('.provider-button').forEach(btn => {
                    btn.classList.remove('active');
                });
                button.classList.add('active');
            };
            providerButtons.appendChild(button);
        });
        
        // Seleccionar primer proveedor por defecto
        if (providers.length > 0) {
            playerIframe.src = providers[0].url;
            providerButtons.children[0].classList.add('active');
        }
    } else if (type === 'tv') {
        const provider = { name: 'AutoEmbed', url: `https://autoembed.co/tv/tmdb/${id}-${season}-${episode}` };
        
        const button = document.createElement('button');
        button.className = 'provider-button active';
        button.textContent = provider.name;
        button.onclick = () => {
            playerIframe.src = provider.url;
        };
        providerButtons.appendChild(button);
        
        playerIframe.src = provider.url;
    }
    
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closePlayer() {
    modal.style.display = 'none';
    playerIframe.src = '';
    document.body.style.overflow = 'auto';
}

function toggleFavorite(item, type) {
    const index = favorites.findIndex(fav => fav.id === item.id && fav.media_type === type);
    
    if (index === -1) {
        // Agregar a favoritos
        favorites.push({
            id: item.id,
            media_type: type,
            title: item.title || item.name,
            poster_path: item.poster_path,
            vote_average: item.vote_average,
            release_date: item.release_date || item.first_air_date
        });
        showToast('Agregado a favoritos');
    } else {
        // Quitar de favoritos
        favorites.splice(index, 1);
        showToast('Eliminado de favoritos');
    }
    
    // Actualizar almacenamiento local
    localStorage.setItem('favorites', JSON.stringify(favorites));
    
    // Actualizar botones de favoritos
    updateFavoriteButton();
    
    // Si estamos en la sección de favoritos, recargar
    if (sections.favorites.classList.contains('active')) {
        loadFavorites();
    }
    
    // Actualizar todos los botones de favorito en las tarjetas
    document.querySelectorAll('.favorite').forEach(button => {
        if (parseInt(button.getAttribute('data-id')) === item.id && button.getAttribute('data-type') === type) {
            button.classList.toggle('favorited');
        }
    });
}

function updateFavoriteButton() {
    if (!currentContent.id) return;
    
    const isFavorite = favorites.some(fav => fav.id === currentContent.id && fav.media_type === currentType);
    
    heroFavoriteButton.classList.toggle('favorited', isFavorite);
    heroFavoriteButton.innerHTML = isFavorite ? 
        '<i class="fas fa-heart"></i> Favorito' : 
        '<i class="far fa-heart"></i> Favorito';
    
    const detailsFavoriteButton = document.getElementById('details-favorite');
    if (detailsFavoriteButton) {
        detailsFavoriteButton.classList.toggle('favorited', isFavorite);
        detailsFavoriteButton.innerHTML = isFavorite ? 
            '<i class="fas fa-heart"></i> Favorito' : 
            '<i class="far fa-heart"></i> Favorito';
    }
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeToggleIcon(newTheme);
}

// Configurar event listeners
function setupEventListeners() {
    // Navegación
    document.querySelectorAll('nav a').forEach(link => {
        link.addEventListener('click', showSection.bind(null, link.getAttribute('data-section')));
    });
    
    // Búsqueda
    searchButton.addEventListener('click', () => {
        currentPage.search = 1;
        searchContent(searchInput.value.trim());
    });
    
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            currentPage.search = 1;
            searchContent(searchInput.value.trim());
        }
    });
    
    // Búsqueda en tiempo real con debounce
    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        const query = e.target.value.trim();
        
        if (query.length >= 3) {
            searchTimeout = setTimeout(() => {
                currentPage.search = 1;
                searchContent(query);
            }, 500);
        }
    });
    
    // Filtros de búsqueda
    searchType.addEventListener('change', () => {
        if (searchInput.value.trim().length >= 3) {
            currentPage.search = 1;
            searchContent(searchInput.value.trim());
        }
    });
    
    searchGenre.addEventListener('change', () => {
        if (searchInput.value.trim().length >= 3) {
            currentPage.search = 1;
            searchContent(searchInput.value.trim());
        }
    });
    
    searchYear.addEventListener('change', () => {
        if (searchInput.value.trim().length >= 3) {
            currentPage.search = 1;
            searchContent(searchInput.value.trim());
        }
    });
    
    // Filtros de películas
    movieGenre.addEventListener('change', () => {
        currentPage.movies = 1;
        loadMovies();
    });
    
    movieYear.addEventListener('change', () => {
        currentPage.movies = 1;
        loadMovies();
    });
    
    movieSort.addEventListener('change', () => {
        currentPage.movies = 1;
        loadMovies();
    });
    
    loadMoreMoviesButton.addEventListener('click', () => {
        currentPage.movies++;
        loadMovies();
    });
    
    // Filtros de series
    seriesGenre.addEventListener('change', () => {
        currentPage.series = 1;
        loadSeries();
    });
    
    seriesYear.addEventListener('change', () => {
        currentPage.series = 1;
        loadSeries();
    });
    
    seriesSort.addEventListener('change', () => {
        currentPage.series = 1;
        loadSeries();
    });
    
    loadMoreSeriesButton.addEventListener('click', () => {
        currentPage.series++;
        loadSeries();
    });
    
    // Reproductor
    closeModal.addEventListener('click', closePlayer);
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            closePlayer();
        }
    });
    
    // Tema
    themeToggle.addEventListener('click', toggleTheme);
    
    // Botón de retroceso para detalles
    window.addEventListener('popstate', (e) => {
        if (sections.details.classList.contains('active')) {
            showSection('home');
        }
    });
}