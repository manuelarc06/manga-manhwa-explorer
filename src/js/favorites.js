import {
    getFavorites,
    removeFavorite,
} from './storage.js';

const favoritesList =
    document.querySelector('#favorites-list');

const favoritesStatus =
    document.querySelector('#favorites-status');

/**
 * Create an image fallback when the cover cannot be loaded.
 *
 * @param {string} title - Manga title.
 * @returns {HTMLElement} Fallback element.
 */
function createImageFallback(title) {
    const fallback =
        document.createElement('div');

    fallback.className =
        'image-placeholder';

    fallback.setAttribute(
        'role',
        'img'
    );

    fallback.setAttribute(
        'aria-label',
        `No cover image available for ${title}`
    );

    fallback.textContent =
        'Cover unavailable';

    return fallback;
}

    
/**
 * Get the best available manga title.
 *
 * @param {Object} manga - Manga object.
 * @returns {string} Manga title.
 */
function getMangaTitle(manga) {
    if (typeof manga.title === 'string') {
        return manga.title;
    }

    return (
        manga.title?.english ||
        manga.title?.romaji ||
        manga.title?.native ||
        manga.name ||
        'Unknown title'
    );
}

/**
 * Create a favorite manga card.
 *
 * @param {Object} manga - Manga object.
 * @returns {HTMLElement} Manga card.
 */
function createFavoriteCard(manga) {
    const article =
        document.createElement('article');

    article.className =
        'manga-card';

    const title =
        getMangaTitle(manga);

    const image =
        manga.cover_image ||
        manga.coverImage ||
        manga.image ||
        '';

    const score =
        manga.average_score ??
        manga.mean_score;

    const slug =
        manga.slug || '';

    const imageContainer =
        document.createElement('div');

    imageContainer.className =
        'manga-card-image';

    if (image) {
        const imageElement =
            document.createElement('img');

        imageElement.src =
            image;

        imageElement.alt =
            `Cover of ${title}`;

        imageElement.loading =
            'lazy';

        imageElement.addEventListener(
            'error',
            () => {
                imageElement.replaceWith(
                    createImageFallback(title)
                );
            }
        );

        imageContainer.appendChild(
            imageElement
        );
    } else {
        imageContainer.appendChild(
            createImageFallback(title)
        );
    }

    const content =
        document.createElement('div');

    content.className =
        'manga-card-content';

    content.innerHTML = `
        <h2>
            ${title}
        </h2>

        ${score !== undefined &&
            score !== null
            ? `
                <p>
                    <span aria-hidden="true">⭐</span>
                    <span class="sr-only">Rating:</span>
                    ${score}/100
                </p>
            `
            : ''
        }

        ${slug
            ? `
                <a
                    class="manga-card-link"
                    href="../details/?slug=${encodeURIComponent(slug)}"
                >
                    View Details
                </a>
            `
            : ''
        }

        <button
            type="button"
            class="favorite-remove-button"
            data-slug="${slug}"
            aria-label="Remove ${title} from favorites"
        >
            Remove Favorite
        </button>
    `;

    article.appendChild(
        imageContainer
    );

    article.appendChild(
        content
    );

    return article;
}

/**
 * Render saved favorites.
 */
function renderFavorites() {
    const favorites =
        getFavorites();

    favoritesList.innerHTML = '';

    if (!favorites.length) {
        favoritesStatus.textContent =
            'You do not have any favorite titles yet.';

        return;
    }

    favoritesStatus.textContent =
        `${favorites.length} favorite title${favorites.length === 1
            ? ''
            : 's'
        }.`;

    const fragment =
        document.createDocumentFragment();

    favorites.forEach((manga) => {
        fragment.appendChild(
            createFavoriteCard(manga)
        );
    });

    favoritesList.appendChild(
        fragment
    );
}

/**
 * Handle removing a favorite.
 *
 * @param {Event} event - Click event.
 */
function handleRemoveFavorite(event) {
    const button =
        event.target.closest(
            '.favorite-remove-button'
        );

    if (!button) {
        return;
    }

    const slug =
        button.dataset.slug;

    if (!slug) {
        return;
    }

    removeFavorite(slug);

    renderFavorites();
}

if (
    favoritesList &&
    favoritesStatus
) {
    favoritesList.addEventListener(
        'click',
        handleRemoveFavorite
    );

    renderFavorites();
}

