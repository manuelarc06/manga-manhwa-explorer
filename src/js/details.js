import {
    getMangaDetails,
    getMangaMetadataById,
} from './api.js';

import {
    addFavorite,
    removeFavorite,
    isFavorite,
} from './storage.js';


const detailsContainer =
    document.querySelector('#manga-details');

const statusMessage =
    document.querySelector('#details-status');


/**
 * Get a URL parameter.
 *
 * @param {string} name - Parameter name.
 * @returns {string|null} Parameter value.
 */
function getUrlParameter(name) {
    const params = new URLSearchParams(
        window.location.search
    );

    return params.get(name);
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
 * Get a safe image URL.
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
 * Create a safe display value.
 *
 * @param {*} value - Value to display.
 * @param {string} fallback - Fallback text.
 * @returns {string} Display value.
 */
function displayValue(
    value,
    fallback = 'Not available'
) {
    if (
        value === undefined ||
        value === null ||
        value === ''
    ) {
        return fallback;
    }

    return String(value);
}


/**
 * Translate API status values to English.
 *
 * @param {*} status - Status returned by the API.
 * @returns {string} English status.
 */
function translateStatus(status) {
    const statusMap = {
        'Tamamlandı': 'Finished',
        'Devam Ediyor': 'Releasing',
        'Yayınlanıyor': 'Releasing',
        'Yakında': 'Not Yet Released',
        'İptal Edildi': 'Cancelled',
        'İptal': 'Cancelled',
        'Hiatus': 'On Hiatus',
        'Completed': 'Finished',
        'Finished': 'Finished',
        'Releasing': 'Releasing',
        'Not yet released': 'Not Yet Released',
        'Cancelled': 'Cancelled',
    };

    if (
        status === undefined ||
        status === null ||
        status === ''
    ) {
        return 'Not available';
    }

    return (
        statusMap[String(status)] ||
        String(status)
    );
}


/**
 * Translate API genre values to English.
 *
 * @param {*} genres - Genres returned by the API.
 * @returns {string} English genres.
 */
function translateGenres(genres) {
    if (!Array.isArray(genres) || !genres.length) {
        return 'Not available';
    }

    const genreMap = {
        'Aksiyon': 'Action',
        'Macera': 'Adventure',
        'Dram': 'Drama',
        'Doğaüstü': 'Supernatural',
        'Komedi': 'Comedy',
        'Romantik': 'Romance',
        'Fantezi': 'Fantasy',
        'Korku': 'Horror',
        'Bilim Kurgu': 'Sci-Fi',
        'Gizem': 'Mystery',
        'Psikolojik': 'Psychological',
        'Spor': 'Sports',
        'Gerilim': 'Thriller',
        'Müzik': 'Music',
        'Yaşamdan Kesitler': 'Slice of Life',
        'Okul': 'School',
        'Savaş': 'Military',
        'Tarih': 'Historical',
        'Büyü': 'Magic',
        'Mecha': 'Mecha',
        'Çocuklar': 'Kids',
        'Seinen': 'Seinen',
        'Shounen': 'Shounen',
        'Shoujo': 'Shoujo',
        'Josei': 'Josei',
        'Ecchi': 'Ecchi',
        'Harem': 'Harem',
        'Isekai': 'Isekai',
        'Yaoi': 'Boys Love',
        'Yuri': 'Girls Love',
    };

    return genres
        .map((genre) => (
            genreMap[genre] ||
            String(genre)
        ))
        .join(', ');

}


/**
 * Create the favorite button.
 *
 * @param {Object} manga - Manga object.
 * @returns {string} Favorite button HTML.
 */
function renderFavoriteButton(manga) {
    const slug = manga.slug || '';

    if (!slug) {
        return '';
    }

    const favorite =
        isFavorite(slug);

    const mangaData =
        encodeURIComponent(
            JSON.stringify(manga)
        );

    return `
        <button
            type="button"
            id="favorite-button"
            class="favorite-button"
            data-slug="${slug}"
            data-manga="${mangaData}"
            aria-pressed="${favorite}"
        >
            ${favorite
            ? 'Remove from Favorites'
            : 'Add to Favorites'}
        </button>
    `;
}


/**
 * Render the manga cover.
 *
 * @param {Object} manga - Manga object.
 * @param {string} title - Manga title.
 * @returns {string} HTML markup.
 */
function renderCover(manga, title) {
    const image = getMangaImage(manga);

    if (!image) {
        return `
            <div
                class="image-placeholder"
                role="img"
                aria-label="No cover image available"
            >
                Cover unavailable
            </div>
        `;
    }

    return `
        <img
            src="${image}"
            alt="Cover of ${title}"
            loading="eager"
        >
    `;
}


/**
 * Render manga details.
 *
 * @param {Object} manga - Nozu manga object.
 * @param {Object|null} metadata - Optional RapidAPI data.
 */
function renderDetails(
    manga,
    metadata = null
) {
    const title = getMangaTitle(manga);

    /*
     * Description
     *
     * Nozu is currently returning the description
     * in Turkish. We keep the API value here so
     * the description can be handled separately.
     */
    const description =
        manga.description ||
        'No description available.';


    /*
     * Status
     *
     * Prefer Nozu data and translate known values
     * to English.
     */
    const status =
        translateStatus(
            manga.status ||
            metadata?.status
        );


    /*
     * Chapters
     *
     * Nozu already provides this value, so use it
     * before falling back to additional metadata.
     */
    const chapters =
        manga.chapters ??
        metadata?.chapters ??
        'Not available';


    /*
     * Volumes
     *
     * Nozu already provides this value, so use it
     * before falling back to additional metadata.
     */
    const volumes =
        manga.volumes ??
        metadata?.volumes ??
        'Not available';


    /*
     * Published
     *
     * Use Nozu's start_date first.
     */
    const published =
        manga.start_date ||
        metadata?.published ||
        'Not available';


    /*
     * Rating
     */
    const score =
        manga.average_score ??
        manga.mean_score ??
        metadata?.score;


    /*
     * Genres
     *
     * Translate the Nozu genre values to English.
     */
    const genres =
        translateGenres(
            manga.genres
        );


    detailsContainer.innerHTML = `
        <div class="details-layout">

            <div class="details-cover">
                ${renderCover(manga, title)}
            </div>

            <div class="details-content">

                <p class="eyebrow">
                    Manga / Manhwa
                </p>

                <h1 id="details-heading">
                    ${title}
                </h1>

                ${renderFavoriteButton(manga)}

                <p class="details-description">
                    ${description}
                </p>

                <dl class="details-metadata">

                    <dt>Status</dt>
                    <dd>
                        ${displayValue(status)}
                    </dd>

                    <dt>Rating</dt>
                    <dd>
                        ${score !== undefined &&
            score !== null
            ? `${score}/100`
            : 'Not available'
        }
                    </dd>

                    <dt>Genres</dt>
                    <dd>
                        ${genres}
                    </dd>

                    <dt>Chapters</dt>
                    <dd>
                        ${displayValue(chapters)}
                    </dd>

                    <dt>Volumes</dt>
                    <dd>
                        ${displayValue(volumes)}
                    </dd>

                    <dt>Published</dt>
                    <dd>
                        ${displayValue(published)}
                    </dd>

                </dl>

            </div>

        </div>
    `;
}


/**
 * Handle adding or removing a manga from favorites.
 *
 * @param {Event} event - Click event.
 */
function handleFavoriteClick(event) {
    const button =
        event.target.closest('#favorite-button');

    if (!button) {
        return;
    }

    const slug =
        button.dataset.slug;

    if (!slug) {
        return;
    }

    const favorite =
        isFavorite(slug);

    /*
     * The manga object is stored on the button
     * so the complete API data can be saved.
     */
    const manga =
        JSON.parse(
            decodeURIComponent(
                button.dataset.manga
            )
        );


    if (favorite) {
        removeFavorite(slug);
    } else {
        addFavorite(manga);
    }


    const updatedFavorite =
        isFavorite(slug);

    button.textContent =
        updatedFavorite
            ? 'Remove from Favorites'
            : 'Add to Favorites';

    button.setAttribute(
        'aria-pressed',
        String(updatedFavorite)
    );
}


/**
 * Load manga details.
 */
async function loadDetails() {
    const slug =
        getUrlParameter('slug');

    const rapidId =
        getUrlParameter('rapidId');

    if (!slug) {
        statusMessage.textContent =
            'Manga title not found.';

        return;
    }

    try {
        statusMessage.textContent =
            'Loading manga details...';

        const nozuResponse =
            await getMangaDetails(slug);

        const manga =
            nozuResponse.data ||
            nozuResponse;

        console.log(
            'Nozu manga details:',
            manga
        );


        let metadata = null;


        /*
         * RapidAPI data is optional.
         *
         * We only request it when a real RapidAPI
         * manga ID was explicitly provided.
         */
        if (rapidId) {
            try {
                metadata =
                    await getMangaMetadataById(
                        rapidId
                    );
            } catch (error) {
                console.warn(
                    'Additional metadata is unavailable:',
                    error
                );
            }
        }


        renderDetails(
            manga,
            metadata
        );

        statusMessage.textContent = '';

    } catch (error) {
        console.error(
            'Could not load manga details:',
            error
        );

        statusMessage.textContent =
            'Unable to load manga details. Please try again later.';
    }
}


detailsContainer?.addEventListener(
    'click',
    handleFavoriteClick
);


if (
    detailsContainer &&
    statusMessage
) {
    loadDetails();
}
