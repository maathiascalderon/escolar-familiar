import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [profileError, setProfileError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Obtener sesión actual
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else setLoading(false);
    });

    // Escuchar cambios de estado (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        setProfileError(null);
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setProfileError(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
        
      if (data) {
        setProfile(data);
        setProfileError(null);
      } else {
        // PGRST116 = no rows found (perfil no existe pero no es error grave)
        // Otro error = problema real de permisos/RLS
        const esErrorDePermisos = error && error.code !== 'PGRST116';
        console.warn('fetchProfile:', error?.code, error?.message);
        setProfile(null);
        setProfileError(esErrorDePermisos ? 'Error de permisos al cargar el perfil. Verifica las políticas RLS en Supabase.' : null);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      setProfile(null);
      setProfileError(null); // No bloquear por errores inesperados
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email, password) => {
    return await supabase.auth.signInWithPassword({ email, password });
  };

  const signOut = async () => {
    return await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, profileError, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
