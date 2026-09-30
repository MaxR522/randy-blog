import { Headphones, Play } from 'lucide-react';
import { labels } from '@/lib/labels.fr';

type AudioSlotProps = {
    minutes: number;
};

/**
 * « Écouter l'article »: static for now, text-to-speech is undecided. The button is marked
 * unavailable rather than doing nothing; a real player only needs a handler and to drop `aria-disabled`.
 */
export function AudioSlot({ minutes }: AudioSlotProps) {
    return (
        <button
            type="button"
            aria-disabled="true"
            className="border-grey-light text-primary tablet:w-auto inline-flex h-13.5 w-full shrink-0 cursor-default items-center gap-3.5 rounded-md border bg-white py-1 pr-5 pl-1 text-left"
        >
            <span className="bg-primary flex size-11 flex-none items-center justify-center rounded-md text-white">
                <Play
                    aria-hidden="true"
                    className="ml-0.5 size-4.5"
                    fill="currentColor"
                    strokeWidth={2}
                />
            </span>
            <span className="flex flex-col gap-0.5">
                <span className="text-button/[1.2] font-semibold">
                    {labels.article.listen}
                </span>
                <span className="text-meta text-grey-dark inline-flex items-center gap-1 font-medium">
                    <Headphones
                        aria-hidden="true"
                        className="size-3"
                        strokeWidth={2}
                    />
                    {labels.article.audioDuration(minutes)}
                </span>
            </span>
        </button>
    );
}
