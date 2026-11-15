import { Music, Pause, Play } from 'lucide-react';
import type { ChangeEvent, DragEvent } from 'react';
import { useEffect, useId, useRef, useState } from 'react';
import { formatSize } from '@/components/admin/image-uploader';
import { FieldError } from '@/components/admin/text-field';
import { Button } from '@/components/public/button';
import { adminLabels } from '@/lib/labels.admin.fr';
import { cn } from '@/lib/utils';

const text = adminLabels.audioUploader;

/** Browsers report M4A under several names; the extension decides when the type is unknown. */
const ACCEPTED_TYPES = [
    'audio/mpeg',
    'audio/mp3',
    'audio/mp4',
    'audio/x-m4a',
    'audio/m4a',
];

const ACCEPTED_EXTENSIONS = ['.mp3', '.m4a'];

const MAX_BYTES = 50 * 1024 * 1024;

type AudioUploaderProps = {
    label: string;
    /** The picked file, sent with the form on save, which uploads it and deletes the audio it replaces. */
    value: File | null;
    /** The audio already saved, shown while no file is picked. */
    existingUrl?: string | null;
    /** Seconds, from Cloudinary. */
    existingDuration?: number | null;
    /** A file, or `null` when the author removes the audio (the parent also forgets `existingUrl`). */
    onChange: (file: File | null) => void;
    /** Upload progress of the save, in percent, while the picked file is being sent. */
    progress?: number | null;
    error?: string;
};

function clock(seconds: number): string {
    const whole = Math.max(0, Math.round(seconds));

    return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`;
}

function isAccepted(file: File): boolean {
    const name = file.name.toLowerCase();

    return (
        ACCEPTED_TYPES.includes(file.type) ||
        ACCEPTED_EXTENSIONS.some((extension) => name.endsWith(extension))
    );
}

/**
 * « Audio de l'article » (PUB-ART-14): optional MP3 or M4A, made by the author with Piper. Drop zone when empty;
 * once filled, a button to listen, the name and duration, « Remplacer » and « Retirer ». The type and size are
 * checked here for quick feedback; the server checks them again. The file is sent with « Enregistrer ».
 */
export function AudioUploader({
    label,
    value,
    existingUrl = null,
    existingDuration = null,
    onChange,
    progress = null,
    error,
}: AudioUploaderProps) {
    const id = useId();
    const inputRef = useRef<HTMLInputElement>(null);
    const audioRef = useRef<HTMLAudioElement>(null);
    const [fileUrl, setFileUrl] = useState<string | null>(null);
    const [fileDuration, setFileDuration] = useState<number | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [localError, setLocalError] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    useEffect(() => {
        setIsPlaying(false);
        setFileDuration(null);

        if (!value) {
            setFileUrl(null);

            return;
        }

        const url = URL.createObjectURL(value);
        setFileUrl(url);

        return () => URL.revokeObjectURL(url);
    }, [value]);

    const sourceUrl = fileUrl ?? existingUrl;
    const duration = value ? fileDuration : existingDuration;
    const shownError = localError ?? error;
    const errorId = `${id}-erreur`;
    const helpId = `${id}-aide`;
    const describedBy = [helpId, shownError ? errorId : null]
        .filter(Boolean)
        .join(' ');

    function pick(file: File | undefined) {
        if (!file) {
            return;
        }

        if (!isAccepted(file)) {
            setLocalError(text.invalidType);

            return;
        }

        if (file.size > MAX_BYTES) {
            setLocalError(text.tooLarge);

            return;
        }

        setLocalError(null);
        onChange(file);
    }

    function handleChange(event: ChangeEvent<HTMLInputElement>) {
        pick(event.target.files?.[0]);
        // Picking the same file again after « Retirer » must fire a change.
        event.target.value = '';
    }

    function handleDrop(event: DragEvent<HTMLLabelElement>) {
        event.preventDefault();
        setIsDragging(false);
        pick(event.dataTransfer.files[0]);
    }

    function handleRemove() {
        audioRef.current?.pause();
        setLocalError(null);
        onChange(null);
        // The drop zone renders a new input: focus it once React has swapped them.
        requestAnimationFrame(() => inputRef.current?.focus());
    }

    function togglePlay() {
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

    const meta = [
        duration !== null ? text.duration(clock(duration)) : null,
        value ? formatSize(value.size) : null,
    ]
        .filter(Boolean)
        .join(' · ');

    const input = (
        <input
            ref={inputRef}
            id={id}
            type="file"
            accept={[...ACCEPTED_EXTENSIONS, ...ACCEPTED_TYPES].join(',')}
            aria-describedby={describedBy}
            aria-invalid={shownError ? true : undefined}
            className="sr-only"
            onChange={handleChange}
        />
    );

    return (
        <div className="flex flex-col gap-2">
            {sourceUrl ? (
                <>
                    <span className="text-body-small text-primary font-semibold">
                        {label}
                    </span>
                    <div className="border-grey-light tablet:px-4 flex flex-col gap-3 rounded-md border p-3">
                        <div className="tablet:flex-row tablet:items-center flex flex-col gap-3">
                            <div className="tablet:gap-4 flex min-w-0 flex-1 items-center gap-3">
                                <button
                                    type="button"
                                    onClick={togglePlay}
                                    aria-label={
                                        isPlaying ? text.pause : text.listen
                                    }
                                    className="bg-primary flex size-11 flex-none items-center justify-center rounded-md text-white"
                                >
                                    {isPlaying ? (
                                        <Pause
                                            aria-hidden="true"
                                            className="size-4.5"
                                            fill="currentColor"
                                        />
                                    ) : (
                                        <Play
                                            aria-hidden="true"
                                            className="ml-0.5 size-4.5"
                                            fill="currentColor"
                                        />
                                    )}
                                </button>
                                <div className="flex min-w-0 flex-col gap-0.5">
                                    <p className="text-body-small truncate font-medium">
                                        {value ? value.name : text.current}
                                    </p>
                                    {meta && (
                                        <p className="text-caption text-grey-dark">
                                            {meta}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div className="tablet:flex tablet:gap-2 grid grid-cols-2 gap-2">
                                <label
                                    htmlFor={id}
                                    className="border-primary text-button text-primary hover:bg-grey-subtle has-focus-visible:outline-accent-600 inline-flex h-11 cursor-pointer items-center justify-center rounded-md border bg-white px-5 font-semibold has-focus-visible:outline-2 has-focus-visible:outline-offset-2"
                                >
                                    {text.replace}
                                    <span className="sr-only">
                                        {' '}
                                        : {label.toLowerCase()}
                                    </span>
                                    {input}
                                </label>
                                <Button
                                    variant="ghost"
                                    className="text-red-700"
                                    onClick={handleRemove}
                                >
                                    {text.remove}
                                    <span className="sr-only">
                                        {' '}
                                        : {label.toLowerCase()}
                                    </span>
                                </Button>
                            </div>
                        </div>
                        {value && progress !== null && (
                            <div className="flex flex-col gap-1.5">
                                <div
                                    role="progressbar"
                                    aria-label={text.uploading}
                                    aria-valuemin={0}
                                    aria-valuemax={100}
                                    aria-valuenow={progress}
                                    className="bg-grey-light h-1 overflow-hidden rounded-xs"
                                >
                                    <div
                                        className="bg-accent-600 h-full"
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                                <p className="text-caption text-grey-dark">
                                    {text.progress(progress)}
                                </p>
                            </div>
                        )}
                    </div>
                    <audio
                        ref={audioRef}
                        src={sourceUrl}
                        preload="metadata"
                        onPlay={() => setIsPlaying(true)}
                        onPause={() => setIsPlaying(false)}
                        onEnded={() => setIsPlaying(false)}
                        onLoadedMetadata={(event) => {
                            if (
                                value &&
                                Number.isFinite(event.currentTarget.duration)
                            ) {
                                setFileDuration(event.currentTarget.duration);
                            }
                        }}
                    />
                    <p id={helpId} className="text-caption text-grey-dark">
                        {text.help}
                    </p>
                </>
            ) : (
                <>
                    <label
                        htmlFor={id}
                        className="text-body-small text-primary font-semibold"
                    >
                        {label}
                    </label>
                    {/* The drop zone is a second label of the same input: a click opens the file picker. */}
                    <label
                        htmlFor={id}
                        onDragOver={(event) => {
                            event.preventDefault();
                            setIsDragging(true);
                        }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={handleDrop}
                        className={cn(
                            'text-body-small has-focus-visible:outline-accent-600 flex cursor-pointer flex-col items-center gap-2.5 rounded-md border border-dashed px-6 py-7 text-center transition-colors duration-(--duration-fast) has-focus-visible:outline-2 has-focus-visible:outline-offset-2',
                            isDragging
                                ? 'border-primary bg-grey-subtle'
                                : 'border-grey-medium hover:bg-grey-subtle',
                            shownError && 'border-red-600',
                        )}
                    >
                        <Music
                            aria-hidden="true"
                            className="text-primary size-7"
                            strokeWidth={1.75}
                        />
                        <span className="font-medium">{text.drop}</span>
                        {input}
                    </label>
                    <p id={helpId} className="text-caption text-grey-dark">
                        {text.help}
                    </p>
                </>
            )}
            {shownError && <FieldError id={errorId}>{shownError}</FieldError>}
        </div>
    );
}
