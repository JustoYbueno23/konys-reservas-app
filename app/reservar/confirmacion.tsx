import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { obtenerMesasActivas } from '../../services/mesas';
import { crearReserva, esReservaDuplicada } from '../../services/reservas';
import { textoAFecha } from '../../utils/fechas';

export const options = {
  headerShown: false,
};

const FONDO = require('../../assets/images/FondoReservarMesa.png');

const DIAS_LARGOS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];
const NOMBRE_ZONA: Record<string, string> = { terraza: 'Terraza', salon: 'Salón' };

function fechaBonita(texto: string) {
  const d = textoAFecha(texto);
  return `${DIAS_LARGOS[d.getDay()]} ${d.getDate()} de ${MESES[d.getMonth()]}`;
}

export default function Confirmacion() {
  const router = useRouter();
  const { mesaId, fecha, horaInicio, horaFin, personas } = useLocalSearchParams<{
    mesaId: string;
    fecha: string;
    horaInicio: string;
    horaFin: string;
    personas: string;
  }>();

  const [mesaTexto, setMesaTexto] = useState('Mesa');
  const [nombre, setNombre] = useState('');
  const [contacto, setContacto] = useState('');
  const [errorForm, setErrorForm] = useState<string | null>(null);
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [exito, setExito] = useState(false);
  const [horaTomada, setHoraTomada] = useState(false);

  // Solo para mostrar el nombre de la mesa en el resumen.
  useEffect(() => {
    async function cargarMesa() {
      try {
        const { data } = await obtenerMesasActivas();
        const mesa = data.find((m: { id: string }) => m.id === mesaId);
        if (mesa) {
          setMesaTexto(`${mesa.nombre} · ${NOMBRE_ZONA[mesa.zona] ?? mesa.zona}`);
        }
      } catch (e) { }
    }
    cargarMesa();
  }, [mesaId]);

  async function confirmar() {
    setErrorForm(null);
    setErrorEnvio(null);

    if (nombre.trim().length < 2) {
      setErrorForm('Escribe tu nombre.');
      return;
    }
    if (contacto.replace(/\D/g, '').length < 7) {
      setErrorForm('Escribe un teléfono válido (mínimo 7 números).');
      return;
    }

    setGuardando(true);
    try {
      const { error } = await crearReserva({
        mesa_id: mesaId,
        cliente_nombre: nombre.trim(),
        cliente_contacto: contacto.trim(),
        num_personas: Number(personas),
        fecha,
        hora_inicio: horaInicio,
        hora_fin: horaFin,
      });

      if (esReservaDuplicada(error)) {
        setHoraTomada(true);
      } else if (error) {
        setErrorEnvio('No se pudo crear la reserva. Revisa tu conexión e inténtalo de nuevo.');
      } else {
        setExito(true);
      }
    } catch (e) {
      setErrorEnvio('No se pudo crear la reserva. Revisa tu conexión e inténtalo de nuevo.');
    }
    setGuardando(false);
  }

  const faltanDatos = !mesaId || !fecha || !horaInicio || !horaFin || !personas;

  return (
    <ImageBackground source={FONDO} style={styles.fondo} resizeMode="cover">
      <View style={styles.overlay} pointerEvents="none" />

      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />

        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollContent}
          >
            {faltanDatos && (
              <View style={styles.caja}>
                <Text style={styles.cajaTitulo}>Faltan datos de la reserva</Text>
                <Pressable style={styles.botonClaro} onPress={() => router.replace('/reservar')}>
                  <Text style={styles.textoBotonClaro}>Empezar de nuevo</Text>
                </Pressable>
              </View>
            )}

            {!faltanDatos && exito && (
              <View style={styles.caja}>
                <View style={styles.checkCirculo}>
                  <Text style={styles.checkTexto}>✓</Text>
                </View>
                <Text style={styles.cajaTitulo}>¡Reserva confirmada!</Text>
                <Text style={styles.cajaTexto}>
                  {mesaTexto}{'\n'}
                  {fechaBonita(fecha)}{'\n'}
                  {horaInicio} – {horaFin}{'\n'}
                  {personas} {Number(personas) === 1 ? 'persona' : 'personas'}
                </Text>
                <Text style={styles.cajaTextoLight}>Te esperamos, {nombre.trim()}.</Text>
                <Pressable style={styles.botonClaro} onPress={() => router.replace('/')}>
                  <Text style={styles.textoBotonClaro}>Volver al inicio</Text>
                </Pressable>
              </View>
            )}

            {!faltanDatos && !exito && horaTomada && (
              <View style={styles.caja}>
                <View style={styles.horaTomadaCirculo}>
                  <Text style={styles.horaTomadaIcono}>🕐</Text>
                </View>
                <Text style={styles.cajaTitulo}>Esa hora ya fue tomada</Text>
                <Text style={styles.cajaTexto}>
                  Alguien reservó esta mesa a esa hora justo antes que tú. Elige otra hora u otra mesa.
                </Text>
                <Pressable style={styles.botonClaro} onPress={() => router.back()}>
                  <Text style={styles.textoBotonClaro}>Elegir otra hora</Text>
                </Pressable>
              </View>
            )}

            {!faltanDatos && !exito && !horaTomada && (
              <>
                <View style={styles.barraSuperior}>
                  <Pressable style={styles.botonBarra} onPress={() => router.back()}>
                    <Text style={styles.textoBarra}>‹ Volver</Text>
                  </Pressable>
                </View>

                <Text style={styles.titulo}>Confirma tu reserva</Text>
                <Text style={styles.subtitulo}>Revisa los datos y déjanos cómo contactarte</Text>

                {/* Resumen tipo "ticket" */}
                <View style={styles.ticket}>
                  <View style={styles.ticketCabecera}>
                    <Text style={styles.ticketCabeceraTexto}>RESUMEN DE RESERVA</Text>
                  </View>
                  <FilaTicket icono="🪑" etiqueta="Mesa" valor={mesaTexto} />
                  <FilaTicket icono="📅" etiqueta="Día" valor={fechaBonita(fecha)} />
                  <FilaTicket icono="⏰" etiqueta="Hora" valor={`${horaInicio} – ${horaFin}`} />
                  <FilaTicket
                    icono="👥"
                    etiqueta="Personas"
                    valor={`${personas} ${Number(personas) === 1 ? 'persona' : 'personas'}`}
                    ultima
                  />
                </View>

                {/* Datos del cliente */}
                <View style={styles.bloqueDatos}>
                  <View style={styles.bloqueEncabezado}>
                    <Text style={styles.bloqueEmoji}>📋</Text>
                    <Text style={styles.bloqueTitulo}>Tus datos</Text>
                  </View>

                  <Text style={styles.inputEtiqueta}>Tu nombre</Text>
                  <TextInput
                    style={styles.input}
                    value={nombre}
                    onChangeText={setNombre}
                    placeholder="Nombre y apellido"
                    placeholderTextColor="rgba(255,255,255,0.35)"
                    autoCapitalize="words"
                    editable={!guardando}
                  />

                  <Text style={styles.inputEtiqueta}>Teléfono de contacto</Text>
                  <TextInput
                    style={styles.input}
                    value={contacto}
                    onChangeText={setContacto}
                    placeholder="Ej: 300 123 4567"
                    placeholderTextColor="rgba(255,255,255,0.35)"
                    keyboardType="phone-pad"
                    editable={!guardando}
                  />
                </View>

                {errorForm && (
                  <View style={styles.mensajeError}>
                    <Text style={styles.mensajeErrorTexto}>{errorForm}</Text>
                  </View>
                )}
                {errorEnvio && (
                  <View style={styles.mensajeError}>
                    <Text style={styles.mensajeErrorTexto}>{errorEnvio}</Text>
                  </View>
                )}

                <Pressable
                  style={[styles.botonConfirmar, guardando && styles.botonDeshabilitado]}
                  onPress={confirmar}
                  disabled={guardando}
                >
                  {guardando ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.textoConfirmar}>Confirmar reserva</Text>
                  )}
                </Pressable>

                <Text style={styles.notaFinal}>Al confirmar, aceptas que te contactaremos al número ingresado.</Text>
              </>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ImageBackground>
  );
}

function FilaTicket({
  icono,
  etiqueta,
  valor,
  ultima,
}: {
  icono: string;
  etiqueta: string;
  valor: string;
  ultima?: boolean;
}) {
  return (
    <View style={[styles.filaTicket, !ultima && styles.filaTicketLinea]}>
      <View style={styles.filaTicketIzq}>
        <Text style={styles.filaTicketIcono}>{icono}</Text>
        <Text style={styles.filaTicketEtiqueta}>{etiqueta}</Text>
      </View>
      <Text style={styles.filaTicketValor}>{valor}</Text>
    </View>
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
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  container: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },

  /* ---------- Volver ---------- */
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
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  subtitulo: {
    fontSize: 14,
    color: '#C9C9C9',
    marginTop: 6,
    marginBottom: 18,
  },

  /* ---------- Resumen tipo ticket ---------- */
  ticket: {
    borderRadius: 20,
    backgroundColor: 'rgba(18,18,18,0.88)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    overflow: 'hidden',
    marginBottom: 22,
  },
  ticketCabecera: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    backgroundColor: '#F28C28',
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(0,0,0,0.25)',
  },
  ticketCabeceraTexto: {
    color: '#1A1A1A',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 2,
    textAlign: 'center',
  },
  filaTicket: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 18,
    gap: 14,
  },
  filaTicketLinea: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.12)',
  },
  filaTicketIzq: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  filaTicketIcono: { fontSize: 18 },
  filaTicketEtiqueta: { color: '#B9B9B9', fontSize: 13, fontWeight: '700' },
  filaTicketValor: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    flexShrink: 1,
    textAlign: 'right',
  },

  /* ---------- Bloque de datos ---------- */
  bloqueDatos: {
    backgroundColor: 'rgba(18,18,18,0.88)',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    marginBottom: 18,
  },
  bloqueEncabezado: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  bloqueEmoji: { fontSize: 18 },
  bloqueTitulo: { color: '#FFFFFF', fontSize: 18, fontWeight: '800' },
  inputEtiqueta: {
    color: '#C8C8C8',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 6,
    marginTop: 4,
  },
  input: {
    height: 54,
    borderRadius: 16,
    paddingHorizontal: 16,
    color: '#FFF',
    fontSize: 16,
    backgroundColor: 'rgba(255,255,255,0.09)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    marginBottom: 12,
  },

  /* ---------- Mensajes ---------- */
  mensajeError: {
    backgroundColor: 'rgba(255,107,107,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,107,107,0.45)',
    borderRadius: 14,
    padding: 12,
    marginBottom: 18,
  },
  mensajeErrorTexto: {
    color: '#FFB4B0',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '600',
  },

  /* ---------- Botón confirmar ---------- */
  botonConfirmar: {
    backgroundColor: '#F2EFEA',
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#F28C28',
  },
  botonDeshabilitado: { opacity: 0.55 },
  textoConfirmar: { color: '#1A1A1A', fontSize: 18, fontWeight: '800', letterSpacing: 0.5 },
  notaFinal: {
    color: '#B9B9B9',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 6,
  },

  /* ---------- Cajas (falta, éxito, hora tomada) ---------- */
  caja: {
    marginTop: 40,
    padding: 28,
    borderRadius: 24,
    alignItems: 'center',
    gap: 18,
    backgroundColor: 'rgba(18,18,18,0.9)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  checkCirculo: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#F28C28',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  checkTexto: { color: '#FFFFFF', fontWeight: '900', fontSize: 42 },
  horaTomadaCirculo: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(255,107,107,0.2)',
    borderWidth: 2,
    borderColor: 'rgba(255,138,128,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  horaTomadaIcono: { fontSize: 44 },
  cajaTitulo: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
  },
  cajaTexto: {
    color: '#E0E0E0',
    fontSize: 17,
    lineHeight: 26,
    textAlign: 'center',
  },
  cajaTextoLight: {
    color: '#C9C9C9',
    fontSize: 16,
    textAlign: 'center',
  },
  botonClaro: {
    backgroundColor: '#F2EFEA',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 26,
    marginTop: 4,
    borderWidth: 2,
    borderColor: '#F28C28',
  },
  textoBotonClaro: {
    color: '#1A1A1A',
    fontSize: 16,
    fontWeight: '800',
  },
});