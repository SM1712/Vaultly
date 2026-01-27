import { User, LogOut, Upload, Trophy, RefreshCw } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useGamification } from '../../../context/GamificationContext';
import { getDynamicAvatar } from '../../../context/GamificationConstants';

export const SettingsProfile = () => {
    const { logout, user } = useAuth();
    const { profile, updateProfile, recalculateLevel } = useGamification();

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Account Section */}
            <div>
                <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <User size={14} /> Cuenta y Sesión
                </h3>
                <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl p-5 border border-zinc-100 dark:border-zinc-800">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="relative group cursor-pointer" onClick={() => document.getElementById('avatar-upload')?.click()}>
                            <img
                                src={profile.avatar || getDynamicAvatar(user?.displayName || 'User', profile.level)}
                                alt="User"
                                className="w-16 h-16 rounded-full bg-zinc-200 dark:bg-zinc-800 object-cover ring-4 ring-white dark:ring-zinc-950 group-hover:opacity-80 transition-opacity"
                            />
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 rounded-full">
                                <Upload size={20} className="text-white" />
                            </div>
                            <input
                                id="avatar-upload"
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        const reader = new FileReader();
                                        reader.onloadend = () => {
                                            updateProfile({ avatar: reader.result as string });
                                        };
                                        reader.readAsDataURL(file);
                                    }
                                }}
                            />
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-lg font-bold text-zinc-900 dark:text-white truncate">{user?.displayName}</p>
                            <p className="text-sm text-zinc-500 truncate">{user?.email}</p>
                            <p className="text-xs text-emerald-500 font-mono mt-1">Nivel {profile.level} • {profile.currentTitle}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => { logout(); }}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 hover:border-rose-200 transition-all font-bold text-sm shadow-sm"
                    >
                        <LogOut size={16} />
                        Cerrar Sesión Actual
                    </button>
                </div>

                {/* Level Management */}
                <div className="mt-6">
                    <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Trophy size={14} /> Gestión de Nivel
                    </h3>
                    <button
                        onClick={recalculateLevel}
                        className="w-full flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-amber-500/50 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-all group"
                    >
                        <div className="text-left">
                            <span className="block font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-amber-600 dark:group-hover:text-amber-400">Recalcular Nivel</span>
                            <span className="text-xs text-zinc-500">Basado en tu historial (Soluciona nivel inflado)</span>
                        </div>
                        <RefreshCw size={18} className="text-zinc-400 group-hover:text-amber-500" />
                    </button>
                </div>
            </div>
        </div>
    );
};
