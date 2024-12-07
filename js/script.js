// API constants. Here it was used the link from RapidAPI due to the need of CORS and this is provided via RapidAPI only as it's explained in the API documentation
const API_URL = 'https://free-to-play-games-database.p.rapidapi.com/api/';
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
            const url = `${API_URL}game?id=${id}`;

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
            let url;
            const queryParams = new URLSearchParams();

            // Check if there are any filters to decide the endpoint
            if (categories.length > 0) {
                // Use the filter endpoint
                url = `${API_URL}filter`;

                // Add categories as a tag parameter
                const tags = categories.map(c => c.toLowerCase().replace(/\s+/g, '-')).join('.');
                queryParams.append('tag', tags);
            }
            else {
                // Use the base URL for no filters
                url = `${API_URL}games`;
            }

            // Add platform and sortBy if provided
            if (platform) {
                queryParams.append('platform', platform.toLowerCase().replace(/\s+/g, '-'));
            }
            if (sortBy) {
                queryParams.append('sort-by', sortBy.toLowerCase().replace(/\s+/g, '-'));
            }

            // Append query parameters if any
            if (queryParams.toString()) {
                url += `?${queryParams.toString()}`;
            }

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

// Event listener for when the page loads
document.addEventListener("DOMContentLoaded", () => {
    // Get the needed elements by its ids or classes
    const mainPage = document.querySelector(".main-page");
    const gameDetailPage = document.querySelector(".game-detail");
    const detailsButton = document.getElementById("details-button");
    const backButton = document.getElementById("back-button");
    const screenshotsContainer = document.getElementById("screenshots-container");
    const modal = document.getElementById("image-modal");
    const modalImage = document.getElementById("modal-image");
    const closeModal = document.getElementById("close-modal");
    const categorySelect = document.getElementById('category');
    const platformSelect = document.getElementById('platform');
    const sortBySelect = document.getElementById('sort-by');
    const nameInput = document.getElementById('name');
    const refreshButton = document.getElementById('refresh-button');
    const gamesList = document.getElementById('games');

    // Initialize the games list and the selected game id variable
    let games = [];
    let selectedGameId = null;

    // Create the arrays to populate the dropdowns
    const categoryList = [
        "2D", "3D", "Action", "Action RPG", "Anime", "Battle Royale", "Card", "Fantasy", "Fighting",
        "First Person", "Flight", "Horror", "Low Spec", "Martial Arts", "Military", "MMO", "MMOFPS",
        "MMORPG", "MMORTS", "MMOTPS", "Moba", "Open World", "Permadeath", "Pixel", "PVE", "PVP",
        "Racing", "Sailing", "Sandbox", "Sci Fi", "Shooter", "Side Scroller", "Social", "Space",
        "Sports", "Strategy", "Superhero", "Survival", "Tank", "Third Person", "Top Down",
        "Tower Defense", "Turn Based", "Voxel", "Zombie"
    ];
    const platformList = ["", "Browser", "PC"];
    const sortByList = ["", "Alphabetical", "Release Date"];

    // Populate the dropdowns with each respective list
    populateDropdown(categorySelect, categoryList);
    populateDropdown(platformSelect, platformList);
    populateDropdown(sortBySelect, sortByList);

    /**
    * Populate a drop down from an array of items.
    *
    * @param dropdown Dropdown to be populated.
    * @param options Array with the options that will be populated.
    */
    function populateDropdown(dropdown, options) {
        options.forEach(option => {
            const optElement = document.createElement("option");
            optElement.value = option.toLowerCase().replace(/\s+/g, "-");
            optElement.textContent = option;
            dropdown.appendChild(optElement);
        });
    }

    /**
    * Fetch the games from the API.
    */
    async function fetchGames() {
        const categories = Array.from(categorySelect.selectedOptions).map(opt => opt.value);
        const platform = platformSelect.value;
        const sortBy = sortBySelect.value;
        const name = nameInput.value;

        games = await Game.getGameList({ categories, platform, sortBy, searchTitle: name });
        displayGames();
    }

    /**
    * Display the games.
    */
    function displayGames() {
        gamesList.innerHTML = '';
        games.forEach((game, index) => {
            const li = document.createElement("li");
            li.textContent = game.title;
            li.classList.add("game-item");
            li.addEventListener("click", () => displayGameDetails(index, li));
            li.dataset.gameId = game.id; // Store game ID for details button
            gamesList.appendChild(li);
        });
    }

    // Create the selected game element
    let selectedGameElement = null;

    /**
    * Display the game details.
    *
    * @param index The game index.
    * @param element The element to be used in the display.
    */
    function displayGameDetails(index, element) {
        const game = games[index];

        if (selectedGameElement) {
            selectedGameElement.classList.remove("selected");
        }
        element.classList.add("selected");
        selectedGameElement = element;

        selectedGameId = game.id;

        // Update the details button state
        detailsButton.disabled = false;

        // Populate game details in main-page
        document.getElementById("game-title").textContent = game.title;
        document.getElementById("game-thumbnail").src = game.thumbnail || "images/no-image.png";
        document.getElementById("game-genre").textContent = game.genre;
        document.getElementById("game-platform").textContent = game.platform;
        document.getElementById("game-publisher").textContent = game.publisher;
        document.getElementById("game-developer").textContent = game.developer;
        document.getElementById("game-release-date").textContent = game.releaseDate.toDateString();
        document.getElementById("game-description").textContent = game.shortDescription;
        const gameLink = document.getElementById("game-link");
        gameLink.textContent = game.gameUrl;
        gameLink.href = game.gameUrl;
    }

    // Add the click event to the get the game id and details
    detailsButton.addEventListener("click", async () => {
        if (selectedGameId) {
            const game = await Game.getGameById(selectedGameId);
            loadGameDetails(game);
            mainPage.style.display = "none";
            gameDetailPage.style.display = "block";
        }
    });

    // Add the click event to go back to the main page
    backButton.addEventListener("click", () => {
        mainPage.style.display = "block";
        gameDetailPage.style.display = "none";
    });

    // Add an event to the click button in order to open the menu on small screens
    document.querySelector('.menu-toggle').addEventListener('click', function () {
        this.classList.toggle('open');
        document.querySelector('.overlay-menu').classList.toggle('open');
    });

    /**
    * Load the game details from the API.
    *
    * @param game The game to be loaded.
    */
    function loadGameDetails(game) {
        document.getElementById("game-detail-name").textContent = game.title;
        document.getElementById("game-detail-description").textContent = game.description;
        document.getElementById("game-detail-genre").textContent = game.genre;
        document.getElementById("game-detail-platform").textContent = game.platform;
        document.getElementById("game-detail-publisher").textContent = game.publisher;
        document.getElementById("game-detail-developer").textContent = game.developer;
        document.getElementById("game-detail-release-date").textContent = game.releaseDate.toDateString();
        document.getElementById("game-detail-status").textContent = game.status;
        document.getElementById("game-detail-link").textContent = game.gameUrl;
        document.getElementById("game-detail-link").href = game.gameUrl;
        document.getElementById("detail-thumbnail").src = game.thumbnail || "images/no-image.png";

        // System Requirements
        const requirements = game.systemRequirements || {};
        document.getElementById("game-detail-requirements-os").textContent = requirements.os || "N/A";
        document.getElementById("game-detail-requirements-processor").textContent = requirements.processor || "N/A";
        document.getElementById("game-detail-requirements-memory").textContent = requirements.memory || "N/A";
        document.getElementById("game-detail-requirements-graphics").textContent = requirements.graphics || "N/A";
        document.getElementById("game-detail-requirements-storage").textContent = requirements.storage || "N/A";

        // Screenshots
        screenshotsContainer.innerHTML = "";
        game.screenshots.forEach((screenshot) => {
            const img = document.createElement("img");
            img.src = screenshot;
            img.addEventListener("click", () => showImageModal(screenshot));
            screenshotsContainer.appendChild(img);
        });
    }

    /**
    * Show the image expanded.
    *
    * @param imageSrc The image url to be showed.
    */
    function showImageModal(imageSrc) {
        modalImage.src = imageSrc;
        modal.style.display = "flex";
    }

    // Add the click event to close the model with the expanded image.
    closeModal.addEventListener("click", () => {
        modal.style.display = "none";
    });

    // Add the click event to close the model with the expanded image.
    window.addEventListener("click", (event) => {
        if (event.target === modal) {
            modal.style.display = "none";
        }
    });

    // Add the click event to the refresh button to get the games
    refreshButton.addEventListener("click", fetchGames);

    // Add the keydown event to the enter key so when the user stops typing and type enter it makes the search.
    nameInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            fetchGames();
        }
    });
    
    // Fetch the games initially so the list show something already when the page loads
    fetchGames();
});