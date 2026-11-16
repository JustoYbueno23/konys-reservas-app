import { supabase } from './supabase';

// Pedidos de reservas a Supabase
// Documentación: https://supabase.com/docs/reference/javascript/select
//                https://supabase.com/docs/reference/javascript/insert
//                https://supabase.com/docs/reference/javascript/rpc

export async function obtenerHorasOcupadas(mesaId: string, fecha: string) {
    const { data, error } = await supabase.rpc('horas_ocupadas', {
        p_mesa_id: mesaId,
        p_fecha: fecha,
    });

    return { data, error };
}

export async function crearReserva(reserva: {
    mesa_id: string;
    cliente_nombre: string;
    cliente_contacto?: string;
    num_personas: number;
    fecha: string;
    hora_inicio: string;
    hora_fin: string;
}) {
    const { error } = await supabase.from('reservas').insert({
        mesa_id: reserva.mesa_id,
        cliente_nombre: reserva.cliente_nombre,
        cliente_contacto: reserva.cliente_contacto ?? null,
        num_personas: reserva.num_personas,
        fecha: reserva.fecha,
        hora_inicio: reserva.hora_inicio,
        hora_fin: reserva.hora_fin,
        estado: 'confirmada',
    });

    return { error };
}

export function esReservaDuplicada(error: { code?: string } | null) {
    return error?.code === '23505';
}