// ---------------------------------------------------------------
// Utilidades de fecha y hora
// ---------------------------------------------------------------
// Convención del proyecto:
//   - Fechas como texto "AAAA-MM-DD"  (ej: "2026-11-10")
//   - Horas como texto "HH:MM"        (ej: "19:00")
// La base de datos devuelve "19:00:00": hay que quitarle los segundos.

// getDay() de JavaScript devuelve 0 para domingo.
// Estos nombres son los mismos que guardas en la tabla horarios (sin tildes).
const DIAS = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];

// ---------------------------------------------------------------
// FECHAS
// ---------------------------------------------------------------

// Date -> "AAAA-MM-DD" usando la fecha LOCAL.
// No uses toISOString(): trabaja en UTC y de noche en Colombia daría el día siguiente.
export function fechaATexto(fecha: Date): string {
    const año = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    return `${año}-${mes}-${dia}`;
}

// "AAAA-MM-DD" -> Date local.
// No uses new Date("2026-11-10"): lo interpreta como UTC y puede mostrar el día anterior.
export function textoAFecha(texto: string): Date {
    const [año, mes, dia] = texto.split('-').map(Number);
    return new Date(año, mes - 1, dia);
}

// Date -> nombre del día como está en la tabla horarios ("lunes", "miercoles"...)
export function nombreDia(fecha: Date): string {
    return DIAS[fecha.getDay()];
}

// Lista de los próximos días, empezando hoy.
// Ejemplo: proximosDias(14) devuelve hoy y los 13 días siguientes.
export function proximosDias(cantidad: number): Date[] {
    const lista: Date[] = [];
    for (let i = 0; i < cantidad; i++) {
        const dia = new Date();
        dia.setDate(dia.getDate() + i);
        lista.push(dia);
    }
    return lista;
}

// ---------------------------------------------------------------
// HORAS
// ---------------------------------------------------------------

// "19:00:00" -> "19:00"
export function quitarSegundos(hora: string): string {
    return hora.slice(0, 5);
}

// "19:30" -> 1170  (minutos desde la medianoche, para poder sumar y comparar)
export function horaAMinutos(hora: string): number {
    const [horas, minutos] = hora.split(':').map(Number);
    return horas * 60 + minutos;
}

// 1170 -> "19:30"
export function minutosAHora(minutos: number): string {
    const horas = String(Math.floor(minutos / 60)).padStart(2, '0');
    const resto = String(minutos % 60).padStart(2, '0');
    return `${horas}:${resto}`;
}

// ---------------------------------------------------------------
// FRANJAS
// ---------------------------------------------------------------

// Genera las horas de inicio posibles dentro de una jornada.
// Una franja solo cuenta si TERMINA antes o justo en la hora de cierre.
//   generarFranjas('12:30', '14:30', 60) -> ['12:30', '13:30']
//   generarFranjas('17:00', '23:00', 60) -> ['17:00', '18:00', '19:00', '20:00', '21:00', '22:00']
export function generarFranjas(horaInicio: string, horaFin: string, duracionMinutos: number): string[] {
    const franjas: string[] = [];
    const inicio = horaAMinutos(quitarSegundos(horaInicio));
    const fin = horaAMinutos(quitarSegundos(horaFin));

    for (let m = inicio; m + duracionMinutos <= fin; m += duracionMinutos) {
        franjas.push(minutosAHora(m));
    }
    return franjas;
}

// ¿Esta franja choca con alguna hora ocupada?
// `ocupadas` es lo que devuelve obtenerHorasOcupadas: [{ hora_inicio, hora_fin }]
// Dos rangos chocan cuando el inicio de uno es anterior al fin del otro, y viceversa.
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

// Si la fecha elegida es hoy, ¿esta franja ya pasó?
// Devuelve false para cualquier otro día.
export function franjaPasada(fechaTexto: string, horaInicio: string): boolean {
    if (fechaTexto !== fechaATexto(new Date())) {
        return false;
    }
    const ahora = new Date();
    const minutosAhora = ahora.getHours() * 60 + ahora.getMinutes();
    return horaAMinutos(horaInicio) <= minutosAhora;
}
