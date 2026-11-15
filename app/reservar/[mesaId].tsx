import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { obtenerHorariosDia } from '../../services/horarios';
import { obtenerMesasActivas } from '../../services/mesas';
import { obtenerHorasOcupadas } from '../../services/reservas';
import {
  fechaATexto,
  franjaOcupada,
  franjaPasada,
  generarFranjas,
  horaAMinutos,
  minutosAHora,
  nombreDia,
  proximosDias,
  textoAFecha,
} from '../../utils/fechas';

export const options = {
  headerShown: false,
};

const FONDO = require('../../assets/images/FondoReservarMesa.png');

const DIAS_ANTICIPACION = 14;
const DIAS_CORTOS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const NOMBRE_ZONA: Record<string, string> = { terraza: 'Terraza', salon: 'Salón' };

type Mesa = { id: string; nombre: string; zona: string; capacidad: number };
type Horario = {
  id: string;
  jornada: string;
  hora_inicio: string;
  hora_fin: string;
  duracion_slot: number;
};
type HoraOcupada = { hora_inicio: string; hora_fin: string };
type HoraElegida = { inicio: string; duracion: number };

const EMOJI_JORNADA: Record<string, string> = {
  almuerzo: '🍽️',
  desayuno: '☕',
  tarde: '🥪',
  noche: '🌙',
};

export default function DiaYHora() {
  const router = useRouter();
  const { mesaId } = useLocalSearchParams<{ mesaId: string }>();

  const [mesa, setMesa] = useState<Mesa | null>(null);
  const [fecha, setFecha] = useState(fechaATexto(new Date()));
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [ocupadas, setOcupadas] = useState<HoraOcupada[]>([]);
  const [horaElegida, setHoraElegida] = useState<HoraElegida | null>(null);
  const [personas, setPersonas] = useState(1);
  const [cargandoDia, setCargandoDia] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [intento, setIntento] = useState(0);

  // 1) Cargar la mesa elegida
  useEffect(() => {
    let activo = true;
    async function cargarMesa() {
      try {
        const { data } = await obtenerMesasActivas();
        const encontrada = data.find((m: Mesa) => m.id === mesaId);
        if (!activo) return;
        if (!encontrada) {
          setError('No encontramos esa mesa.');
          return;
        }
        setMesa(encontrada);
        setPersonas(Math.min(2, encontrada.capacidad));
      } catch (e) {
        if (activo) setError('No se pudo cargar la mesa. Revisa tu conexión.');
      }
    }
    cargarMesa();
    return () => {
      activo = false;
    };
  }, [mesaId, intento]);

  // 2) Cargar horarios y horas ocupadas al cambiar el día
  useEffect(() => {
    let activo = true;
    async function cargarDia() {
      setCargandoDia(true);
      setHoraElegida(null);
      try {
        const dia = nombreDia(textoAFecha(fecha));
        const { data: horariosDia } = await obtenerHorariosDia(dia);
        const { data: horasOcupadas, error: errorOcupadas } = await obtenerHorasOcupadas(
          mesaId,
          fecha
        );
        if (errorOcupadas) throw errorOcupadas;
        if (!activo) return;
        const ordenados = [...horariosDia].sort((a: Horario, b: Horario) =>
          a.hora_inicio.localeCompare(b.hora_inicio)
        );
        setHorarios(ordenados);
        setOcupadas(horasOcupadas);
      } catch (e) {
        if (activo) setError('No se pudieron cargar los horarios. Revisa tu conexión.');
      }
      if (activo) setCargandoDia(false);
    }
    cargarDia();
    return () => {
      activo = false;
    };
  }, [mesaId, fecha, intento]);

  function reintentar() {
    setError(null);
    setIntento(intento + 1);
  }

  function continuar() {
    if (!horaElegida || !mesa) return;
    const horaFin = minutosAHora(horaAMinutos(horaElegida.inicio) + horaElegida.duracion);
    router.push({
      pathname: '/reservar/confirmacion',
      params: {
        mesaId: mesa.id,
        fecha,
        horaInicio: horaElegida.inicio,
        horaFin,
        personas: String(personas),
      },
    });
  }

  const bloques = horarios.map((h) => ({
    id: h.id,
    titulo: h.jornada.charAt(0).toUpperCase() + h.jornada.slice(1),
    duracion: h.duracion_slot,
    emoji: EMOJI_JORNADA[h.jornada.toLowerCase()] ?? '🕐',
    franjas: generarFranjas(h.hora_inicio, h.hora_fin, h.duracion_slot).map((hora) => ({
      hora,
      libre: !franjaOcupada(hora, h.duracion_slot, ocupadas) && !franjaPasada(fecha, hora),
    })),
  }));
  const hayLibres = bloques.some((b) => b.franjas.some((f) => f.libre));

  const dias = proximosDias(DIAS_ANTICIPACION);

  return (
    <ImageBackground source={FONDO} style={styles.fondo} resizeMode="cover">
      <View style={styles.overlay} pointerEvents="none" />

      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Barra superior */}
          <View style={styles.barraSuperior}>
            <Pressable style={styles.botonBarra} onPress={() => router.back()}>
              <Text style={styles.textoBarra}>‹ Volver</Text>
            </Pressable>
          </View>

          {/* Encabezado */}
          <Text style={styles.titulo}>Día y hora</Text>
          {mesa && (
            <View style={styles.mesaCard}>
              <View style={styles.mesaCirculo}>
                <Text style={styles.mesaCirculoTexto}>
                  {(mesa.nombre?.replace(/\D/g, '') || '·').slice(0, 3)}
                </Text>
              </View>
              <View style={styles.mesaTextos}>
                <Text style={styles.mesaNombre}>{mesa.nombre}</Text>
                <Text style={styles.mesaDetalle}>
                  {NOMBRE_ZONA[mesa.zona] ?? mesa.zona} · hasta {mesa.capacidad} personas
                </Text>
              </View>
            </View>
          )}

          {error && (
            <View style={styles.mensajeCaja}>
              <View style={styles.mensajeCard}>
                <Text style={styles.mensajeTexto}>{error}</Text>
                <Pressable style={styles.botonClaro} onPress={reintentar}>
                  <Text style={styles.textoBotonClaro}>Reintentar</Text>
                </Pressable>
              </View>
            </View>
          )}

          {!error && !mesa && (
            <ActivityIndicator size="large" color="#F28C28" style={styles.cargando} />
          )}

          {!error && mesa && (
            <>
              {/* Días */}
              <Text style={styles.etiqueta}>Elige el día</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.diasScroll}
                contentContainerStyle={styles.filaDias}
              >
                {dias.map((d, i) => {
                  const texto = fechaATexto(d);
                  const elegido = texto === fecha;
                  return (
                    <Pressable
                      key={texto}
                      onPress={() => setFecha(texto)}
                      style={[styles.dia, elegido && styles.diaElegido]}
                    >
                      <Text style={[styles.diaNombre, elegido && styles.textoOscuro]}>
                        {i === 0 ? 'Hoy' : DIAS_CORTOS[d.getDay()]}
                      </Text>
                      <Text style={[styles.diaNumero, elegido && styles.textoOscuro]}>
                        {d.getDate()}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              {/* Horas */}
              <Text style={styles.etiqueta}>Elige la hora</Text>

              {cargandoDia && (
                <ActivityIndicator size="large" color="#F28C28" style={styles.cargando} />
              )}

              {!cargandoDia && bloques.length === 0 && (
                <View style={styles.mensajeCard}>
                  <Text style={styles.mensajeTexto}>Este día no hay servicio.</Text>
                </View>
              )}

              {!cargandoDia && bloques.length > 0 && !hayLibres && (
                <View style={styles.mensajeCard}>
                  <Text style={styles.mensajeTexto}>
                    No quedan horas libres este día. Prueba con otro día u otra mesa.
                  </Text>
                </View>
              )}

              {!cargandoDia &&
                bloques.map((bloque) => (
                  <View key={bloque.id} style={styles.bloque}>
                    <View style={styles.bloqueEncabezado}>
                      <Text style={styles.bloqueEmoji}>{bloque.emoji}</Text>
                      <Text style={styles.bloqueTitulo}>{bloque.titulo}</Text>
                    </View>
                    <View style={styles.franjas}>
                      {bloque.franjas.map((f) => {
                        const elegida = horaElegida?.inicio === f.hora;
                        return (
                          <Pressable
                            key={f.hora}
                            disabled={!f.libre}
                            onPress={() =>
                              setHoraElegida({
                                inicio: f.hora,
                                duracion: bloque.duracion,
                              })
                            }
                            style={[
                              styles.franja,
                              !f.libre && styles.franjaApagada,
                              elegida && styles.franjaElegida,
                            ]}
                          >
                            <Text
                              style={[
                                styles.franjaTexto,
                                elegida && styles.textoOscuro,
                              ]}
                            >
                              {f.hora}
                            </Text>
                            {!f.libre && <View style={styles.franjaTachada} />}
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                ))}

              {!cargandoDia && bloques.length > 0 && (
                <Text style={styles.nota}>
                  🕓 Las horas apagadas ya están ocupadas o ya pasaron.
                </Text>
              )}

              {/* Personas */}
              <View style={styles.personasEncabezado}>
                <Text style={styles.etiqueta}>¿Cuántas personas?</Text>
                <Text style={styles.capacidadTexto}>Máx {mesa.capacidad}</Text>
              </View>
              <View style={styles.contador}>
                <Pressable
                  style={[styles.botonContador, personas <= 1 && styles.franjaApagada]}
                  disabled={personas <= 1}
                  onPress={() => setPersonas(personas - 1)}
                >
                  <Text style={styles.textoContador}>−</Text>
                </Pressable>
                <Text style={styles.numeroPersonas}>{personas}</Text>
                <Pressable
                  style={[
                    styles.botonContador,
                    personas >= mesa.capacidad && styles.franjaApagada,
                  ]}
                  disabled={personas >= mesa.capacidad}
                  onPress={() => setPersonas(personas + 1)}
                >
                  <Text style={styles.textoContador}>+</Text>
                </Pressable>
              </View>

              <Pressable
                style={[styles.botonContinuar, !horaElegida && styles.botonDeshabilitado]}
                onPress={continuar}
                disabled={!horaElegida}
              >
                <Text style={styles.textoContinuar}>Continuar</Text>
              </Pressable>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  fondo: { flex: 1, backgroundColor: '#0d2b3e' },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.42)',
  },
  container: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  cargando: { marginVertical: 28 },
  barraSuperior: { marginBottom: 14 },
  botonBarra: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  textoBarra: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },

  /* ---------- Encabezado ---------- */
  titulo: {
    fontSize: 34,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },

  mesaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(18,18,18,0.82)',
    borderRadius: 22,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  mesaCirculo: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F28C28',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  mesaCirculoTexto: { color: '#FFFFFF', fontWeight: '800', fontSize: 22 },
  mesaTextos: { flex: 1 },
  mesaNombre: { color: '#FFFFFF', fontSize: 20, fontWeight: '800' },
  mesaDetalle: { color: '#C8C8C8', fontSize: 14, marginTop: 4 },

  /* ---------- Etiquetas ---------- */
  etiqueta: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    marginTop: 26,
    marginBottom: 10,
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },

  /* ---------- Días ---------- */
  diasScroll: { marginBottom: 6 },
  filaDias: { alignItems: 'center', gap: 8, paddingRight: 8, paddingVertical: 4 },
  dia: {
    width: 60,
    height: 66,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(18,18,18,0.78)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  diaElegido: {
    backgroundColor: '#F2EFEA',
    borderColor: '#F28C28',
    borderWidth: 2,
    shadowColor: '#F28C28',
    shadowOpacity: 0.45,
    shadowRadius: 8,
  },
  diaNombre: { color: '#C8C8C8', fontSize: 12, fontWeight: '700' },
  diaNumero: { color: '#FFF', fontSize: 20, fontWeight: '800', marginTop: 2 },
  textoOscuro: { color: '#1A1A1A' },

  /* ---------- Bloques por jornada ---------- */
  bloque: {
    marginBottom: 14,
    padding: 16,
    borderRadius: 22,
    backgroundColor: 'rgba(18,18,18,0.82)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  bloqueEncabezado: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  bloqueEmoji: { fontSize: 22 },
  bloqueTitulo: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  franjas: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  franja: {
    minWidth: 76,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 22,
    backgroundColor: 'rgba(18,18,18,0.85)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  franjaElegida: {
    backgroundColor: '#F28C28',
    borderColor: '#FFFFFF',
    shadowColor: '#F28C28',
    shadowOpacity: 0.55,
    shadowRadius: 10,
  },
  franjaApagada: { opacity: 0.4 },
  franjaTachada: {
    position: 'absolute',
    left: 12,
    right: 12,
    top: '50%',
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.45)',
    transform: [{ translateY: -1 }],
  },
  franjaTexto: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  nota: {
    color: '#C8C8C8',
    fontSize: 13,
    marginTop: 4,
    marginBottom: 4,
  },

  /* ---------- Personas ---------- */
  personasEncabezado: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  capacidadTexto: { color: '#B5B5B5', fontSize: 13, fontWeight: '600', marginTop: 22 },
  contador: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 28,
    marginVertical: 14,
  },
  botonContador: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F2EFEA',
    borderWidth: 1,
    borderColor: '#F28C28',
  },
  textoContador: { color: '#1A1A1A', fontSize: 26, fontWeight: '800' },
  numeroPersonas: { color: '#FFF', fontSize: 30, fontWeight: '800', minWidth: 36, textAlign: 'center' },

  /* ---------- Botones / mensajes ---------- */
  botonContinuar: {
    backgroundColor: '#F2EFEA',
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    borderWidth: 2,
    borderColor: '#F28C28',
  },
  botonDeshabilitado: { opacity: 0.35 },
  textoContinuar: {
    color: '#1A1A1A',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  mensajeCaja: { marginVertical: 12 },
  mensajeCard: {
    backgroundColor: 'rgba(18,18,18,0.82)',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    marginVertical: 12,
  },
  mensajeTexto: { color: '#FFF', fontSize: 16, textAlign: 'center' },
  botonClaro: {
    backgroundColor: '#F2EFEA',
    paddingHorizontal: 28,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: 12,
  },
  textoBotonClaro: { color: '#1A1A1A', fontSize: 15, fontWeight: '800' },
});