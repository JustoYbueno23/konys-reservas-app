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

export async function obtenerDiasConServicio() {
    const { data, error } = await supabase
        .from('horarios')
        .select('dia_semana')
        .eq('activo', true);

    if (error) throw error;

    const dias = (data || []).map((fila) => fila.dia_semana as string);
    return { data: Array.from(new Set(dias)), error: null };
}