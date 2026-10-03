import { Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { SearchBar } from '@/components/public/search-bar';
import { Seo } from '@/components/public/seo';
import PublicLayout from '@/layouts/public-layout';
import { labels } from '@/lib/labels.fr';
import { frenchTypography } from '@/lib/typography';
import { home } from '@/routes';
import type { SeoData } from '@/types';

/**
 * Public 404 page, rendered by the exception handler for every missing page with a real 404 status.
 * Left-aligned on mobile, centred from tablet.
 */
export default function NotFound({ seo }: { seo: SeoData }) {
    return (
        <PublicLayout navbar="back">
            <Seo seo={seo} />

            <div className="px-gutter laptop:py-24 mx-auto w-full max-w-7xl py-14">
                <div className="tablet:mx-auto tablet:items-center tablet:text-center flex max-w-180 flex-col items-start">
                    <p className="text-overline text-accent-700 font-semibold uppercase">
                        {labels.notFound.overline}
                    </p>
                    <h1 className="text-display laptop:text-[5.25rem] mt-4 font-sans leading-none font-semibold tracking-[-0.03em]">
                        {labels.notFound.title}
                    </h1>
                    <p className="text-chapo text-grey-dark laptop:mt-7 laptop:text-2xl mt-5 max-w-150 font-sans text-pretty">
                        {frenchTypography(labels.notFound.text)}
                    </p>
                    <div className="laptop:mt-10 mt-7 w-full max-w-140">
                        <SearchBar size="large" />
                    </div>
                    <Link
                        href={home()}
                        className="text-button text-accent-600 hover:text-accent-700 laptop:mt-7 mt-5 inline-flex min-h-11 items-center gap-2 font-medium"
                    >
                        <ArrowLeft
                            aria-hidden="true"
                            className="size-4.5 flex-none"
                            strokeWidth={2}
                        />
                        <span className="underline underline-offset-4">
                            {frenchTypography(labels.nav.backHome)}
                        </span>
                    </Link>
                </div>
            </div>
        </PublicLayout>
    );
}
