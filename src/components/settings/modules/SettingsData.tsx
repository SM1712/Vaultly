import { useRef, useState } from 'react';
import { Database, Download, Upload, AlertTriangle, Trash2 } from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { toast } from 'sonner';

export const SettingsData = () => {
    const { data: appData, updateData, resetData } = useData();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // State for update simulation
    const [isUpdating, setIsUpdating] = useState(false);
    const [updateStatus, setUpdateStatus] = useState('');

    // State for Danger Zone Confirmation
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const handleSystemUpdate = () => {
        setIsUpdating(true);
        setUpdateStatus('RECARGANDO...');
        window.location.reload();
    };

    const handleExport = () => {
        const jsonString = `data:text/json;chatset=utf-8,${encodeURIComponent(
            JSON.stringify(appData)
        )}`;
        const link = document.createElement("a");
        link.href = jsonString;
        link.download = `vault_backup_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        toast.success("Copia Descargada", {
            description: "La copia de seguridad se ha guardado en tu dispositivo."
        });
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const json = e.target?.result as string;
                const parsedData = JSON.parse(json);
                if (!parsedData || typeof parsedData !== 'object') {
                    throw new Error("Formato inválido");
                }
                updateData(parsedData);
                toast.success("Datos Restaurados", {
                    description: "Tus datos financieros han sido importados con éxito."
                });
            } catch (error) {
                console.error("Import error:", error);
                toast.error("Importación Fallida", {
                    description: "El archivo JSON proporcionado tiene un formato inválido o está corrupto."
                });
            }
        };
        reader.readAsText(file);
        event.target.value = '';
    };

    const handleConfirmReset = async () => {
        await resetData();
        setShowDeleteConfirm(false);
        toast.success("Datos Eliminados", {
            description: "Se han borrado todos los datos financieros locales de tu cuenta."
        });
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="bg-amber-50 dark:bg-amber-900/10 p-5 rounded-xl border border-amber-200 dark:border-amber-900/30">
                <h4 className="text-amber-800 dark:text-amber-400 font-bold mb-2 flex items-center gap-2">
                    <Database size={18} /> Gestión de Datos
                </h4>
                <p className="text-sm text-amber-700 dark:text-amber-500/80 mb-0 leading-relaxed">
                    Gestiona tus datos locales. Recuerda exportar copias de seguridad regularmente.
                </p>
            </div>

            <div className="space-y-3">
                <button
                    onClick={handleExport}
                    className="w-full flex items-center justify-between p-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all group"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                            <Download size={20} />
                        </div>
                        <div className="text-left">
                            <p className="font-bold text-zinc-900 dark:text-zinc-100">Exportar Copia de Seguridad</p>
                            <p className="text-xs text-zinc-500">Descargar archivo .json</p>
                        </div>
                    </div>
                </button>

                <input type="file" ref={fileInputRef} onChange={handleFileImport} accept=".json" className="hidden" />

                <button
                    onClick={handleImportClick}
                    className="w-full flex items-center justify-between p-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/5 transition-all group"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                            <Upload size={20} />
                        </div>
                        <div className="text-left">
                            <p className="font-bold text-zinc-900 dark:text-zinc-100">Restaurar Copia</p>
                            <p className="text-xs text-zinc-500">Sobrescribir datos actuales</p>
                        </div>
                    </div>
                </button>

                <div className="h-4"></div>

                <div className="border-t border-zinc-100 dark:border-zinc-800 pt-6">
                    <h5 className="text-xs font-bold text-rose-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <AlertTriangle size={14} /> Zona de Peligro
                    </h5>

                    {!showDeleteConfirm ? (
                        <button
                            onClick={() => setShowDeleteConfirm(true)}
                            className="w-full flex items-center justify-center gap-2 p-4 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-xl hover:bg-rose-100 dark:hover:bg-rose-900/30 transition-all font-bold text-sm tracking-wide border border-rose-200 dark:border-rose-900/50"
                        >
                            <Trash2 size={18} />
                            Eliminar todos los datos
                        </button>
                    ) : (
                        <div className="p-4 bg-rose-50 dark:bg-rose-900/20 rounded-xl border border-rose-200 dark:border-rose-900/50 text-center space-y-3 animate-in fade-in zoom-in-95 duration-200">
                            <p className="text-rose-700 dark:text-rose-300 font-bold text-sm">
                                ¿Estás absolutamente seguro?
                            </p>
                            <p className="text-rose-600/80 dark:text-rose-400/80 text-xs">
                                Esta acción eliminará todas las transacciones, metas y configuraciones.<br />
                                No se puede deshacer.
                            </p>
                            <div className="flex gap-2 justify-center mt-2">
                                <button
                                    onClick={() => setShowDeleteConfirm(false)}
                                    className="px-4 py-2 bg-white dark:bg-rose-950 text-zinc-600 dark:text-rose-200 font-bold text-xs rounded-lg border border-zinc-200 dark:border-rose-900 hover:bg-zinc-50"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleConfirmReset}
                                    className="px-4 py-2 bg-rose-600 text-white font-bold text-xs rounded-lg hover:bg-rose-700 shadow-sm"
                                >
                                    Sí, eliminar todo
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="pt-4 text-center">
                <button
                    onClick={handleSystemUpdate}
                    disabled={isUpdating}
                    className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 underline"
                >
                    {isUpdating ? updateStatus : 'Recargar Aplicación'}
                </button>
            </div>
        </div>
    );
};
