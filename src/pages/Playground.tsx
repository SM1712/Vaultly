import { useNavigate } from 'react-router-dom';
import { LayoutGrid, AlertTriangle } from 'lucide-react';

const Playground = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-zinc-950 text-white p-8 font-mono">
            <header className="flex items-center justify-between mb-12 border-b border-zinc-800 pb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded bg-indigo-500 flex items-center justify-center">
                        <AlertTriangle size={20} className="text-white" />
                    </div>
                    <h1 className="text-xl font-bold tracking-tight">Playground App</h1>
                </div>

                <button
                    onClick={() => navigate('/')}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-900 border border-zinc-700 hover:bg-zinc-800 hover:border-zinc-600 transition-all text-sm"
                >
                    <LayoutGrid size={16} />
                    <span>Volver al Hub</span>
                </button>
            </header>

            <main className="max-w-3xl mx-auto text-center space-y-8 pt-12">
                <div className="p-12 border border-dashed border-zinc-800 rounded-2xl bg-zinc-900/50">
                    <h2 className="text-2xl font-bold mb-4">Zona de Pruebas</h2>
                    <p className="text-zinc-400">
                        Esta es una aplicación completamente separada de la app de finanzas.
                        Aquí podemos probar nuevas tecnologías o módulos sin afectar el núcleo principal.
                    </p>
                </div>

                <div className="grid grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-32 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-600">
                            Placeholder Module {i}
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
};

export default Playground;
