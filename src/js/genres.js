import { searchMangaByGenre, getMangaItems, } from './api.js';

const genreList = document.querySelector('#genre-list');
const genreResults = document.querySelector('#genre-results');
const genreStatus = document.querySelector('#genre-status');
const genrePagination = document.querySelector('#genre-pagination');

const isGenrePage = Boolean(genrePagination);

const PAGE_SIZE = 12;

let requestId = 0;
let currentGenre = '';
let currentPage = 1;

/**
 * Genre labels shown to users.
 * The values sent to Nozu remain separate.
 */
const GENRES = [
    { value: 'Aksiyon', label: 'Action' },
    { value: 'Macera', label: 'Adventure' },
    { value: 'Komedi', label: 'Comedy' },
    { value: 'Dram', label: 'Drama' },
    { value: 'Fantastik', label: 'Fantasy' },
    { value: 'Romantik', label: 'Romance' },
    { value: 'Korku', label: 'Horror' },
    { value: 'Gizem', label: 'Mystery' },
];

function getMangaTitle(manga) {
    if (typeof manga?.title === 'string') {
        return manga.title;
    }

    return (
        manga?.title?.english ||
        manga?.title?.romaji ||
        manga?.title?.native ||
        manga?.name ||
        'Unknown title'
    );
}

function getMangaImage(manga) {
    const image =
        manga?.cover_image ||
        manga?.coverImage ||
        manga?.image ||
        '';

    if (typeof image !== 'string') {
        return '';
    }

    try {
        const url = new URL(image, window.location.href);

        if (!['http:', 'https:'].includes(url.protocol)) {
            return '';
        }

        return url.href;
    } catch {
        return '';
    }
}

function createImageFallback(title) {
    const placeholder = document.createElement('div');

    placeholder.className = 'image-placeholder';
    placeholder.setAttribute('role', 'img');
    placeholder.setAttribute(
        'aria-label',
        `No cover image available for ${title}`
    );
    placeholder.textContent = 'Cover unavailable';

    return placeholder;
}

function createMangaCard(manga) {
    const article = document.createElement('article');
    article.className = 'manga-card';

    const title = getMangaTitle(manga);
    const slug = typeof manga?.slug === 'string'
        ? manga.slug
        : '';

    const score =
        manga?.average_score ??
        manga?.mean_score;

    const genres = Array.isArray(manga?.genres)
        ? manga.genres
            .slice(0, 2)
            .map((genre) => {
                if (typeof genre === 'string') {
                    return genre;
                }

                return genre?.name || '';
            })
            .filter(Boolean)
            .join(', ')
        : '';

    const year =
        manga?.start_year ??
        manga?.start_date ??
        '';

    const imageContainer = document.createElement('div');
    imageContainer.className = 'manga-card-image';

    const imageUrl = getMangaImage(manga);

    if (imageUrl) {
        const image = document.createElement('img');

        image.src = imageUrl;
        image.alt = `Cover of ${title}`;
        image.loading = 'lazy';

        image.addEventListener('error', () => {
            image.replaceWith(createImageFallback(title));
        }, { once: true });

        imageContainer.appendChild(image);
    } else {
        imageContainer.appendChild(createImageFallback(title));
    }

    const content = document.createElement('div');
    content.className = 'manga-card-content';

    const heading = document.createElement('h3');
    heading.textContent = title;
    content.appendChild(heading);

    const rating = document.createElement('p');

    rating.textContent =
        score !== undefined && score !== null && score !== ''
            ? `Rating: ${score}/100`
            : 'Rating unavailable';

    content.appendChild(rating);

    if (genres) {
        const genreText = document.createElement('p');
        genreText.textContent = genres;
        content.appendChild(genreText);
    }

    if (year) {
        const yearText = document.createElement('p');
        yearText.textContent = String(year);
        content.appendChild(yearText);
    }

    if (slug) {
        const link = document.createElement('a');

        link.className = 'manga-card-link';

        const detailsPath = isGenrePage
            ? '../details/index.html'
            : 'details/index.html';

        link.href =
            `${detailsPath}?slug=${encodeURIComponent(slug)}`;

        link.textContent = 'View Details';

        content.appendChild(link);
    }

    article.append(imageContainer, content);

    return article;
}

function renderResults(mangaList) {
    genreResults.replaceChildren();

    if (!mangaList.length) {
        genreStatus.textContent =
            'No manga found for this genre.';

        return;
    }

    const fragment = document.createDocumentFragment();

    mangaList.forEach((manga) => {
        fragment.appendChild(createMangaCard(manga));
    });

    genreResults.appendChild(fragment);

    genreStatus.textContent =
        `${mangaList.length} manga found.`;
}

function updateUrl(genre, page) {
    if (!isGenrePage) {
        return;
    }

    const url = new URL(window.location.href);

    url.searchParams.set('genre', genre);
    url.searchParams.set('page', String(page));

    window.history.replaceState({}, '', url);
}

function renderPagination(meta, displayedCount) {
    if (!genrePagination) {
        return;
    }

    genrePagination.replaceChildren();

    const parsedPage = Number(meta?.current_page);
    const parsedLastPage = Number(meta?.last_page);

    const page = Number.isInteger(parsedPage) && parsedPage > 0
        ? parsedPage
        : currentPage;

    const lastPage =
        Number.isInteger(parsedLastPage) && parsedLastPage > 0
            ? parsedLastPage
            : page;

    if (lastPage <= 1) {
        return;
    }

    const previous = document.createElement('button');
    previous.type = 'button';
    previous.textContent = 'Previous';
    previous.disabled = page <= 1;
    previous.addEventListener('click', () => {
        loadGenre(currentGenre, page - 1);
    });

    const pageLabel = document.createElement('span');
    pageLabel.textContent = `Page ${page} of ${lastPage}`;

    const next = document.createElement('button');
    next.type = 'button';
    next.textContent = 'Next';
    next.disabled = page >= lastPage;
    next.addEventListener('click', () => {
        loadGenre(currentGenre, page + 1);
    });

    genrePagination.append(previous, pageLabel, next);
}

async function loadGenre(genre, page = 1) {
    if (!genre || !genreResults || !genreStatus) {
        return;
    }

    const thisRequest = ++requestId;

    currentGenre = genre;
    currentPage = page;

    genreStatus.textContent = 'Loading manga...';
    genreResults.replaceChildren();

    if (genrePagination) {
        genrePagination.replaceChildren();
    }

    updateUrl(genre, page);

    try {
        const response = await searchMangaByGenre(
            genre,
            page,
            PAGE_SIZE
        );

        // Ignore stale responses from earlier selections.
        if (thisRequest !== requestId) {
            return;
        }

        if (response?.success === false) {
            throw new Error(
                response.message || 'The genre search failed.'
            );
        }

        const mangaList = getMangaItems(response);

        renderResults(mangaList);

        renderPagination(
            response?.meta,
            mangaList.length
        );
    } catch (error) {
        if (thisRequest !== requestId) {
            return;
        }

        console.error('Genre search error:', error);

        genreResults.replaceChildren();

        genreStatus.textContent =
            error.message ||
            'Unable to load manga for this genre. Please try again later.';
    }
}

function handleGenreClick(event) {
    const button = event.target.closest('button[data-genre]');

    if (!button || !genreList?.contains(button)) {
        return;
    }

    const genre = button.dataset.genre;

    if (!genre) {
        return;
    }

    genreList.querySelectorAll('button[data-genre]')
        .forEach((item) => {
            item.removeAttribute('aria-current');
        });

    button.setAttribute('aria-current', 'true');

    loadGenre(genre, 1);
}

function selectGenreButton(genre) {
    if (!genreList) {
        return;
    }

    const buttons = genreList.querySelectorAll('button[data-genre]');

    buttons.forEach((button) => {
        const selected = button.dataset.genre === genre;

        if (selected) {
            button.setAttribute('aria-current', 'true');
        } else {
            button.removeAttribute('aria-current');
        }
    });
}

if (genreList && genreResults && genreStatus) {
    genreList.addEventListener('click', handleGenreClick);

    if (isGenrePage) {
        const params = new URLSearchParams(window.location.search);

        const requestedGenre = params.get('genre');
        const requestedPage = Number(params.get('page') || 1);

        const validGenre = GENRES.find(
            (item) => item.value === requestedGenre
        );

        if (validGenre) {
            const initialPage =
                Number.isInteger(requestedPage) && requestedPage > 0
                    ? requestedPage
                    : 1;

            selectGenreButton(validGenre.value);
            loadGenre(validGenre.value, initialPage);
        }
    }
}

