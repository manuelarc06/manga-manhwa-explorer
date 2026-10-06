import {
    searchMangaByGenre,
    getMangaItems,
} from './api.js';

const genreList =
    document.querySelector('#genre-list');

const genreResults =
    document.querySelector('#genre-results');

const genreStatus =
    document.querySelector('#genre-status');

/**
 * Get the best available manga title.
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
        'Unknown title'
    );
}

/**
 * Get a safe manga image URL.
 *
 * @param {Object} manga - Manga object from Nozu.
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
 * Create a manga card.
 *
 * @param {Object} manga - Manga object from Nozu.
 * @returns {HTMLElement} Manga card.
 */
function createMangaCard(manga) {
    const article =
        document.createElement('article');

    article.className = 'manga-card';

    const title =
        getMangaTitle(manga);

    const image =
        getMangaImage(manga);

    const score =
        manga.average_score ??
        manga.mean_score;

    const genres =
        Array.isArray(manga.genres) &&
            manga.genres.length
            ? manga.genres
                .slice(0, 2)
                .join(', ')
            : 'Genre unavailable';

    const year =
        manga.start_year ||
        'Year unavailable';

    const slug =
        manga.slug || '';

    const imageMarkup = image
        ? `
            <img
                src="${image}"
                alt="Cover of ${title}"
                loading="lazy"
            >
        `
        : `
            <div
                class="image-placeholder"
                role="img"
                aria-label="No cover image available"
            >
                Cover unavailable
            </div>
        `;

    const linkMarkup = slug
        ? `
            <a
                class="manga-card-link"
                href="details/?slug=${encodeURIComponent(slug)}"
            >
                View Details
            </a>
        `
        : '';

    article.innerHTML = `
        ${imageMarkup}

        <div class="manga-card-content">

            <h3>
                ${title}
            </h3>

            <p>
                ${score !== undefined &&
            score !== null
            ? `⭐ ${score}/100`
            : '⭐ Not rated'
        }
            </p>

            <p>
                ${genres}
            </p>

            <p>
                ${year}
            </p>

            ${linkMarkup}

        </div>
    `;

    return article;
}

/**
 * Render manga results.
 *
 * @param {Array} mangaList - Manga results.
 */
function renderGenreResults(mangaList) {
    genreResults.innerHTML = '';

    if (!mangaList.length) {
        genreStatus.textContent =
            'No manga found for this genre.';

        return;
    }

    const fragment =
        document.createDocumentFragment();

    mangaList.forEach((manga) => {
        fragment.appendChild(
            createMangaCard(manga)
        );
    });

    genreResults.appendChild(fragment);

    genreStatus.textContent =
        `${mangaList.length} manga found.`;
}

/**
 * Load manga for a selected genre.
 *
 * @param {string} genre - Nozu genre name.
 */
async function loadGenre(genre) {
    genreStatus.textContent =
        'Loading manga...';

    genreResults.innerHTML = '';

    try {
        const response =
            await searchMangaByGenre(
                genre,
                1,
                12
            );

        const mangaList =
            getMangaItems(response);

        renderGenreResults(mangaList);
    } catch (error) {
        console.error(
            'Genre search error:',
            error
        );

        genreStatus.textContent =
            'Unable to load manga for this genre. Please try again later.';
    }
}

/**
 * Handle genre button clicks.
 *
 * @param {Event} event - Click event.
 */
function handleGenreClick(event) {
    const button =
        event.target.closest(
            'button[data-genre]'
        );

    if (!button) {
        return;
    }

    const genre =
        button.dataset.genre;

    if (!genre) {
        return;
    }

    document
        .querySelectorAll(
            '#genre-list button'
        )
        .forEach((genreButton) => {
            genreButton.removeAttribute(
                'aria-current'
            );
        });

    button.setAttribute(
        'aria-current',
        'true'
    );

    loadGenre(genre);
}

if (
    genreList &&
    genreResults &&
    genreStatus
) {
    genreList.addEventListener(
        'click',
        handleGenreClick
    );
}

