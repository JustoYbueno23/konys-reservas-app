import { supabase } from './supabase';

// Platos de la carta para el cliente: solo los disponibles aparecen en la app
// Documentación: https://supabase.com/docs/reference/javascript/select
export async function obtenerPlatosDisponibles() {
  const { data, error } = await supabase
    .from('platos')
    .select('*')
    .eq('disponible', true)
    .order('categoria')
    .order('precio');

  return { data, error };
}
