import type { SyntheticEvent } from 'react';
import { useEffect, useRef, useState } from 'react';

/**
 * The article audio player (PUB-ART-14): play and pause on the same button, seek, and the time read from the
 * `<audio>` element; `duration` from Cloudinary stands in until the file's own metadata loads. Pauses on unmount.
 */
export function useAudioPlayer(duration: number) {
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

    return {
        audioRef,
        isStarted,
        isPlaying,
        current,
        total,
        toggle,
        seek,
        audioEvents: {
            onPlay: (): void => setIsPlaying(true),
            onPause: (): void => setIsPlaying(false),
            onEnded: (): void => setIsPlaying(false),
            onTimeUpdate: (event: SyntheticEvent<HTMLAudioElement>): void =>
                setCurrent(event.currentTarget.currentTime),
            onLoadedMetadata: (
                event: SyntheticEvent<HTMLAudioElement>,
            ): void => {
                if (Number.isFinite(event.currentTarget.duration)) {
                    setTotal(event.currentTarget.duration);
                }
            },
        },
    };
}

export type AudioPlayer = ReturnType<typeof useAudioPlayer>;
