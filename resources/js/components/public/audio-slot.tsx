import { Headphones, Pause, Play } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { labels } from '@/lib/labels.fr';
import { cn } from '@/lib/utils';

type AudioSlotProps = {
    /** The MP3 or M4A file on Cloudinary. */
    url: string;
    /** Seconds, from Cloudinary's upload answer; the file's own metadata replaces it once loaded. */
    duration: number;
};

/**
 * `1:24`, as on the board.
 */
function clock(seconds: number): string {
    const whole = Math.max(0, Math.floor(seconds));

    return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`;
}

/**
 * « Écouter l'article » (PUB-ART-14): idle, the whole box is one button with the label and the duration. Once
 * started it becomes a small player: the same button pauses and resumes, the time reads `1:24 / 6:00`, and the
 * 4 px progress bar is a native range input, so it can be clicked, dragged or moved with the arrow keys.
 * The `<audio>` element loads nothing until the reader presses play (`preload="none"`), and never autoplays.
 */
export function AudioSlot({ url, duration }: AudioSlotProps) {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [isStarted, setIsStarted] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [current, setCurrent] = useState(0);
    const [total, setTotal] = useState(duration);

    useEffect(() => {
        const audio = audioRef.current;

        return () => audio?.pause();
    }, []);

    function toggle(): void {
        const audio = audioRef.current;

        if (!audio) {
            return;
        }

        setIsStarted(true);

        if (audio.paused) {
            void audio.play().catch(() => setIsPlaying(false));
        } else {
            audio.pause();
        }
    }

    function seek(seconds: number): void {
        const audio = audioRef.current;

        if (audio) {
            audio.currentTime = seconds;
        }

        setCurrent(seconds);
    }

    const minutes = Math.max(1, Math.ceil(duration / 60));
    const progress = total > 0 ? Math.min(100, (current / total) * 100) : 0;

    return (
        <div
            role={isStarted ? 'group' : undefined}
            aria-label={isStarted ? labels.article.player : undefined}
            className={cn(
                'text-primary tablet:w-auto flex h-13.5 w-full shrink-0 items-center gap-3.5 rounded-md border bg-white py-1 pr-5 pl-1',
                isStarted ? 'border-primary tablet:w-95' : 'border-grey-light',
            )}
        >
            {/* One element in both states, so the focus stays on it when the player opens. */}
            <button
                type="button"
                onClick={toggle}
                aria-label={
                    isStarted
                        ? isPlaying
                            ? labels.article.pause
                            : labels.article.listen
                        : undefined
                }
                className={cn(
                    'flex items-center gap-3.5 rounded-md text-left',
                    isStarted ? 'flex-none' : 'min-w-0 flex-1',
                )}
            >
                <span className="bg-primary flex size-11 flex-none items-center justify-center rounded-md text-white">
                    {isPlaying ? (
                        <Pause
                            aria-hidden="true"
                            className="size-4.5"
                            fill="currentColor"
                            strokeWidth={2}
                        />
                    ) : (
                        <Play
                            aria-hidden="true"
                            className="ml-0.5 size-4.5"
                            fill="currentColor"
                            strokeWidth={2}
                        />
                    )}
                </span>
                {!isStarted && (
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
                )}
            </button>

            {isStarted && (
                <div className="flex min-w-0 flex-1 flex-col">
                    <div className="text-caption flex justify-between gap-3 font-semibold">
                        <span aria-hidden="true">{labels.article.listen}</span>
                        <span className="text-grey-dark font-medium tabular-nums">
                            {clock(current)} / {clock(total)}
                        </span>
                    </div>
                    <div className="has-focus-visible:outline-accent-600 relative flex h-6 items-center rounded-sm has-focus-visible:outline-2 has-focus-visible:outline-offset-2">
                        <div
                            aria-hidden="true"
                            className="bg-grey-light h-1 w-full overflow-hidden rounded-xs"
                        >
                            <div
                                className="bg-accent-600 h-full"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <input
                            type="range"
                            min={0}
                            max={Math.max(1, Math.round(total))}
                            step={1}
                            value={Math.round(current)}
                            aria-label={labels.article.seek}
                            aria-valuetext={labels.article.audioPosition(
                                current,
                                total,
                            )}
                            onChange={(event) =>
                                seek(Number(event.target.value))
                            }
                            className="absolute inset-0 size-full cursor-pointer opacity-0"
                        />
                    </div>
                </div>
            )}

            <audio
                ref={audioRef}
                src={url}
                preload="none"
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onEnded={() => setIsPlaying(false)}
                onTimeUpdate={(event) =>
                    setCurrent(event.currentTarget.currentTime)
                }
                onLoadedMetadata={(event) => {
                    if (Number.isFinite(event.currentTarget.duration)) {
                        setTotal(event.currentTarget.duration);
                    }
                }}
            />
        </div>
    );
}
