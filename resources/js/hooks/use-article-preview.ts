import { router } from '@inertiajs/react';
import { useState } from 'react';
import {
    archive,
    publish,
} from '@/actions/App/Http/Controllers/Admin/ArticleController';
import type { PreviewedArticle } from '@/helpers/article';

/**
 * State and actions of the preview panel: « Publier » or « Archiver » from the panel, and the frame, reloaded after
 * a status change with its skeleton shown until it has loaded again. Opening the panel, or another article in it,
 * starts again with the skeleton.
 */
export function useArticlePreview(article: PreviewedArticle | null) {
    const articleId = article?.id ?? null;
    const [shownId, setShownId] = useState(articleId);
    const [frameVersion, setFrameVersion] = useState(0);
    const [isFrameLoaded, setIsFrameLoaded] = useState(false);
    const [isChangingStatus, setIsChangingStatus] = useState(false);

    if (shownId !== articleId) {
        setShownId(articleId);
        setIsFrameLoaded(false);
        setIsChangingStatus(false);
    }

    function changeStatus(): void {
        if (!article) {
            return;
        }

        const url =
            article.status === 'PUBLISHED'
                ? archive.url(article.id)
                : publish.url(article.id);

        router.patch(
            url,
            {},
            {
                preserveScroll: true,
                preserveState: true,
                onStart: () => setIsChangingStatus(true),
                onFinish: () => setIsChangingStatus(false),
                onSuccess: () => {
                    setIsFrameLoaded(false);
                    setFrameVersion((version) => version + 1);
                },
            },
        );
    }

    return {
        frameVersion,
        isFrameLoaded,
        isChangingStatus,
        changeStatus,
        markFrameLoaded: (): void => setIsFrameLoaded(true),
    };
}

export type ArticlePreview = ReturnType<typeof useArticlePreview>;
