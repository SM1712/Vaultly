import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { collection, getDocs, limit, query } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Wifi, WifiOff, Database, Key } from "lucide-react";

const DebugFooter = () => {
    const { user } = useAuth();
    const [dbStatus, setDbStatus] = useState<"checking" | "connected" | "error">("checking");
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [envStatus, setEnvStatus] = useState<boolean>(false);

    useEffect(() => {
        // 1. Check Env Vars
        const hasKey = !!import.meta.env.VITE_FIREBASE_API_KEY;
        setEnvStatus(hasKey);

        if (!user || !hasKey) return;

        // 2. Check Database Connection & Permissions
        const checkConnection = async () => {
            try {
                const colRef = collection(db, "users", user.uid, "transactions");
                // Try to fetch just 1 doc to verify rules and connection
                await getDocs(query(colRef, limit(1)));
                setDbStatus("connected");
            } catch (err: any) {
                setDbStatus("error");
                console.error("Debug connection failed:", err);
                setErrorMsg(err.code || err.message);
            }
        };

        checkConnection();
    }, [user]);

    if (!user) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-zinc-950/90 text-zinc-500 text-[10px] p-2 flex flex-col items-center justify-center gap-1 backdrop-blur-sm border-t border-zinc-800 z-50 font-mono">

            {/* Env Vars Check */}
            <div className="flex items-center gap-2">
                <Key size={12} className={envStatus ? "text-emerald-500" : "text-rose-500"} />
                <span>Configs: {envStatus ? "OK" : "MISSING"}</span>
            </div>

            {/* Database Check */}
            <div className="flex items-center gap-2">
                <Database size={12} className={dbStatus === "connected" ? "text-emerald-500" : "text-rose-500"} />
                <span>
                    DB: {dbStatus === "checking" ? "..." : dbStatus === "connected" ? "Connected" : `ERROR (${errorMsg})`}
                </span>
            </div>

            {/* UID Display */}
            <div className="flex items-center gap-2 opacity-75">
                <span>UID: {user.uid.slice(0, 5)}...{user.uid.slice(-5)}</span>
            </div>

        </div>
    );
};

export default DebugFooter;
