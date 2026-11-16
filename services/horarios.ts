import { supabase } from './supabase';

// Pedidos de horarios a Supabase
// La tabla horarios guarda las jornadas (almuerzo y noche) de cada día de la semana
// Documentación: https://supabase.com/docs/reference/javascript/select

export async function obtenerHorariosDia(diaSemana: string) {
    const { data, error } = await supabase
        .from('horarios')
        .select('*')
        .eq('dia_semana', diaSemana)
        .eq('activo', true);
    if (error) throw error;
    return { data: data || [], error: null };
}

// Devuelve los días de la semana que tienen horario activo (ej: "lunes", "martes")
export async function obtenerDiasConServicio() {
    const { data, error } = await supabase
        .from('horarios')
        .select('dia_semana')
        .eq('activo', true);

    if (error) throw error;

    const dias = (data || []).map((fila) => fila.dia_semana as string);
    return { data: Array.from(new Set(dias)), error: null };
}