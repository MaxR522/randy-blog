import { Head } from '@inertiajs/react';
import { StandardCard } from '@/components/public/article-cards';
import { buttonClasses } from '@/components/public/button';
import { ExternalLink } from '@/components/public/external-link';
import { SectionHeader } from '@/components/public/section-header';
import { socialLinks } from '@/components/public/social-links';
import PublicLayout from '@/layouts/public-layout';
import { cloudinarySrcSet, cloudinaryUrl } from '@/lib/cloudinary';
import { labels } from '@/lib/labels.fr';
import { frenchTypography } from '@/lib/typography';
import type { ArticleCard, AuthorProfile } from '@/types';

type ProfileProps = {
    author: AuthorProfile;
    latest: ArticleCard[];
};

const container = 'mx-auto w-full max-w-7xl px-gutter';

const AVATAR_WIDTHS = [240, 480, 720, 832] as const;

const avatarClasses =
    'absolute inset-0 size-full rounded-sm bg-accent-50 object-cover';

/**
 * Portrait with its photo credit: a centred 240 px square below laptop; from laptop, the photo fills
 * its column and stretches down so photo and credit end with the biography. The image is absolutely
 * positioned so its own height never makes the row taller than the text. It is the page's LCP image.
 */
function Avatar({ author }: { author: AuthorProfile }) {
    return (
        <div className="laptop:items-stretch laptop:text-left flex flex-col items-center text-center">
            <div className="laptop:size-auto laptop:min-h-80 laptop:w-full laptop:flex-1 relative size-60">
                {author.avatar ? (
                    <img
                        src={cloudinaryUrl(author.avatar, 832)}
                        srcSet={cloudinarySrcSet(author.avatar, AVATAR_WIDTHS)}
                        sizes="(min-width: 1024px) 416px, 240px"
                        alt={author.fullName}
                        width={416}
                        height={416}
                        fetchPriority="high"
                        decoding="async"
                        className={avatarClasses}
                    />
                ) : (
                    <div className={avatarClasses} />
                )}
            </div>
            {author.avatar && author.avatarCredit && (
                <p className="text-caption text-grey-dark laptop:mt-3 mt-2.5">
                    {frenchTypography(
                        `${labels.article.photoCredit} ${author.avatarCredit}`,
                    )}
                </p>
            )}
        </div>
    );
}

export default function Profile({ author, latest }: ProfileProps) {
    const name = frenchTypography(author.name);

    return (
        <PublicLayout navbar="back">
            <Head>
                <title>{name}</title>
                <meta
                    name="description"
                    content={frenchTypography(author.description)}
                />
            </Head>

            <div
                className={`${container} laptop:grid laptop:grid-cols-[26rem_1fr] laptop:gap-x-16 laptop:pt-20 pt-10`}
            >
                <Avatar author={author} />

                <div className="min-w-0">
                    <h1 className="text-h1 max-tablet:text-[1.75rem] laptop:mt-0 laptop:text-[2.625rem] desktop:text-[4rem] mt-7 font-sans leading-none tracking-tight">
                        {name}
                    </h1>

                    {author.bioHtml && (
                        <div
                            className="article-body laptop:mt-9 mx-0 mt-5 max-w-160 *:last:mb-0"
                            dangerouslySetInnerHTML={{ __html: author.bioHtml }}
                        />
                    )}
                </div>

                <ul
                    role="list"
                    className="tablet:flex tablet:flex-wrap laptop:col-start-2 laptop:mt-9 mt-5 grid grid-cols-2 gap-3"
                >
                    {socialLinks.map(({ label, href, Icon }) => (
                        <li key={label}>
                            <ExternalLink
                                href={href}
                                className={buttonClasses(
                                    'secondary',
                                    'w-full gap-2.5 px-4.5',
                                )}
                            >
                                <Icon className="size-4.5 flex-none" />
                                {label}
                            </ExternalLink>
                        </li>
                    ))}
                </ul>
            </div>

            {latest.length > 0 && (
                <section
                    aria-labelledby="derniers-articles"
                    className={`${container} laptop:pt-24 laptop:pb-24 pt-16 pb-14`}
                >
                    <SectionHeader
                        id="derniers-articles"
                        title={labels.author.latest}
                    />
                    <ul
                        role="list"
                        className="tablet:grid-cols-2 tablet:gap-x-grid tablet:gap-y-12 laptop:grid-cols-3 grid gap-8"
                    >
                        {latest.map((article) => (
                            <StandardCard
                                key={article.id}
                                article={article}
                                layout="stack-wide"
                                sizes="(min-width: 1280px) 389px, (min-width: 1024px) 31vw, (min-width: 768px) 50vw, 100vw"
                            />
                        ))}
                    </ul>
                </section>
            )}
        </PublicLayout>
    );
}
