// AI-Based Recommendation Engine

class MovieRecommender {
    constructor(movies, userRatings) {
        this.movies = movies;
        this.userRatings = userRatings;
    }

    // CONTENT-BASED FILTERING
    // Recommends movies similar to a given movie based on genres, director, etc.
    getContentBasedRecommendations(movieId, numRecommendations = 5) {
        const targetMovie = this.movies.find(m => m.id === movieId);
        if (!targetMovie) return [];

        // Calculate similarity scores for all other movies
        const recommendations = this.movies
            .filter(m => m.id !== movieId)
            .map(movie => ({
                ...movie,
                similarityScore: this.calculateContentSimilarity(targetMovie, movie)
            }))
            .sort((a, b) => b.similarityScore - a.similarityScore)
            .slice(0, numRecommendations);

        return recommendations;
    }

    // Calculate similarity between two movies based on attributes
    calculateContentSimilarity(movie1, movie2) {
        let score = 0;

        // Genre similarity (most important factor - 50%)
        const genreScore = this.calculateGenreSimilarity(movie1.genres, movie2.genres);
        score += genreScore * 0.5;

        // Director similarity (20%)
        if (movie1.director === movie2.director) {
            score += 0.2;
        }

        // Year proximity (15% - movies from similar era)
        const yearDiff = Math.abs(movie1.year - movie2.year);
        const yearScore = Math.max(0, 1 - (yearDiff / 50)); // Normalize to 0-1
        score += yearScore * 0.15;

        // Rating similarity (15% - similar quality)
        const ratingDiff = Math.abs(movie1.rating - movie2.rating);
        const ratingScore = Math.max(0, 1 - (ratingDiff / 5));
        score += ratingScore * 0.15;

        return Math.round(score * 100); // Return as percentage
    }

    // Calculate genre overlap using Jaccard similarity
    calculateGenreSimilarity(genres1, genres2) {
        const set1 = new Set(genres1);
        const set2 = new Set(genres2);
        
        const intersection = new Set([...set1].filter(x => set2.has(x)));
        const union = new Set([...set1, ...set2]);
        
        return intersection.size / union.size;
    }

    // COLLABORATIVE FILTERING
    // Recommends movies based on similar users' preferences
    getCollaborativeRecommendations(currentUserRatings, numRecommendations = 5) {
        if (Object.keys(currentUserRatings).length === 0) {
            return [];
        }

        // Find similar users based on rating patterns
        const userSimilarities = this.userRatings.map(user => ({
            userId: user.userId,
            similarity: this.calculateUserSimilarity(currentUserRatings, user.ratings)
        }))
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 5); // Consider top 5 similar users

        // Get movie recommendations from similar users
        const movieScores = {};
        
        userSimilarities.forEach(({ userId, similarity }) => {
            const user = this.userRatings.find(u => u.userId === userId);
            
            Object.keys(user.ratings).forEach(movieId => {
                const id = parseInt(movieId);
                
                // Skip movies the current user has already rated
                if (currentUserRatings[id]) return;
                
                if (!movieScores[id]) {
                    movieScores[id] = { totalScore: 0, count: 0 };
                }
                
                // Weight the rating by user similarity
                movieScores[id].totalScore += user.ratings[id] * similarity;
                movieScores[id].count += similarity;
            });
        });

        // Calculate average weighted scores and get recommendations
        const recommendations = Object.keys(movieScores)
            .map(movieId => {
                const id = parseInt(movieId);
                const movie = this.movies.find(m => m.id === id);
                const avgScore = movieScores[id].totalScore / movieScores[id].count;
                
                return {
                    ...movie,
                    predictedRating: avgScore.toFixed(1),
                    similarityScore: Math.round((avgScore / 5) * 100)
                };
            })
            .sort((a, b) => b.predictedRating - a.predictedRating)
            .slice(0, numRecommendations);

        return recommendations;
    }

    // Calculate similarity between two users using Pearson correlation
    calculateUserSimilarity(ratings1, ratings2) {
        const commonMovies = Object.keys(ratings1).filter(id => ratings2[id]);
        
        if (commonMovies.length === 0) return 0;

        // Calculate means
        const mean1 = commonMovies.reduce((sum, id) => sum + ratings1[id], 0) / commonMovies.length;
        const mean2 = commonMovies.reduce((sum, id) => sum + ratings2[id], 0) / commonMovies.length;

        // Calculate Pearson correlation
        let numerator = 0;
        let denominator1 = 0;
        let denominator2 = 0;

        commonMovies.forEach(id => {
            const diff1 = ratings1[id] - mean1;
            const diff2 = ratings2[id] - mean2;
            
            numerator += diff1 * diff2;
            denominator1 += diff1 * diff1;
            denominator2 += diff2 * diff2;
        });

        if (denominator1 === 0 || denominator2 === 0) return 0;

        const correlation = numerator / Math.sqrt(denominator1 * denominator2);
        
        // Normalize to 0-1 range
        return (correlation + 1) / 2;
    }

    // HYBRID RECOMMENDATION SYSTEM
    // Combines content-based and collaborative filtering
    getHybridRecommendations(movieId, currentUserRatings, numRecommendations = 5) {
        // Get recommendations from both approaches
        const contentRecs = this.getContentBasedRecommendations(movieId, 15);
        const collabRecs = this.getCollaborativeRecommendations(currentUserRatings, 15);

        // Create a map of movies with combined scores
        const movieScores = {};

        // Add content-based scores (weight: 0.6)
        contentRecs.forEach(movie => {
            movieScores[movie.id] = {
                movie: movie,
                contentScore: movie.similarityScore * 0.6,
                collabScore: 0
            };
        });

        // Add collaborative scores (weight: 0.4)
        collabRecs.forEach(movie => {
            if (movieScores[movie.id]) {
                movieScores[movie.id].collabScore = movie.similarityScore * 0.4;
            } else {
                movieScores[movie.id] = {
                    movie: movie,
                    contentScore: 0,
                    collabScore: movie.similarityScore * 0.4
                };
            }
        });

        // Calculate final hybrid scores
        const recommendations = Object.values(movieScores)
            .map(({ movie, contentScore, collabScore }) => ({
                ...movie,
                similarityScore: Math.round(contentScore + collabScore),
                method: contentScore > 0 && collabScore > 0 ? 'Hybrid' : 
                       contentScore > 0 ? 'Content' : 'Collaborative'
            }))
            .sort((a, b) => b.similarityScore - a.similarityScore)
            .slice(0, numRecommendations);

        return recommendations;
    }

    // Get movies by genre
    getMoviesByGenre(genre) {
        if (!genre) return this.movies;
        return this.movies.filter(movie => movie.genres.includes(genre));
    }

    // Search movies by title
    searchMovies(query) {
        const lowerQuery = query.toLowerCase();
        return this.movies.filter(movie => 
            movie.title.toLowerCase().includes(lowerQuery)
        );
    }

    // Get movie statistics
    getStatistics() {
        const totalMovies = this.movies.length;
        const genres = getAllGenres();
        const avgRating = (this.movies.reduce((sum, m) => sum + m.rating, 0) / totalMovies).toFixed(1);
        
        return {
            totalMovies,
            totalGenres: genres.length,
            avgRating
        };
    }

    // Get random movies for rating (collaborative filtering setup)
    getRandomMoviesForRating(count = 8) {
        const shuffled = [...this.movies].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    }
}

// Initialize the recommender system
const recommender = new MovieRecommender(movies, userRatings);
