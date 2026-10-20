import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createFont, woff2 } from 'fonteditor-core';
import svgpath from 'svgpath';
import contoursModule from 'fonteditor-core/lib/ttf/util/contours2svg';

const contours2svg = contoursModule.default;
const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root));
const text = async (path) => (await read(path)).toString('utf8');
export const additions = JSON.parse(await text('scripts/icon-additions.json'));

/** Generate additions without rebuilding the imported IcoMoon outlines from SVG. */
export async function generateIcons() {
    await woff2.init();
    const font = createFont(await read('fonts/primeicons.ttf'), { type: 'ttf', hinting: true });
    const data = font.get();
    const selection = JSON.parse(await text('selection.json'));
    const generated = [];

    for (const { name, code, tags } of additions) {
        const source = await text(`raw-svg/${name}.svg`);
        assert.match(source, /viewBox="0 0 24 24"/);
        assert.doesNotMatch(source, /\bstroke[=-]/, 'Use filled outlines, not SVG strokes.');
        // Expand implicit relative lines and arcs before the font importer's path parser.
        const normalized = source.replace(/\bd="([^"]+)"/g, (_, path) => {
            const segments = [];
            svgpath(path).unarc().abs().unshort().iterate((segment) => {
                segments.push(segment.join(' '));
            });
            return `d="${segments.join(' ')}"`;
        });
        const glyph = createFont(normalized, { type: 'svg', combinePath: true }).get().glyf[0];
        const { xMin, xMax, yMin, yMax } = glyph;
        const scale = 1024 / Math.max(xMax - xMin, yMax - yMin);
        const left = (1024 - (xMax - xMin) * scale) / 2;
        // Match IcoMoon's 1024 em and 6.25% baseline; preserve the source aspect ratio.
        glyph.contours = glyph.contours.map((contour) => contour.map((point) => ({
            ...point,
            x: Math.round((point.x - xMin) * scale + left),
            y: Math.round(960 - (yMax - point.y) * scale)
        })));
        const points = glyph.contours.flat();
        Object.assign(glyph, {
            name, unicode: [code], advanceWidth: 1024,
            xMin: Math.min(...points.map((point) => point.x)),
            xMax: Math.max(...points.map((point) => point.x)),
            yMin: Math.min(...points.map((point) => point.y)),
            yMax: Math.max(...points.map((point) => point.y))
        });
        glyph.leftSideBearing = glyph.xMin;
        const index = data.glyf.findIndex((item) => item.unicode?.includes(code));
        if (index === -1) {
            data.glyf.push(glyph);
        } else {
            assert.equal(selection.icons.find((item) => item.properties.code === code)?.properties.name, name,
                'Never overwrite an assigned codepoint.');
            data.glyf[index] = glyph;
        }
        const paths = [contours2svg(glyph.contours.map((contour) => contour.map((point) => ({
            ...point, y: 960 - point.y
        }))))];
        let entry = selection.icons.find((item) => item.properties.name === name);
        if (!entry) {
            entry = {
                icon: {}, attrs: [{}],
                properties: {
                    order: Math.max(...selection.icons.map((item) => item.properties.order)) + 1,
                    id: Math.max(...selection.icons.map((item) => item.properties.id)) + 1,
                    name, prevSize: 24, code
                },
                setIdx: 0, setId: 1, iconIdx: selection.icons.length
            };
            selection.icons.push(entry);
        }
        assert.equal(entry.properties.code, code);
        entry.icon = {
            paths, attrs: [{}], isMulticolor: false, isMulticolor2: false,
            grid: 16, tags: [name, ...tags]
        };
        generated.push({ name, hex: code.toString(16), glyph });
    }

    const outputs = new Map();
    for (const type of ['ttf', 'woff', 'woff2', 'eot']) {
        outputs.set(`fonts/primeicons.${type}`, font.write({ type, hinting: true }));
    }
    // Retain the original SVG font's metadata, font id and every imported glyph verbatim.
    let svgFont = await text('fonts/primeicons.svg');
    for (const { name, hex, glyph } of generated) {
        svgFont = svgFont.replace(new RegExp(`<glyph[^>]*glyph-name="${name}"[^>]*/>\\s*`, 'g'), '');
        svgFont = svgFont.replace('</font>',
            `<glyph unicode="&#x${hex};" glyph-name="${name}" data-tags="${name}" d="${contours2svg(glyph.contours)}" />\n</font>`);
    }
    outputs.set('fonts/primeicons.svg', svgFont);
    outputs.set('selection.json', JSON.stringify(selection));

    const cssMarker = '/* Generated additions: npm run generate */';
    let css = (await text('mantleicons.css')).split(cssMarker)[0].trimEnd();
    css += `\n\n${cssMarker}\n`;
    for (const { name, hex } of generated) {
        css += `.mi-${name}:before,\n.pi-${name}:before {\n    content: "\\${hex}";\n}\n\n`;
    }
    outputs.set('mantleicons.css', css.trimEnd() + '\n');

    let demo = await text('demo.html');
    demo = demo.replace(/\d+ icons/, `${selection.icons.length} icons`);
    demo = demo.replace(/        <!-- Generated additions -->[\s\S]*?        <!-- End generated additions -->\n/, '');
    const cards = generated.map(({ name, hex }) => `        <div class="glyph fs1">
            <div class="clearfix bshadow0 pbs">
                <span class="mi mi-${name}"></span>
                <span class="mls"> mi-${name}</span>
            </div>
            <fieldset class="fs0 size1of1 clearfix hidden-false">
                <input type="text" readonly value="${hex}" class="unit size1of2" />
                <input type="text" maxlength="1" readonly value="&#x${hex};" class="unitRight size1of2 talign-right" />
            </fieldset>
        </div>`).join('\n');
    demo = demo.replace('        <div class="glyph fs1">',
        `        <!-- Generated additions -->\n${cards}\n        <!-- End generated additions -->\n        <div class="glyph fs1">`);
    outputs.set('demo.html', demo);
    return outputs;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    const outputs = await generateIcons();
    for (const [path, output] of outputs) {
        if (process.argv.includes('--check')) {
            assert.deepEqual(Buffer.from(output), await read(path), `Stale ${path}; run npm run generate.`);
        } else {
            await writeFile(new URL(path, root), output);
        }
    }
    console.log(`${process.argv.includes('--check') ? 'Checked' : 'Generated'} ${outputs.size} icon assets.`);
}
