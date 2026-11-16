import { home, privacy } from '@/routes';

/** Fixed links of the public chrome: home, the privacy page, and the home page subscription block. */
export function publicLinksOf(): {
    homeUrl: string;
    privacyUrl: string;
    subscribeUrl: string;
} {
    return {
        homeUrl: home.url(),
        privacyUrl: privacy.url(),
        subscribeUrl: `${home.url()}#abonnement`,
    };
}
