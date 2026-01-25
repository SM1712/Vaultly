import { useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { NAV_SECTIONS, ESSENTIAL_MODE_ITEMS, SIMPLE_MODE_ITEMS } from '../constants/navigation';

export const useNavigation = () => {
    const { navMode, customModeItems } = useTheme();
    const location = useLocation();

    // Logic to keep user in Onboarding environment if they are already there
    const isOnboarding = location.pathname.startsWith('/onboarding');
    const getPath = (path: string) => {
        if (!isOnboarding) return path;
        // If we are in onboarding, force all sidebar links to stay in /onboarding prefix
        return path === '/' ? '/onboarding' : `/onboarding${path}`;
    };

    // Filter and Process Sections
    const sections = NAV_SECTIONS.map(section => ({
        ...section,
        items: section.items
            .filter(item => {
                if (navMode === 'normal') return true;
                if (navMode === 'essential') return ESSENTIAL_MODE_ITEMS.includes(item.id);
                if (navMode === 'simple') return SIMPLE_MODE_ITEMS.includes(item.id);
                if (navMode === 'custom') return customModeItems.includes(item.id);
                return true;
            })
            .map(item => ({
                ...item,
                to: getPath(item.to)
            }))
    })).filter(section => section.items.length > 0);

    return { sections, isOnboarding };
};
