import { useEffect, useState } from 'react';

/**
 * Whether the page is scrolled away from the top, for the shadow of a sticky bar.
 */
export function useIsScrolled(): boolean {
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const updateIsScrolled = () => setIsScrolled(window.scrollY > 0);

        updateIsScrolled();
        window.addEventListener('scroll', updateIsScrolled, { passive: true });

        return () => window.removeEventListener('scroll', updateIsScrolled);
    }, []);

    return isScrolled;
}
