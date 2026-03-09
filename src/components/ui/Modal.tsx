import { X } from 'lucide-react';
import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    maxWidth?: string;
    noPadding?: boolean;
    className?: string;
    headerActions?: React.ReactNode;
}

const Modal = ({ isOpen, onClose, title, children, maxWidth = "max-w-md", noPadding = false, className = "", headerActions }: ModalProps) => {
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

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className={`relative bg-white dark:bg-zinc-900 rounded-xl shadow-2xl w-full ${maxWidth} ${className} border border-zinc-200 dark:border-zinc-800 max-h-[85vh] flex flex-col overflow-hidden`}
                    >
                        <div className="flex items-center justify-between p-4 border-b border-zinc-100 dark:border-zinc-800/50 flex-shrink-0">
                            <div className="flex items-center gap-3">
                                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                                    {title}
                                </h3>
                                {headerActions && (
                                    <div className="flex items-center gap-2">
                                        {headerActions}
                                    </div>
                                )}
                            </div>
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
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default Modal;
