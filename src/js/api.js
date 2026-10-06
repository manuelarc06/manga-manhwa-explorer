const NOZU_API = 'https://nozu.me/api/v1';
const RAPIDAPI_BASE_URL =
    'https://anime-manga-and-novels-api.p.rapidapi.com';

const RAPIDAPI_HOST =
    'anime-manga-and-novels-api.p.rapidapi.com';

const RAPIDAPI_KEY =
    import.meta.env.VITE_RAPIDAPI_KEY;

/**
 * Fetch data from an API.
 *
 * @param {string} url - API URL.
 * @param {Object} headers - Optional request headers.
 * @returns {Promise<Object>} Parsed JSON response.
 */
async function fetchData(url, headers = {}) {
    const response = await fetch(url, {
        method: 'GET',
        headers,
    });

    if (!response.ok) {
        if (response.status === 404) {
            throw new Error('Resource not found.');
        }

        if (response.status === 429) {
            throw new Error('Too many requests. Please try again later.');
        }

        throw new Error(
            `API request failed with status ${response.status}.`
        );
    }

    return response.json();
}

/**
 * Create RapidAPI request headers.
 *
 * @returns {Object} RapidAPI headers.
 */
function getRapidApiHeaders() {
    if (!RAPIDAPI_KEY) {
        throw new Error(
            'RapidAPI key is missing. Check your .env file.'
        );
    }

    return {
        'x-rapidapi-key': RAPIDAPI_KEY,
        'x-rapidapi-host': RAPIDAPI_HOST,
    };
}

/**
 * Search manga using the Nozu API.
 *
 * @param {string} query - Search term.
 * @param {number} page - Page number.
 * @param {number} perPage - Results per page.
 * @returns {Promise<Object>} Search response.
 */
export async function searchManga(
    query,
    page = 1,
    perPage = 12
) {
    const params = new URLSearchParams({
        type: 'manga',
        q: query,
        page: String(page),
        per_page: String(perPage),
    });

    const url = `${NOZU_API}/search?${params.toString()}`;

    return fetchData(url);
}

/**
 * Search manga using a genre filter.
 *
 * @param {string} genre - Genre name.
 * @param {number} page - Page number.
 * @param {number} perPage - Results per page.
 * @returns {Promise<Object>} Search response.
 */
export async function searchMangaByGenre(
    genre,
    page = 1,
    perPage = 12
) {
    const params = new URLSearchParams({
        type: 'manga',
        genre,
        page: String(page),
        per_page: String(perPage),
    });

    const url = `${NOZU_API}/search?${params.toString()}`;

    return fetchData(url);
}

/**
 * Get manga details from Nozu.
 *
 * The slug must come from a real Nozu response.
 *
 * @param {string} slug - Nozu manga slug.
 * @returns {Promise<Object>} Manga details.
 */
export async function getMangaDetails(slug) {
    if (!slug) {
        throw new Error('A manga slug is required.');
    }

    const url =
        `${NOZU_API}/manga/${encodeURIComponent(slug)}`;

    return fetchData(url);
}

/**
 * Get popular manga from Nozu.
 *
 * @returns {Promise<Object>} Popular manga response.
 */
export async function getPopularManga() {
    const url = `${NOZU_API}/popular?type=manga`;

    return fetchData(url);
}

/**
 * Get trending manga from Nozu.
 *
 * @returns {Promise<Object>} Trending manga response.
 */
export async function getTrendingManga() {
    const url = `${NOZU_API}/trending?type=manga`;

    return fetchData(url);
}

/**
 * Get random manga from Nozu.
 *
 * @returns {Promise<Object>} Random manga response.
 */
export async function getRandomManga() {
    const url = `${NOZU_API}/random?type=manga`;

    return fetchData(url);
}

/**
 * Get manga from the Nozu discover endpoint.
 *
 * @returns {Promise<Object>} Discover response.
 */
export async function getMangaDiscover() {
    const url = `${NOZU_API}/discover`;

    return fetchData(url);
}



/**
 * Get manga catalog from Anime, Manga and Novels API.
 *
 * This API provides complementary information such as
 * chapters, volumes, publication and status.
 *
 * @param {number} page - Page number.
 * @param {number} pageSize - Number of results per page.
 * @returns {Promise<Object>} Manga catalog response.
 */
export async function getMangaList(
    page = 1,
    pageSize = 10
) {
    const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
    });

    const url =
        `${RAPIDAPI_BASE_URL}/manga?${params.toString()}`;

    return fetchData(
        url,
        getRapidApiHeaders()
    );
}

/**
 * Get manga details from Anime, Manga and Novels API.
 *
 * This function must only be called with a real mangaId
 * provided by that API.
 *
 * @param {number|string} id - RapidAPI manga ID.
 * @returns {Promise<Object>} Manga details.
 */
export async function getMangaMetadataById(id) {
    if (!id) {
        throw new Error(
            'A RapidAPI manga ID is required.'
        );
    }

    const url =
        `${RAPIDAPI_BASE_URL}/manga/${encodeURIComponent(id)}`;

    return fetchData(
        url,
        getRapidApiHeaders()
    );
}

/**
 * Get a safe list of manga items from an API response.
 *
 * @param {Object} response - API response.
 * @returns {Array} Manga items.
 */
export function getMangaItems(response) {
    if (Array.isArray(response?.data)) {
        return response.data;
    }

    if (Array.isArray(response?.items)) {
        return response.items;
    }

    if (Array.isArray(response)) {
        return response;
    }

    return [];
}
