import { useGamification } from '../../context/GamificationContext';
import { useAuth } from '../../context/AuthContext';
import { AchievementBadge, XPBar } from './GamificationComponents';
import { getDynamicAvatar } from '../../context/GamificationConstants';

export const AchievementsList = () => {
    const { profile, achievements } = useGamification();
    const { user } = useAuth();

    const isUnlocked = (id: string) => profile.unlockedAchievements.some(a => a.achievementId === id);

    // Sort: Unlocked first, then by rarity (Legendary -> Common)
    const sortedAchievements = [...achievements].sort((a, b) => {
        const aUnlocked = isUnlocked(a.id);
        const bUnlocked = isUnlocked(b.id);

        if (aUnlocked && !bUnlocked) return -1;
        if (!aUnlocked && bUnlocked) return 1;

        // Rarity weight
        const rarityWeight = { legendary: 5, epic: 4, rare: 3, uncommon: 2, common: 1 };
        return rarityWeight[b.rarity] - rarityWeight[a.rarity];
    });

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header / Profile Summary */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -mr-10 -mt-10" />

                <div className="relative z-10 flex flex-col md:flex-row gap-6 items-center md:items-start text-center md:text-left">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-300 to-orange-500 p-1 shadow-lg ring-4 ring-white dark:ring-zinc-950">
                        <img
                            src={profile.avatar || getDynamicAvatar(user?.displayName || 'User', profile.level)}
                            alt="Avatar"
                            className="w-full h-full rounded-full bg-white object-cover"
                        />
                    </div>

                    <div className="flex-1 w-full">
                        <h2 className="text-2xl font-black text-zinc-900 dark:text-white mb-1">
                            {profile.currentTitle}
                        </h2>
                        <p className="text-zinc-500 font-medium mb-4">Nivel {profile.level} • {profile.currentXP} XP Totales</p>

                        <XPBar
                            current={profile.currentXP}
                            max={profile.nextLevelXP}
                            level={profile.level}
                        />
                    </div>
                </div>
            </div>

            {/* Achievements Grid */}
            <div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
                    <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-md text-xs">
                        {profile.unlockedAchievements.length}/{achievements.length}
                    </span>
                    Insignias
                </h3>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {sortedAchievements.map(achievement => {
                        const unlocked = isUnlocked(achievement.id);

                        if (achievement.isHidden && !unlocked) {
                            return (
                                <AchievementBadge
                                    key={achievement.id}
                                    icon="Lock"
                                    title="???"
                                    description="Juega para descubrir este logro secreto."
                                    rarity="common"
                                    locked={true}
                                />
                            );
                        }

                        return (
                            <AchievementBadge
                                key={achievement.id}
                                icon={achievement.icon}
                                title={achievement.title}
                                description={unlocked ? achievement.description : achievement.condition || achievement.description}
                                rarity={achievement.rarity}
                                locked={!unlocked}
                            />
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
