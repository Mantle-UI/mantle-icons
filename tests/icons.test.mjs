import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { createFont, woff2 } from 'fonteditor-core';
import { additions, generateIcons } from '../scripts/generate-icons.mjs';
import { glyphFingerprint } from '../scripts/glyph-fingerprint.mjs';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url));
const legacy = JSON.parse(await read('tests/fixtures/legacy-glyphs.json'));
const selection = JSON.parse(await read('selection.json'));
const hash = (value) => createHash('sha256').update(value).digest('hex');
await woff2.init();

test('generated assets are reproducible and match their SVG sources', async () => {
    for (const [path, output] of await generateIcons()) {
        assert.deepEqual(Buffer.from(output), await read(path), `Stale ${path}; run npm run generate.`);
    }
});

for (const type of ['ttf', 'woff', 'woff2', 'eot']) {
    test(`${type}: all imported glyphs, mappings and metrics remain compatible`, async () => {
        const font = createFont(await read(`fonts/primeicons.${type}`), { type, hinting: true }).get();
        assert.deepEqual(font.glyf.slice(0, legacy.glyphs.length).map(glyphFingerprint), legacy.glyphs);
        assert.equal(font.glyf.length, legacy.glyphs.length + additions.length);
        assert.deepEqual({
            unitsPerEm: font.head.unitsPerEm, ascent: font.hhea.ascent,
            descent: font.hhea.descent, lineGap: font.hhea.lineGap
        }, legacy.metrics);
        for (const { name, code } of additions) {
            const glyphs = font.glyf.filter((glyph) => glyph.unicode?.includes(code));
            assert.equal(glyphs.length, 1, name);
            assert.ok(glyphs[0].contours.length > 0, name);
            assert.equal(glyphs[0].advanceWidth, 1024, name);
            assert.ok(glyphs[0].xMin >= 0 && glyphs[0].xMax <= 1024, name);
            assert.ok(glyphs[0].yMin >= -64 && glyphs[0].yMax <= 960, name);
        }
    });
}

test('CSS aliases, selection and gallery expose unique, matching codepoints', async () => {
    const css = (await read('mantleicons.css')).toString();
    const demo = (await read('demo.html')).toString();
    const icons = selection.icons.map(({ properties: { name, code } }) => ({ name, code }));
    assert.deepEqual(icons.slice(0, legacy.icons.length), legacy.icons);
    assert.deepEqual(selection.icons.slice(0, legacy.icons.length).map((icon) => hash(JSON.stringify(icon))), legacy.selection);
    assert.equal(new Set(icons.map((icon) => icon.name)).size, icons.length);
    assert.equal(new Set(icons.map((icon) => icon.code)).size, icons.length);
    assert.equal(icons.length, legacy.icons.length + additions.length);
    for (const { name, code } of icons) {
        assert.match(css, new RegExp(`\\.mi-${name}:before,\\s*\\.pi-${name}:before\\s*\\{\\s*content: "\\\\${code.toString(16)}";`));
        assert.ok(demo.includes(`mi mi-${name}`), `Missing gallery entry: ${name}`);
    }
    assert.match(demo, new RegExp(`${icons.length} icons`));
    assert.match((await read('primeicons.css')).toString(), /@import '\.\/mantleicons.css'/);
});

test('SVG font retains its identity and includes both additions', async () => {
    const svg = (await read('fonts/primeicons.svg')).toString();
    assert.match(svg, /<font id="primeicons"/);
    assert.match(svg, /units-per-em="1024" ascent="960" descent="-64"/);
    const imported = [...svg.matchAll(/<glyph\b[^>]*\/>/g)]
        .filter(([tag]) => !additions.some(({ name }) => tag.includes(`glyph-name="${name}"`)))
        .map(([tag]) => hash(tag));
    assert.deepEqual(imported, legacy.svgGlyphs);
    for (const { name, code } of [...legacy.icons, ...additions]) {
        assert.match(svg, new RegExp(`<glyph unicode="&#x${code.toString(16)};" glyph-name="${name}"`));
    }
});
