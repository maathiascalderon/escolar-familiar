import { useState } from 'react';
import { Loader2, LogIn, GraduationCap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error: signInError } = await signIn(email, password);
    
    if (signInError) {
      setError('Credenciales inválidas. Intenta nuevamente.');
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#4D418A] flex flex-col justify-center px-8 relative overflow-hidden selection:bg-white/20">
      
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#7A52B8] opacity-50 rounded-full translate-y-1/3 -translate-x-1/3 blur-3xl" />

      <div className="relative z-10 w-full max-w-sm mx-auto">
        <div className="text-center mb-10">
          <div className="bg-white/10 w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto mb-6 backdrop-blur-sm border border-white/20 shadow-2xl">
            <GraduationCap size={40} className="text-white" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">EscolarFamiliar</h1>
          <p className="text-[#B3A6E8] mt-2 text-sm font-medium">Inicia sesión en tu cuenta</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-100 text-sm p-3 rounded-xl text-center">
              {error}
            </div>
          )}
          
          <div>
            <input
              type="email"
              placeholder="Correo electrónico"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-white/10 text-white placeholder-white/50 border border-white/20 rounded-2xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-white/50 transition-all font-medium"
            />
          </div>
          <div>
            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-white/10 text-white placeholder-white/50 border border-white/20 rounded-2xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-white/50 transition-all font-medium"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !email || !password}
            className="w-full bg-white text-[#4D418A] font-bold py-4 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:bg-gray-50 flex justify-center items-center transition-all disabled:opacity-70 disabled:hover:bg-white mt-8"
          >
            {loading ? <Loader2 className="animate-spin w-5 h-5 mr-2" /> : <LogIn className="w-5 h-5 mr-2" />}
            {loading ? 'Entrando...' : 'Ingresar'}
          </button>
        </form>

        <p className="text-center text-[#B3A6E8] text-xs mt-10 opacity-60">
          Sistema de gestión centralizada
        </p>
      </div>
    </div>
  );
}
