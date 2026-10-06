const FAVORITES_KEY = 'mangaExplorerFavorites';
const RECENT_KEY = 'mangaExplorerRecentlyViewed';

/**
 * Get saved favorites from localStorage.
 *
 * @returns {Array} Favorite manga.
 */
export function getFavorites() {
    try {
        const favorites =
            localStorage.getItem(FAVORITES_KEY);

        return favorites
            ? JSON.parse(favorites)
            : [];
    } catch (error) {
        console.error(
            'Could not load favorites:',
            error
        );

        return [];
    }
}

/**
 * Save favorites to localStorage.
 *
 * @param {Array} favorites - Favorite manga.
 */
function saveFavorites(favorites) {
    localStorage.setItem(
        FAVORITES_KEY,
        JSON.stringify(favorites)
    );
}

/**
 * Add manga to favorites.
 *
 * @param {Object} manga - Manga object.
 */
export function addFavorite(manga) {
    const favorites = getFavorites();

    const exists = favorites.some(
        (favorite) =>
            favorite.slug === manga.slug
    );

    if (!exists) {
        favorites.push(manga);
        saveFavorites(favorites);
    }
}

/**
 * Remove manga from favorites.
 *
 * @param {string} slug - Nozu manga slug.
 */
export function removeFavorite(slug) {
    const favorites =
        getFavorites().filter(
            (manga) => manga.slug !== slug
        );

    saveFavorites(favorites);
}

/**
 * Check whether a manga is a favorite.
 *
 * @param {string} slug - Nozu manga slug.
 * @returns {boolean} Whether manga is favorite.
 */
export function isFavorite(slug) {
    return getFavorites().some(
        (manga) => manga.slug === slug
    );
}

/**
 * Get recently viewed manga.
 *
 * @returns {Array} Recently viewed manga.
 */
export function getRecentlyViewed() {
    try {
        const recent =
            localStorage.getItem(RECENT_KEY);

        return recent
            ? JSON.parse(recent)
            : [];
    } catch (error) {
        console.error(
            'Could not load recently viewed manga:',
            error
        );

        return [];
    }
}

/**
 * Save a recently viewed manga.
 *
 * @param {Object} manga - Manga object.
 */
export function addRecentlyViewed(manga) {
    let recent =
        getRecentlyViewed();

    recent = recent.filter(
        (item) =>
            item.slug !== manga.slug
    );

    recent.unshift(manga);

    recent =
        recent.slice(0, 5);

    localStorage.setItem(
        RECENT_KEY,
        JSON.stringify(recent)
    );
}
