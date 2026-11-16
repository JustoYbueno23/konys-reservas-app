import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BotonPrincipal } from '../../components/BotonPrincipal';
import { BotonVolver } from '../../components/BotonVolver';
import { obtenerDiasConServicio, obtenerHorariosDia } from '../../services/horarios';
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

const FONDO = require('../../assets/images/FondoReservarMesa.png');

// Cuantos dias hacia adelante se puede reservar
const DIAS_ANTICIPACION = 14;

const DIAS_CORTOS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const NOMBRE_ZONA: Record<string, string> = { terraza: 'Terraza', salon: 'Salón' };

const COLORES = {
  naranja: '#F28C28',
  crema: '#F2EFEA',
  oscuro: '#1A1A1A',
  texto: '#FFFFFF',
  textoSuave: '#C8C8C8',
  caja: 'rgba(18, 18, 18, 0.85)',
  borde: 'rgba(255, 255, 255, 0.2)',
};

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

export default function DiaYHora() {
  const router = useRouter();
  const { mesaId } = useLocalSearchParams<{ mesaId: string }>();

  const [mesa, setMesa] = useState<Mesa | null>(null);
  const [dias, setDias] = useState<Date[]>([]);
  const [fecha, setFecha] = useState('');
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [ocupadas, setOcupadas] = useState<HoraOcupada[]>([]);
  const [horaElegida, setHoraElegida] = useState<HoraElegida | null>(null);
  const [personas, setPersonas] = useState(1);
  const [cargandoDia, setCargandoDia] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [intento, setIntento] = useState(0);

  // Al abrir la pantalla: cargar la mesa y los dias que tienen servicio
  useEffect(() => {
    let ignore = false;

    async function cargarInicio() {
      try {
        const resultadoMesas = await obtenerMesasActivas();
        const resultadoDias = await obtenerDiasConServicio();
        if (ignore) return;

        const mesaEncontrada = resultadoMesas.data.find((m: Mesa) => m.id === mesaId);
        if (!mesaEncontrada) {
          setError('No se encontró la mesa elegida.');
          return;
        }

        // Solo se muestran los dias en los que el restaurante abre
        const diasConServicio = proximosDias(DIAS_ANTICIPACION).filter((d) =>
          resultadoDias.data.includes(nombreDia(d))
        );

        setMesa(mesaEncontrada);
        setPersonas(Math.min(2, mesaEncontrada.capacidad));
        setDias(diasConServicio);
        if (diasConServicio.length > 0) {
          setFecha(fechaATexto(diasConServicio[0]));
        }
      } catch (e) {
        if (!ignore) setError('No se pudo cargar la información. Revisa tu conexión.');
      }
    }

    cargarInicio();

    // Si la pantalla se cierra antes de que termine, se ignora el resultado
    return () => {
      ignore = true;
    };
  }, [mesaId, intento]);

  // Cada vez que cambia el dia: cargar sus horarios y las horas ocupadas
  useEffect(() => {
    if (!fecha) return;
    let ignore = false;

    async function cargarDia() {
      setCargandoDia(true);
      setHoraElegida(null);
      try {
        const dia = nombreDia(textoAFecha(fecha));
        const resultadoHorarios = await obtenerHorariosDia(dia);
        const resultadoOcupadas = await obtenerHorasOcupadas(mesaId, fecha);
        if (resultadoOcupadas.error) throw resultadoOcupadas.error;
        if (ignore) return;

        // Almuerzo primero y noche despues
        const ordenados = [...resultadoHorarios.data].sort((a: Horario, b: Horario) =>
          a.hora_inicio.localeCompare(b.hora_inicio)
        );
        setHorarios(ordenados);
        setOcupadas(resultadoOcupadas.data);
      } catch (e) {
        if (!ignore) setError('No se pudieron cargar los horarios. Revisa tu conexión.');
      }
      if (!ignore) setCargandoDia(false);
    }

    cargarDia();

    return () => {
      ignore = true;
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

  // Franjas de un horario, indicando si estan libres
  function crearFranjas(horario: Horario) {
    const horas = generarFranjas(horario.hora_inicio, horario.hora_fin, horario.duracion_slot);
    return horas.map((hora) => ({
      hora,
      libre: !franjaOcupada(hora, horario.duracion_slot, ocupadas) && !franjaPasada(fecha, hora),
    }));
  }

  const hayLibres = horarios.some((h) => crearFranjas(h).some((f) => f.libre));
  const hoy = fechaATexto(new Date());

  return (
    <ImageBackground source={FONDO} style={styles.fondo} resizeMode="cover">
      <View style={styles.capaOscura} />

      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />

        <ScrollView contentContainerStyle={styles.contenido}>
          <BotonVolver style={{ marginBottom: 14 }} />

          <Text style={styles.titulo}>Día y hora</Text>

          {/* Error: se puede reintentar */}
          {error && (
            <View style={styles.caja}>
              <Text style={styles.textoCentrado}>{error}</Text>
              <Pressable style={styles.botonClaro} onPress={reintentar}>
                <Text style={styles.textoBotonClaro}>Reintentar</Text>
              </Pressable>
            </View>
          )}

          {/* Cargando la mesa */}
          {!error && !mesa && <ActivityIndicator size="large" color={COLORES.naranja} />}

          {!error && mesa && (
            <>
              <View style={styles.caja}>
                <Text style={styles.mesaNombre}>{mesa.nombre}</Text>
                <Text style={styles.textoSuave}>
                  {NOMBRE_ZONA[mesa.zona] ?? mesa.zona} - hasta {mesa.capacidad} personas
                </Text>
              </View>

              {dias.length === 0 ? (
                <View style={styles.caja}>
                  <Text style={styles.textoCentrado}>
                    No hay días con servicio en las próximas dos semanas.
                  </Text>
                </View>
              ) : (
                <>
                  <Text style={styles.etiqueta}>Elige el día</Text>
                  <FlatList
                    data={dias}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    keyExtractor={(d) => fechaATexto(d)}
                    contentContainerStyle={styles.listaDias}
                    renderItem={({ item }) => {
                      const texto = fechaATexto(item);
                      const elegido = texto === fecha;
                      return (
                        <Pressable
                          style={[styles.dia, elegido && styles.diaElegido]}
                          onPress={() => setFecha(texto)}
                        >
                          <Text style={[styles.diaNombre, elegido && styles.textoOscuro]}>
                            {texto === hoy ? 'Hoy' : DIAS_CORTOS[item.getDay()]}
                          </Text>
                          <Text style={[styles.diaNumero, elegido && styles.textoOscuro]}>
                            {item.getDate()}
                          </Text>
                        </Pressable>
                      );
                    }}
                  />

                  <Text style={styles.etiqueta}>Elige la hora</Text>

                  {cargandoDia && <ActivityIndicator size="large" color={COLORES.naranja} />}

                  {!cargandoDia && horarios.length === 0 && (
                    <View style={styles.caja}>
                      <Text style={styles.textoCentrado}>Este día no hay servicio.</Text>
                    </View>
                  )}

                  {!cargandoDia && horarios.length > 0 && !hayLibres && (
                    <View style={styles.caja}>
                      <Text style={styles.textoCentrado}>
                        No quedan horas libres este día. Prueba con otro día u otra mesa.
                      </Text>
                    </View>
                  )}

                  {!cargandoDia &&
                    horarios.map((horario) => (
                      <View key={horario.id} style={styles.caja}>
                        <Text style={styles.jornada}>
                          {horario.jornada.charAt(0).toUpperCase() + horario.jornada.slice(1)}
                        </Text>
                        <View style={styles.franjas}>
                          {crearFranjas(horario).map((franja) => {
                            const elegida = horaElegida?.inicio === franja.hora;
                            return (
                              <Pressable
                                key={franja.hora}
                                disabled={!franja.libre}
                                style={[
                                  styles.franja,
                                  !franja.libre && styles.franjaOcupada,
                                  elegida && styles.franjaElegida,
                                ]}
                                onPress={() =>
                                  setHoraElegida({
                                    inicio: franja.hora,
                                    duracion: horario.duracion_slot,
                                  })
                                }
                              >
                                <Text style={[styles.franjaTexto, elegida && styles.textoOscuro]}>
                                  {franja.hora}
                                </Text>
                              </Pressable>
                            );
                          })}
                        </View>
                      </View>
                    ))}

                  {!cargandoDia && horarios.length > 0 && (
                    <Text style={styles.nota}>
                      Las horas apagadas ya están reservadas o ya pasaron.
                    </Text>
                  )}

                  <Text style={styles.etiqueta}>¿Cuántas personas?</Text>
                  <View style={styles.contador}>
                    <Pressable
                      style={[styles.botonContador, personas <= 1 && styles.franjaOcupada]}
                      disabled={personas <= 1}
                      onPress={() => setPersonas(personas - 1)}
                    >
                      <Text style={styles.textoContador}>-</Text>
                    </Pressable>

                    <Text style={styles.numeroPersonas}>{personas}</Text>

                    <Pressable
                      style={[
                        styles.botonContador,
                        personas >= mesa.capacidad && styles.franjaOcupada,
                      ]}
                      disabled={personas >= mesa.capacidad}
                      onPress={() => setPersonas(personas + 1)}
                    >
                      <Text style={styles.textoContador}>+</Text>
                    </Pressable>
                  </View>

                  <BotonPrincipal
                    texto="Continuar"
                    onPress={continuar}
                    disabled={!horaElegida}
                    style={{ marginTop: 12 }}
                  />
                </>
              )}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  fondo: {
    flex: 1,
    backgroundColor: '#000000',
  },
  capaOscura: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  container: {
    flex: 1,
  },
  contenido: {
    padding: 20,
    paddingBottom: 40,
  },
  titulo: {
    color: COLORES.texto,
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  etiqueta: {
    color: COLORES.texto,
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 22,
    marginBottom: 10,
  },
  caja: {
    backgroundColor: COLORES.caja,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORES.borde,
    padding: 16,
    marginBottom: 12,
  },
  mesaNombre: {
    color: COLORES.texto,
    fontSize: 20,
    fontWeight: 'bold',
  },
  textoSuave: {
    color: COLORES.textoSuave,
    fontSize: 14,
    marginTop: 4,
  },
  textoCentrado: {
    color: COLORES.texto,
    fontSize: 16,
    textAlign: 'center',
  },
  textoOscuro: {
    color: COLORES.oscuro,
  },
  listaDias: {
    gap: 8,
  },
  dia: {
    width: 60,
    height: 66,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORES.borde,
    backgroundColor: COLORES.caja,
    alignItems: 'center',
    justifyContent: 'center',
  },
  diaElegido: {
    backgroundColor: COLORES.crema,
    borderColor: COLORES.naranja,
    borderWidth: 2,
  },
  diaNombre: {
    color: COLORES.textoSuave,
    fontSize: 12,
    fontWeight: '600',
  },
  diaNumero: {
    color: COLORES.texto,
    fontSize: 20,
    fontWeight: 'bold',
  },
  jornada: {
    color: COLORES.texto,
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  franjas: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  franja: {
    minWidth: 76,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORES.borde,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
  },
  franjaElegida: {
    backgroundColor: COLORES.naranja,
    borderColor: COLORES.texto,
  },
  franjaOcupada: {
    opacity: 0.3,
  },
  franjaTexto: {
    color: COLORES.texto,
    fontSize: 16,
    fontWeight: 'bold',
  },
  nota: {
    color: COLORES.textoSuave,
    fontSize: 13,
  },
  contador: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 28,
    marginBottom: 10,
  },
  botonContador: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: COLORES.crema,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textoContador: {
    color: COLORES.oscuro,
    fontSize: 26,
    fontWeight: 'bold',
  },
  numeroPersonas: {
    color: COLORES.texto,
    fontSize: 30,
    fontWeight: 'bold',
    minWidth: 36,
    textAlign: 'center',
  },
  botonClaro: {
    alignSelf: 'center',
    backgroundColor: COLORES.crema,
    paddingVertical: 12,
    paddingHorizontal: 26,
    borderRadius: 22,
    marginTop: 14,
  },
  textoBotonClaro: {
    color: COLORES.oscuro,
    fontSize: 15,
    fontWeight: 'bold',
  },
});