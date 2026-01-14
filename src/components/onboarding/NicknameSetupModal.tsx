import React, { useState, useRef, useEffect } from 'react';
import { useCollaboration } from '../../context/CollaborationContext';
import { User, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import { toast } from 'sonner';

const NicknameSetupModal = () => {
    const { checkNicknameAvailability, registerNickname, skipProfileSetup } = useCollaboration();
    const [nickname, setNickname] = useState('');
    const [status, setStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const checkTimeout = useRef<any>(null);
    const isMounted = useRef(true);

    useEffect(() => {
        return () => { isMounted.current = false; };
    }, []);

    const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Allow letters (including accents), numbers, underscores, dots, hyphens
        const val = e.target.value.replace(/[^a-zA-Z0-9_.\-\u00C0-\u017F\s]/g, '');
        setNickname(val);
        setStatus('idle');
        setError('');

        if (checkTimeout.current) clearTimeout(checkTimeout.current);

        if (val.length < 3) return;

        setStatus('checking');
        checkTimeout.current = setTimeout(async () => {
            if (!isMounted.current) return;
            try {
                // Timebox the check to 5 seconds to prevent eternal loading
                const checkPromise = checkNicknameAvailability(val);
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error("Tiempo de espera agotado (Timeout)")), 5000)
                );

                const available = await Promise.race([checkPromise, timeoutPromise]) as boolean;

                if (isMounted.current) {
                    setStatus(available ? 'available' : 'taken');
                    if (!available) setError('Este nickname ya está siendo usado');
                }
            } catch (err: any) {
                console.error("Check Nickname Error:", err);
                if (isMounted.current) {
                    setStatus('idle');
                    // Show friendly error
                    const msg = err.message || "Error desconocido";
                    if (msg.includes("permission")) {
                        toast.error("Error de permisos. Verifica las reglas de Firebase.");
                    } else if (msg.includes("Timeout")) {
                        toast.error("La verificación tardó demasiado. Revisa tu conexión.");
                    } else {
                        toast.error(`Error verificando: ${msg}`);
                    }
                }
            }
        }, 500);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (status !== 'available' || submitting) return;

        setSubmitting(true);
        try {
            await registerNickname(nickname);
            // Modal will unmount automatically as profile is set
        } catch (err: any) {
            toast.error(err.message || "Error al registrar");
            setSubmitting(false);
        }
    };

    const handleSkip = () => {
        toast.info("Has omitido la configuración de identidad. Algunas funciones colaborativas no estarán disponibles.");
        skipProfileSetup();
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100] animate-in fade-in duration-300">
            <div className="bg-white dark:bg-zinc-900 w-full max-w-md p-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-300">

                <div className="relative">
                    <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-6 mx-auto border border-zinc-200 dark:border-zinc-700">
                        <User size={32} className="text-zinc-500 dark:text-zinc-400" />
                    </div>

                    <h2 className="text-2xl font-bold text-center text-zinc-900 dark:text-white mb-2">Identidad en la Bóveda</h2>
                    <p className="text-zinc-500 dark:text-zinc-400 text-center text-sm mb-8">
                        Para colaborar en proyectos, necesitas un identificador único (Nickname). Este nombre será visible para otros usuarios.
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Tu Nickname</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={nickname}
                                    onChange={handleInput}
                                    placeholder="ej. vault_master"
                                    className={clsx(
                                        "w-full bg-zinc-50 dark:bg-zinc-950 border rounded-xl px-4 py-3 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 transition-all font-mono",
                                        status === 'taken' ? "border-rose-500 focus:ring-rose-500/20" :
                                            status === 'available' ? "border-emerald-500 focus:ring-emerald-500/20" :
                                                "border-zinc-200 dark:border-zinc-800 focus:ring-zinc-500/20"
                                    )}
                                />
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    {status === 'checking' && <Loader2 className="animate-spin text-zinc-400" size={18} />}
                                    {status === 'available' && <CheckCircle2 className="text-emerald-500" size={18} />}
                                    {status === 'taken' && <XCircle className="text-rose-500" size={18} />}
                                </div>
                            </div>
                            {error && <p className="text-xs text-rose-500 font-medium">{error}</p>}
                            <p className="text-xs text-zinc-500 dark:text-zinc-500">
                                Se permiten mayúsculas, tildes y caracteres especiales simples. Mínimo 3 caracteres.
                            </p>
                        </div>

                        <div className="space-y-3">
                            <button
                                type="submit"
                                disabled={status !== 'available' || submitting}
                                className={clsx(
                                    "w-full font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg",
                                    status === 'available'
                                        ? "bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 shadow-zinc-200 dark:shadow-none cursor-pointer"
                                        : "bg-zinc-200 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600 cursor-not-allowed opacity-70"
                                )}
                            >
                                {submitting ? <Loader2 className="animate-spin" /> : "Confirmar Identidad"}
                            </button>

                            <button
                                type="button"
                                onClick={handleSkip}
                                className="w-full py-2 text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors"
                            >
                                Continuar sin Identidad (Modo Offline)
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default NicknameSetupModal;
