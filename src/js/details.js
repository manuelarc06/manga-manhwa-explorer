import { getMangaDetails, getMangaMetadataById, } from './api.js';

import { addFavorite, removeFavorite, isFavorite, addRecentlyViewed, } from './storage.js';

const detailsContainer = document.querySelector('#manga-details');

const statusMessage = document.querySelector('#details-status');

const errorContainer = document.querySelector('#details-error');

function getUrlParameter(name) {
    return new URLSearchParams(
        window.location.search
    ).get(name);
}

function escapeHTML(value) {
    return String(value ?? '').replace(
        /[&<>"']/g,
        (character) => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            '\'': '&#39;',
        })[character]
    );
}

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
        manga?.image;

    return typeof image === 'string'
        ? image.trim()
        : '';
}

function getSafeImageURL(value) {
    if (typeof value !== 'string') {
        return '';
    }

    try {
        const url = new URL(value);

        return ['https:', 'http:'].includes(url.protocol)
            ? url.href
            : '';
    } catch {
        return '';
    }
}

function getSafeExternalURL(value) {
    if (typeof value !== 'string') {
        return '';
    }

    try {
        const url = new URL(value);

        return ['https:', 'http:'].includes(url.protocol)
            ? url.href
            : '';
    } catch {
        return '';
    }
}

function displayValue(value, fallback = 'Not available') {
    if (
        value === undefined ||
        value === null ||
        value === ''
    ) {
        return fallback;
    }

    if (Array.isArray(value)) {
        return value.length
            ? value.map(String).join(', ')
            : fallback;
    }

    return String(value);
}

function formatDate(value) {
    if (!value) {
        return 'Not available';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return String(value);
    }

    return new Intl.DateTimeFormat('en', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        timeZone: 'UTC',
    }).format(date);
}

function getArray(value) {
    return Array.isArray(value) ? value : [];
}

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

    if (!status) {
        return 'Not available';
    }

    return statusMap[String(status)] || String(status);
}

const genreTranslations = {
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
    'Çocuklar': 'Kids',
    'Shounen': 'Shounen',
    'Shoujo': 'Shoujo',
    'Seinen': 'Seinen',
    'Josei': 'Josei',
    'Yaoi': 'Boys Love',
    'Yuri': 'Girls Love',
};

function translateGenre(genre) {
    return genreTranslations[genre] || String(genre);
}

function renderSection(title, content, id = '') {
    if (!content || !content.trim()) {
        return '';
    }

    return `
        <section
            class="details-section"
            ${id ? `id="${escapeHTML(id)}"` : ''}
        >
            <h2>${escapeHTML(title)}</h2>
            ${content}
        </section>
    `;
}

function renderPills(values, translate = false) {
    const items = getArray(values);

    if (!items.length) {
        return '<p class="details-muted">Not available.</p>';
    }

    return `
        <div class="details-pills">
            ${items.map((item) => {
        const label = translate
            ? translateGenre(item)
            : item;

        return `
                    <span class="details-pill">
                        ${escapeHTML(label)}
                    </span>
                `;
    }).join('')}
        </div>
    `;
}

function renderFavoriteButton(manga) {
    const slug = manga.slug;

    if (!slug) {
        return '';
    }

    const favorite = isFavorite(slug);

    return `
        <button
            type="button"
            id="favorite-button"
            class="favorite-button"
            data-slug="${escapeHTML(slug)}"
            aria-pressed="${favorite}"
        >
            ${favorite
            ? '♥ Remove from Favorites'
            : '♡ Add to Favorites'}
        </button>
    `;
}

function handleFavoriteClick(event) {
    const button = event.target.closest(
        '#favorite-button'
    );

    if (!button) {
        return;
    }

    const slug = button.dataset.slug;

    if (!slug || !currentManga) {
        return;
    }

    if (isFavorite(slug)) {
        removeFavorite(slug);
    } else {
        addFavorite(currentManga);
    }

    const favorite = isFavorite(slug);

    button.textContent = favorite
        ? '♥ Remove from Favorites'
        : '♡ Add to Favorites';

    button.setAttribute(
        'aria-pressed',
        String(favorite)
    );
}

let currentManga = null;

function renderCover(manga, title) {
    const image = getSafeImageURL(
        getMangaImage(manga)
    );

    if (!image) {
        return `
            <div class="image-placeholder"
                 role="img"
                 aria-label="No cover image available">
                Cover unavailable
            </div>
        `;
    }

    return `
        <img
            src="${escapeHTML(image)}"
            alt="Cover of ${escapeHTML(title)}"
            loading="eager"
            onerror="this.replaceWith(Object.assign(document.createElement('div'), {className:'image-placeholder',textContent:'Cover unavailable'}))"
        >
    `;
}

function renderBanner(manga) {
    const banner = getSafeImageURL(
        manga.banner_image ||
        manga.banner_image_original
    );

    if (!banner) {
        return '';
    }

    return `
        <div class="details-banner">
            <img
                src="${escapeHTML(banner)}"
                alt=""
                loading="eager"
            >
            <div class="details-banner-overlay"></div>
        </div>
    `;
}

function renderMainInformation(manga, metadata) {
    const title = getMangaTitle(manga);

    const nativeTitle =
        manga.title?.native;

    const romajiTitle =
        manga.title?.romaji;

    const description =
        manga.description;

    const score =
        manga.average_score ??
        manga.mean_score ??
        metadata?.score;

    const status = translateStatus(
        manga.status ?? metadata?.status
    );

    const cover = renderCover(manga, title);

    return `
        ${renderBanner(manga)}

        <div class="details-hero">

            <div class="details-cover">
                ${cover}
            </div>

            <div class="details-content">

                <p class="details-eyebrow">
                    ${escapeHTML(
        manga.type || 'Manga'
    )}
                    ${manga.format
            ? ` · ${escapeHTML(manga.format)}`
            : ''}
                </p>

                <h1 id="details-heading">
                    ${escapeHTML(title)}
                </h1>

                ${nativeTitle
            ? `<p class="details-native-title">
                        ${escapeHTML(nativeTitle)}
                       </p>`
            : ''}

                ${romajiTitle &&
            romajiTitle !== title
            ? `<p class="details-romaji-title">
                        ${escapeHTML(romajiTitle)}
                       </p>`
            : ''}

                ${renderFavoriteButton(manga)}

                <div class="details-score">
                    <span aria-hidden="true">★</span>
                    <strong>
                        ${score !== undefined &&
            score !== null
            ? `${escapeHTML(score)}/100`
            : 'Not rated'}
                    </strong>
                </div>

                <p class="details-description">
                    ${description
            ? escapeHTML(description)
                .replace(/\r?\n/g, '<br>')
            : 'No description available.'}
                </p>

            </div>
        </div>

        <div class="details-quick-stats">
            ${renderStat('Status', status)}
            ${renderStat(
                'Chapters',
                manga.chapters ?? metadata?.chapters
            )}
            ${renderStat(
                'Volumes',
                manga.volumes ?? metadata?.volumes
            )}
            ${renderStat('Favorites', manga.favourites)}
        </div>
    `;
}

function renderStat(label, value) {
    return `
        <div class="details-stat">
            <span>${escapeHTML(label)}</span>
            <strong>${escapeHTML(
        displayValue(value)
    )}</strong>
        </div>
    `;
}

function renderMetadata(manga, metadata) {
    const startDate =
        manga.start_date ||
        metadata?.published;

    const endDate = manga.end_date;

    const score =
        manga.average_score ??
        manga.mean_score ??
        metadata?.score;

    const fields = [
        ['Format', manga.format],
        ['Type', manga.type],
        ['Status', translateStatus(manga.status)],
        ['Country of origin', manga.country_of_origin],
        ['Start date', formatDate(startDate)],
        ['End date', formatDate(endDate)],
        ['Start year', manga.start_year],
        ['Season', manga.season],
        ['Season year', manga.season_year],
        ['Chapters', manga.chapters ?? metadata?.chapters],
        ['Volumes', manga.volumes ?? metadata?.volumes],
        ['Average score', score],
        ['Mean score', manga.mean_score],
        ['Popularity', manga.popularity],
        ['Favorites', manga.favourites],
        ['Source', manga.source],
        ['Hashtag', manga.hashtag],
    ];

    const rows = fields
        .filter(([, value]) =>
            value !== undefined &&
            value !== null &&
            value !== ''
        )
        .map(([label, value]) => `
            <div class="metadata-row">
                <dt>${escapeHTML(label)}</dt>
                <dd>${escapeHTML(value)}</dd>
            </div>
        `)
        .join('');

    if (!rows) {
        return '';
    }

    return renderSection(
        'Publication Information',
        `<dl class="details-metadata">${rows}</dl>`,
        'publication-information'
    );
}

function renderGenres(manga) {
    const genres = getArray(manga.genres);

    const content = genres.length
        ? `<div class="details-pills">
            ${genres.map((genre) => `
                <a
                    class="details-pill"
                    href="../genres/?genre=${encodeURIComponent(genre)}"
                >
                    ${escapeHTML(translateGenre(genre))}
                </a>
            `).join('')}
           </div>`
        : '<p class="details-muted">No genres available.</p>';

    return renderSection('Genres', content, 'genres');
}

function renderTags(manga) {
    const tags = getArray(manga.tags);

    if (!tags.length) {
        return '';
    }

    const content = `
        <div class="details-tags">
            ${tags.map((tag) => `
                <article class="details-tag">
                    <strong>${escapeHTML(tag.name)}</strong>
                    ${tag.rank !== undefined
            ? `<span>Rank: ${escapeHTML(tag.rank)}</span>`
            : ''}
                    ${tag.description
            ? `<p>${escapeHTML(tag.description)}</p>`
            : ''}
                    ${tag.is_adult
            ? '<span class="details-adult-tag">Adult</span>'
            : ''}
                </article>
            `).join('')}
        </div>
    `;

    return renderSection('Tags', content, 'tags');
}

function renderPeopleSection(title, people) {
    const items = getArray(people);

    if (!items.length) {
        return '';
    }

    const content = `
        <div class="details-people-grid">
            ${items.map((person) => {
        const image = getSafeImageURL(
            person.image
        );

        return `
                    <article class="details-person">
                        ${image
                ? `<img
                                src="${escapeHTML(image)}"
                                alt="${escapeHTML(person.name || 'Person')}"
                                loading="lazy"
                              >`
                : ''}
                        <div>
                            <h3>${escapeHTML(
                    displayValue(person.name, 'Unknown')
                )}</h3>
                            ${person.role
                ? `<p>${escapeHTML(person.role)}</p>`
                : ''}
                            ${person.language
                ? `<p>${escapeHTML(person.language)}</p>`
                : ''}
                        </div>
                    </article>
                `;
    }).join('')}
        </div>
    `;

    return renderSection(title, content);
}

function renderCreativeTeam(manga) {
    return [
        renderPeopleSection('Authors', manga.authors),
        renderPeopleSection('Staff and Contributors', manga.staff),
    ].join('');
}

function renderCharacters(manga) {
    const characters = getArray(manga.characters);

    if (!characters.length) {
        return '';
    }

    const content = `
        <div class="details-character-grid">
            ${characters.map((character) => {
        const image = getSafeImageURL(
            character.image
        );

        return `
                    <article class="details-character">
                        ${image
                ? `<img
                                src="${escapeHTML(image)}"
                                alt="${escapeHTML(character.name || 'Character')}"
                                loading="lazy"
                              >`
                : '<div class="image-placeholder">No image</div>'}

                        <div class="details-character-info">
                            <h3>${escapeHTML(
                    displayValue(character.name)
                )}</h3>

                            ${character.role
                ? `<p>${escapeHTML(character.role)}</p>`
                : ''}

                            ${character.voice_actor?.name
                ? `<p class="details-muted">
                                    Voice: ${escapeHTML(
                    character.voice_actor.name
                )}
                                   </p>`
                : ''}
                        </div>
                    </article>
                `;
    }).join('')}
        </div>
    `;

    return renderSection(
        `Characters (${characters.length})`,
        content,
        'characters'
    );
}

function renderRelatedCard(item, label = '') {
    const title = getMangaTitle(item);

    const image = getSafeImageURL(
        item.cover_image ||
        item.image ||
        item.coverImage
    );

    const slug = item.slug;

    const destination = slug
        ? `../details/?slug=${encodeURIComponent(slug)}`
        : '';

    return `
        <article class="details-card">
            ${image
            ? `<img
                    src="${escapeHTML(image)}"
                    alt="Cover of ${escapeHTML(title)}"
                    loading="lazy"
                   >`
            : '<div class="image-placeholder">No cover</div>'}

            <div class="details-card-content">
                <h3>${escapeHTML(title)}</h3>

                ${label
            ? `<p>${escapeHTML(label)}</p>`
            : ''}

                ${item.format
            ? `<p>${escapeHTML(item.format)}</p>`
            : ''}

                ${item.average_score !== undefined &&
            item.average_score !== null
            ? `<p>★ ${escapeHTML(item.average_score)}/100</p>`
            : ''}

                ${destination
            ? `<a href="${escapeHTML(destination)}">
                        View Details
                       </a>`
            : ''}
            </div>
        </article>
    `;
}

function renderRecommendations(manga) {
    const items = getArray(manga.recommendations);

    if (!items.length) {
        return '';
    }

    return renderSection(
        'You May Also Like',
        `<div class="details-card-grid">
            ${items.map((item) =>
            renderRelatedCard(item)
        ).join('')}
         </div>`,
        'recommendations'
    );
}

function renderRelations(manga) {
    const relations = getArray(manga.relations);

    if (!relations.length) {
        return '';
    }

    return renderSection(
        'Related Titles',
        `<div class="details-card-grid">
            ${relations.map((item) =>
            renderRelatedCard(
                item,
                item.relation_type || item.type || ''
            )
        ).join('')}
         </div>`,
        'related-titles'
    );
}

function renderExternalLinks(manga) {
    const links = getArray(manga.external_links);

    const siteURL = getSafeExternalURL(
        manga.site_url
    );

    const validLinks = links
        .map((link) => ({
            ...link,
            safeURL: getSafeExternalURL(link.url),
        }))
        .filter((link) => link.safeURL);

    if (!validLinks.length && !siteURL) {
        return '';
    }

    const items = [
        ...(siteURL
            ? [{
                site: 'AniList',
                safeURL: siteURL,
                language: '',
            }]
            : []),
        ...validLinks,
    ];

    const content = `
        <ul class="details-link-list">
            ${items.map((link) => `
                <li>
                    <a
                        href="${escapeHTML(link.safeURL)}"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        ${escapeHTML(link.site || 'External link')}
                    </a>
                    ${link.language
            ? `<span>${escapeHTML(link.language)}</span>`
            : ''}
                </li>
            `).join('')}
        </ul>
    `;

    return renderSection('Official and External Links', content);
}

function renderTrailer(manga) {
    const trailer = manga.trailer;

    if (!trailer?.id) {
        return '';
    }

    const site = String(
        trailer.site || 'youtube'
    ).toLowerCase();

    let trailerURL = '';

    if (site === 'youtube') {
        trailerURL =
            `https://www.youtube.com/watch?v=${encodeURIComponent(trailer.id)
            }`;
    }

    if (!trailerURL) {
        return '';
    }

    const thumbnail = getSafeImageURL(
        trailer.thumbnail
    );

    return renderSection(
        'Trailer',
        `
            <a
                class="details-trailer"
                href="${escapeHTML(trailerURL)}"
                target="_blank"
                rel="noopener noreferrer"
            >
                ${thumbnail
            ? `<img
                        src="${escapeHTML(thumbnail)}"
                        alt="Trailer thumbnail"
                        loading="lazy"
                       >`
            : ''}
                <span>▶ Watch Trailer</span>
            </a>
        `,
        'trailer'
    );
}

function renderRankings(manga) {
    const rankings = getArray(manga.rankings);

    if (!rankings.length) {
        return '';
    }

    const content = `
        <div class="details-rankings">
            ${rankings.map((ranking) => `
                <article>
                    <strong>#${escapeHTML(
        displayValue(ranking.rank)
    )}</strong>
                    <div>
                        <h3>${escapeHTML(
        ranking.context ||
        ranking.type ||
        'Ranking'
    )}</h3>
                        <p>
                            ${escapeHTML(
        displayValue(ranking.format)
    )}
                            ${ranking.year
            ? ` · ${escapeHTML(ranking.year)}`
            : ''}
                            ${ranking.all_time
            ? ' · All time'
            : ''}
                        </p>
                    </div>
                </article>
            `).join('')}
        </div>
    `;

    return renderSection('Rankings', content);
}

function renderSynonyms(manga) {
    const synonyms = getArray(manga.synonyms);

    if (!synonyms.length) {
        return '';
    }

    return renderSection(
        'Alternative Titles',
        `<ul class="details-synonyms">
            ${synonyms.map((synonym) => `
                <li>${escapeHTML(synonym)}</li>
            `).join('')}
         </ul>`
    );
}

function renderStats(manga) {
    const stats = manga.stats;

    if (!stats || typeof stats !== 'object') {
        return '';
    }

    const distributions = [
        ['Score Distribution', stats.scoreDistribution],
        ['Status Distribution', stats.statusDistribution],
    ];

    const content = distributions.map(([title, values]) => {
        const items = getArray(values);

        if (!items.length) {
            return '';
        }

        return `
            <div class="details-distribution">
                <h3>${escapeHTML(title)}</h3>
                <div class="details-pills">
                    ${items.map((item) => {
            const label =
                item.score ??
                item.status ??
                item.name ??
                item.label ??
                'Value';

            const count =
                item.count ??
                item.amount ??
                item.percentage ??
                item.value;

            return `
                            <span class="details-pill">
                                ${escapeHTML(label)}
                                ${count !== undefined
                    ? `: ${escapeHTML(count)}`
                    : ''}
                            </span>
                        `;
        }).join('')}
                </div>
            </div>
        `;
    }).join('');

    return renderSection('Statistics', content);
}

function renderDetails(manga, metadata = null) {
    const title = getMangaTitle(manga);

    document.title =
        `${title} | Manga & Manhwa Explorer`;

    const sections = [
        renderMainInformation(manga, metadata),
        renderMetadata(manga, metadata),
        renderGenres(manga),
        renderTags(manga),
        renderCreativeTeam(manga),
        renderCharacters(manga),
        renderRankings(manga),
        renderStats(manga),
        renderSynonyms(manga),
        renderRelations(manga),
        renderRecommendations(manga),
        renderTrailer(manga),
        renderExternalLinks(manga),
    ];

    detailsContainer.innerHTML = sections.join('');
}

async function loadDetails() {
    const slug = getUrlParameter('slug');
    const rapidId = getUrlParameter('rapidId');

    detailsContainer.replaceChildren();
    errorContainer.hidden = true;
    errorContainer.textContent = '';

    if (!slug) {
        statusMessage.textContent =
            'Manga title not found.';

        errorContainer.textContent =
            'No manga slug was provided. Open a manga from Explore or Favorites.';

        errorContainer.hidden = false;
        return;
    }

    statusMessage.textContent =
        'Loading manga details...';

    try {
        const response =
            await getMangaDetails(slug);

        const manga =
            response?.data ?? response;

        if (!manga || typeof manga !== 'object') {
            throw new Error(
                'The API returned invalid manga details.'
            );
        }

        currentManga = manga;

        console.log('Nozu manga details:', manga);

        let metadata = null;

        if (rapidId) {
            try {
                metadata = await getMangaMetadataById(
                    rapidId
                );
            } catch (error) {
                console.warn(
                    'Additional metadata is unavailable:',
                    error
                );
            }
        }

        renderDetails(manga, metadata);

        addRecentlyViewed(manga);

        statusMessage.textContent = '';

    } catch (error) {
        console.error(
            'Could not load manga details:',
            error
        );

        currentManga = null;
        detailsContainer.replaceChildren();

        statusMessage.textContent = '';

        errorContainer.textContent =
            error?.message
                ? `Unable to load manga details: ${error.message}`
                : 'Unable to load manga details. Please try again later.';

        errorContainer.hidden = false;
    }
}


detailsContainer?.addEventListener(
    'click',
    handleFavoriteClick
);

if (detailsContainer && statusMessage && errorContainer) {
    loadDetails();
}