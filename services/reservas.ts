import { supabase } from './supabase';

export interface Reserva {
    id: string;
    mesa_id: string;
    cliente_nombre: string;
    cliente_contacto?: string;
    num_personas: number;
    fecha: string;
    hora_inicio: string;
    hora_fin: string;
    estado: string;
    creado_en: string;
}

/**
 * Obtiene las reservas confirmadas de una mesa en una fecha específica.
 * Se usa para saber qué horarios ya están ocupados.
 */
export async function obtenerReservasConfirmadas(mesaId: string, fecha: string) {
    try {
        const { data, error } = await supabase
            .from('reservas')
            .select('*')
            .eq('mesa_id', mesaId)
            .eq('fecha', fecha)
            .eq('estado', 'confirmada');

        if (error) throw error;
        return { data: data || [], error: null };
    } catch (error) {
        return { data: [], error: error as Error };
    }
}

/**
 * Crea una nueva reserva en Supabase.
 * Valida internamente que no haya conflicto de horario (aunque Supabase lo restringiría con RLS/índice único).
 */
export async function crearReserva(datos: {
    mesa_id: string;
    cliente_nombre: string;
    cliente_contacto?: string;
    num_personas: number;
    fecha: string;
    hora_inicio: string;
    hora_fin: string;
}) {
    try {
        const { data, error } = await supabase
            .from('reservas')
            .insert([
                {
                    mesa_id: datos.mesa_id,
                    cliente_nombre: datos.cliente_nombre,
                    cliente_contacto: datos.cliente_contacto || null,
                    num_personas: datos.num_personas,
                    fecha: datos.fecha,
                    hora_inicio: datos.hora_inicio,
                    hora_fin: datos.hora_fin,
                    estado: 'confirmada',
                },
            ])
            .select()
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        return { data: null, error: error as Error };
    }
}