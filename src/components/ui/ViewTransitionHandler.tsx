import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

/**
 * ViewTransitionHandler (Link Interceptor Version)
 * 
 * This component listens for clicks on <a> tags globaly.
 * If the click is a local navigation, it uses document.startViewTransition()
 * to wrap the React Router navigation, enabling the "WOW" effect.
 */
export function ViewTransitionHandler({ children }: { children: React.ReactNode }) {
    const navigate = useNavigate();
    const location = useLocation();

    // We use a ref to track if we explain why we are here
    const isTransitioning = useRef(false);

    useEffect(() => {
        // Feature detection
        if (!document.startViewTransition) return;

        const handleAnchorClick = (e: MouseEvent) => {
            // Find the anchor element
            const target = (e.target as HTMLElement).closest('a');

            // Basic checks to ensure we should intercept
            if (
                !target ||
                target.target === '_blank' ||
                e.button !== 0 || // only left click
                e.metaKey || e.ctrlKey || e.altKey || e.shiftKey || // no modifier keys
                e.defaultPrevented
            ) {
                return;
            }

            // Check if it's a local link
            const url = new URL(target.href);
            if (url.origin !== window.location.origin) return;

            // Check if it's the same page
            // Note: For HashRouter, pathname is just "/" usually, hash changes.
            // URL: http://localhost:5173/Vaultly/#/expenses
            // target.href: http://localhost:5173/Vaultly/#/incomes

            // We need to compare the full href (including hash)
            if (url.href === window.location.href) return;

            // STOP the default browser navigation
            e.preventDefault();

            // Perform View Transition
            document.startViewTransition(() => {
                // Determine the path to navigate to.
                // For HashRouter, we extract the hash part.
                // url.hash is "#/expenses".
                // navigate() expects "/expenses" (if relative) or the full path.

                const hashPath = url.hash.slice(1); // remove '#' e.g. "/expenses"

                // If the link was just "/foo" (no hash) in a HashRouter app, it might break?
                // But our app uses <Link> tags which generate proper hrefs with #.
                // If it's a raw generic link, we handle it.

                if (hashPath) {
                    navigate(hashPath);
                } else {
                    // Fallback for non-hash links?
                    navigate(url.pathname + url.search);
                }
            });
        };

        // Capture phase to ensure we get it first? Or bubbling?
        // Bubbling is safer to play nice with other handlers, but we want to intercept navigation.
        window.addEventListener('click', handleAnchorClick);

        return () => {
            window.removeEventListener('click', handleAnchorClick);
        };
    }, [navigate]);

    return <div className="view-transition-provider h-full">{children}</div>;
}
