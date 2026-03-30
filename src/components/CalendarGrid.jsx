import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const tipoColores = {
  'Prueba':   '#EF7A5D',
  'Tarea':    '#818CF8',
  'Reunión':  '#47B2A6',
  'Actividad':'#FBBF24',
};

const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

/**
 * CalendarGrid - Calendario mensual reutilizable
 * @param {Array} eventos - [{fecha: 'YYYY-MM-DD', tipo: string, titulo: string, hija: string}]
 * @param {string|null} diaSeleccionado - 'YYYY-MM-DD' o null
 * @param {Function} onSelectDay - (fechaStr) => void
 */
export default function CalendarGrid({ eventos = [], diaSeleccionado, onSelectDay }) {
  const hoy = new Date();
  const [año, setAño] = useState(hoy.getFullYear());
  const [mes, setMes] = useState(hoy.getMonth()); // 0-indexed

  const primerDia = new Date(año, mes, 1);
  const ultimoDia = new Date(año, mes + 1, 0);

  // lunes=0 ... domingo=6 (ajustamos el domingo europeo)
  const offsetInicio = (primerDia.getDay() + 6) % 7;
  const totalDias = ultimoDia.getDate();

  // Construir grid de celdas (null = hueco)
  const celdas = Array(offsetInicio).fill(null);
  for (let d = 1; d <= totalDias; d++) celdas.push(d);
  while (celdas.length % 7 !== 0) celdas.push(null);

  const mesNombres = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                      'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

  const mesAnterior = () => {
    if (mes === 0) { setMes(11); setAño(a => a - 1); }
    else setMes(m => m - 1);
  };
  const mesSiguiente = () => {
    if (mes === 11) { setMes(0); setAño(a => a + 1); }
    else setMes(m => m + 1);
  };

  // Agrupar eventos por fecha
  const eventosPorFecha = {};
  eventos.forEach(ev => {
    if (!eventosPorFecha[ev.fecha]) eventosPorFecha[ev.fecha] = [];
    eventosPorFecha[ev.fecha].push(ev);
  });

  const fechaStr = (dia) => {
    if (!dia) return null;
    return `${año}-${String(mes + 1).padStart(2,'0')}-${String(dia).padStart(2,'0')}`;
  };

  const esHoy = (dia) => {
    return dia === hoy.getDate() && mes === hoy.getMonth() && año === hoy.getFullYear();
  };

  const esSeleccionado = (dia) => diaSeleccionado === fechaStr(dia);

  return (
    <div className="bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-50 overflow-hidden">
      {/* Header navegación mes */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
        <button onClick={mesAnterior} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition text-gray-500">
          <ChevronLeft size={20} />
        </button>
        <div className="text-center">
          <p className="text-[15px] font-black text-gray-900 tracking-tight">{mesNombres[mes]}</p>
          <p className="text-[11px] font-bold text-gray-400">{año}</p>
        </div>
        <button onClick={mesSiguiente} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition text-gray-500">
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Cabecera días de la semana */}
      <div className="grid grid-cols-7 px-2 pt-3 pb-1">
        {DIAS_SEMANA.map(d => (
          <div key={d} className="text-center text-[10px] font-bold text-gray-400 uppercase tracking-wider py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Grid de días */}
      <div className="grid grid-cols-7 px-2 pb-3 gap-y-1">
        {celdas.map((dia, i) => {
          const fecha = fechaStr(dia);
          const evsDia = dia ? (eventosPorFecha[fecha] || []) : [];
          const seleccionado = dia && esSeleccionado(dia);
          const today = dia && esHoy(dia);

          return (
            <button
              key={i}
              disabled={!dia}
              onClick={() => dia && onSelectDay && onSelectDay(seleccionado ? null : fecha)}
              className={`
                flex flex-col items-center justify-start pt-1 pb-1.5 rounded-xl transition-all
                ${!dia ? 'opacity-0 pointer-events-none' : ''}
                ${seleccionado ? 'bg-[#4D418A] shadow-md shadow-[#4D418A]/30' : today ? 'bg-indigo-50' : 'hover:bg-gray-50'}
              `}
            >
              <span className={`text-[14px] font-bold leading-snug
                ${seleccionado ? 'text-white' : today ? 'text-[#4D418A]' : 'text-gray-800'}
              `}>
                {dia}
              </span>
              {/* Puntos de eventos (máx 3) */}
              <div className="flex gap-0.5 mt-0.5 h-2 items-center">
                {evsDia.slice(0, 3).map((ev, j) => (
                  <span
                    key={j}
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: seleccionado ? 'rgba(255,255,255,0.8)' : (tipoColores[ev.tipo] || '#818CF8') }}
                  />
                ))}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
