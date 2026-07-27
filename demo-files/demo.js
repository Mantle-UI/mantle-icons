const searchInput = document.getElementById('iconSearch');
const sizeInput = document.getElementById('iconSize');
const sizeValue = document.getElementById('iconSizeValue');
const glyphs = Array.from(document.querySelectorAll('.glyph'));

function filterIcons() {
    const query = searchInput.value.trim().toLowerCase();

    glyphs.forEach((glyph) => {
        const iconName = glyph.querySelector('.mls').textContent.toLowerCase();

        glyph.hidden = query && !iconName.includes(query);
    });
}

function updateIconSize() {
    const size = `${sizeInput.value}px`;

    document.documentElement.style.setProperty('--icon-size', size);
    sizeValue.value = size;
    sizeValue.textContent = size;
}

searchInput.addEventListener('input', filterIcons);
sizeInput.addEventListener('input', updateIconSize);

document.body.addEventListener('click', (event) => {
    const input = event.target.closest('.glyph input');

    if (input) {
        input.select();
    }
});
