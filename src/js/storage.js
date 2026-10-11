const FAVORITES_KEY = 'mangaExplorerFavorites';
const RECENT_KEY = 'mangaExplorerRecentlyViewed';
const MAX_RECENT_TITLES = 5;

/**
 * Read an array from localStorage safely.
 *
 * @param {string} key - Storage key.
 * @returns {Array} Stored items or an empty array.
 */
function readStorage(key) {
    try {
        const value = localStorage.getItem(key);

        if (!value) {
            return [];
        }

        const parsed = JSON.parse(value);

        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        console.error(`Could not read ${key}:`, error);
        return [];
    }
}

/**
 * Save an array to localStorage safely.
 *
 * @param {string} key - Storage key.
 * @param {Array} items - Items to save.
 * @returns {boolean} Whether the save succeeded.
 */
function writeStorage(key, items) {
    try {
        localStorage.setItem(key, JSON.stringify(items));
        return true;
    } catch (error) {
        console.error(`Could not save ${key}:`, error);
        return false;
    }
}

/**
 * Get saved favorites.
 *
 * @returns {Array} Favorite manga.
 */
export function getFavorites() {
    return readStorage(FAVORITES_KEY);
}

/**
 * Add a manga to favorites without duplicates.
 *
 * @param {Object} manga - Manga object.
 * @returns {boolean} Whether the save succeeded.
 */
export function addFavorite(manga) {
    if (!manga?.slug) {
        return false;
    }

    const favorites = getFavorites();
    const exists = favorites.some(
        (item) => item.slug === manga.slug
    );

    if (exists) {
        return true;
    }

    favorites.push(manga);
    return writeStorage(FAVORITES_KEY, favorites);
}

/**
 * Remove a manga from favorites.
 *
 * @param {string} slug - Manga slug.
 * @returns {boolean} Whether the save succeeded.
 */
export function removeFavorite(slug) {
    const favorites = getFavorites().filter(
        (item) => item.slug !== slug
    );

    return writeStorage(FAVORITES_KEY, favorites);
}

/**
 * Check whether a manga is a favorite.
 *
 * @param {string} slug - Manga slug.
 * @returns {boolean} Whether it is a favorite.
 */
export function isFavorite(slug) {
    return getFavorites().some(
        (item) => item.slug === slug
    );
}

/**
 * Get recently viewed manga.
 *
 * @returns {Array} Recently viewed manga.
 */
export function getRecentlyViewed() {
    return readStorage(RECENT_KEY);
}

/**
 * Save a recently viewed manga.
 * The newest title appears first and duplicates are removed.
 *
 * @param {Object} manga - Manga object.
 * @returns {boolean} Whether the save succeeded.
 */
export function addRecentlyViewed(manga) {
    if (!manga?.slug) {
        return false;
    }

    const recent = getRecentlyViewed().filter(
        (item) => item.slug !== manga.slug
    );

    recent.unshift(manga);

    return writeStorage(
        RECENT_KEY,
        recent.slice(0, MAX_RECENT_TITLES)
    );
}