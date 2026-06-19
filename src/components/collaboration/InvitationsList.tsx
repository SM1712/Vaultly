import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCollaboration } from '../../context/CollaborationContext';
import { Check, X, Mail, Loader2, Users, Sparkles } from 'lucide-react';
import { clsx } from 'clsx';

const InvitationsList = () => {
    const { invitations, respondToInvitation } = useCollaboration();
    const [processingItem, setProcessingItem] = useState<string | null>(null);

    const handleRespond = async (id: string, accept: boolean) => {
        setProcessingItem(id);
        await respondToInvitation(id, accept);
        setProcessingItem(null);
    };

    if (invitations.length === 0) return null;

    return (
        <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
            <h3 className="font-bold text-zinc-400 dark:text-zinc-500 text-xs uppercase tracking-widest mb-4 flex items-center gap-2">
                <Mail size={14} className="text-indigo-400 animate-pulse" />
                <span>Invitaciones Pendientes ({invitations.length})</span>
            </h3>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                <AnimatePresence mode="popLayout">
                    {invitations.map(invite => {
                        const initials = invite.fromNickname ? invite.fromNickname.substring(0, 2).toUpperCase() : '??';
                        
                        return (
                            <motion.div
                                key={invite.id}
                                layout
                                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: -10 }}
                                transition={{ type: "spring", stiffness: 350, damping: 25 }}
                                className="group relative flex flex-col bg-zinc-900/10 dark:bg-zinc-950/20 backdrop-blur-xl border border-zinc-200/50 dark:border-zinc-800/80 hover:border-indigo-500/30 rounded-3xl p-5 shadow-[0_10px_30px_rgba(0,0,0,0.04)] dark:shadow-[0_15px_40px_rgba(0,0,0,0.3)] transition-all duration-300 overflow-hidden"
                            >
                                {/* Subtle Glowing Background Accent */}
                                <div className="absolute -right-12 -top-12 w-28 h-28 rounded-full blur-[40px] opacity-10 bg-indigo-500 pointer-events-none group-hover:opacity-20 transition-opacity duration-500" />
                                
                                {/* Top colored indicator border */}
                                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-500" />

                                <div className="flex items-start gap-3.5 mb-4 z-10">
                                    {/* Avatar circle */}
                                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 text-indigo-500 dark:text-indigo-400 flex items-center justify-center font-black text-sm tracking-tighter uppercase shrink-0">
                                        {initials}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-indigo-650 dark:text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full mb-1">
                                            <Sparkles size={8} /> Invitación
                                        </span>
                                        <h4 className="font-black text-base text-zinc-900 dark:text-zinc-100 truncate leading-snug" title={invite.projectName}>
                                            {invite.projectName}
                                        </h4>
                                        <p className="text-xs text-zinc-500 truncate mt-0.5">
                                            De <strong className="text-zinc-700 dark:text-zinc-350">@{invite.fromNickname}</strong>
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-2.5 mt-auto z-10">
                                    <button
                                        onClick={() => handleRespond(invite.id, true)}
                                        disabled={processingItem === invite.id}
                                        className="flex-1 bg-emerald-650 hover:bg-emerald-600 active:scale-[0.98] text-white py-2.5 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-900/10 hover:shadow-lg hover:shadow-emerald-500/10 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
                                    >
                                        {processingItem === invite.id ? (
                                            <Loader2 size={14} className="animate-spin" />
                                        ) : (
                                            <Check size={14} strokeWidth={2.5} />
                                        )}
                                        <span>Aceptar</span>
                                    </button>
                                    
                                    <button
                                        onClick={() => handleRespond(invite.id, false)}
                                        disabled={processingItem === invite.id}
                                        className="flex-1 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-850 active:scale-[0.98] text-zinc-600 dark:text-zinc-400 py-2.5 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 border border-zinc-200 dark:border-zinc-800 transition-all disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
                                    >
                                        {processingItem === invite.id ? (
                                            <Loader2 size={14} className="animate-spin" />
                                        ) : (
                                            <X size={14} strokeWidth={2.5} />
                                        )}
                                        <span>Rechazar</span>
                                    </button>
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default InvitationsList;
