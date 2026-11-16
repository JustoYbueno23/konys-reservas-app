import { supabase } from './supabase';

export async function obtenerPlatosDisponibles() {
  const { data, error } = await supabase
    .from('platos')
    .select('*')
    .eq('disponible', true)
    .order('categoria')
    .order('precio');

  return { data, error };
}
