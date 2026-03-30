import { useState, useEffect } from 'react';
import { Bell, BookOpen, FileText, ChevronRight, Loader2, LogOut } from 'lucide-react';

import BottomNav from '../components/layout/BottomNav';
import CalendarGrid from '../components/CalendarGrid';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const MOCK_DATA = {
  hijas: [
    { id: 0, nombre: 'Todas',     curso: 'Visión General',  gradient: 'from-[#4D418A] to-[#6858BA]' },
    { id: 1, nombre: 'Florencia', curso: '3° Medio',        gradient: 'from-[#7A52B8] to-[#996DE0]' },
    { id: 2, nombre: 'Pía',       curso: '1° Medio',        gradient: 'from-[#EF7A5D] to-[#F39C86]' },
    { id: 3, nombre: 'Francisca', curso: '6° Básico',       gradient: 'from-[#47B2A6] to-[#62D3C6]' },
  ]
};

const tipoColores = {
  'Prueba':    'bg-[#EF7A5D]',
  'Tarea':     'bg-[#818CF8]',
  'Reunión':   'bg-[#47B2A6]',
  'Actividad': 'bg-[#FBBF24]',
};

const solicitarNotificaciones = async () => {
  if (!("Notification" in window)) {
    alert("Este navegador no soporta notificaciones de escritorio o móviles.");
    return;
  }
  
  if (Notification.permission === "granted") {
    new Notification("Notificaciones Activas", {
      body: "Ya recibirás alertas para los eventos programados.",
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
    alert("Bloqueaste las notificaciones. Debes activarlas en la configuración del navegador (el candado en la barra de direcciones).");
  }
};


// ─────────────────────────────────────────────
// Vista normal (admin / parent)
// ─────────────────────────────────────────────
function DashboardAdmin({ profile, eventosBD, cargando }) {
  const [selectedHijaId, setSelectedHijaId] = useState(0);

  const eventosActivos = eventosBD.map(ev => ({
    id: ev.id,
    hijaId: MOCK_DATA.hijas.find(h => h.nombre === ev.daughter)?.id || 0,
    hijaNombre: ev.daughter,
    tipo: ev.type,
    titulo: ev.subject,
    descripcion: ev.description || '',
    fecha: ev.date,
    color: tipoColores[ev.type] || 'bg-gray-500',
  }));

  const eventosFiltrados = selectedHijaId === 0
    ? eventosActivos
    : eventosActivos.filter(e => e.hijaId === selectedHijaId);

  const proximoEvento = eventosFiltrados.length > 0 ? eventosFiltrados[0] : null;

  return (
    <div className="min-h-screen bg-[#F0F4F8] pb-36 font-sans antialiased text-gray-900">

      {/* Header */}
      <div className="pt-14 px-6 mb-8 flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <div className="w-12 h-12 rounded-2xl overflow-hidden mr-4 shadow-sm border-2 border-white">
              <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.name || 'U')}&background=4D418A&color=fff`} alt="Profile" className="w-full h-full object-cover" />
            </div>
            <div>
              <p className="text-gray-400 text-[11px] font-bold uppercase tracking-widest leading-none mb-1">Bienvenido</p>
              <h2 className="text-[18px] font-black tracking-tight text-gray-900">{profile?.name || 'Usuario'}</h2>
            </div>
          </div>
          <button 
            onClick={solicitarNotificaciones}
            className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-sm text-gray-400 hover:text-indigo-500 transition-colors relative border border-gray-50"
            title="Activar notificaciones"
          >
            <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-red-500 rounded-full border-2 border-white"></span>
            <Bell size={18} strokeWidth={2.5} />
          </button>
        </div>

        {/* Próximo evento */}
        <div className="bg-white rounded-[2.5rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-white flex justify-between items-center relative overflow-hidden">
          {proximoEvento && <div className={`absolute top-0 left-0 w-2 h-full ${proximoEvento.color}`} />}
          <div>
            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1.5">Actividad más próxima</p>
            <h3 className="text-[16px] font-black text-gray-900 tracking-tight leading-tight">{proximoEvento ? proximoEvento.titulo : 'Sin eventos próximos'}</h3>
            {proximoEvento && <p className="text-[12px] font-bold text-gray-400 mt-1 uppercase tracking-wider">{proximoEvento.hijaNombre} • {proximoEvento.fecha.split('-').reverse().join('/')}</p>}
          </div>
          <Link to="/calendario" className="bg-indigo-50 text-indigo-500 w-12 h-12 rounded-2xl flex flex-shrink-0 items-center justify-center ml-4 hover:bg-indigo-100 transition">
            <ChevronRight size={20} strokeWidth={2.5} />
          </Link>
        </div>
      </div>

      {/* Selector hijas */}
      <div className="px-6 mb-8">
        <div className="flex space-x-3 overflow-x-auto hide-scrollbar pb-2">
          {MOCK_DATA.hijas.map(hija => (
            <button
              key={hija.id}
              onClick={() => setSelectedHijaId(hija.id)}
              className={`flex-shrink-0 px-6 py-3 rounded-full text-[14px] font-bold transition-all duration-300 ${selectedHijaId === hija.id ? 'bg-gray-900 text-white shadow-lg shadow-gray-900/20' : 'bg-white text-gray-500 shadow-sm border border-gray-100'}`}
            >
              {hija.nombre}
            </button>
          ))}
        </div>
      </div>

      {/* Recordatorios */}
      <div className="px-6 space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-gray-400 font-bold text-[13px] uppercase tracking-wider">Recordatorios</h2>
          <Link to="/calendario" className="text-[13px] font-bold text-gray-900 flex items-center hover:opacity-70 transition-opacity">
            Ver todos <ChevronRight size={14} className="ml-1" />
          </Link>
        </div>

        {cargando ? (
          <div className="flex justify-center py-10"><Loader2 className="animate-spin text-gray-400" /></div>
        ) : eventosFiltrados.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-6 bg-white rounded-3xl shadow-sm border border-gray-100">No hay recordatorios pendientes.</p>
        ) : (
          eventosFiltrados.slice(0, 3).map(evento => (
            <div key={evento.id} className="bg-white rounded-[2.5rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 relative overflow-hidden">
              <div className="flex items-center mb-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mr-4 ${evento.tipo === 'Prueba' ? 'bg-red-50 text-red-500' : 'bg-indigo-50 text-indigo-500'}`}>
                  {evento.tipo === 'Prueba' ? <FileText size={22} /> : <BookOpen size={22} />}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-[16px] tracking-tight">{evento.titulo}</h3>
                  <p className="text-gray-500 text-[12px] font-medium mt-0.5">{evento.descripcion || 'Sin descripción'}</p>
                </div>
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div>
                  <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1">Fecha</p>
                  <p className="text-[14px] font-black text-gray-900">{evento.fecha.split('-').reverse().join(' / ')}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1">Para</p>
                  <p className="text-[14px] font-black text-gray-900">{evento.hijaNombre}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <BottomNav />
    </div>
  );
}

// ─────────────────────────────────────────────
// Vista Florencia (hija): Inicio + Calendario integrado
// ─────────────────────────────────────────────
function DashboardHija({ profile, eventosBD, cargando, signOut }) {
  const [diaSeleccionado, setDiaSeleccionado] = useState(null);
  const [vistaActiva, setVistaActiva] = useState('mes');
  const hoy = new Date().toISOString().split('T')[0];

  // Días para vista semana
  const diasSemana = (() => {
    const ABR = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
    return Array.from({ length: 14 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() + i);
      return { etiqueta: ABR[d.getDay()], numero: d.getDate(), fechaStr: d.toISOString().split('T')[0] };
    });
  })();

  // Solo eventos de Florencia
  const misEventos = eventosBD
    .filter(ev => ev.daughter === profile?.name)
    .map(ev => ({
      id: ev.id,
      hija: ev.daughter,
      tipo: ev.type,
      titulo: ev.subject,
      descripcion: ev.description || '',
      fecha: ev.date,
      color: tipoColores[ev.type] || 'bg-gray-500',
    }));

  const proximoEvento = misEventos.find(e => e.fecha >= hoy) || null;

  const eventosDia = diaSeleccionado
    ? misEventos.filter(e => e.fecha === diaSeleccionado)
    : misEventos.filter(e => e.fecha >= hoy).slice(0, 5);

  // Para CalendarGrid pasamos {fecha, tipo}
  const eventosGrid = misEventos.map(ev => ({ fecha: ev.fecha, tipo: ev.tipo }));

  return (
    <div className="min-h-screen bg-[#F0F4F8] pb-28 font-sans antialiased text-gray-900">

      {/* Header */}
      <div className="pt-12 px-6 mb-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <div className="w-12 h-12 rounded-2xl overflow-hidden mr-4 shadow-sm border-2 border-white">
              <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.name || 'F')}&background=7A52B8&color=fff`} alt="Profile" className="w-full h-full object-cover" />
            </div>
            <div>
              <p className="text-gray-400 text-[11px] font-bold uppercase tracking-widest leading-none mb-1">Hola 👋</p>
              <h2 className="text-[20px] font-black tracking-tight text-gray-900">{profile?.name}</h2>
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={solicitarNotificaciones}
              className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-sm text-gray-400 hover:text-indigo-500 transition-colors relative border border-gray-50"
              title="Activar notificaciones"
            >
              <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-red-500 rounded-full border-2 border-white"></span>
              <Bell size={18} strokeWidth={2.5} />
            </button>
            <button
              onClick={signOut}
              className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-sm text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors border border-gray-50"
              title="Cerrar sesión"
            >
              <LogOut size={18} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* Próxima actividad */}
        <div className="bg-white rounded-[2rem] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white relative overflow-hidden flex items-center gap-4">
          {proximoEvento && <div className={`absolute top-0 left-0 w-1.5 h-full ${proximoEvento.color}`} />}
          <div className="ml-1 flex-1">
            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1">Actividad más próxima</p>
            <h3 className="text-[15px] font-black text-gray-900 tracking-tight">
              {proximoEvento ? proximoEvento.titulo : 'Sin eventos próximos 🎉'}
            </h3>
            {proximoEvento && (
              <p className="text-[11px] font-bold text-gray-400 mt-0.5 uppercase tracking-wider">
                {proximoEvento.tipo} · {proximoEvento.fecha.split('-').reverse().join('/')}
              </p>
            )}
          </div>
          <div className={`w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center ${proximoEvento ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-500'}`}>
            {proximoEvento ? <FileText size={18} /> : <BookOpen size={18} />}
          </div>
        </div>
      </div>

      {/* Calendario con toggle */}
      <div className="px-6 mb-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[13px] font-bold text-gray-400 uppercase tracking-wider">Mi Calendario</h2>
          <div className="flex bg-white border border-gray-100 rounded-2xl p-1 shadow-sm gap-1">
            <button
              onClick={() => setVistaActiva('mes')}
              className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-all ${vistaActiva === 'mes' ? 'bg-[#7A52B8] text-white shadow' : 'text-gray-400'}`}
            >Mes</button>
            <button
              onClick={() => setVistaActiva('semana')}
              className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-all ${vistaActiva === 'semana' ? 'bg-[#7A52B8] text-white shadow' : 'text-gray-400'}`}
            >Semana</button>
          </div>
        </div>

        {cargando ? (
          <div className="flex justify-center py-6"><Loader2 className="animate-spin text-[#7A52B8]" /></div>
        ) : vistaActiva === 'mes' ? (
          <CalendarGrid
            eventos={eventosGrid}
            diaSeleccionado={diaSeleccionado}
            onSelectDay={(fecha) => setDiaSeleccionado(prev => prev === fecha ? null : fecha)}
          />
        ) : (
          <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
            {diasSemana.map((d) => {
              const tiene = misEventos.some(e => e.fecha === d.fechaStr);
              const sel = diaSeleccionado === d.fechaStr;
              return (
                <button
                  key={d.fechaStr}
                  onClick={() => setDiaSeleccionado(sel ? null : d.fechaStr)}
                  className={`flex-shrink-0 w-14 h-20 rounded-2xl flex flex-col items-center justify-center transition-all ${
                    sel ? 'bg-[#7A52B8] shadow-lg shadow-[#7A52B8]/30' : 'bg-white border border-gray-100 hover:bg-gray-50'
                  }`}
                >
                  <span className={`text-[10px] uppercase font-bold tracking-wider ${sel ? 'text-white/70' : 'text-gray-400'}`}>{d.etiqueta}</span>
                  <span className={`text-[18px] font-black mt-0.5 ${sel ? 'text-white' : 'text-gray-900'}`}>{d.numero}</span>
                  {tiene && <span className={`w-1.5 h-1.5 rounded-full mt-1 ${sel ? 'bg-white/70' : 'bg-[#EF7A5D]'}`} />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Lista de eventos */}
      <div className="px-6 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-[13px] font-bold text-gray-400 uppercase tracking-wider">
            {diaSeleccionado
              ? `Eventos · ${diaSeleccionado.split('-').reverse().join('/')}`
              : 'Próximos eventos'}
          </h2>
          {diaSeleccionado && (
            <button
              onClick={() => setDiaSeleccionado(null)}
              className="text-[12px] font-bold text-[#7A52B8] bg-purple-50 px-3 py-1 rounded-full hover:bg-purple-100 transition"
            >
              Ver todos ×
            </button>
          )}
        </div>

        {cargando ? null : eventosDia.length === 0 ? (
          <p className="text-center text-gray-400 py-6 bg-white rounded-3xl text-sm font-medium shadow-sm border border-gray-50">
            {diaSeleccionado ? 'Sin actividades este día 🎉' : 'No tienes eventos próximos.'}
          </p>
        ) : (
          eventosDia.map(ev => (
            <div key={ev.id} className="bg-white rounded-[1.5rem] p-4 shadow-sm border border-gray-50 flex items-center relative overflow-hidden">
              <div className={`absolute top-0 left-0 w-1.5 h-full ${ev.color}`} />
              <div className="ml-3 flex-1">
                <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full inline-block mb-1 ${
                  ev.tipo === 'Prueba' ? 'bg-orange-50 text-[#EF7A5D]' :
                  ev.tipo === 'Tarea'  ? 'bg-indigo-50 text-[#818CF8]' :
                  ev.tipo === 'Reunión'? 'bg-teal-50 text-[#47B2A6]'  :
                  'bg-yellow-50 text-yellow-600'
                }`}>{ev.tipo}</span>
                <h4 className="font-bold text-gray-900 text-[15px]">{ev.titulo}</h4>
                <p className="text-[11px] font-bold text-gray-300 mt-0.5">{ev.fecha.split('-').reverse().join('/')}</p>
              </div>
              <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
            </div>
          ))
        )}
      </div>

      <BottomNav />
    </div>
  );
}

// ─────────────────────────────────────────────
// Dashboard principal — decide qué vista mostrar
// ─────────────────────────────────────────────
export default function Dashboard() {
  const { profile, signOut } = useAuth();
  const isHija = profile?.role === 'hija';

  const [eventosBD, setEventosBD] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function cargarEventos() {
      const { data } = await supabase
        .from('events')
        .select('*')
        .order('date', { ascending: true });
      if (data) setEventosBD(data);
      setCargando(false);
    }
    cargarEventos();
  }, []);

  if (isHija) {
    return <DashboardHija profile={profile} eventosBD={eventosBD} cargando={cargando} signOut={signOut} />;
  }

  return <DashboardAdmin profile={profile} eventosBD={eventosBD} cargando={cargando} />;
}
