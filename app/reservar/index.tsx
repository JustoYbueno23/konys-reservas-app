// -------------------------------------------------------------
// PANTALLA: Elegir la mesa
// Muestra las mesas activas agrupadas por zona (Terraza y Salón).
// Se toca una burbuja para seleccionarla y "Continuar" lleva a elegir
// el día y la hora.
// Navegación: https://docs.expo.dev/router/advanced/navigation/
// -------------------------------------------------------------
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BotonAdmin } from '../../components/BotonAdmin';
import { BotonPrincipal } from '../../components/BotonPrincipal';
import { BotonVolver } from '../../components/BotonVolver';
import { obtenerMesasActivas } from '../../services/mesas';
import { numeroDeMesa } from '../../utils/formato';

const FONDO = require('../../assets/images/FondoReservarMesa.png');
const MESA = require('../../assets/images/MesasFondo.png');
const TERRAZA_FONDO = require('../../assets/images/TerrazaFondo.jpg');
const SALON_FONDO = require('../../assets/images/SalonFondo.jpg');

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

// La zona viene de la base de datos en minúscula y sin tilde
const ZONAS = [
  { clave: 'terraza', titulo: 'Terraza', foto: TERRAZA_FONDO },
  { clave: 'salon', titulo: 'Salón', foto: SALON_FONDO },
];

// La imagen de la mesa tiene mucho espacio en blanco alrededor, entonces se
// agranda y se centra para que solo se vea la mesa dentro del círculo
const TAMANO = 96;
const IMAGEN_ANCHO = 345;
const IMAGEN_ALTO = 724;
const MESA_CENTRO_X = 172;
const MESA_CENTRO_Y = 365;
const MESA_DIAMETRO = 290;
const ESCALA = TAMANO / MESA_DIAMETRO;

// Una burbuja de mesa: foto recortada en el círculo y número encima
function MesaCirculo({ mesa, seleccionada, alTocar }: {
  mesa: Mesa;
  seleccionada: boolean;
  alTocar: () => void;
}) {
  return (
    <View style={styles.mesaItem}>
      <Pressable
        style={[styles.circulo, seleccionada && styles.circuloSeleccionado]}
        onPress={alTocar}
      >
        <Image source={MESA} resizeMode="stretch" style={styles.imagenMesa} />
        <View style={[styles.numeroCaja, seleccionada && styles.numeroCajaSeleccionada]}>
          <Text style={[styles.numero, seleccionada && styles.textoOscuro]}>
            {numeroDeMesa(mesa.nombre)}
          </Text>
        </View>
      </Pressable>

      <View style={styles.capacidadCaja}>
        <Text style={styles.capacidad}>{mesa.capacidad} pers.</Text>
      </View>
    </View>
  );
}

export default function ReservarIndex() {
  const router = useRouter();

  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mesaElegida, setMesaElegida] = useState<string | null>(null);
  // Si cambia "intento", el useEffect se vuelve a ejecutar (botón Reintentar)
  const [intento, setIntento] = useState(0);

  // Pedir las mesas al abrir la pantalla. "ignore" es el patrón de la
  // documentación de useEffect para no actualizar el estado si ya se cerró
  useEffect(() => {
    let ignore = false;

    async function cargarMesas() {
      setCargando(true);
      setError(null);
      try {
        const respuesta = await obtenerMesasActivas();
        if (!ignore) setMesas(respuesta.data as Mesa[]);
      } catch (e) {
        if (!ignore) setError('No se pudieron cargar las mesas. Revisa tu conexión.');
      }
      if (!ignore) setCargando(false);
    }

    cargarMesas();

    return () => {
      ignore = true;
    };
  }, [intento]);

  function continuar() {
    if (!mesaElegida) return;
    router.push({
      pathname: '/reservar/[mesaId]',
      params: { mesaId: mesaElegida },
    });
  }

  // Mesas de una zona, ordenadas por el número del nombre
  function mesasDeZona(clave: string) {
    return mesas
      .filter((m) => m.zona === clave)
      .sort((a, b) => Number(numeroDeMesa(a.nombre)) - Number(numeroDeMesa(b.nombre)));
  }

  return (
    <ImageBackground source={FONDO} style={styles.fondo} resizeMode="cover">
      <View style={styles.capaOscura} />

      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />

        <ScrollView contentContainerStyle={styles.contenido}>
          <View style={styles.barraSuperior}>
            <BotonVolver />

            {/* Atajo para el personal del restaurante */}
            <BotonAdmin />
          </View>

          <Text style={styles.titulo}>Elige tu mesa</Text>
          <Text style={styles.subtitulo}>Toca una burbuja para seleccionarla</Text>

          {cargando && <ActivityIndicator size="large" color={COLORES.naranja} />}

          {error && (
            <View style={styles.cajaMensaje}>
              <Text style={styles.textoMensaje}>{error}</Text>
              <Pressable style={styles.botonClaro} onPress={() => setIntento(intento + 1)}>
                <Text style={styles.textoBotonClaro}>Reintentar</Text>
              </Pressable>
            </View>
          )}

          {!cargando && !error && mesas.length === 0 && (
            <View style={styles.cajaMensaje}>
              <Text style={styles.textoMensaje}>No hay mesas disponibles por ahora.</Text>
            </View>
          )}

          {!cargando &&
            !error &&
            ZONAS.map((zona) => {
              const mesasZona = mesasDeZona(zona.clave);
              if (mesasZona.length === 0) return null;

              return (
                <ImageBackground
                  key={zona.clave}
                  source={zona.foto}
                  style={styles.tarjeta}
                  imageStyle={styles.tarjetaFoto}
                  resizeMode="cover"
                >
                  <View style={styles.tarjetaCapa} />

                  <View style={styles.etiquetaZona}>
                    <Text style={styles.textoZona}>
                      {zona.titulo} - {mesasZona.length} {mesasZona.length === 1 ? 'mesa' : 'mesas'}
                    </Text>
                  </View>

                  <View style={styles.filaMesas}>
                    {mesasZona.map((mesa) => (
                      <MesaCirculo
                        key={mesa.id}
                        mesa={mesa}
                        seleccionada={mesaElegida === mesa.id}
                        alTocar={() => setMesaElegida(mesa.id)}
                      />
                    ))}
                  </View>
                </ImageBackground>
              );
            })}

          <BotonPrincipal
            texto="Continuar"
            onPress={continuar}
            disabled={!mesaElegida}
            style={{ marginTop: 6 }}
          />
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
    backgroundColor: 'rgba(0, 0, 0, 0.42)',
  },
  container: {
    flex: 1,
  },
  contenido: {
    padding: 20,
    paddingBottom: 40,
  },
  barraSuperior: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  titulo: {
    color: COLORES.texto,
    fontSize: 34,
    fontWeight: 'bold',
  },
  subtitulo: {
    color: COLORES.textoSuave,
    fontSize: 15,
    marginTop: 6,
    marginBottom: 18,
  },
  tarjeta: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: COLORES.borde,
    padding: 14,
    marginBottom: 22,
    overflow: 'hidden',
    minHeight: 185,
  },
  tarjetaFoto: {
    borderRadius: 22,
  },
  tarjetaCapa: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  etiquetaZona: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORES.borde,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    marginBottom: 12,
  },
  textoZona: {
    color: COLORES.texto,
    fontSize: 15,
    fontWeight: 'bold',
  },
  filaMesas: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 18,
  },
  mesaItem: {
    alignItems: 'center',
    width: 108,
  },
  circulo: {
    width: TAMANO,
    height: TAMANO,
    borderRadius: TAMANO / 2,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.55)',
    backgroundColor: '#3B2A20',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circuloSeleccionado: {
    borderColor: COLORES.naranja,
    borderWidth: 4,
  },
  imagenMesa: {
    position: 'absolute',
    width: IMAGEN_ANCHO * ESCALA,
    height: IMAGEN_ALTO * ESCALA,
    left: TAMANO / 2 - MESA_CENTRO_X * ESCALA,
    top: TAMANO / 2 - MESA_CENTRO_Y * ESCALA,
  },
  numeroCaja: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  numeroCajaSeleccionada: {
    backgroundColor: COLORES.naranja,
  },
  numero: {
    color: COLORES.texto,
    fontSize: 22,
    fontWeight: 'bold',
  },
  textoOscuro: {
    color: COLORES.oscuro,
  },
  capacidadCaja: {
    marginTop: 8,
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORES.borde,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  capacidad: {
    color: COLORES.texto,
    fontSize: 13,
    fontWeight: 'bold',
  },
  cajaMensaje: {
    backgroundColor: COLORES.caja,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORES.borde,
    padding: 18,
    marginVertical: 14,
  },
  textoMensaje: {
    color: COLORES.texto,
    fontSize: 16,
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
