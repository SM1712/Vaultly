import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
    const { signInWithGoogle, user } = useAuth();
    const navigate = useNavigate();

    const handleLogin = async () => {
        try {
            await signInWithGoogle();
            navigate('/');
        } catch (error) {
            console.error("Login failed", error);
        }
    };

    if (user) {
        navigate('/');
        return null;
    }

    return (
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
            <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-2xl shadow-2xl max-w-md w-full text-center space-y-8">
                <div className="space-y-2">
                    <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            className="w-8 h-8 text-emerald-500"
                        >
                            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Vaultly</h1>
                    <p className="text-zinc-400 text-sm">Tu terminal financiera personal</p>
                </div>

                <div className="space-y-4">
                    <button
                        onClick={handleLogin}
                        className="w-full bg-white hover:bg-zinc-200 text-zinc-900 font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-3 transition-colors"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                        Continuar con Google
                    </button>
                    <p className="text-xs text-zinc-500">
                        Al continuar, accedes a tu espacio seguro en el dispositivo.
                        No almacenamos datos en la nube (aún).
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
