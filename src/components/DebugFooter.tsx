import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import { CloudStorage } from "../services/CloudStorage";
import { RefreshCcw, Save, Smartphone } from "lucide-react";
import { toast } from "sonner";

const DebugFooter = () => {
    const { user } = useAuth();
    const { data, isLoading, isSaving, updateData } = useData(); // Access global state

    // Manual Force Save
    const handleForceSave = async () => {
        if (!user) return;
        toast.info("Forzando guardado...");
        try {
            await CloudStorage.saveMasterDoc(user.uid, data);
            toast.success("Guardado forzado exitoso");
        } catch (e: any) {
            toast.error("Error guardando: " + e.message);
        }
    };

    // Manual Force Load
    const handleForceLoad = async () => {
        if (!user) return;
        toast.info("Forzando carga...");
        try {
            const freshData = await CloudStorage.fetchMasterDoc(user.uid);
            if (freshData) {
                // We need to bypass the 'updateData' debounce to just SET the data
                // Ideally DataContext exposes 'setData', but 'updateData' merges. 
                // We can just merge everything.
                updateData(freshData);
                toast.success("Carga exitosa: " + freshData.transactions.length + " txs");
            } else {
                toast.warning("No se encontraron datos en la nube");
            }
        } catch (e: any) {
            toast.error("Error cargando: " + e.message);
        }
    };

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-zinc-950/95 text-zinc-400 text-[10px] p-2 flex flex-wrap items-center justify-center gap-4 border-t border-zinc-800 z-50 font-mono">

            {/* User Info */}
            <div className="flex items-center gap-1">
                <Smartphone size={12} />
                <span>{user ? user.email : "No User"}</span>
            </div>

            {/* Data Stats */}
            <div className="flex items-center gap-2">
                <span className={isLoading ? "text-yellow-500" : "text-green-500"}>
                    {isLoading ? "LOADING..." : "READY"}
                </span>
                <span>TXs: {data.transactions?.length || 0}</span>
                <span className={isSaving ? "text-blue-500 animate-pulse" : "text-zinc-600"}>
                    {isSaving ? "SAVING..." : "IDLE"}
                </span>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2">
                <button onClick={handleForceLoad} className="flex items-center gap-1 bg-zinc-800 px-2 py-1 rounded hover:bg-zinc-700">
                    <RefreshCcw size={10} /> LOAD
                </button>
                <button onClick={handleForceSave} className="flex items-center gap-1 bg-zinc-800 px-2 py-1 rounded hover:bg-zinc-700">
                    <Save size={10} /> SAVE
                </button>
            </div>

            <div className="text-zinc-600">v2.0 DEBUG</div>
        </div>
    );
};

export default DebugFooter;
