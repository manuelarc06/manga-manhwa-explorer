import {
    getPopularManga,
    getRandomManga,
    getMangaItems,
} from './api.js';

const featuredManga =
    document.querySelector('#featured-manga');

const randomButton =
    document.querySelector('#random-button');

const searchForm =
    document.querySelector('#search-form');

const searchInput =
    document.querySelector('#search-input');

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
 * Get the best available manga image.
 *
 * @param {Object} manga - Manga object.
 * @returns {string} Image URL.
 */
function getMangaImage(manga) {
    return (
        manga.cover_image ||
        manga.coverImage ||
        manga.image ||
        ''
    );
}

/**
 * Get the manga slug.
 *
 * The slug must come from the API response.
 *
 * @param {Object} manga - Manga object.
 * @returns {string} Manga slug.
 */
function getMangaSlug(manga) {
    return manga.slug || '';
}

/**
 * Get the manga score.
 *
 * @param {Object} manga - Manga object.
 * @returns {string} Manga score.
 */
function getMangaScore(manga) {
    const score =
        manga.average_score ??
        manga.mean_score;

    if (
        score === undefined ||
        score === null
    ) {
        return 'Not rated';
    }

    return `${score}/100`;
}

/**
 * Get the manga genres.
 *
 * @param {Object} manga - Manga object.
 * @returns {string} Manga genres.
 */
function getMangaGenres(manga) {
    if (
        !Array.isArray(manga.genres) ||
        !manga.genres.length
    ) {
        return 'Genres unavailable';
    }

    return manga.genres
        .slice(0, 2)
        .join(', ');
}

/**
 * Create a fallback element when an image is unavailable.
 *
 * @param {string} title - Manga title.
 * @returns {HTMLElement} Image fallback.
 */
function createImageFallback(title) {
    const fallback =
        document.createElement('div');

    fallback.className =
        'manga-card-image-fallback';

    fallback.setAttribute(
        'role',
        'img'
    );

    fallback.setAttribute(
        'aria-label',
        `Cover unavailable for ${title}`
    );

    fallback.textContent =
        'Cover unavailable';

    return fallback;
}

/**
 * Create a manga card.
 *
 * @param {Object} manga - Manga object.
 * @returns {HTMLElement} Manga card.
 */
function createMangaCard(manga) {
    const card =
        document.createElement('article');

    card.className =
        'manga-card';

    const title =
        getMangaTitle(manga);

    const image =
        getMangaImage(manga);

    const slug =
        getMangaSlug(manga);

    const score =
        getMangaScore(manga);

    const genres =
        getMangaGenres(manga);

    const imageContainer =
        document.createElement('div');

    imageContainer.className =
        'manga-card-image';

    if (image) {
        const imageElement =
            document.createElement('img');

        imageElement.src = image;
        imageElement.alt =
            `Cover of ${title}`;
        imageElement.loading = 'lazy';

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
        <h3>${title}</h3>

        <p>
            <span aria-hidden="true">⭐</span>
            <span class="sr-only">Rating:</span>
            ${score}
        </p>

        <p>
            ${genres}
        </p>
    `;

    if (slug) {
        const link =
            document.createElement('a');

        link.className =
            'manga-card-link';

        link.href =
            `details/?slug=${encodeURIComponent(slug)}`;

        link.textContent =
            'View details';

        content.appendChild(link);
    }

    card.appendChild(
        imageContainer
    );

    card.appendChild(
        content
    );

    return card;
}

/**
 * Render manga cards.
 *
 * @param {Array} mangaList - Manga list.
 */
function renderManga(mangaList) {
    featuredManga.innerHTML = '';

    if (!mangaList.length) {
        featuredManga.innerHTML = `
            <p class="status-message">
                No featured manga are available right now.
            </p>
        `;

        return;
    }

    const fragment =
        document.createDocumentFragment();

    mangaList.forEach((manga) => {
        fragment.appendChild(
            createMangaCard(manga)
        );
    });

    featuredManga.appendChild(
        fragment
    );
}

/**
 * Load popular manga.
 */
async function loadManga() {
    featuredManga.innerHTML = `
        <p class="status-message">
            Loading manga...
        </p>
    `;

    try {
        const response =
            await getPopularManga();

        const mangaList =
            getMangaItems(response);

        renderManga(mangaList);
    } catch (error) {
        console.error(
            'Could not load featured manga:',
            error
        );

        featuredManga.innerHTML = `
            <p class="status-message">
                Unable to load featured manga.
                Please try again later.
            </p>
        `;
    }
}

/**
 * Navigate to a random manga.
 */
async function handleRandomManga() {
    if (randomButton) {
        randomButton.disabled = true;
        randomButton.textContent =
            'Finding a title...';
    }

    try {
        const response =
            await getRandomManga();

        const manga =
            response.data ||
            response;

        const slug =
            getMangaSlug(manga);

        if (!slug) {
            throw new Error(
                'Random manga does not have a valid slug.'
            );
        }

        window.location.href =
            `details/?slug=${encodeURIComponent(slug)}`;
    } catch (error) {
        console.error(
            'Could not load random manga:',
            error
        );

        if (randomButton) {
            randomButton.textContent =
                'Unable to find title';

            window.setTimeout(() => {
                randomButton.textContent =
                    'Random Title';
                randomButton.disabled = false;
            }, 2000);
        }
    }
}

/**
 * Handle the home search form.
 *
 * @param {SubmitEvent} event - Form submit event.
 */
function handleSearch(event) {
    event.preventDefault();

    const query =
        searchInput.value.trim();

    if (!query) {
        searchInput.focus();
        return;
    }

    window.location.href =
        `search/?q=${encodeURIComponent(query)}`;
}

randomButton?.addEventListener(
    'click',
    handleRandomManga
);

searchForm?.addEventListener(
    'submit',
    handleSearch
);

loadManga();
