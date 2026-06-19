import { LevelUpCelebration } from './LevelUpCelebration';
import { useGamification } from '../../context/GamificationContext';

interface LevelUpModalProps {
    isOpen: boolean;
    onClose: () => void;
    level: number;
    title: string;
}

const LevelUpModalContent = ({ isOpen, onClose, level, title }: LevelUpModalProps) => {
    const { profile } = useGamification();

    return (
        <LevelUpCelebration
            isOpen={isOpen}
            onClose={onClose}
            level={level}
            title={title}
            savingLevel={profile?.savingLevel || 1}
            disciplineLevel={profile?.disciplineLevel || 1}
            growthLevel={profile?.growthLevel || 1}
        />
    );
};

export default LevelUpModalContent;
