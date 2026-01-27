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

    // Recursive function to filter and map items
    const processItems = (items: typeof NAV_SECTIONS[0]['items']): typeof NAV_SECTIONS[0]['items'] => {
        return items
            .filter(item => {
                // First check if the item itself is allowed
                let isAllowed = true;
                if (navMode === 'essential') isAllowed = ESSENTIAL_MODE_ITEMS.includes(item.id);
                else if (navMode === 'simple') isAllowed = SIMPLE_MODE_ITEMS.includes(item.id);
                else if (navMode === 'custom') isAllowed = customModeItems.includes(item.id);

                // If it has subItems, we need to check them too
                // If a group is not explicitly allowed, but has allowed children, we might want to keep it?
                // For now, let's imply groups are allowed in normal mode, and in restricted modes we might need to add group IDs to the lists
                // OR we check if children survive the filter.

                // Let's assume for this rework we focus on Normal mode mainly.
                // In restricted modes, if the group ID is not in the list, it hides.
                // We should probably add group IDs to the constants later if we want them in simple/essential.
                return isAllowed || (navMode === 'normal');
            })
            .map(item => {
                const newItem = {
                    ...item,
                    to: getPath(item.to)
                };
                if (newItem.subItems) {
                    newItem.subItems = processItems(newItem.subItems);
                }
                return newItem;
            });
    };

    // Filter and Process Sections
    const sections = NAV_SECTIONS.map(section => ({
        ...section,
        items: processItems(section.items)
    })).filter(section => section.items.length > 0);

    return { sections, isOnboarding };
};
