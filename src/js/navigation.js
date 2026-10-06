const menuButton = document.querySelector('#menu-button');
const navLinks = document.querySelector('#nav-links');

/**
 * Toggles the mobile navigation menu.
 */
function toggleMenu() {
    const isOpen = navLinks.classList.toggle('show');

    menuButton.setAttribute(
        'aria-expanded',
        String(isOpen)
    );
}

if (menuButton && navLinks) {
    menuButton.addEventListener('click', toggleMenu);
}
