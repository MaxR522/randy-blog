import { useHttp } from '@inertiajs/react';
import { useRef, useState } from 'react';

/**
 * The search request of a picker modal: a JSON GET, the loading state and the failure message. A response that
 * arrives after `cancel()` or after a newer `load()` is ignored.
 */
export function usePickerRequest<Response>() {
    const [hasFailed, setHasFailed] = useState(false);
    const generation = useRef(0);
    const http = useHttp<Record<string, never>, Response>({});

    function fail(current: number): false {
        if (current === generation.current) {
            setHasFailed(true);
        }

        return false;
    }

    function load(url: string, onSuccess: (response: Response) => void): void {
        const current = ++generation.current;

        setHasFailed(false);
        http.get(url, {
            onSuccess: (response) => {
                if (current === generation.current) {
                    onSuccess(response);
                }
            },
            onHttpException: () => fail(current),
            onNetworkError: () => fail(current),
        }).catch(() => undefined);
    }

    function cancel(): void {
        generation.current++;
        setHasFailed(false);
    }

    return { isLoading: http.processing, hasFailed, load, cancel };
}
