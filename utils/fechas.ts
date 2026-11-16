const DIAS = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];

export function fechaATexto(fecha: Date): string {
    const año = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    return `${año}-${mes}-${dia}`;
}

export function textoAFecha(texto: string): Date {
    const [año, mes, dia] = texto.split('-').map(Number);
    return new Date(año, mes - 1, dia);
}

export function nombreDia(fecha: Date): string {
    return DIAS[fecha.getDay()];
}

export function proximosDias(cantidad: number): Date[] {
    const lista: Date[] = [];
    for (let i = 0; i < cantidad; i++) {
        const dia = new Date();
        dia.setDate(dia.getDate() + i);
        lista.push(dia);
    }
    return lista;
}

export function quitarSegundos(hora: string): string {
    return hora.slice(0, 5);
}

export function horaAMinutos(hora: string): number {
    const [horas, minutos] = hora.split(':').map(Number);
    return horas * 60 + minutos;
}

export function minutosAHora(minutos: number): string {
    const horas = String(Math.floor(minutos / 60)).padStart(2, '0');
    const resto = String(minutos % 60).padStart(2, '0');
    return `${horas}:${resto}`;
}

export function generarFranjas(horaInicio: string, horaFin: string, duracionMinutos: number): string[] {
    const franjas: string[] = [];
    const inicio = horaAMinutos(quitarSegundos(horaInicio));
    const fin = horaAMinutos(quitarSegundos(horaFin));

    for (let m = inicio; m + duracionMinutos <= fin; m += duracionMinutos) {
        franjas.push(minutosAHora(m));
    }
    return franjas;
}

export function franjaOcupada(
    horaInicio: string,
    duracionMinutos: number,
    ocupadas: { hora_inicio: string; hora_fin: string }[]
): boolean {
    const inicio = horaAMinutos(horaInicio);
    const fin = inicio + duracionMinutos;

    for (const o of ocupadas) {
        const ocupadaInicio = horaAMinutos(quitarSegundos(o.hora_inicio));
        const ocupadaFin = horaAMinutos(quitarSegundos(o.hora_fin));
        if (inicio < ocupadaFin && fin > ocupadaInicio) {
            return true;
        }
    }
    return false;
}

export function franjaPasada(fechaTexto: string, horaInicio: string): boolean {
    if (fechaTexto !== fechaATexto(new Date())) {
        return false;
    }
    const ahora = new Date();
    const minutosAhora = ahora.getHours() * 60 + ahora.getMinutes();
    return horaAMinutos(horaInicio) <= minutosAhora;
}

export const DIAS_CORTOS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
export const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

export function formatoFechaLarga(fechaTexto: string): string {
    const [a, m, d] = fechaTexto.split('-').map(Number);
    const dia = DIAS_CORTOS[new Date(a, m - 1, d).getDay()];
    return `${dia} ${d} ${MESES[m - 1]}`;
}
