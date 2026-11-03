import { supabase } from './supabase';

export async function obtenerHorariosDia(diaSemana: string) {
    const { data, error } = await supabase
        .from('horarios')
        .select('*')
        .eq('dia_semana', diaSemana)
        .eq('activo', true);
    if (error) throw error;
    return { data: data || [], error: null };
}