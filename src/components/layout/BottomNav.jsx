import { Home, Calendar, PlusCircle, BookOpen, User } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function BottomNav() {
  const location = useLocation();
  const currentPath = location.pathname;
  const { profile } = useAuth();

  const isHija = profile?.role === 'hija';

  const navItems = [
    { name: 'Inicio', path: '/', icon: Home },
    ...(!isHija ? [{ name: 'Calendario', path: '/calendario', icon: Calendar }] : []),
    { name: 'Agregar', path: '/agregar', icon: PlusCircle, isMain: true },
    { name: 'Notas', path: '/notas', icon: BookOpen },
    ...(profile?.role === 'admin' || profile?.role === 'parent' ? [{ name: 'Ajustes', path: '/ajustes', icon: User }] : []),
  ];

  return (
    <nav className="fixed bottom-6 left-6 right-6 bg-white/90 backdrop-blur-xl rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-white flex justify-between items-center px-4 py-3 z-50 transition-all">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = currentPath === item.path;

        if (item.isMain) {
          return (
            <Link 
              key={item.name} 
              to={item.path} 
              className="bg-[#2E7FFF] hover:bg-[#1C69E5] text-white p-4 rounded-full shadow-lg transform -translate-y-6 shadow-[#2E7FFF]/40 transition-transform hover:scale-105 active:scale-95"
            >
              <Icon size={26} strokeWidth={2.5} />
            </Link>
          );
        }

        return (
          <Link 
            key={item.name} 
            to={item.path} 
            className={`flex items-center justify-center p-3 rounded-full transition-all duration-300 ${isActive ? 'bg-[#4375F1] text-white w-auto px-4 shadow-[0_4px_15px_rgba(67,117,241,0.3)]' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <Icon size={20} className={isActive ? 'mr-1.5' : ''} strokeWidth={isActive ? 2.5 : 2} />
            {isActive && <span className="text-[12px] font-bold tracking-tight">{item.name}</span>}
          </Link>
        );
      })}
    </nav>
  );
}
