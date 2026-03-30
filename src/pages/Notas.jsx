import { useState, useEffect } from 'react';
import { BookOpen, Plus, Search, ChevronDown, Check, Trash2, Edit2, Save, X } from 'lucide-react';
import BottomNav from '../components/layout/BottomNav';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

const HIJAS = [
  { id: 1, nombre: 'Florencia', color: 'bg-indigo-600', light: 'bg-indigo-50', text: 'text-indigo-600' },
  { id: 2, nombre: 'Pía', color: 'bg-rose-500', light: 'bg-rose-50', text: 'text-rose-600' },
  { id: 3, nombre: 'Francisca', color: 'bg-teal-500', light: 'bg-teal-50', text: 'text-teal-600' }
];

export default function Notas() {
  const { profile, signOut } = useAuth();
  // Mathias (admin), Mirsa (parent) y Florencia (hija) pueden gestionar notas
  const canModify = profile?.role === 'admin' || profile?.role === 'parent' || profile?.role === 'hija';
  const isAdmin = canModify;
  const isHija = profile?.role === 'hija';
  
  // Si es hija, auto-seleccionar su propia ficha
  const hijaPropiaObj = HIJAS.find(h => h.nombre === profile?.name) || HIJAS[0];
  const [hijaActiva, setHijaActiva] = useState(isHija ? hijaPropiaObj : HIJAS[0]);
  const [notasBD, setNotasBD] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [semestreActivo, setSemestreActivo] = useState(1);
  
  // Modal de Agregar Nota
  const [modalAbierto, setModalAbierto] = useState(false);
  const [asignaturasGuardadas, setAsignaturasGuardadas] = useState([]);
  const [formNota, setFormNota] = useState({ subject: '', grade: '', semester: semestreActivo });
  const [guardando, setGuardando] = useState(false);
  
  // Modal Editar Nota
  const [notaEditando, setNotaEditando] = useState(null);

  useEffect(() => {
    cargarNotas();
    // Cargar asignaturas desde Supabase para sincronizar entre dispositivos
    async function cargarAsignaturas() {
      const { data } = await supabase.from('subjects').select('*');
      if (data && data.length > 0) {
        setAsignaturasGuardadas(data);
      } else {
        // Fallback a localStorage si Supabase no tiene datos aún
        const local = JSON.parse(localStorage.getItem('asignaturas') || '[]');
        setAsignaturasGuardadas(local);
      }
    }
    cargarAsignaturas();
  }, [hijaActiva]);

  const cargarNotas = async () => {
    setCargando(true);
    const { data } = await supabase
      .from('grades')
      .select('*')
      .eq('daughter', hijaActiva.nombre)
      .order('created_at', { ascending: false });
    
    if (data) setNotasBD(data);
    setCargando(false);
  };

  const handleGuardarNota = async (e) => {
    e.preventDefault();
    setGuardando(true);
    const { error } = await supabase.from('grades').insert([{
      daughter: hijaActiva.nombre,
      subject: formNota.subject,
      grade: parseFloat(formNota.grade),
      semester: parseInt(formNota.semester)
    }]);

    if (!error) {
      setModalAbierto(false);
      setFormNota({ subject: '', grade: '', semester: '1' });
      cargarNotas();
    } else {
      alert("Error al guardar nota: " + error.message);
    }
    setGuardando(false);
  };

  const eliminarNota = async (id) => {
    if(!isAdmin) return;
    if(confirm("¿Seguro que deseas eliminar esta nota?")) {
      await supabase.from('grades').delete().eq('id', id);
      setNotaEditando(null);  // cerrar modal si estaba abierto
      cargarNotas();
    }
  };

  const handleActualizarNota = async (e) => {
    e.preventDefault();
    setGuardando(true);
    const { error } = await supabase.from('grades').update({
      subject: notaEditando.subject,
      grade: parseFloat(notaEditando.grade),
      semester: parseInt(notaEditando.semester)
    }).eq('id', notaEditando.id);

    if (!error) {
      setNotaEditando(null);
      cargarNotas();
    } else {
      alert("Error al editar nota: " + error.message);
    }
    setGuardando(false);
  };

  // Filtrar asignaturas asignadas a la hija actual
  const asignaturasDeHija = asignaturasGuardadas.filter(a => a.hijas.includes(hijaActiva.nombre));

  // Combinar asignaturas registradas con las que ya tienen notas filtradas por el Semestre seleccionado
  const promediosCombinados = asignaturasDeHija.map(asigObj => {
    const notasDeAsig = notasBD.filter(n => n.subject === asigObj.nombre && n.semester === semestreActivo);
    if (notasDeAsig.length === 0) {
      return { asignatura: asigObj.nombre, promedio: '---', cantidad: 0, notas: [] };
    }
    const suma = notasDeAsig.reduce((a, b) => a + b.grade, 0);
    const promedio = (suma / notasDeAsig.length).toFixed(1);
    return { asignatura: asigObj.nombre, promedio, cantidad: notasDeAsig.length, notas: notasDeAsig };
  });  

  const promediosEvaluados = promediosCombinados.filter(p => p.promedio !== '---');
  const sumaGeneral = promediosEvaluados.reduce((a, b) => a + parseFloat(b.promedio), 0);
  const promedioGeneralHija = promediosEvaluados.length > 0 ? (sumaGeneral / promediosEvaluados.length).toFixed(1) : '---';

  return (
    <div className="min-h-screen bg-[#F0F4F8] pb-36 font-sans antialiased text-gray-900">
      
      {/* Nuevo Header Limpio */}
      <div className="pt-14 px-6 mb-8">
        <h1 className="text-[22px] font-black tracking-tight text-gray-900 mb-6 flex items-center">
          <BookOpen className="mr-3 text-indigo-500" strokeWidth={2.5} size={26} /> Rendimiento
        </h1>
        
        {/* Selector de hija - oculto para rol hija (solo ve la propia) */}
        {!isHija && (
          <div className="flex space-x-3 overflow-x-auto hide-scrollbar pb-2">
            {HIJAS.map(hija => {
              const isSelected = hijaActiva.id === hija.id;
              return (
                <button
                  key={hija.id}
                  onClick={() => setHijaActiva(hija)}
                  className={`flex-shrink-0 px-6 py-3 rounded-full text-[14px] font-bold transition-all duration-300 ${isSelected ? `bg-gray-900 text-white shadow-lg shadow-gray-900/20` : 'bg-white text-gray-500 shadow-sm border border-gray-100 hover:bg-gray-50'}`}
                >
                  {hija.nombre}
                </button>
              )
            })}
          </div>
        )}
        {isHija && (
          <div className="flex items-center justify-between">
            <span className="px-6 py-3 rounded-full text-[14px] font-bold bg-gray-900 text-white">{profile?.name}</span>
            <button onClick={signOut} className="text-[13px] font-bold text-red-400 hover:text-red-600 flex items-center gap-1 transition">
              Cerrar sesión
            </button>
          </div>
        )}
      </div>

      {/* Cuadro de Promedio General Dinámico */}
      <div className="px-6 mb-6">
        <div className="bg-white rounded-[2.5rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-white flex justify-between items-center">
          <div>
            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1">Rendimiento Actual Semestre {semestreActivo}</p>
            <h3 className="text-[16px] font-bold text-gray-800 tracking-tight">Promedio General</h3>
          </div>
          <div className={`${promedioGeneralHija !== '---' && parseFloat(promedioGeneralHija) < 4.0 ? 'bg-red-50 text-red-500' : 'bg-[#34C759]/10 text-[#34C759]'} px-6 py-3 rounded-3xl transition-colors`}>
            <span className="text-[24px] font-black tracking-tighter">{promedioGeneralHija}</span>
          </div>
        </div>
      </div>

      <div className="px-6 space-y-6">
        
        {canModify && (
          <button 
            onClick={() => setModalAbierto(true)}
            className="w-full bg-[#2E7FFF] text-white font-bold py-4 rounded-full shadow-lg shadow-[#2E7FFF]/30 flex justify-center items-center transition-transform active:scale-95"
          >
            <Plus className="mr-2" strokeWidth={2.5} /> Añadir Calificación
          </button>
        )}

        <div>
          <h2 className="text-gray-400 font-bold text-[13px] uppercase tracking-wider mb-4 flex flex-col gap-3">
            <span>Promedios y Materias</span>
            
            <div className="flex space-x-2 bg-gray-200/50 p-1.5 rounded-full w-full max-w-[200px]">
              <button 
                onClick={() => setSemestreActivo(1)}
                className={`flex-1 text-[11px] font-bold uppercase tracking-widest py-1.5 rounded-full transition ${semestreActivo === 1 ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
              >
                1° Sem
              </button>
              <button 
                onClick={() => setSemestreActivo(2)}
                className={`flex-1 text-[11px] font-bold uppercase tracking-widest py-1.5 rounded-full transition ${semestreActivo === 2 ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
              >
                2° Sem
              </button>
            </div>
          </h2>

          <div className="grid grid-cols-1 gap-5">
            {cargando ? (
              <p className="text-center text-gray-400 py-6 font-medium">Actualizando...</p>
            ) : asignaturasDeHija.length === 0 ? (
              <div className="bg-white p-8 rounded-[2.5rem] border border-gray-50 text-center shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                <BookOpen className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                <p className="text-gray-500 font-medium text-[15px] leading-relaxed">No hay asignaturas registradas para {hijaActiva.nombre}.<br/>Ve a Ajustes para agregarlas.</p>
              </div>
            ) : (
              promediosCombinados.map((item, index) => {
                const esRojo = item.promedio !== '---' && parseFloat(item.promedio) < 4.0;
                return (
                  <div key={index} className="bg-white rounded-[2.5rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60">
                    <div className="flex justify-between items-center mb-5">
                      <div>
                        <h3 className="font-bold text-gray-900 text-[18px] tracking-tight">{item.asignatura}</h3>
                        <p className="text-gray-400 text-[13px] font-medium mt-1">{item.cantidad === 0 ? 'Sin evaluaciones' : `${item.cantidad} calificaciones`}</p>
                      </div>
                      <div className={`text-3xl font-black tracking-tighter ${item.promedio === '---' ? 'text-gray-300' : esRojo ? 'text-red-500' : 'text-[#34C759]'}`}>
                        {item.promedio}
                      </div>
                    </div>
                    {/* Visualización de mini-notas */}
                    {item.notas.length > 0 && (
                      <div className="flex space-x-2 overflow-x-auto hide-scrollbar pt-2 border-t border-gray-50/80">
                        {item.notas.map((notaObj, i) => (
                          <div 
                            key={i} 
                            onClick={() => canModify ? setNotaEditando({
                               id: notaObj.id,
                               subject: notaObj.subject,
                               grade: notaObj.grade,
                               semester: notaObj.semester || 1
                            }) : null}
                            className={`flex flex-shrink-0 w-12 h-12 rounded-[1rem] items-center justify-center font-bold text-[15px] ${canModify ? 'cursor-pointer transition transform active:scale-95' : 'cursor-default'} ${notaObj.grade < 4.0 ? 'bg-red-50 text-red-600' : 'bg-[#F0F4F8] text-gray-800 hover:bg-[#E2E8F0]'}`}
                            title={canModify ? "Editar calificación" : ""}
                          >
                            {notaObj.grade.toFixed(1)}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Modal Agregar Nota */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-[#0A0E17]/60 z-[100] flex items-end justify-center sm:items-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-[2.5rem] w-full max-w-sm p-8 shadow-2xl animate-in slide-in-from-bottom-full pb-10">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-[20px] font-black tracking-tight text-gray-900">Añadir Nota</h3>
              <button type="button" onClick={() => setModalAbierto(false)} className="bg-gray-50 text-gray-400 rounded-full p-3 hover:bg-gray-100 hover:text-gray-600 transition">
                <ChevronDown size={22} strokeWidth={2.5} />
              </button>
            </div>
            
            <form onSubmit={handleGuardarNota} className="space-y-5">
              <div>
                <label className="block text-[11px] uppercase tracking-widest font-bold text-gray-400 mb-2 ml-1">Asignatura</label>
                <select 
                  required
                  value={formNota.subject}
                  onChange={e => setFormNota({...formNota, subject: e.target.value})}
                  className="w-full bg-[#F0F4F8] border-0 rounded-2xl p-4 text-[15px] font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#2E7FFF] transition-all"
                >
                  <option value="" className="text-gray-400">Selecciona materia...</option>
                  {asignaturasDeHija.map(a => <option key={a.id} value={a.nombre}>{a.nombre}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] uppercase tracking-widest font-bold text-gray-400 mb-2 ml-1">Calificación</label>
                  <input 
                    type="number" step="0.1" min="1.0" max="7.0" required placeholder="6.5"
                    value={formNota.grade}
                    onChange={e => setFormNota({...formNota, grade: e.target.value})}
                    className="w-full p-4 bg-[#F0F4F8] border-0 rounded-2xl outline-none focus:ring-2 focus:ring-[#2E7FFF] font-black text-[22px] text-center text-[#2E7FFF] transition-all placeholder:text-gray-300"
                  />
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-widest font-bold text-gray-400 mb-2 ml-1">Semestre</label>
                  <select 
                    value={formNota.semester} onChange={e => setFormNota({...formNota, semester: parseInt(e.target.value)})}
                    className="w-full p-4 bg-[#F0F4F8] border-0 rounded-2xl outline-none focus:ring-2 focus:ring-[#2E7FFF] font-bold text-gray-900 transition-all text-center"
                  >
                    <option value={1}>1° Sem</option>
                    <option value={2}>2° Sem</option>
                  </select>
                </div>
              </div>
              
              <button 
                type="submit" 
                disabled={guardando || !formNota.subject || !formNota.grade}
                className="w-full mt-6 bg-[#2E7FFF] text-white font-bold py-4 rounded-full shadow-lg shadow-[#2E7FFF]/30 hover:bg-[#1C69E5] transition transform active:scale-95 disabled:opacity-50"
              >
                {guardando ? 'Guardando...' : 'Guardar Calificación'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Editar Nota Existente */}
      {notaEditando && (
        <div className="fixed inset-0 bg-[#0A0E17]/60 z-[100] flex items-end justify-center sm:items-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-[2.5rem] w-full max-w-sm p-8 shadow-2xl animate-in slide-in-from-bottom-full pb-10">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-[20px] font-black tracking-tight text-gray-900">Editar Nota</h3>
              <div className="flex gap-2">
                <button type="button" onClick={() => eliminarNota(notaEditando.id)} className="bg-red-50 text-red-500 rounded-full p-3 hover:bg-red-100 transition">
                  <Trash2 size={20} strokeWidth={2.5} />
                </button>
                <button type="button" onClick={() => setNotaEditando(null)} className="bg-gray-50 text-gray-400 rounded-full p-3 hover:bg-gray-100 transition">
                  <X size={20} strokeWidth={2.5} />
                </button>
              </div>
            </div>
            
            <form onSubmit={handleActualizarNota} className="space-y-5">
              <div>
                <label className="block text-[11px] uppercase tracking-widest font-bold text-gray-400 mb-2 ml-1">Asignatura</label>
                <select 
                  required
                  value={notaEditando.subject}
                  onChange={e => setNotaEditando({...notaEditando, subject: e.target.value})}
                  className="w-full bg-[#F0F4F8] border-0 rounded-2xl p-4 text-[15px] font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#2E7FFF] transition-all"
                >
                  <option value="" className="text-gray-400">Selecciona materia...</option>
                  {asignaturasDeHija.map(a => <option key={a.id} value={a.nombre}>{a.nombre}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] uppercase tracking-widest font-bold text-gray-400 mb-2 ml-1">Calificación</label>
                  <input 
                    type="number" step="0.1" min="1.0" max="7.0" required placeholder="6.5"
                    value={notaEditando.grade}
                    onChange={e => setNotaEditando({...notaEditando, grade: e.target.value})}
                    className="w-full p-4 bg-[#F0F4F8] border-0 rounded-2xl outline-none focus:ring-2 focus:ring-[#2E7FFF] font-black text-[22px] text-center text-[#2E7FFF] transition-all placeholder:text-gray-300"
                  />
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-widest font-bold text-gray-400 mb-2 ml-1">Semestre</label>
                  <select 
                    value={notaEditando.semester} onChange={e => setNotaEditando({...notaEditando, semester: parseInt(e.target.value)})}
                    className="w-full p-4 bg-[#F0F4F8] border-0 rounded-2xl outline-none focus:ring-2 focus:ring-[#2E7FFF] font-bold text-gray-900 transition-all text-center"
                  >
                    <option value={1}>1° Sem</option>
                    <option value={2}>2° Sem</option>
                  </select>
                </div>
              </div>
              
              <button 
                type="submit" 
                disabled={guardando || !notaEditando.subject || !notaEditando.grade}
                className="w-full mt-6 bg-[#2E7FFF] text-white font-bold py-4 rounded-full shadow-lg shadow-[#2E7FFF]/30 hover:bg-[#1C69E5] transition transform active:scale-95 flex justify-center items-center disabled:opacity-50"
              >
                {guardando ? 'Guardando...' : <><Save size={20} className="mr-2" /> Actualizar</>}
              </button>
            </form>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
