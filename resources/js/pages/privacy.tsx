import { Head } from '@inertiajs/react';
import { Fragment } from 'react';
import { ExternalLink } from '@/components/public/external-link';
import PublicLayout from '@/layouts/public-layout';
import { labels } from '@/lib/labels.fr';
import type { PolicyBlock, PolicyInline } from '@/lib/privacy-policy.fr';
import { privacyPolicy } from '@/lib/privacy-policy.fr';
import { frenchTypography } from '@/lib/typography';

/**
 * Text with its links: `mailto:` stays in the tab, other sites open in a new one.
 */
function Inline({ content }: { content: PolicyInline[] }) {
    return content.map((part, index) => {
        if (typeof part === 'string') {
            return <Fragment key={index}>{frenchTypography(part)}</Fragment>;
        }

        const text = frenchTypography(part.text);

        return part.href.startsWith('mailto:') ? (
            <a key={index} href={part.href}>
                {text}
            </a>
        ) : (
            <ExternalLink key={index} href={part.href}>
                {text}
            </ExternalLink>
        );
    });
}

function Block({ block }: { block: PolicyBlock }) {
    if (block.type === 'list') {
        return (
            <ul>
                {block.items.map((item, index) => (
                    <li key={index}>
                        <Inline content={item} />
                    </li>
                ))}
            </ul>
        );
    }

    return (
        <p>
            <Inline content={block.content} />
        </p>
    );
}

export default function Privacy() {
    return (
        <PublicLayout navbar="back">
            <Head>
                <title>{labels.footer.privacy}</title>
                <meta
                    name="description"
                    content={frenchTypography(privacyPolicy.description)}
                />
            </Head>

            <article className="px-gutter laptop:pt-20 laptop:pb-24 mx-auto w-full max-w-7xl pt-10 pb-14">
                <header className="max-w-article-header mx-auto">
                    <h1 className="text-h1 font-sans">
                        {labels.footer.privacy}
                    </h1>
                    <p className="text-meta text-grey-dark mt-4 font-medium">
                        {frenchTypography(
                            labels.privacy.updatedAt(privacyPolicy.updatedAt),
                        )}
                    </p>
                    <p className="text-chapo text-grey-dark laptop:mt-8 mt-6 font-sans">
                        {frenchTypography(privacyPolicy.introduction)}
                    </p>
                </header>

                <div className="article-body">
                    {privacyPolicy.sections.map((section) => (
                        <section key={section.id} aria-labelledby={section.id}>
                            <h2 id={section.id}>
                                {frenchTypography(section.title)}
                            </h2>
                            {section.blocks.map((block, index) => (
                                <Block key={index} block={block} />
                            ))}
                        </section>
                    ))}
                </div>
            </article>
        </PublicLayout>
    );
}
