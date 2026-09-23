/**
 * Reports (or rewrites with --fix) Tailwind classes that have a canonical
 * form, e.g. `text-[0.9375rem]/normal` -> `text-button/normal`. Uses the
 * same Tailwind engine as the VS Code IntelliSense "can be written as" hint.
 */
import { __unstable__loadDesignSystem } from '@tailwindcss/node';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const shouldFix = process.argv.includes('--fix');

const scannedDirectories = ['resources/js', 'resources/views'];
const ignoredDirectories = [
    'resources/js/actions',
    'resources/js/routes',
    'resources/js/wayfinder',
    'resources/js/components/ui',
];
const scannedExtensions = ['.ts', '.tsx', '.blade.php'];

const cssEntryPoint = path.join(root, 'resources/css/app.css');
const designSystem = await __unstable__loadDesignSystem(
    readFileSync(cssEntryPoint, 'utf8'),
    { base: path.dirname(cssEntryPoint) },
);

/** @type {Map<string, string>} */
const canonicalCache = new Map();

function canonicalClass(candidate) {
    if (!canonicalCache.has(candidate)) {
        const [canonical] = designSystem.canonicalizeCandidates([candidate], {
            rem: 16,
        });
        canonicalCache.set(candidate, canonical ?? candidate);
    }

    return canonicalCache.get(candidate);
}

function* sourceFiles(directory) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
        const entryPath = path.join(directory, entry.name);
        const relativePath = path.relative(root, entryPath);

        if (entry.isDirectory()) {
            if (!ignoredDirectories.includes(relativePath)) {
                yield* sourceFiles(entryPath);
            }
        } else if (scannedExtensions.some((ext) => entry.name.endsWith(ext))) {
            yield entryPath;
        }
    }
}

const tokenPattern = /[^\s"'`{}]+/g;
let findingCount = 0;

for (const directory of scannedDirectories) {
    for (const filePath of sourceFiles(path.join(root, directory))) {
        const lines = readFileSync(filePath, 'utf8').split('\n');
        let fileChanged = false;

        const fixedLines = lines.map((line, index) =>
            line.replace(tokenPattern, (token) => {
                const canonical = canonicalClass(token);

                if (canonical === token) {
                    return token;
                }

                findingCount++;
                fileChanged = true;
                console.log(
                    `${path.relative(root, filePath)}:${index + 1}  ${token} -> ${canonical}`,
                );

                return canonical;
            }),
        );

        if (shouldFix && fileChanged) {
            writeFileSync(filePath, fixedLines.join('\n'));
        }
    }
}

if (findingCount > 0 && !shouldFix) {
    console.log(
        `\n${findingCount} non-canonical Tailwind class(es). Run: npm run tailwind:canonical -- --fix`,
    );
    process.exit(1);
}
