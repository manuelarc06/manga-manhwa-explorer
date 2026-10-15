const menuButton = document.querySelector('#menu-button');
const navLinks = document.querySelector('#nav-links');

function setMenuOpen(shouldOpen) {
    if (!menuButton || !navLinks) { return; }

    navLinks.classList.toggle('show', shouldOpen);

    menuButton.setAttribute('aria-expanded', String(shouldOpen));

    menuButton.setAttribute('aria-label', shouldOpen ? 'Close navigation menu' : 'Open navigation menu');

    menuButton.textContent = shouldOpen ? '×' : '☰';
}

if (menuButton && navLinks) {
    menuButton.addEventListener('click', () => {
        const isOpen = menuButton.getAttribute('aria-expanded') === 'true';

        setMenuOpen(!isOpen);
    });

    navLinks.querySelectorAll('a').forEach((link) => {
        link.addEventListener('click', () => { setMenuOpen(false); });
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') { setMenuOpen(false); menuButton.focus(); }
    });

    window.addEventListener('resize', () => {
        if (window.innerWidth > 700) { setMenuOpen(false); }
    });
}

