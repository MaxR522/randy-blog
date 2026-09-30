import { Check, Link2 } from 'lucide-react';
import type { ComponentType, SVGProps } from 'react';
import { useEffect, useState } from 'react';
import {
    FacebookIcon,
    LinkedInIcon,
    XIcon,
} from '@/components/public/brand-icons';
import { ExternalLink } from '@/components/public/external-link';
import { Toast } from '@/components/public/toast';
import { labels } from '@/lib/labels.fr';
import { cn } from '@/lib/utils';

const COPIED_DURATION_MS = 2000;

type ShareButtonsProps = {
    url: string;
    title: string;
};

type ShareNetwork = {
    name: string;
    icon: ComponentType<SVGProps<SVGSVGElement>>;
    shareUrl: (url: string, title: string) => string;
};

const networks: ShareNetwork[] = [
    {
        name: labels.share.facebook,
        icon: FacebookIcon,
        shareUrl: (url) =>
            `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    },
    {
        name: labels.share.x,
        icon: XIcon,
        shareUrl: (url, title) =>
            `https://x.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
    },
    {
        name: labels.share.linkedin,
        icon: LinkedInIcon,
        shareUrl: (url) =>
            `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    },
];

/**
 * Icon and label from tablet, 44 × 44 icon squares on phones (the label stays for screen readers).
 */
const itemClasses =
    'inline-flex size-11 items-center justify-center gap-2 rounded-md border text-body-small font-medium tablet:w-auto tablet:px-4';

const iconClasses = 'size-5 tablet:size-4.5';

/**
 * Copy with the Clipboard API, or with the legacy command where the API is missing or refuses.
 */
async function copyToClipboard(text: string): Promise<void> {
    try {
        await navigator.clipboard.writeText(text);

        return;
    } catch {
        // Falls through to the legacy copy below.
    }

    const field = document.createElement('textarea');

    field.value = text;
    field.setAttribute('readonly', '');
    field.className = 'fixed -left-full opacity-0';
    document.body.append(field);
    field.select();

    const isCopied = document.execCommand('copy');

    field.remove();

    if (!isCopied) {
        throw new Error('Copy refused');
    }
}

/**
 * Share links (new tab) and « Copier le lien », which turns green for two seconds, shows a toast
 * and announces the copy.
 */
export function ShareButtons({ url, title }: ShareButtonsProps) {
    const [isCopied, setIsCopied] = useState(false);

    useEffect(() => {
        if (!isCopied) {
            return;
        }

        const timeout = window.setTimeout(
            () => setIsCopied(false),
            COPIED_DURATION_MS,
        );

        return () => window.clearTimeout(timeout);
    }, [isCopied]);

    const copyLink = async () => {
        try {
            await copyToClipboard(url);
            setIsCopied(true);
        } catch {
            setIsCopied(false);
        }
    };

    return (
        <>
            <ul
                role="list"
                aria-label={labels.article.share}
                className="tablet:gap-2.5 flex flex-wrap gap-2"
            >
                {networks.map(({ name, icon: Icon, shareUrl }) => (
                    <li key={name}>
                        <ExternalLink
                            href={shareUrl(url, title)}
                            className={cn(
                                itemClasses,
                                'border-grey-light text-primary hover:bg-grey-subtle',
                            )}
                        >
                            <Icon className={iconClasses} />
                            <span className="sr-only">
                                {labels.a11y.shareOn}{' '}
                            </span>
                            <span className="max-tablet:sr-only">{name}</span>
                        </ExternalLink>
                    </li>
                ))}
                <li>
                    <button
                        type="button"
                        onClick={copyLink}
                        className={cn(
                            itemClasses,
                            'ease-standard transition-colors duration-(--duration-base)',
                            isCopied
                                ? 'border-green-600 bg-green-50 font-semibold text-green-700'
                                : 'border-grey-light text-primary hover:bg-grey-subtle bg-white',
                        )}
                    >
                        {isCopied ? (
                            <Check
                                aria-hidden="true"
                                className={iconClasses}
                                strokeWidth={2}
                            />
                        ) : (
                            <Link2
                                aria-hidden="true"
                                className={iconClasses}
                                strokeWidth={1.75}
                            />
                        )}
                        <span className="max-tablet:sr-only">
                            {isCopied
                                ? labels.article.linkCopied
                                : labels.article.copyLink}
                        </span>
                    </button>
                </li>
            </ul>
            <Toast
                message={labels.article.linkCopied}
                announcement={labels.a11y.linkCopied}
                isVisible={isCopied}
            />
        </>
    );
}
