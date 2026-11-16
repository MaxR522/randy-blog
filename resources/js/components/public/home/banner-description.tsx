import { Fragment } from 'react';
import { ExternalLink } from '@/components/public/external-link';
import { bannerLinkUrls, linkedPartsOf } from '@/helpers/home';
import { frenchTypography } from '@/helpers/typography';
import { labels } from '@/lib/labels.fr';

/**
 * Banner description with its link words (`labels.home.heroLinks`, in order) turned into external links.
 */
export function BannerDescription() {
    return (
        <p className="text-body/[1.625] laptop:mt-7 laptop:text-lg/7 mt-5 text-pretty">
            {linkedPartsOf(
                labels.home.heroDescription,
                labels.home.heroLinks,
            ).map((part, position) =>
                part.kind === 'link' ? (
                    <ExternalLink
                        key={part.text}
                        href={bannerLinkUrls[part.index]}
                        className="link"
                    >
                        {part.text}
                    </ExternalLink>
                ) : (
                    <Fragment key={position}>
                        {frenchTypography(part.text)}
                    </Fragment>
                ),
            )}
        </p>
    );
}
