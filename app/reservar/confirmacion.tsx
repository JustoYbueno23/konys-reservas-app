// -------------------------------------------------------------
// PANTALLA: Confirmación de la reserva
// Recibe los datos de la pantalla anterior por parámetros:
// mesaId, fecha, horaInicio, horaFin y personas
// (https://docs.expo.dev/router/advanced/navigation/)
// -------------------------------------------------------------
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
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
import { BotonPrincipal } from '../../components/BotonPrincipal';
import { BotonVolver } from '../../components/BotonVolver';
import { obtenerMesasActivas } from '../../services/mesas';
import { crearReserva, esReservaDuplicada } from '../../services/reservas';
import { textoAFecha } from '../../utils/fechas';

const FONDO = require('../../assets/images/FondoReservarMesa.png');

type Mesa = { id: string; nombre: string; zona: string };

// Armar la fecha en español escribiendo los nombres a mano,
// para no depender del idioma que tenga configurado el celular
const DIAS_LARGOS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];
// En la base de datos la zona viene en minúscula y sin tilde
const NOMBRE_ZONA: Record<string, string> = { terraza: 'Terraza', salon: 'Salón' };

const COLORES = {
  naranja: '#F28C28',
  crema: '#F2EFEA',
  oscuro: '#1A1A1A',
  texto: '#FFFFFF',
  textoSuave: '#C8C8C8',
  error: '#FF8A80',
  caja: 'rgba(18, 18, 18, 0.85)',
  borde: 'rgba(255, 255, 255, 0.2)',
};

// "2026-11-10" -> "martes 10 de noviembre"
function fechaLarga(texto: string) {
  const fecha = textoAFecha(texto);
  return DIAS_LARGOS[fecha.getDay()] + ' ' + fecha.getDate() + ' de ' + MESES[fecha.getMonth()];
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
  const [mensajeError, setMensajeError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [resultado, setResultado] = useState<'pendiente' | 'exito' | 'horaTomada'>('pendiente');

  // Al abrir la pantalla se busca el nombre de la mesa para mostrarla en el resumen.
  // La variable "ignore" evita actualizar el estado si la pantalla ya se cerró
  // (patrón de la documentación de useEffect: https://react.dev/reference/react/useEffect)
  useEffect(() => {
    let ignore = false;

    async function cargarMesa() {
      try {
        const respuesta = await obtenerMesasActivas();
        const mesa = (respuesta.data as Mesa[]).find((m) => m.id === mesaId);
        if (mesa && !ignore) {
          setMesaTexto(`${mesa.nombre} - ${NOMBRE_ZONA[mesa.zona] ?? mesa.zona}`);
        }
      } catch (e) {
        // Si falla, se deja "Mesa" y la reserva se puede hacer igual
      }
    }

    cargarMesa();

    return () => {
      ignore = true;
    };
  }, [mesaId]);

  function confirmar() {
    setMensajeError(null);

    // Primero validar los datos, después llamar a Supabase
    if (nombre.trim().length < 2) {
      setMensajeError('Escribe tu nombre.');
      return;
    }
    if (contacto.replace(/\D/g, '').length < 7) {
      setMensajeError('Escribe un teléfono válido (mínimo 7 números).');
      return;
    }

    guardarReserva();
  }

  async function guardarReserva() {
    setGuardando(true);

    // crearReserva devuelve error si no hay conexión.
    // esReservaDuplicada detecta si otra persona reservó esa misma
    // mesa y franja antes (lo bloquea el índice único de la base de datos)
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
        setResultado('horaTomada');
      } else if (error) {
        setMensajeError('No se pudo crear la reserva. Revisa tu conexión e inténtalo de nuevo.');
      } else {
        setResultado('exito');
      }
    } catch (e) {
      setMensajeError('No se pudo crear la reserva. Revisa tu conexión e inténtalo de nuevo.');
    }

    setGuardando(false);
  }

  // Por si la pantalla se abre sin los parámetros de la pantalla anterior
  const faltanDatos = !mesaId || !fecha || !horaInicio || !horaFin || !personas;

  return (
    <ImageBackground source={FONDO} style={styles.fondo} resizeMode="cover">
      <View style={styles.capaOscura} />

      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />

        {/* El teclado mueve el contenido hacia arriba mientras se escribe
            (https://reactnative.dev/docs/keyboardavoidingview) */}
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.contenido}
          >
            {faltanDatos && (
              <View style={styles.caja}>
                <Text style={styles.cajaTitulo}>Faltan datos de la reserva</Text>
                <Pressable style={styles.botonClaro} onPress={() => router.replace('/reservar')}>
                  <Text style={styles.textoBotonClaro}>Empezar de nuevo</Text>
                </Pressable>
              </View>
            )}

            {!faltanDatos && resultado === 'exito' && (
              <View style={styles.caja}>
                <Text style={styles.cajaTitulo}>Reserva confirmada</Text>
                <Text style={styles.cajaTexto}>{mesaTexto}</Text>
                <Text style={styles.cajaTexto}>{fechaLarga(fecha)}</Text>
                <Text style={styles.cajaTexto}>
                  {horaInicio} a {horaFin}
                </Text>
                <Text style={styles.cajaTexto}>
                  {personas} {Number(personas) === 1 ? 'persona' : 'personas'}
                </Text>
                <Text style={styles.textoSuave}>Te esperamos, {nombre.trim()}.</Text>
                {/* router.replace evita que el botón atrás vuelva a este formulario ya enviado */}
                <Pressable style={styles.botonClaro} onPress={() => router.replace('/')}>
                  <Text style={styles.textoBotonClaro}>Volver al inicio</Text>
                </Pressable>
              </View>
            )}

            {!faltanDatos && resultado === 'horaTomada' && (
              <View style={styles.caja}>
                <Text style={styles.cajaTitulo}>Esa hora ya fue tomada</Text>
                <Text style={styles.cajaTexto}>
                  Alguien reservó esta mesa a esa hora justo antes que tú. Elige otra hora u otra mesa.
                </Text>
                <Pressable style={styles.botonClaro} onPress={() => router.back()}>
                  <Text style={styles.textoBotonClaro}>Elegir otra hora</Text>
                </Pressable>
              </View>
            )}

            {!faltanDatos && resultado === 'pendiente' && (
              <>
                <BotonVolver style={{ marginBottom: 14 }} />

                <Text style={styles.titulo}>Confirma tu reserva</Text>
                <Text style={styles.subtitulo}>Revisa los datos y déjanos cómo contactarte</Text>

                <View style={styles.caja}>
                  <View style={styles.filaResumen}>
                    <Text style={styles.filaEtiqueta}>Mesa</Text>
                    <Text style={styles.filaValor}>{mesaTexto}</Text>
                  </View>
                  <View style={styles.filaResumen}>
                    <Text style={styles.filaEtiqueta}>Día</Text>
                    <Text style={styles.filaValor}>{fechaLarga(fecha)}</Text>
                  </View>
                  <View style={styles.filaResumen}>
                    <Text style={styles.filaEtiqueta}>Hora</Text>
                    <Text style={styles.filaValor}>{horaInicio} a {horaFin}</Text>
                  </View>
                  <View style={[styles.filaResumen, styles.filaSinLinea]}>
                    <Text style={styles.filaEtiqueta}>Personas</Text>
                    <Text style={styles.filaValor}>
                      {personas} {Number(personas) === 1 ? 'persona' : 'personas'}
                    </Text>
                  </View>
                </View>

                <View style={styles.caja}>
                  <Text style={styles.etiqueta}>Tu nombre</Text>
                  <TextInput
                    style={styles.input}
                    value={nombre}
                    onChangeText={setNombre}
                    placeholder="Nombre y apellido"
                    placeholderTextColor="rgba(255, 255, 255, 0.4)"
                    autoCapitalize="words"
                    editable={!guardando}
                  />

                  <Text style={styles.etiqueta}>Teléfono de contacto</Text>
                  <TextInput
                    style={styles.input}
                    value={contacto}
                    onChangeText={setContacto}
                    placeholder="Ej: 300 123 4567"
                    placeholderTextColor="rgba(255, 255, 255, 0.4)"
                    keyboardType="phone-pad"
                    editable={!guardando}
                  />
                </View>

                {mensajeError && <Text style={styles.textoError}>{mensajeError}</Text>}

                <BotonPrincipal
                  texto="Confirmar reserva"
                  onPress={confirmar}
                  cargando={guardando}
                  opacidadDeshabilitado={0.5}
                />
              </>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
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
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
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
    fontSize: 30,
    fontWeight: 'bold',
  },
  subtitulo: {
    color: COLORES.textoSuave,
    fontSize: 14,
    marginTop: 6,
    marginBottom: 18,
  },
  caja: {
    backgroundColor: COLORES.caja,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORES.borde,
    padding: 16,
    marginBottom: 14,
  },
  cajaTitulo: {
    color: COLORES.texto,
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 6,
  },
  cajaTexto: {
    color: COLORES.texto,
    fontSize: 17,
    textAlign: 'center',
  },
  textoSuave: {
    color: COLORES.textoSuave,
    fontSize: 15,
    textAlign: 'center',
    marginTop: 6,
  },
  filaResumen: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.12)',
  },
  filaSinLinea: {
    borderBottomWidth: 0,
  },
  filaEtiqueta: {
    color: COLORES.textoSuave,
    fontSize: 15,
  },
  filaValor: {
    color: COLORES.texto,
    fontSize: 16,
    fontWeight: 'bold',
    flexShrink: 1,
    textAlign: 'right',
  },
  etiqueta: {
    color: COLORES.texto,
    fontSize: 15,
    fontWeight: 'bold',
    marginTop: 6,
    marginBottom: 8,
  },
  input: {
    height: 50,
    borderRadius: 14,
    paddingHorizontal: 14,
    color: COLORES.texto,
    fontSize: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: COLORES.borde,
  },
  textoError: {
    color: COLORES.error,
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 14,
  },
  botonClaro: {
    alignSelf: 'center',
    backgroundColor: COLORES.crema,
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 22,
    marginTop: 12,
  },
  textoBotonClaro: {
    color: COLORES.oscuro,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
