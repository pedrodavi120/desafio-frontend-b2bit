import React, { useState, useEffect, createContext, useContext } from 'react';
import axios from 'axios';

// --- TIPOS (TYPESCRIPT) ---
interface UserData {
    name: string;
    last_name: string;
    email: string;
    avatar?: {
        image_high_url: string;
    };
}

interface AuthContextType {
    isAuthenticated: boolean;
    login: (token: string) => void;
    logout: () => void;
}

// --- CONFIGURAÇÃO DA API ---
const api = axios.create({
    baseURL: '[https://api.homologation.cliqdrive.com.br](https://api.homologation.cliqdrive.com.br)',
    headers: {
        'Accept': 'application/json;version=v1_web',
        'Content-Type': 'application/json'
    }
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// --- CONTEXTO DE AUTENTICAÇÃO ---
export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => !!localStorage.getItem('accessToken'));

    const login = (token: string) => {
        localStorage.setItem('accessToken', token);
        setIsAuthenticated(true);
    };

    const logout = () => {
        localStorage.removeItem('accessToken');
        setIsAuthenticated(false);
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth deve ser usado dentro de um AuthProvider');
    }
    return context;
};

// --- COMPONENTES DAS PÁGINAS ---
const LoginPage: React.FC = () => {
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [error, setError] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const { login } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const response = await api.post('/auth/login/', { email, password });
            if (response.data && response.data.tokens) {
                login(response.data.tokens.access);
            }
        } catch (err: any) {
            const errorMessage = err.response?.data?.detail || 'E-mail ou senha inválidos.';
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="bg-white p-8 sm:p-12 rounded-2xl shadow-lg w-full max-w-md m-4">
                <div className="flex justify-center mb-10">
                    <img src="/B2Bit Logo.png" alt="Logo da B2Bit" className="w-48" />
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="mb-6">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">E-mail</label>
                        <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="@gmail.com"
                            className="w-full px-4 py-3 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div className="mb-6">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">Password</label>
                        <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="****************"
                            className="w-full px-4 py-3 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    {error && <p className="text-red-500 text-center text-sm mb-4">{error}</p>}
                    <button type="submit" disabled={isLoading}
                        className="w-full text-white font-bold py-3 px-4 rounded-lg transition-colors duration-300 disabled:opacity-50"
                        style={{ backgroundColor: '#02274F' }}>
                        {isLoading ? 'Entrando...' : 'Sign In'}
                    </button>
                </form>
            </div>
        </div>
    );
};

const ProfilePage: React.FC = () => {
    const [userData, setUserData] = useState<UserData | null>(null);
    const [error, setError] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const { logout } = useAuth();

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await api.get('/auth/profile/');
                setUserData(response.data);
            } catch (err) {
                setError('Sessão expirada. A redirecionar para o login...');
                setTimeout(() => logout(), 3000);
            } finally {
                setIsLoading(false);
            }
        };
        fetchProfile();
    }, [logout]);

    return (
        <div className="min-h-screen w-full flex flex-col bg-gray-100">
            <header className="bg-white shadow-md w-full">
                <div className="container mx-auto px-6 py-4 flex justify-end items-center">
                    <button onClick={logout} className="text-white font-bold py-2 px-6 rounded-lg transition-colors duration-300"
                        style={{ backgroundColor: '#02274F' }}>
                        Logout
                    </button>
                </div>
            </header>
            <main className="flex-grow flex items-center justify-center p-4">
                {isLoading && <p>A carregar perfil...</p>}
                {error && <p className="text-red-500 text-center">{error}</p>}
                {userData && (
                    <div className="bg-white p-8 sm:p-10 rounded-2xl shadow-lg text-center w-full max-w-md m-4">
                        <h2 className="text-gray-600 font-bold mb-6">Profile picture</h2>
                        <img src={userData.avatar?.image_high_url || `https://placehold.co/150x150/EFEFEF/333333?text=${userData.name.charAt(0)}`}
                            alt="Foto do perfil" className="w-32 h-32 rounded-full mx-auto mb-8 object-cover border-4 border-gray-200" />
                        <div className="text-left space-y-6">
                            <div>
                                <p className="text-gray-700 font-bold mb-1">Your Name</p>
                                <div className="bg-gray-100 p-3 rounded-lg">
                                    <p className="text-gray-800">{`${userData.name} ${userData.last_name || ''}`.trim()}</p>
                                </div>
                            </div>
                            <div>
                                <p className="text-gray-700 font-bold mb-1">Your E-mail</p>
                                <div className="bg-gray-100 p-3 rounded-lg">
                                    <p className="text-gray-800">{userData.email}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

function App() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <ProfilePage /> : <LoginPage />;
}

export default App;
