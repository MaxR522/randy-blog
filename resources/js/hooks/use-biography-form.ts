import { useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import { biography } from '@/routes/admin/account';

/**
 * Inline editor of the biography. TinyMCE normalises the HTML when it loads, so only a change made by the author
 * counts as dirty. `start()` refills it from the saved value each time the editor opens.
 */
export function useBiographyForm(value: string, onDone: () => void) {
    const form = useForm({ bio: value });
    const [isChanged, setIsChanged] = useState(false);

    function start(): void {
        form.setDefaults({ bio: value });
        form.setData({ bio: value });
        form.clearErrors();
        setIsChanged(false);
    }

    function change(html: string): void {
        if (html !== form.data.bio) {
            setIsChanged(true);
        }

        form.setData('bio', html);
    }

    function submit(event: FormEvent<HTMLFormElement>): void {
        event.preventDefault();
        form.patch(biography.url(), {
            preserveScroll: true,
            onSuccess: onDone,
        });
    }

    return {
        value: form.data.bio,
        error: form.errors.bio,
        isBusy: form.processing,
        isDirty: isChanged,
        change,
        start,
        submit,
    };
}

export type BiographyForm = ReturnType<typeof useBiographyForm>;
