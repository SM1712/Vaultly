import { SettingsLayout } from './SettingsLayout';

interface SettingsMenuProps {
    isOpen: boolean;
    onClose: () => void;
}

const SettingsMenu = ({ isOpen, onClose }: SettingsMenuProps) => {
    return <SettingsLayout isOpen={isOpen} onClose={onClose} />;
};

export default SettingsMenu;
