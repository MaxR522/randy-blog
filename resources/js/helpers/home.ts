import { socialUrls } from '@/lib/social';

/** Targets of the banner's link words, in the order of `labels.home.heroLinks`. */
export const bannerLinkUrls = [
    socialUrls.hautetfort,
    socialUrls.facebook,
    socialUrls.x,
    socialUrls.linkedin,
    socialUrls.youtube,
];

/** One piece of a text with link words: plain text, or a link word with its index. */
export type TextPart =
    | { kind: 'text'; text: string }
    | { kind: 'link'; text: string; index: number };

/** Splits the text around each link word, taken in order. */
export function linkedPartsOf(
    text: string,
    linkTexts: readonly string[],
): TextPart[] {
    const parts: TextPart[] = [];
    let rest = text;

    linkTexts.forEach((linkText, index) => {
        const position = rest.indexOf(linkText);

        parts.push({ kind: 'text', text: rest.slice(0, position) });
        parts.push({ kind: 'link', text: linkText, index });
        rest = rest.slice(position + linkText.length);
    });

    parts.push({ kind: 'text', text: rest });

    return parts;
}
