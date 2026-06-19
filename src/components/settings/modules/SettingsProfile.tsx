import { useState, useRef, useEffect } from 'react';
import { User, LogOut, Upload, Compass, RefreshCw, Check, X, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useGamification } from '../../../context/GamificationContext';
import { getDynamicAvatar } from '../../../context/GamificationConstants';
import { useCollaboration } from '../../../context/CollaborationContext';
import { clsx } from 'clsx';
import { toast } from 'sonner';

interface SettingsProfileProps {
    onClose?: () => void;
}

export const SettingsProfile = ({ onClose }: SettingsProfileProps) => {
    const navigate = useNavigate();
    const { logout, user } = useAuth();
    const { profile, updateProfile, recalculateLevel } = useGamification();
    const { profile: collabProfile, checkNicknameAvailability, registerNickname } = useCollaboration();

    const [newNick, setNewNick] = useState('');
    const [nickStatus, setNickStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
    const [nickError, setNickError] = useState('');
    const [registering, setRegistering] = useState(false);
    const checkTimeout = useRef<any>(null);

    const handleInputNick = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Allow letters (including accents), numbers, underscores, dots, hyphens
        const val = e.target.value.replace(/[^a-zA-Z0-9_.\-\u00C0-\u017F\s]/g, '');
        setNewNick(val);
        setNickStatus('idle');
        setNickError('');

        if (checkTimeout.current) clearTimeout(checkTimeout.current);

        if (val.length < 3) return;

        setNickStatus('checking');
        checkTimeout.current = setTimeout(async () => {
            try {
                const available = await checkNicknameAvailability(val);
                setNickStatus(available ? 'available' : 'taken');
                if (!available) setNickError('Este nickname ya está registrado');
            } catch (err: any) {
                console.error("Check Nickname Error:", err);
                setNickStatus('idle');
            }
        }, 500);
    };

    const handleRegisterNick = async (e: React.FormEvent) => {
        e.preventDefault();
        if (nickStatus !== 'available' || registering) return;

        setRegistering(true);
        try {
            await registerNickname(newNick);
            setNewNick('');
            setNickStatus('idle');
        } catch (err: any) {
            toast.error("Error de Registro", {
                description: err.message || "Hubo un problema al crear tu perfil."
            });
        } finally {
            setRegistering(false);
        }
    };

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

                    {/* Collaborative Nickname Block */}
                    {collabProfile ? (
                        <div className="mt-4 p-4 bg-white dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                            <div>
                                <span className="block text-[10px] font-bold text-zinc-400 dark:text-zinc-550 uppercase tracking-wider">ID Colaborativa</span>
                                <span className="text-sm font-bold text-indigo-500 dark:text-indigo-400">@{collabProfile.nickname}</span>
                            </div>
                            <span className="text-[9px] font-black uppercase tracking-wider px-2.5 py-1 bg-indigo-500/10 text-indigo-500 dark:text-indigo-450 rounded-lg">Activo</span>
                        </div>
                    ) : (
                        <div className="mt-4 p-4 bg-indigo-500/5 dark:bg-indigo-500/10 border border-indigo-500/25 dark:border-indigo-900/30 rounded-xl space-y-3">
                            <div>
                                <span className="block text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1">Activar Identidad Colaborativa</span>
                                <p className="text-[11px] text-zinc-500 dark:text-zinc-450 leading-relaxed">
                                    No tienes un nickname registrado. Actívalo ahora para poder invitar a otros usuarios y colaborar en bovedas en tiempo real.
                                </p>
                            </div>
                            
                            <form onSubmit={handleRegisterNick} className="space-y-3">
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={newNick}
                                        onChange={handleInputNick}
                                        placeholder="ej. mi_apodo_vault"
                                        className={clsx(
                                            "w-full bg-white dark:bg-zinc-950 border rounded-xl px-4 py-2.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 transition-all font-mono",
                                            nickStatus === 'taken' ? "border-rose-500 focus:ring-rose-500/20" :
                                            nickStatus === 'available' ? "border-emerald-500 focus:ring-emerald-500/20" :
                                            "border-zinc-200 dark:border-zinc-800 focus:ring-zinc-500/20"
                                        )}
                                    />
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                        {nickStatus === 'checking' && <Loader2 className="animate-spin text-zinc-400" size={14} />}
                                        {nickStatus === 'available' && <Check className="text-emerald-500" size={14} />}
                                        {nickStatus === 'taken' && <X className="text-rose-500" size={14} />}
                                    </div>
                                </div>
                                {nickError && <p className="text-[10px] text-rose-500 font-medium">{nickError}</p>}
                                
                                <button
                                    type="submit"
                                    disabled={nickStatus !== 'available' || registering}
                                    className={clsx(
                                        "w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md",
                                        nickStatus === 'available'
                                            ? "bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer"
                                            : "bg-zinc-200 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-650 cursor-not-allowed"
                                    )}
                                >
                                    {registering ? <Loader2 className="animate-spin" size={14} /> : null}
                                    <span>Confirmar Nickname</span>
                                </button>
                            </form>
                        </div>
                    )}

                    <button
                        onClick={() => { logout(); }}
                        className="mt-6 w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 hover:border-rose-200 transition-all font-bold text-sm shadow-sm"
                    >
                        <LogOut size={16} />
                        Cerrar Sesión Actual
                    </button>
                </div>

                {/* Level Management */}
                <div className="mt-6 space-y-4">
                    <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                        <Compass size={14} /> Senda y Nivel
                    </h3>

                    {/* Senda Financiera redirection */}
                    <button
                        onClick={() => {
                            navigate('/gamification');
                            if (onClose) onClose();
                        }}
                        className="w-full flex items-center justify-between p-4 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-xl border border-indigo-500/20 hover:border-indigo-500 hover:bg-indigo-500/10 transition-all group"
                    >
                        <div className="text-left">
                            <span className="block font-bold text-indigo-600 dark:text-indigo-400">Ver Senda de la Riqueza</span>
                            <span className="text-xs text-zinc-500">Explora la Bóveda Celestial, tus misiones y reliquias</span>
                        </div>
                        <Compass size={18} className="text-indigo-400 group-hover:scale-110 transition-transform" />
                    </button>

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
