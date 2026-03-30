import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, List, Loader2, Trash2, Edit2, X, Save } from 'lucide-react';
import BottomNav from '../components/layout/BottomNav';
import CalendarGrid from '../components/CalendarGrid';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

const tipoColores = {
  'Prueba':   { bg: 'bg-[#EF7A5D]', light: 'bg-orange-50', text: 'text-[#EF7A5D]', hex: '#EF7A5D' },
  'Tarea':    { bg: 'bg-[#818CF8]', light: 'bg-indigo-50', text: 'text-[#818CF8]', hex: '#818CF8' },
  'Reunión':  { bg: 'bg-[#47B2A6]', light: 'bg-teal-50',  text: 'text-[#47B2A6]', hex: '#47B2A6' },
  'Actividad':{ bg: 'bg-[#FBBF24]', light: 'bg-yellow-50', text: 'text-yellow-600', hex: '#FBBF24' },
};

const DIAS_SEMANA_ABR = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export default function Calendario() {
  const { profile } = useAuth();
  const isHija = profile?.role === 'hija';
  const canDeleteEdit = profile?.role === 'admin' || profile?.role === 'parent';

  const [eventos, setEventos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [diaSeleccionado, setDiaSeleccionado] = useState(null); // 'YYYY-MM-DD'
  const [vistaActiva, setVistaActiva] = useState('mes'); // 'mes' | 'semana'

  // Vista semana: días scroll horizontal
  const [diasSemana, setDiasSemana] = useState([]);

  // Edición
  const [eventoEditando, setEventoEditando] = useState(null);
  const [guardandoEdicion, setGuardandoEdicion] = useState(false);

  useEffect(() => {
    async function cargar() {
      const { data } = await supabase.from('events').select('*').order('date', { ascending: true });
      if (data) {
        setEventos(data.map(ev => {
          const colores = tipoColores[ev.type] || tipoColores['Prueba'];
          return {
            id: ev.id,
            hija: ev.daughter,
            tipo: ev.type,
            titulo: ev.subject,
            descripcion: ev.description || '',
            fecha: ev.date,
            color: colores.bg,
            bgLight: colores.light,
            text: colores.text,
            hex: colores.hex,
          };
        }));
      }
      setCargando(false);
    }

    // Generar semana (hoy + 13 días)
    const hoy = new Date();
    const arr = [];
    for (let i = 0; i < 14; i++) {
      const d = new Date(hoy);
      d.setDate(hoy.getDate() + i);
      arr.push({
        etiqueta: DIAS_SEMANA_ABR[d.getDay()],
        numero: d.getDate(),
        fechaStr: d.toISOString().split('T')[0],
      });
    }
    setDiasSemana(arr);
    setDiaSeleccionado(arr[0].fechaStr);
    cargar();
  }, []);

  const handleGuardarEdicion = async (e) => {
    e.preventDefault();
    setGuardandoEdicion(true);
    const { error } = await supabase.from('events').update({
      daughter: eventoEditando.hija,
      type: eventoEditando.tipo,
      subject: eventoEditando.titulo,
      date: eventoEditando.fecha,
      description: eventoEditando.descripcion || '',
    }).eq('id', eventoEditando.id);
    if (!error) window.location.reload();
    else alert('Error: ' + error.message);
    setGuardandoEdicion(false);
  };

  // Filtrar según rol y día seleccionado
  const eventosFiltradosBase = isHija
    ? eventos.filter(e => e.hija === profile?.name)
    : eventos;

  const eventosDia = diaSeleccionado
    ? eventosFiltradosBase.filter(e => e.fecha === diaSeleccionado)
    : eventosFiltradosBase;

  // Para el CalendarGrid, pasar eventos con tipo para los puntos de color
  const eventosParaGrid = eventosFiltradosBase;

  return (
    <div className="min-h-screen bg-[#F0F4F8] pb-28 pt-10 px-5 font-sans antialiased">

      {/* Header */}
      <div className="flex justify-between items-center mb-5">
        <h1 className="text-[22px] font-black tracking-tight text-gray-900 flex items-center">
          <CalendarIcon className="mr-2.5 text-[#4D418A]" strokeWidth={2.5} size={24} /> Calendario
        </h1>
        {/* Toggle vista */}
        <div className="flex bg-white border border-gray-100 rounded-2xl p-1 shadow-sm gap-1">
          <button
            onClick={() => setVistaActiva('mes')}
            className={`px-3 py-1.5 rounded-xl text-[12px] font-bold transition-all ${vistaActiva === 'mes' ? 'bg-[#4D418A] text-white shadow' : 'text-gray-400 hover:text-gray-700'}`}
          >
            Mes
          </button>
          <button
            onClick={() => setVistaActiva('semana')}
            className={`px-3 py-1.5 rounded-xl text-[12px] font-bold transition-all ${vistaActiva === 'semana' ? 'bg-[#4D418A] text-white shadow' : 'text-gray-400 hover:text-gray-700'}`}
          >
            Semana
          </button>
        </div>
      </div>

      {/* Vista MES */}
      {vistaActiva === 'mes' && (
        <CalendarGrid
          eventos={eventosParaGrid}
          diaSeleccionado={diaSeleccionado}
          onSelectDay={setDiaSeleccionado}
        />
      )}

      {/* Vista SEMANA: scroll horizontal */}
      {vistaActiva === 'semana' && (
        <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar mb-1">
          {diasSemana.map((d) => {
            const tiene = eventosFiltradosBase.some(e => e.fecha === d.fechaStr);
            const sel = diaSeleccionado === d.fechaStr;
            return (
              <button
                key={d.fechaStr}
                onClick={() => setDiaSeleccionado(sel ? null : d.fechaStr)}
                className={`flex-shrink-0 w-14 h-20 rounded-2xl flex flex-col items-center justify-center transition-all ${sel ? 'bg-[#4D418A] shadow-lg shadow-[#4D418A]/30' : 'bg-white border border-gray-100 hover:bg-gray-50'}`}
              >
                <span className={`text-[10px] uppercase font-bold tracking-wider ${sel ? 'text-white/70' : 'text-gray-400'}`}>{d.etiqueta}</span>
                <span className={`text-[18px] font-black mt-0.5 ${sel ? 'text-white' : 'text-gray-900'}`}>{d.numero}</span>
                {tiene && (
                  <span className={`w-1.5 h-1.5 rounded-full mt-1 ${sel ? 'bg-white/70' : 'bg-[#EF7A5D]'}`} />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Lista de eventos del día seleccionado */}
      <div className="mt-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-[13px] font-bold text-gray-400 uppercase tracking-wider">
            {diaSeleccionado
              ? `Eventos · ${diaSeleccionado.split('-').reverse().join('/')}`
              : 'Todos los eventos'}
          </h2>
          {diaSeleccionado && (
            <button
              onClick={() => setDiaSeleccionado(null)}
              className="text-[12px] font-bold text-[#4D418A] bg-indigo-50 px-3 py-1 rounded-full hover:bg-indigo-100 transition"
            >
              Ver todos ×
            </button>
          )}
        </div>

        {cargando ? (
          <div className="flex justify-center py-8"><Loader2 className="animate-spin text-[#4D418A]" /></div>
        ) : eventosDia.length === 0 ? (
          <p className="text-center text-gray-400 py-8 bg-white rounded-3xl border border-gray-50 text-sm font-medium shadow-sm">
            {diaSeleccionado ? 'Sin actividades este día 🎉' : 'No hay eventos registrados.'}
          </p>
        ) : (
          eventosDia.map(evento => (
            <div key={evento.id} className="bg-white rounded-[1.75rem] p-4 shadow-sm border border-gray-50 flex items-center relative overflow-hidden">
              <div className={`absolute top-0 left-0 w-1.5 h-full ${evento.color}`} />
              <div className="ml-3 flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${evento.bgLight} ${evento.text}`}>
                    {evento.tipo}
                  </span>
                  {!isHija && (
                    <span className="text-[10px] font-bold text-gray-400">{evento.hija}</span>
                  )}
                </div>
                <h3 className="font-bold text-gray-900 text-[15px] tracking-tight">{evento.titulo}</h3>
                {evento.descripcion && (
                  <p className="text-[12px] text-gray-400 font-medium mt-0.5 line-clamp-1">{evento.descripcion}</p>
                )}
                <p className="text-[11px] font-bold text-gray-300 mt-1">{evento.fecha.split('-').reverse().join('/')}</p>
              </div>
              {canDeleteEdit && (
                <div className="flex flex-col gap-1 ml-2">
                  <button
                    onClick={() => setEventoEditando({ ...evento })}
                    className="p-2 text-gray-300 hover:text-indigo-500 hover:bg-indigo-50 rounded-xl transition"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={async () => {
                      if (confirm('¿Eliminar este evento?')) {
                        await supabase.from('events').delete().eq('id', evento.id);
                        setEventos(prev => prev.filter(e => e.id !== evento.id));
                      }
                    }}
                    className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Modal Editar */}
      {eventoEditando && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-end justify-center sm:items-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] w-full max-w-sm p-8 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-[20px] font-black tracking-tight">Editar Evento</h3>
              <button onClick={() => setEventoEditando(null)} className="p-2"><X size={20} className="text-gray-400" /></button>
            </div>
            <form onSubmit={handleGuardarEdicion} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-400">Para</label>
                <select value={eventoEditando.hija} onChange={e => setEventoEditando({...eventoEditando, hija: e.target.value})} className="w-full mt-1 p-3 bg-gray-50 rounded-2xl font-bold text-gray-900">
                  <option>Florencia</option><option>Pía</option><option>Francisca</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400">Tipo</label>
                <select value={eventoEditando.tipo} onChange={e => setEventoEditando({...eventoEditando, tipo: e.target.value})} className="w-full mt-1 p-3 bg-gray-50 rounded-2xl font-bold text-gray-900">
                  <option>Prueba</option><option>Tarea</option><option>Reunión</option><option>Actividad</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400">Fecha</label>
                <input type="date" value={eventoEditando.fecha} onChange={e => setEventoEditando({...eventoEditando, fecha: e.target.value})} className="w-full mt-1 p-3 bg-gray-50 rounded-2xl" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400">Título</label>
                <input type="text" value={eventoEditando.titulo} onChange={e => setEventoEditando({...eventoEditando, titulo: e.target.value})} className="w-full mt-1 p-3 bg-gray-50 rounded-2xl" />
              </div>
              <button disabled={guardandoEdicion} className="w-full bg-indigo-600 text-white font-bold py-4 rounded-full flex justify-center items-center active:scale-95 transition">
                {guardandoEdicion ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5 mr-2" />Guardar</>}
              </button>
            </form>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
