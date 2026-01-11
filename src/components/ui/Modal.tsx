import { X } from 'lucide-react';
import { useEffect } from 'react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    maxWidth?: string;
    noPadding?: boolean;
    className?: string;
}

const Modal = ({ isOpen, onClose, title, children, maxWidth = "max-w-md", noPadding = false, className = "" }: ModalProps) => {
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className={`relative bg-white dark:bg-zinc-900 rounded-xl shadow-2xl w-full ${maxWidth} ${className} border border-zinc-200 dark:border-zinc-800 transform transition-all animate-in fade-in zoom-in-95 duration-200 max-h-[85vh] flex flex-col overflow-hidden`}>
                <div className="flex items-center justify-between p-4 border-b border-zinc-100 dark:border-zinc-800/50 flex-shrink-0">
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                        {title}
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className={noPadding ? "flex-1 min-h-0 flex flex-col overflow-hidden" : "p-6 overflow-y-auto no-scrollbar"}>
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Modal;
