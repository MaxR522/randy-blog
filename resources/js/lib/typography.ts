const NO_BREAK_SPACE = ' ';
const NARROW_NO_BREAK_SPACE = ' ';

/**
 * French typography for plain text: typographic apostrophe and ellipsis,
 * no-break space before « : » and inside « guillemets », narrow no-break
 * space before « ; ! ? ».
 */
export function frenchTypography(text: string): string {
    return text
        .replace(/\.\.\./g, '…')
        .replace(/'/g, '’')
        .replace(/«\s*/g, `«${NO_BREAK_SPACE}`)
        .replace(/\s*»/g, `${NO_BREAK_SPACE}»`)
        .replace(/(\S)[   ]*([;!?]+)/g, `$1${NARROW_NO_BREAK_SPACE}$2`)
        .replace(/(\S)[   ]*:(?=\s|$)/g, `$1${NO_BREAK_SPACE}:`);
}
