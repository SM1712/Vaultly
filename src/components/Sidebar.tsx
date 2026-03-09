import { SidebarVertical } from './navigation/SidebarVertical';
import { SidebarHorizontal } from './navigation/SidebarHorizontal';
import { SidebarDock } from './navigation/SidebarDock';
import { MobileDockNav } from './navigation/MobileDockNav';
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
                {/* Desktop: Floating Dock */}
                <div className="hidden lg:block">
                    <SidebarDock onOpenSettings={onOpenSettings} />
                </div>

                {/* Mobile: Floating Dock */}
                <div className="lg:hidden">
                    <MobileDockNav onOpenSettings={onOpenSettings} />
                </div>

                {/* Mobile Drawer (Hidden by default, toggled via Context/Props) */}
                {/* This allows the 'More' button in MobileNavBar to open the full menu */}
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
