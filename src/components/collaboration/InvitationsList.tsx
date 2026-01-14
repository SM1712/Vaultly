import { useCollaboration } from '../../context/CollaborationContext';
import { Check, X, Mail } from 'lucide-react';

const InvitationsList = () => {
    const { invitations, respondToInvitation } = useCollaboration();

    if (invitations.length === 0) return null;

    return (
        <div className="mb-8 animate-in fade-in slide-in-from-top-4">
            <h3 className="font-bold text-zinc-500 text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
                <Mail size={16} /> Invitaciones Pendientes
            </h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {invitations.map(invite => (
                    <div key={invite.id} className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-indigo-200 dark:border-indigo-900/50 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />

                        <div className="mb-3">
                            <p className="text-xs text-indigo-600 dark:text-indigo-400 font-bold mb-1">Invitación a Proyecto</p>
                            <h4 className="font-bold text-lg text-zinc-900 dark:text-zinc-100">{invite.projectName}</h4>
                            <p className="text-sm text-zinc-500">De: <span className="font-bold text-zinc-700 dark:text-zinc-300">@{invite.fromNickname}</span></p>
                        </div>

                        <div className="flex gap-2 mt-4">
                            <button
                                onClick={() => respondToInvitation(invite.id, true)}
                                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-colors"
                            >
                                <Check size={16} /> Aceptar
                            </button>
                            <button
                                onClick={() => respondToInvitation(invite.id, false)}
                                className="flex-1 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400 py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-colors"
                            >
                                <X size={16} /> Rechazar
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default InvitationsList;
