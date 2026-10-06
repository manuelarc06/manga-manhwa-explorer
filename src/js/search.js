import {
    searchManga,
    getMangaItems,
} from './api.js';

const searchForm =
    document.querySelector('#search-form');

const searchInput =
    document.querySelector('#search-input');

const searchResults =
    document.querySelector('#search-results');

const searchStatus =
    document.querySelector('#search-status');

let currentPage = 1;

const RESULTS_PER_PAGE = 12;

/**
 * Get a manga title.
 *
 * @param {Object} manga - Manga object from Nozu.
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
 * Get the manga publication year.
 *
 * @param {Object} manga - Manga object.
 * @returns {string} Publication year.
 */
function getMangaYear(manga) {
    return manga.start_year
        ? String(manga.start_year)
        : 'Year unavailable';
}

/**
 * Get the manga image.
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
 * Create an image fallback.
 *
 * @param {string} title - Manga title.
 * @returns {HTMLElement} Fallback element.
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
 * Create a manga result card.
 *
 * @param {Object} manga - Manga object.
 * @returns {HTMLElement} Manga card.
 */
function createMangaCard(manga) {
    const article =
        document.createElement('article');

    article.className =
        'manga-card';

    const title =
        getMangaTitle(manga);

    const image =
        getMangaImage(manga);

    const slug =
        manga.slug || '';

    const score =
        getMangaScore(manga);

    const genres =
        getMangaGenres(manga);

    const year =
        getMangaYear(manga);

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
        <h2>${title}</h2>

        <p>
            <span aria-hidden="true">⭐</span>
            <span class="sr-only">Rating:</span>
            ${score}
        </p>

        <p>
            ${genres}
        </p>

        <p>
            ${year}
        </p>
    `;

    if (slug) {
        const link =
            document.createElement('a');

        link.className =
            'manga-card-link';

        link.href =
            `../details/?slug=${encodeURIComponent(slug)}`;

        link.textContent =
            'View details';

        content.appendChild(link);
    }

    article.appendChild(
        imageContainer
    );

    article.appendChild(
        content
    );

    return article;
}

/**
 * Render pagination controls.
 *
 * @param {Object} response - Nozu response.
 */
function renderPagination(response) {
    const totalPages =
        response?.pagination?.total_pages ??
        response?.meta?.totalPages ??
        response?.total_pages ??
        null;

    const pagination =
        document.querySelector(
            '#search-pagination'
        );

    if (!pagination) {
        return;
    }

    pagination.innerHTML = '';

    if (
        !totalPages ||
        totalPages <= 1
    ) {
        return;
    }

    const previousButton =
        document.createElement('button');

    previousButton.type =
        'button';

    previousButton.textContent =
        'Previous';

    previousButton.disabled =
        currentPage <= 1;

    previousButton.addEventListener(
        'click',
        () => {
            if (currentPage > 1) {
                currentPage -= 1;

                performSearch(
                    searchInput.value.trim(),
                    currentPage
                );
            }
        }
    );

    const pageStatus =
        document.createElement('span');

    pageStatus.textContent =
        `Page ${currentPage} of ${totalPages}`;

    const nextButton =
        document.createElement('button');

    nextButton.type =
        'button';

    nextButton.textContent =
        'Next';

    nextButton.disabled =
        currentPage >= totalPages;

    nextButton.addEventListener(
        'click',
        () => {
            if (
                currentPage <
                totalPages
            ) {
                currentPage += 1;

                performSearch(
                    searchInput.value.trim(),
                    currentPage
                );
            }
        }
    );

    pagination.appendChild(
        previousButton
    );

    pagination.appendChild(
        pageStatus
    );

    pagination.appendChild(
        nextButton
    );
}

/**
 * Render search results.
 *
 * @param {Array} mangaList - Manga results.
 * @param {Object} response - API response.
 */
function renderSearchResults(
    mangaList,
    response
) {
    searchResults.innerHTML = '';

    if (!mangaList.length) {
        searchStatus.textContent =
            'No manga found. Try another title.';

        renderPagination(response);

        return;
    }

    const fragment =
        document.createDocumentFragment();

    mangaList.forEach((manga) => {
        fragment.appendChild(
            createMangaCard(manga)
        );
    });

    searchResults.appendChild(
        fragment
    );

    searchStatus.textContent =
        `${mangaList.length} result(s) found.`;

    renderPagination(response);
}

/**
 * Perform a manga search.
 *
 * @param {string} query - Search query.
 * @param {number} page - Page number.
 */
async function performSearch(
    query,
    page = 1
) {
    if (!query) {
        searchStatus.textContent =
            'Please enter a manga title.';

        searchResults.innerHTML = '';

        return;
    }

    currentPage = page;

    searchStatus.textContent =
        'Searching...';

    searchResults.innerHTML = '';

    const pagination =
        document.querySelector(
            '#search-pagination'
        );

    if (pagination) {
        pagination.innerHTML = '';
    }

    try {
        const response =
            await searchManga(
                query,
                page,
                RESULTS_PER_PAGE
            );

        const mangaList =
            getMangaItems(response);

        renderSearchResults(
            mangaList,
            response
        );
    } catch (error) {
        console.error(
            'Search error:',
            error
        );

        searchStatus.textContent =
            'Unable to search manga right now. Please try again later.';

        searchResults.innerHTML = '';
    }
}

/**
 * Get the initial search query from the URL.
 *
 * @returns {string} Search query.
 */
function getInitialQuery() {
    const params =
        new URLSearchParams(
            window.location.search
        );

    return params.get('q')?.trim() || '';
}

if (
    searchForm &&
    searchInput &&
    searchResults &&
    searchStatus
) {
    searchForm.addEventListener(
        'submit',
        (event) => {
            event.preventDefault();

            const query =
                searchInput.value.trim();

            if (!query) {
                searchStatus.textContent =
                    'Please enter a manga title.';

                searchInput.focus();

                return;
            }

            const newUrl =
                `?q=${encodeURIComponent(query)}`;

            window.history.replaceState(
                {},
                '',
                newUrl
            );

            currentPage = 1;

            performSearch(
                query,
                currentPage
            );
        }
    );

    const initialQuery =
        getInitialQuery();

    if (initialQuery) {
        searchInput.value =
            initialQuery;

        performSearch(
            initialQuery,
            1
        );
    }
}
