import { Link } from '@inertiajs/react';
import type { ComponentType, SVGProps } from 'react';
import {
    FacebookIcon,
    LinkedInIcon,
    XIcon,
    YouTubeIcon,
} from '@/components/public/brand-icons';
import { labels } from '@/lib/labels.fr';
import { socialUrls } from '@/lib/social';
import { frenchTypography } from '@/lib/typography';
import { home, privacy } from '@/routes';

const socialLinks: {
    label: string;
    href: string;
    Icon: ComponentType<SVGProps<SVGSVGElement>>;
}[] = [
    {
        label: labels.share.facebook,
        href: socialUrls.facebook,
        Icon: FacebookIcon,
    },
    { label: labels.share.x, href: socialUrls.x, Icon: XIcon },
    {
        label: labels.share.linkedin,
        href: socialUrls.linkedin,
        Icon: LinkedInIcon,
    },
    {
        label: labels.share.youtube,
        href: socialUrls.youtube,
        Icon: YouTubeIcon,
    },
];

const columnTitleClasses =
    'mb-2 text-overline font-semibold text-grey-dark uppercase';

const footerLinkClasses =
    'flex min-h-11 items-center gap-2.5 text-button font-medium text-primary hover:text-accent-800';

export function Footer() {
    return (
        <footer className="border-primary border-t-2 bg-white">
            <div className="px-gutter laptop:pt-14 mx-auto w-full max-w-7xl pt-12 pb-9">
                <div className="tablet:grid-cols-[1.3fr_1fr_1fr] tablet:gap-12 grid gap-10">
                    <div>
                        <Link
                            href={home()}
                            className="text-primary font-sans text-[1.875rem] leading-none font-semibold tracking-[-0.015em]"
                        >
                            {labels.brand.name}
                        </Link>
                        <p className="text-grey-dark mt-2.5 font-sans text-[1.1875rem]/[1.4] tracking-[-0.01em] italic">
                            {frenchTypography(labels.brand.tagline)}
                        </p>
                    </div>
                    <div>
                        <h2 className={columnTitleClasses}>
                            {labels.footer.follow}
                        </h2>
                        <ul className="tablet:grid-cols-1 grid grid-cols-2 gap-x-4">
                            {socialLinks.map(({ label, href, Icon }) => (
                                <li key={label}>
                                    <a
                                        href={href}
                                        target="_blank"
                                        rel="noopener"
                                        className={footerLinkClasses}
                                    >
                                        <Icon className="size-5 flex-none" />
                                        {label}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div>
                        <h2 className={columnTitleClasses}>
                            {labels.footer.info}
                        </h2>
                        <ul>
                            <li>
                                <Link
                                    href={privacy()}
                                    className={footerLinkClasses}
                                >
                                    <span className="border-b border-current">
                                        {labels.footer.privacy}
                                    </span>
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>
                <div className="border-grey-light text-caption text-grey-dark tablet:flex-row tablet:items-center tablet:justify-between tablet:gap-6 mt-10 flex flex-col gap-2 border-t pt-5">
                    <p>{labels.footer.copyright}</p>
                    <p>{labels.footer.credit}</p>
                </div>
            </div>
        </footer>
    );
}
