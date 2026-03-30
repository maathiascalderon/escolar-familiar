import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Loader2 } from 'lucide-react';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AgregarEvento from './pages/AgregarEvento';
import Calendario from './pages/Calendario';
import Ajustes from './pages/Ajustes';
import Notas from './pages/Notas';

function PrivateRoute({ children }) {
  const { session, loading, profileError, profile, signOut } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-[#4D418A] flex items-center justify-center">
        <Loader2 className="animate-spin text-white w-10 h-10" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  // Usuario autenticado pero sin perfil en la DB
  if (!loading && session && !profile && profileError) {
    return (
      <div className="min-h-screen bg-[#F0F4F8] flex flex-col items-center justify-center p-8 text-center">
        <div className="bg-white rounded-[2.5rem] p-8 shadow-lg max-w-sm w-full">
          <div className="w-16 h-16 bg-red-50 rounded-[1.5rem] flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">⚠️</span>
          </div>
          <h1 className="text-xl font-black text-gray-900 mb-2">Perfil no encontrado</h1>
          <p className="text-gray-500 text-sm mb-1">Tu cuenta existe pero no tiene un perfil configurado.</p>
          <p className="text-gray-400 text-xs mb-6">Pide al administrador que te agregue a la tabla <code className="bg-gray-100 px-1 rounded">profiles</code> con tu email.</p>
          <button
            onClick={signOut}
            className="w-full bg-[#4D418A] text-white font-bold py-3 rounded-full"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    );
  }

  return children;
}

function AppContent() {
  const { session } = useAuth();

  return (
    <BrowserRouter>
      {session ? (
        <div className="bg-gray-900 min-h-screen w-full flex justify-center items-start sm:py-6">
          <div className="w-full sm:max-w-md sm:h-[850px] bg-gray-50 bg-[#f9f9fb] shadow-2xl sm:rounded-[3rem] sm:border-[8px] border-gray-800 relative overflow-x-hidden overflow-y-auto hide-scrollbar">
            <Routes>
            <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/calendario" element={<PrivateRoute><Calendario /></PrivateRoute>} />
            <Route path="/agregar" element={<PrivateRoute><AgregarEvento /></PrivateRoute>} />
            <Route path="/ajustes" element={<PrivateRoute><Ajustes /></PrivateRoute>} />
            <Route path="/notas" element={<PrivateRoute><Notas /></PrivateRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
      ) : (
        <div className="bg-gray-900 min-h-screen w-full flex justify-center items-start sm:py-6">
          <div className="w-full sm:max-w-md sm:h-[850px] bg-[#4D418A] shadow-2xl sm:rounded-[3rem] sm:border-[8px] border-gray-800 relative overflow-hidden flex items-center justify-center">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </div>
        </div>
      )}
    </BrowserRouter>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
