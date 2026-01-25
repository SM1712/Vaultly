import { SidebarVertical } from './navigation/SidebarVertical';
import { SidebarHorizontal } from './navigation/SidebarHorizontal';
import { SidebarDock } from './navigation/SidebarDock';
import { useTheme } from '../context/ThemeContext';

interface SidebarProps {
    isOpen: boolean; // For mobile/off-canvas state
    onClose: () => void;
    onOpenSettings: () => void;
}

const Sidebar = ({ isOpen, onClose, onOpenSettings }: SidebarProps) => {
    const { sidebarPosition, sidebarVisibility } = useTheme();

    // Force mobile behavior if isOpen is true (handled by Layout layer mostly, but good safeguards)
    // Actually, Layout handles "IsMobileMenuOpen".
    // On Desktop, we check sidebarPosition.

    const isHorizontal = sidebarPosition === 'top' || sidebarPosition === 'bottom';

    // Determine which component to render
    if (sidebarVisibility === 'floating') {
        return (
            <>
                {/* We still render SidebarVertical for Mobile "Hamburger" menu if isOpen is true, 
                    OR we rely on the fact that Layout passes isOpen for that specific case.
                    However, Dock replaces Desktop View.
                */}
                <div className="hidden lg:block">
                    <SidebarDock onOpenSettings={onOpenSettings} />
                </div>
                {/* Mobile Fallback: Standard Sidebar */}
                <div className={isOpen ? "block lg:hidden" : "hidden"}>
                    <SidebarVertical
                        isOpen={isOpen}
                        onClose={onClose}
                        onOpenSettings={onOpenSettings}
                        position="left"
                    />
                </div>
            </>
        );
    }

    if (isHorizontal) {
        return (
            <>
                <div className="hidden lg:block">
                    <SidebarHorizontal
                        onOpenSettings={onOpenSettings}
                        position={sidebarPosition as 'top' | 'bottom'}
                    />
                </div>
                {/* Mobile Fallback */}
                <div className={isOpen ? "block lg:hidden" : "hidden"}>
                    <SidebarVertical
                        isOpen={isOpen}
                        onClose={onClose}
                        onOpenSettings={onOpenSettings}
                        position="left"
                    />
                </div>
            </>
        );
    }

    // Default Vertical (Left/Right)
    return (
        <SidebarVertical
            isOpen={isOpen}
            onClose={onClose}
            onOpenSettings={onOpenSettings}
            position={sidebarPosition as 'left' | 'right'}
        />
    );
};

export default Sidebar;
