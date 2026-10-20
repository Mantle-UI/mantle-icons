import { createHash } from 'node:crypto';

/** Hash outlines, bearings, advance widths and mappings independently of font encoding. */
export function glyphFingerprint(glyph) {
    const { name, ...outline } = glyph;
    return createHash('sha256').update(JSON.stringify(outline)).digest('hex');
}
