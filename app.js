// Main Application Logic

// Store user ratings for collaborative filtering
let currentUserRatings = {};

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Populate movie dropdowns
    populateMovieSelects();
    
    // Populate genre filter
    populateGenreFilter();
    
    // Show statistics
    updateStatistics();
    
    // Load movies to rate for collaborative filtering
    loadMoviesToRate();
    
    // Add search on enter key
    document.getElementById('search-movie').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchMovies();
        }
    });
}

// Populate movie select dropdowns
function populateMovieSelects() {
    const selects = ['movie-select', 'hybrid-movie-select'];
    
    selects.forEach(selectId => {
        const select = document.getElementById(selectId);
        movies.forEach(movie => {
            const option = document.createElement('option');
            option.value = movie.id;
            option.textContent = `${movie.title} (${movie.year})`;
            select.appendChild(option);
        });
    });
}

// Populate genre filter
function populateGenreFilter() {
    const genreSelect = document.getElementById('filter-genre');
    const genres = getAllGenres();
    
    genres.forEach(genre => {
        const option = document.createElement('option');
        option.value = genre;
        option.textContent = genre;
        genreSelect.appendChild(option);
    });
}

// Update statistics display
function updateStatistics() {
    const stats = recommender.getStatistics();
    document.getElementById('total-movies').textContent = stats.totalMovies;
    document.getElementById('total-genres').textContent = stats.totalGenres;
    document.getElementById('avg-rating').textContent = stats.avgRating;
}

// Switch between tabs
function switchTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Remove active class from all buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById(tabName).classList.add('active');
    
    // Add active class to clicked button
    event.target.classList.add('active');
}

// CONTENT-BASED RECOMMENDATIONS
function getContentBasedRecommendations() {
    const movieId = parseInt(document.getElementById('movie-select').value);
    const numRecs = parseInt(document.getElementById('num-recommendations').value);
    const resultsDiv = document.getElementById('content-results');
    
    if (!movieId) {
        resultsDiv.innerHTML = '<div class="no-results">Please select a movie first.</div>';
        return;
    }
    
    resultsDiv.innerHTML = '<div class="loading">Finding similar movies...</div>';
    
    setTimeout(() => {
        const recommendations = recommender.getContentBasedRecommendations(movieId, numRecs);
        const selectedMovie = movies.find(m => m.id === movieId);
        
        let html = `
            <div class="recommendations-info" style="margin-top: 30px;">
                <strong>Based on your interest in "${selectedMovie.title}"</strong><br>
                These movies share similar genres, directors, or themes.
            </div>
            <div class="movie-grid">
        `;
        
        recommendations.forEach(movie => {
            html += createMovieCard(movie, true);
        });
        
        html += '</div>';
        resultsDiv.innerHTML = html;
    }, 500);
}

// COLLABORATIVE FILTERING
function loadMoviesToRate() {
    const moviesToRate = recommender.getRandomMoviesForRating(8);
    const container = document.getElementById('movies-to-rate');
    
    let html = '';
    moviesToRate.forEach(movie => {
        html += `
            <div class="movie-card">
                <div class="movie-title">${movie.title}</div>
                <div class="movie-meta">${movie.year} • ${movie.genres.join(', ')}</div>
                <div class="user-rating-input">
                    <label style="margin: 0;">Your Rating:</label>
                    <input type="number" min="1" max="5" step="0.5" 
                           id="rating-${movie.id}" 
                           onchange="updateUserRating(${movie.id}, this.value)"
                           placeholder="1-5">
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

function updateUserRating(movieId, rating) {
    const numRating = parseFloat(rating);
    if (numRating >= 1 && numRating <= 5) {
        currentUserRatings[movieId] = numRating;
    }
}

function getCollaborativeRecommendations() {
    const resultsDiv = document.getElementById('collaborative-results');
    
    if (Object.keys(currentUserRatings).length < 3) {
        resultsDiv.innerHTML = '<div class="no-results">Please rate at least 3 movies to get personalized recommendations.</div>';
        return;
    }
    
    resultsDiv.innerHTML = '<div class="loading">Finding movies you might like based on similar users...</div>';
    
    setTimeout(() => {
        const recommendations = recommender.getCollaborativeRecommendations(currentUserRatings, 8);
        
        if (recommendations.length === 0) {
            resultsDiv.innerHTML = '<div class="no-results">Not enough data to make recommendations. Try rating more movies!</div>';
            return;
        }
        
        let html = `
            <div class="recommendations-info" style="margin-top: 30px;">
                <strong>Personalized Recommendations</strong><br>
                Based on users with similar taste, you might enjoy these movies.
            </div>
            <div class="movie-grid">
        `;
        
        recommendations.forEach(movie => {
            html += createMovieCard(movie, true, true);
        });
        
        html += '</div>';
        resultsDiv.innerHTML = html;
    }, 500);
}

// HYBRID RECOMMENDATIONS
function getHybridRecommendations() {
    const movieId = parseInt(document.getElementById('hybrid-movie-select').value);
    const numRecs = parseInt(document.getElementById('hybrid-num').value);
    const resultsDiv = document.getElementById('hybrid-results');
    
    if (!movieId) {
        resultsDiv.innerHTML = '<div class="no-results">Please select a movie first.</div>';
        return;
    }
    
    resultsDiv.innerHTML = '<div class="loading">Analyzing with hybrid AI algorithm...</div>';
    
    setTimeout(() => {
        // Use existing user ratings if available, otherwise use empty object
        const recommendations = recommender.getHybridRecommendations(movieId, currentUserRatings, numRecs);
        const selectedMovie = movies.find(m => m.id === movieId);
        
        let html = `
            <div class="recommendations-info" style="margin-top: 30px;">
                <strong>Smart Recommendations for "${selectedMovie.title}"</strong><br>
                Combining content similarity and collaborative patterns for best results.
            </div>
            <div class="movie-grid">
        `;
        
        recommendations.forEach(movie => {
            html += createMovieCard(movie, true, false, true);
        });
        
        html += '</div>';
        resultsDiv.innerHTML = html;
    }, 500);
}

// BROWSE AND SEARCH
function searchMovies() {
    const query = document.getElementById('search-movie').value;
    const genre = document.getElementById('filter-genre').value;
    const resultsDiv = document.getElementById('browse-results');
    
    resultsDiv.innerHTML = '<div class="loading">Searching movies...</div>';
    
    setTimeout(() => {
        let results = movies;
        
        if (query) {
            results = recommender.searchMovies(query);
        }
        
        if (genre) {
            results = results.filter(movie => movie.genres.includes(genre));
        }
        
        if (results.length === 0) {
            resultsDiv.innerHTML = '<div class="no-results">No movies found matching your criteria.</div>';
            return;
        }
        
        let html = '<div class="movie-grid">';
        results.forEach(movie => {
            html += createMovieCard(movie, false);
        });
        html += '</div>';
        
        resultsDiv.innerHTML = html;
    }, 300);
}

// Create movie card HTML
function createMovieCard(movie, showSimilarity = false, showPredicted = false, showMethod = false) {
    const genreTags = movie.genres.map(g => `<span class="genre-tag">${g}</span>`).join('');
    
    let similarityHtml = '';
    if (showSimilarity) {
        similarityHtml = `<div class="similarity-score">Match: ${movie.similarityScore}%</div>`;
    }
    
    let predictedRatingHtml = '';
    if (showPredicted && movie.predictedRating) {
        predictedRatingHtml = `<div class="similarity-score">Predicted Rating: ${movie.predictedRating}/5</div>`;
    }
    
    let methodHtml = '';
    if (showMethod && movie.method) {
        methodHtml = `<div style="font-size: 0.8em; color: var(--accent); margin-top: 8px;">Method: ${movie.method}</div>`;
    }
    
    return `
        <div class="movie-card">
            <div class="movie-title">${movie.title}</div>
            <div class="movie-meta">${movie.year} • ${movie.director}</div>
            <div class="movie-genres">${genreTags}</div>
            <div class="rating">
                <span class="star">★</span>
                <span class="rating-value">${movie.rating}/10</span>
            </div>
            ${similarityHtml}
            ${predictedRatingHtml}
            ${methodHtml}
            <div style="margin-top: 12px; font-size: 0.9em; color: rgba(255,255,255,0.7);">
                ${movie.description}
            </div>
        </div>
    `;
}

// Utility function to show messages
function showMessage(elementId, message, type = 'info') {
    const element = document.getElementById(elementId);
    element.innerHTML = `<div class="${type}">${message}</div>`;
}
