import type { ComponentType, SVGProps } from 'react';
import {
    FacebookIcon,
    LinkedInIcon,
    XIcon,
    YouTubeIcon,
} from '@/components/public/brand-icons';
import { labels } from '@/lib/labels.fr';
import { socialUrls } from '@/lib/social';

/**
 * The author's four accounts with their brand glyph, listed in the footer and on the author page.
 */
export const socialLinks: {
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
