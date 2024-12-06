const API_URL = 'https://free-to-play-games-database.p.rapidapi.com/api/games';
const RAPIDAPI_KEY = '6092be9ecamsh9db44a30f6f4725p1f2b32jsn9243a6067c94';
const RAPIDAPI_HOST = 'free-to-play-games-database.p.rapidapi.com';

// Class to hold the system requirements information
class SystemRequirements {
    constructor(os, processor, memory, graphics, storage) {
        this.os = os || '';
        this.processor = processor || '';
        this.memory = memory || '';
        this.graphics = graphics || '';
        this.storage = storage || '';
    }
}

// Class to hold the game properties and API calls
class Game {
    constructor({
        id,
        title,
        thumbnail,
        status,
        shortDescription,
        description,
        gameUrl,
        genre,
        platform,
        publisher,
        developer,
        releaseDate,
        freeToGameProfileUrl,
        systemRequirements = null,
        screenshots = []
    }) {
        this.id = id;
        this.title = title;
        this.thumbnail = thumbnail;
        this.status = status || '';
        this.shortDescription = shortDescription;
        this.description = description || '';
        this.gameUrl = gameUrl;
        this.genre = genre;
        this.platform = platform;
        this.publisher = publisher;
        this.developer = developer;
        this.releaseDate = releaseDate ? new Date(releaseDate) : null;
        this.freeToGameProfileUrl = freeToGameProfileUrl;
        this.systemRequirements = systemRequirements;
        this.screenshots = screenshots;
    }

    /**
     * Get a game from the API by its id.
     *
     * @param id The id of the game to be returned.
     * @return A game object with the data filled.
     * @throws Error If the API fails to return something for any reason.
     */
    static async getGameById(id) {
        try {
            // Construct the full URL with the game ID
            const url = `${API_URL}?id=${id}`;
    
            // Make the API request with the RapidAPI headers
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'X-RapidAPI-Key': RAPIDAPI_KEY,
                    'X-RapidAPI-Host': RAPIDAPI_HOST,
                },
            });
    
            // If the response is not ok, throw an error
            if (!response.ok) {
                throw new Error(`Failed to fetch game with id ${id}`);
            }
    
            // Parse the response as JSON
            const gameData = await response.json();
    
            // Create the system requirement object and set the properties if they have value
            const systemRequirements = gameData.minimum_system_requirements
                ? new SystemRequirements(
                    gameData.minimum_system_requirements.os,
                    gameData.minimum_system_requirements.processor,
                    gameData.minimum_system_requirements.memory,
                    gameData.minimum_system_requirements.graphics,
                    gameData.minimum_system_requirements.storage
                )
                : null;
    
            // Extract screenshots if there are any
            const screenshots = gameData.screenshots
                ? gameData.screenshots.map(screenshot => screenshot.image)
                : [];
    
            // Create and return the Game object
            return new Game({
                id: gameData.id,
                title: gameData.title,
                thumbnail: gameData.thumbnail,
                status: gameData.status,
                shortDescription: gameData.short_description,
                description: gameData.description,
                gameUrl: gameData.game_url,
                genre: gameData.genre,
                platform: gameData.platform,
                publisher: gameData.publisher,
                developer: gameData.developer,
                releaseDate: gameData.release_date,
                freeToGameProfileUrl: gameData.freetogame_profile_url,
                systemRequirements,
                screenshots,
            });
        } catch (error) {
            // Log the error to the console
            console.error('Error fetching game:', error);
    
            // Throw the error for the calling code to handle
            throw new Error('Failed to fetch game data');
        }
    }

    /**
     * Get a list of games from the API by some criteria.
     *
     * @param categories An array of string containing the categories to be filtered as tags.
     * @param platform The platform to be filtered.
     * @param sortBy The sort by criteria.
     * @param searchTitle A text to be searched with 'contains' logic using the title property.
     * @return An array containing the list of games.
     * @throws Error If the API fails to return something for any reason.
     */
    static async getGameList({ categories = [], platform = '', sortBy = '', searchTitle = '' }) {
        try {
            // Start constructing the query parameters
            const queryParams = new URLSearchParams();
    
            // If platform is set, include in the query
            if (platform) {
                queryParams.append('platform', platform.toLowerCase().replace(/\s+/g, '-'));
            }
    
            // If sortBy is set, include in the query
            if (sortBy) {
                queryParams.append('sort-by', sortBy.toLowerCase().replace(/\s+/g, '-'));
            }
    
            // The API doesn't support categories filtering natively in RapidAPI.
            // You'll need to filter these manually if necessary after fetching.
    
            // Construct the final URL
            const url = `${API_URL}?${queryParams.toString()}`;
    
            // Make the API request with RapidAPI headers
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'X-RapidAPI-Key': RAPIDAPI_KEY,
                    'X-RapidAPI-Host': RAPIDAPI_HOST,
                },
            });
    
            // If the response is not ok, throw an error
            if (!response.ok) {
                throw new Error('Failed to fetch game list');
            }
    
            // Parse the response as JSON
            const gameListData = await response.json();
    
            // Map the API response to an array of Game objects
            let games = gameListData.map(game => new Game({
                id: game.id,
                title: game.title,
                thumbnail: game.thumbnail,
                shortDescription: game.short_description,
                gameUrl: game.game_url,
                genre: game.genre,
                platform: game.platform,
                publisher: game.publisher,
                developer: game.developer,
                releaseDate: game.release_date,
                freeToGameProfileUrl: game.freetogame_profile_url,
            }));
    
            // Filter the results by title if searchTitle is provided
            if (searchTitle) {
                const lowerSearchTitle = searchTitle.toLowerCase();
                games = games.filter(game => game.title.toLowerCase().includes(lowerSearchTitle));
            }
    
            // Return the filtered list of games
            return games;
        } catch (error) {
            // Log the error to the console
            console.error('Error fetching game list:', error);
    
            // Throw the error for the caller to handle
            throw new Error('Failed to fetch game list');
        }
    }
}