import type { ChangeEvent, SyntheticEvent } from 'react';
import { useEffect, useRef, useState } from 'react';
import { isAcceptedAudio, MAX_AUDIO_BYTES } from '@/helpers/media-upload';
import { useFileDrop } from '@/hooks/use-file-drop';
import { useObjectUrl } from '@/hooks/use-object-url';
import { adminLabels } from '@/lib/labels.admin.fr';

const text = adminLabels.audioUploader;

type AudioUploadOptions = {
    value: File | null;
    existingUrl: string | null;
    existingDuration: number | null;
    onChange: (file: File | null) => void;
};

/**
 * Behaviour of the audio field: the local source, play and pause, the picked file's duration, the quick type and
 * size check, drag and drop, « Retirer ».
 */
export function useAudioUpload({
    value,
    existingUrl,
    existingDuration,
    onChange,
}: AudioUploadOptions) {
    const inputRef = useRef<HTMLInputElement>(null);
    const audioRef = useRef<HTMLAudioElement>(null);
    const fileUrl = useObjectUrl(value);
    const [fileDuration, setFileDuration] = useState<number | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [localError, setLocalError] = useState<string | null>(null);

    useEffect(() => {
        setIsPlaying(false);
        setFileDuration(null);
    }, [value]);

    function pick(file: File | undefined): void {
        if (!file) {
            return;
        }

        if (!isAcceptedAudio(file)) {
            setLocalError(text.invalidType);

            return;
        }

        if (file.size > MAX_AUDIO_BYTES) {
            setLocalError(text.tooLarge);

            return;
        }

        setLocalError(null);
        onChange(file);
    }

    const drop = useFileDrop(pick);

    function changeFile(event: ChangeEvent<HTMLInputElement>): void {
        pick(event.target.files?.[0]);
        // Picking the same file again after « Retirer » must fire a change.
        event.target.value = '';
    }

    function remove(): void {
        audioRef.current?.pause();
        setLocalError(null);
        onChange(null);
        // The drop zone renders a new input: focus it once React has swapped them.
        requestAnimationFrame(() => inputRef.current?.focus());
    }

    function togglePlay(): void {
        const audio = audioRef.current;

        if (!audio) {
            return;
        }

        if (audio.paused) {
            void audio.play().catch(() => setIsPlaying(false));
        } else {
            audio.pause();
        }
    }

    return {
        inputRef,
        audioRef,
        sourceUrl: fileUrl ?? existingUrl,
        duration: value ? fileDuration : existingDuration,
        isPlaying,
        localError,
        isDragging: drop.isDragging,
        dropZoneProps: drop.dropZoneProps,
        changeFile,
        remove,
        togglePlay,
        /** Handlers of the `<audio>` element. */
        audioEvents: {
            onPlay: (): void => setIsPlaying(true),
            onPause: (): void => setIsPlaying(false),
            onEnded: (): void => setIsPlaying(false),
            onLoadedMetadata: (
                event: SyntheticEvent<HTMLAudioElement>,
            ): void => {
                if (value && Number.isFinite(event.currentTarget.duration)) {
                    setFileDuration(event.currentTarget.duration);
                }
            },
        },
    };
}
