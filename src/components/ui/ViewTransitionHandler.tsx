import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * ViewTransitionHandler (Link Interceptor Version)
 * 
 * Disabled because document.startViewTransition can conflict with React Suspense 
 * and cause the screen to go completely blank on lazy route loading.
 */
export function ViewTransitionHandler({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
