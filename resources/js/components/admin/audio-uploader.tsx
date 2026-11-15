import { Music, Pause, Play } from 'lucide-react';
import { useId } from 'react';
import { FileDropZone } from '@/components/admin/file-drop-zone';
import { FieldError } from '@/components/admin/text-field';
import { Button } from '@/components/public/button';
import {
    ACCEPTED_AUDIO_EXTENSIONS,
    ACCEPTED_AUDIO_TYPES,
    clock,
    formatSize,
} from '@/helpers/media-upload';
import { useAudioUpload } from '@/hooks/use-audio-upload';
import { adminLabels } from '@/lib/labels.admin.fr';

const text = adminLabels.audioUploader;

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
    const upload = useAudioUpload({
        value,
        existingUrl,
        existingDuration,
        onChange,
    });
    const { sourceUrl, duration, isPlaying } = upload;
    const shownError = upload.localError ?? error;
    const errorId = `${id}-erreur`;
    const helpId = `${id}-aide`;
    const describedBy = [helpId, shownError ? errorId : null]
        .filter(Boolean)
        .join(' ');

    const meta = [
        duration !== null ? text.duration(clock(duration)) : null,
        value ? formatSize(value.size) : null,
    ]
        .filter(Boolean)
        .join(' · ');

    const input = (
        <input
            ref={upload.inputRef}
            id={id}
            type="file"
            accept={[
                ...ACCEPTED_AUDIO_EXTENSIONS,
                ...ACCEPTED_AUDIO_TYPES,
            ].join(',')}
            aria-describedby={describedBy}
            aria-invalid={shownError ? true : undefined}
            className="sr-only"
            onChange={upload.changeFile}
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
                                    onClick={upload.togglePlay}
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
                                    onClick={upload.remove}
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
                        ref={upload.audioRef}
                        src={sourceUrl}
                        preload="metadata"
                        {...upload.audioEvents}
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
                    <FileDropZone
                        htmlFor={id}
                        icon={Music}
                        text={text.drop}
                        isDragging={upload.isDragging}
                        hasError={Boolean(shownError)}
                        dropZoneProps={upload.dropZoneProps}
                    >
                        {input}
                    </FileDropZone>
                    <p id={helpId} className="text-caption text-grey-dark">
                        {text.help}
                    </p>
                </>
            )}
            {shownError && <FieldError id={errorId}>{shownError}</FieldError>}
        </div>
    );
}
