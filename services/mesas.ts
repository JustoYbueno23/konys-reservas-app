import { supabase } from './supabase';

// Pedidos de mesas a Supabase
// Las mesas activas (activa = true) son las que aceptan reservas
// Documentación: https://supabase.com/docs/reference/javascript/select

export async function obtenerMesasActivas() {
    const { data, error } = await supabase
        .from('mesas')
        .select('*')
        .eq('activa', true);
    if (error) throw error;
    return { data: data || [], error: null };
}