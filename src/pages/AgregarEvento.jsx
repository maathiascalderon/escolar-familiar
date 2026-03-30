import { useState, useEffect } from 'react';
import { BookOpen, Plus, Loader2, Lock } from 'lucide-react';
import BottomNav from '../components/layout/BottomNav';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export default function AgregarEvento() {
  const { user, profile } = useAuth();
  const isHija = profile?.role === 'hija';
  const [asignaturasGuardadas, setAsignaturasGuardadas] = useState([]);
  
  const [guardando, setGuardando] = useState(false);
  const [mensajeExito, setMensajeExito] = useState('');
  
  const [formulario, setFormulario] = useState({
    daughter: isHija ? (profile?.name || 'Florencia') : 'Florencia',
    type: 'Prueba',
    subject: '',
    date: '',
    description: ''
  });

  useEffect(() => {
    // Cargar asignaturas desde Supabase para sincronizar entre dispositivos
    async function cargarAsignaturas() {
      const { data } = await supabase.from('subjects').select('*');
      if (data && data.length > 0) {
        setAsignaturasGuardadas(data);
      } else {
        // Fallback a localStorage si Supabase no tiene datos
        const local = JSON.parse(localStorage.getItem('asignaturas') || '[]');
        setAsignaturasGuardadas(local);
      }
    }
    cargarAsignaturas();
  }, []);

  const handleChange = (e) => {
    setFormulario({ ...formulario, [e.target.name]: e.target.value });
  };

  const handleGuardar = async (e) => {
    e.preventDefault();
    setGuardando(true);
    setMensajeExito('');

    const datosGuardar = { ...formulario, created_at_by: user?.id };

    const { error } = await supabase.from('events').insert([datosGuardar]);

    if (!error) {
      setMensajeExito('¡Evento guardado exitosamente!');
      setFormulario({ daughter: 'Florencia', type: 'Prueba', subject: '', date: '', description: '' });
      setTimeout(() => setMensajeExito(''), 3000);
    } else {
      alert('Error al guardar el evento: ' + error.message);
    }
    setGuardando(false);
  };

  return (
    <div className="min-h-screen bg-[#F0F4F8] pb-32 pt-14 px-6 font-sans">
      <h1 className="text-[22px] font-black tracking-tight text-gray-900 mb-8 flex items-center">
        <Plus className="mr-3 text-indigo-500" strokeWidth={2.5} size={26} /> Nuevo Evento
      </h1>

      {mensajeExito && (
        <div className="bg-teal-50 border border-teal-200 text-teal-700 px-4 py-3 rounded-2xl mb-6 shadow-sm font-medium animate-in fade-in">
          {mensajeExito}
        </div>
      )}

      <form onSubmit={handleGuardar} className="bg-white rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 sm:p-8 border border-white/60 transition-all"> 
        <div className="space-y-5">
          <div>
            <label className="block text-[11px] uppercase tracking-widest font-bold text-gray-400 mb-2 ml-1">Para quién</label>
            {isHija ? (
              <div className="w-full bg-[#F0F4F8] border-0 rounded-2xl p-4 text-[15px] font-bold text-gray-500 flex items-center justify-between">
                <span>{profile?.name}</span>
                <Lock size={16} className="text-gray-400" />
              </div>
            ) : (
              <select name="daughter" value={formulario.daughter} onChange={handleChange} className="w-full bg-[#F0F4F8] border-0 rounded-2xl p-4 text-[15px] font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#2E7FFF] transition-all">
                <option value="Florencia">Florencia</option>
                <option value="Pía">Pía</option>
                <option value="Francisca">Francisca</option>
              </select>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] uppercase tracking-widest font-bold text-gray-400 mb-2 ml-1">Actividad</label>
              <select name="type" value={formulario.type} onChange={handleChange} className="w-full bg-[#F0F4F8] border-0 rounded-2xl p-4 text-[15px] font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#2E7FFF] transition-all">
                <option value="Prueba">Prueba</option>
                <option value="Tarea">Tarea</option>
                <option value="Reunión">Reunión</option>
                <option value="Actividad">Actividad</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] uppercase tracking-widest font-bold text-gray-400 mb-2 ml-1">Fecha</label>
              <input type="date" name="date" required value={formulario.date} onChange={handleChange} className="w-full bg-[#F0F4F8] border-0 rounded-2xl p-4 text-[15px] font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#2E7FFF] transition-all" />
            </div>
          </div>

          <div>
            <label className="block text-[11px] uppercase tracking-widest font-bold text-gray-400 mb-2 ml-1">Asignatura / Título</label>
            <input type="text" list="lista-asignaturas" name="subject" required placeholder="Ej: Historia de Chile" value={formulario.subject} onChange={handleChange} className="w-full bg-[#F0F4F8] border-0 rounded-2xl p-4 text-[15px] font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#2E7FFF] transition-all" />
            <datalist id="lista-asignaturas">
              {asignaturasGuardadas
                .filter(a => a.hijas.includes(formulario.daughter))
                .map(a => <option key={a.id} value={a.nombre} />)
              }
            </datalist>
          </div>

          <div>
            <label className="block text-[11px] uppercase tracking-widest font-bold text-gray-400 mb-2 ml-1">Detalles o Descripción</label>
            <textarea name="description" rows="3" placeholder="Notas adicionales..." value={formulario.description} onChange={handleChange} className="w-full bg-[#F0F4F8] border-0 rounded-2xl p-4 text-[15px] font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#2E7FFF] resize-none transition-all"></textarea>
          </div>
        </div>

        <button 
          type="submit"
          disabled={guardando}
          className="w-full mt-8 bg-gray-900 hover:bg-black text-white font-bold py-4 rounded-full shadow-lg shadow-gray-900/20 transition-transform active:scale-95 flex justify-center items-center"
        >
          {guardando ? <Loader2 className="animate-spin w-5 h-5 mr-2" /> : <Plus className="w-5 h-5 mr-2" />}
          {guardando ? 'Guardando...' : 'Crear Evento'}
        </button>
      </form>

      <BottomNav />
    </div>
  );
}
