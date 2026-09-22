import { cloudinarySrcSet, cloudinaryUrl } from '@/lib/cloudinary';
import { cn } from '@/lib/utils';

const WIDTHS = [240, 360, 480, 640, 960, 1280] as const;

type ArticleImageProps = {
    src: string | null;
    sizes: string;
    isPriority?: boolean;
    className?: string;
};

/**
 * Card image: always 3:2, cropped to fill. Decorative (the title is the link text).
 */
export function ArticleImage({
    src,
    sizes,
    isPriority = false,
    className,
}: ArticleImageProps) {
    const classes = cn(
        'aspect-card bg-grey-subtle w-full rounded-sm object-cover',
        className,
    );

    if (!src) {
        return <div className={classes} />;
    }

    return (
        <img
            src={cloudinaryUrl(src, 960)}
            srcSet={cloudinarySrcSet(src, WIDTHS)}
            sizes={sizes}
            alt=""
            width={960}
            height={640}
            loading={isPriority ? 'eager' : 'lazy'}
            fetchPriority={isPriority ? 'high' : undefined}
            decoding="async"
            className={classes}
        />
    );
}
