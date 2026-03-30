import { useState, useEffect } from 'react';
import { Settings, BookOpen, Key, Users, LogOut, ChevronRight, Plus, X, Trash2, BellRing, Edit2, Save } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import BottomNav from '../components/layout/BottomNav';
import { supabase } from '../lib/supabase';

export default function Ajustes() {
  const { profile, signOut } = useAuth();
  const isAdmin = profile?.role === 'admin' || profile?.role === 'parent';

  // State for subjects (Asignaturas)
  const [asignaturas, setAsignaturas] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [nuevaAsignatura, setNuevaAsignatura] = useState('');
  const [hijasSeleccionadas, setHijasSeleccionadas] = useState([]);
  const [asignaturaEditando, setAsignaturaEditando] = useState(null);

  const cerrarModal = () => {
    setModalOpen(false);
    setNuevaAsignatura('');
    setHijasSeleccionadas([]);
    setAsignaturaEditando(null);
  };

  useEffect(() => {
    async function cargarAsignaturas() {
      const { data, error } = await supabase.from('subjects').select('*').order('id', { ascending: true });
      if (data && data.length > 0) {
        setAsignaturas(data);
      } else {
        // Si la tabla está vacía, insertar defaults
        const defaults = [
          { nombre: 'Matemáticas', hijas: ['Florencia', 'Pía', 'Francisca'] },
          { nombre: 'Historia', hijas: ['Pía', 'Francisca'] }
        ];
        const { data: inserted } = await supabase.from('subjects').insert(defaults).select();
        if (inserted) setAsignaturas(inserted);
      }
    }
    cargarAsignaturas();
  }, []);

  const handleAgregarAsignatura = async (e) => {
    e.preventDefault();
    if (!nuevaAsignatura.trim() || hijasSeleccionadas.length === 0) {
      alert("Debes escribir el nombre y seleccionar al menos una hija.");
      return;
    }
    
    if (asignaturaEditando) {
      // Actualizar en Supabase
      const { data } = await supabase
        .from('subjects')
        .update({ nombre: nuevaAsignatura, hijas: hijasSeleccionadas })
        .eq('id', asignaturaEditando)
        .select();
      if (data) setAsignaturas(prev => prev.map(a => a.id === asignaturaEditando ? data[0] : a));
    } else {
      // Insertar en Supabase
      const { data } = await supabase
        .from('subjects')
        .insert([{ nombre: nuevaAsignatura, hijas: hijasSeleccionadas }])
        .select();
      if (data) setAsignaturas(prev => [...prev, data[0]]);
    }
    cerrarModal();
  };

  const iniciarEdicion = (asig) => {
    setNuevaAsignatura(asig.nombre);
    setHijasSeleccionadas(asig.hijas);
    setAsignaturaEditando(asig.id);
    setModalOpen(true);
  };

  const eliminarAsignatura = async (id) => {
    await supabase.from('subjects').delete().eq('id', id);
    setAsignaturas(prev => prev.filter(a => a.id !== id));
  };

  const toggleHija = (nombre) => {
    if (hijasSeleccionadas.includes(nombre)) {
      setHijasSeleccionadas(hijasSeleccionadas.filter(h => h !== nombre));
    } else {
      setHijasSeleccionadas([...hijasSeleccionadas, nombre]);
    }
  };

  const solicitarNotificaciones = async () => {
    if (!("Notification" in window)) {
      alert("Este navegador no soporta notificaciones de escritorio o móviles.");
      return;
    }
    
    if (Notification.permission === "granted") {
      new Notification("Notificaciones Activas", {
        body: "Ya recibirás alertas para los eventos de tus hijas.",
        icon: "/favicon.ico"
      });
      alert("¡Las notificaciones ya están activas!");
    } else if (Notification.permission !== "denied") {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        new Notification("Gestión Escolar familiar", {
          body: "Configuración exitosa.",
        });
      }
    } else {
      alert("Bloqueaste las notificaciones. Debes activarlas en la configuración de la página (el candado en la barra de direcciones).");
    }
  };

  if (profile && !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-xl font-bold text-gray-900 mb-2">Acceso Restringido</h1>
        <p className="text-gray-500 mb-6">Solo los padres y administradores pueden acceder a esta configuración.</p>
        <button onClick={signOut} className="bg-purple-600 text-white font-bold py-3 px-8 rounded-full shadow-md">Volver e Iniciar Sesión</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0F4F8] pb-32 pt-14 px-6 font-sans">
      <h1 className="text-[22px] font-black tracking-tight text-gray-900 mb-8 flex items-center">
        <Settings className="mr-3 text-gray-400" strokeWidth={2.5} size={26} /> Ajustes
      </h1>

      {/* Perfil Actual */}
      <div className="glass rounded-[2.5rem] p-6 shadow-ios border border-white/50 mb-6 flex items-center justify-between">
        <div className="flex items-center">
          <div className="w-16 h-16 bg-[#4D418A]/10 text-[#4D418A] rounded-[1.5rem] flex items-center justify-center font-black text-2xl mr-4">
            {profile?.name?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div>
            <h2 className="font-black text-gray-900 text-xl tracking-tight">{profile?.name || 'Usuario'}</h2>
            <p className="text-[13px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{profile?.role || 'Sin rol'}</p>
          </div>
        </div>
        <button onClick={signOut} className="bg-red-50 p-4 rounded-2xl text-red-500 hover:bg-red-100 transition active:scale-95">
          <LogOut size={20} />
        </button>
      </div>

      {/* Solo para Administradores */}
      {isAdmin && (
        <div className="space-y-6">
          <h3 className="font-bold text-gray-400 uppercase tracking-wider text-[13px] ml-1">Administración</h3>
          
          {/* Gestión de Asignaturas */}
          <div className="bg-white rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 overflow-hidden">
            <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-indigo-50/30">
              <div className="flex items-center">
                <div className="bg-indigo-50 w-12 h-12 rounded-2xl flex items-center justify-center text-indigo-500 mr-4">
                  <BookOpen size={22} />
                </div>
                <h4 className="font-bold text-gray-900 text-[17px]">Asignaturas</h4>
              </div>
              <button onClick={() => {cerrarModal(); setModalOpen(true);}} className="bg-gray-900 hover:bg-black text-white p-3 rounded-2xl shadow-lg shadow-gray-900/20 transition active:scale-95">
                <Plus size={20} strokeWidth={2.5} />
              </button>
            </div>
            
            <div className="p-5">
              <p className="text-sm text-gray-500 mb-3">Tus asignaturas registradas:</p>
              <div className="space-y-2">
                {asignaturas.length === 0 ? (
                  <p className="text-sm text-center py-4 bg-gray-50 rounded-xl">No hay asignaturas. Presiona el botón + para agregar.</p>
                ) : (
                  asignaturas.map(asig => (
                    <div key={asig.id} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-xl group transition">
                      <div>
                        <span className="font-semibold text-gray-900 text-sm">{asig.nombre}</span>
                        <p className="text-xs text-indigo-500 font-medium">Pertenece a: {asig.hijas.join(', ')}</p>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                        <button onClick={() => iniciarEdicion(asig)} className="text-indigo-400 p-2 hover:bg-indigo-50 rounded-lg transition">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => eliminarAsignatura(asig.id)} className="text-red-400 p-2 hover:bg-red-50 rounded-lg transition">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 overflow-hidden mt-6">
            <div className="p-6 border-b border-gray-50 flex justify-between items-center">
              <div className="flex items-center">
                <div className="bg-yellow-50 w-12 h-12 rounded-2xl flex items-center justify-center text-amber-500 mr-4">
                  <BellRing size={22} />
                </div>
                <h4 className="font-bold text-gray-900 text-[17px]">Notificaciones</h4>
              </div>
            </div>
            <div className="p-4">
              <p className="text-xs text-gray-500 mb-4">Activa las notificaciones en tu celular para recibir recordatorios automáticos.</p>
              <button 
                onClick={solicitarNotificaciones} 
                className="w-full bg-yellow-50 hover:bg-yellow-100 text-yellow-700 font-bold py-3 rounded-xl transition flex justify-center items-center"
              >
                <BellRing size={16} className="mr-2" />
                Permitir Notificaciones Push
              </button>
            </div>
          </div>

        </div>
      )}

      {/* Modal Agregar Asignatura */}
      {modalOpen && (
        <div className="fixed inset-0 bg-[#0A0E17]/60 z-[100] flex items-end justify-center sm:items-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-[2.5rem] w-full max-w-sm p-8 shadow-2xl animate-in slide-in-from-bottom-full pb-10">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-[20px] font-black tracking-tight text-gray-900">{asignaturaEditando ? 'Editar Asignatura' : 'Nueva Asignatura'}</h3>
              <button type="button" onClick={cerrarModal} className="bg-gray-50 text-gray-400 rounded-full p-3 hover:bg-gray-100 hover:text-gray-600 transition">
                <X size={22} strokeWidth={2.5} />
              </button>
            </div>
            
            <form onSubmit={handleAgregarAsignatura}>
              <div className="mb-5">
                <label className="block text-[11px] uppercase tracking-widest font-bold text-gray-400 mb-2 ml-1">Nombre</label>
                <input 
                  type="text" 
                  autoFocus
                  required
                  placeholder="Ej: Biología Celular"
                  value={nuevaAsignatura}
                  onChange={e => setNuevaAsignatura(e.target.value)}
                  className="w-full bg-[#F0F4F8] border-0 rounded-2xl p-4 text-[15px] font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#2E7FFF] transition-all"
                />
              </div>
              
              <div className="mb-8">
                <label className="block text-[11px] uppercase tracking-widest font-bold text-gray-400 mb-2 ml-1">¿De quién es esta materia?</label>
                <div className="flex flex-wrap gap-2 mt-3">
                  {['Florencia', 'Pía', 'Francisca'].map(nombre => (
                    <button 
                      key={nombre}
                      type="button"
                      onClick={() => toggleHija(nombre)}
                      className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all ${hijasSeleccionadas.includes(nombre) ? 'bg-gray-900 text-white shadow-md' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                    >
                      {nombre}
                    </button>
                  ))}
                </div>
              </div>
              
              <button type="submit" className="w-full mt-6 bg-[#2E7FFF] text-white font-bold py-4 rounded-full shadow-lg shadow-[#2E7FFF]/30 hover:bg-[#1C69E5] transition transform active:scale-95 disabled:opacity-50 flex justify-center items-center">
                {asignaturaEditando ? <Save className="w-5 h-5 mr-2" /> : <Plus className="w-5 h-5 mr-2" />}
                {asignaturaEditando ? 'Guardar Cambios' : 'Guardar Asignatura'}
              </button>
            </form>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
