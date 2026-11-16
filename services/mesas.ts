import { supabase } from './supabase';

export async function obtenerMesasActivas() {
    const { data, error } = await supabase
        .from('mesas')
        .select('*')
        .eq('activa', true);
    if (error) throw error;
    return { data: data || [], error: null };
}