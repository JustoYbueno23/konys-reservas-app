import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  ImageBackground,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BotonAdmin } from '../components/BotonAdmin';
import { obtenerMesasActivas } from '../services/mesas';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const FONDO = require('../assets/images/fondos/postres.webp');

const COLORES = {
  naranja: '#F28C28',
  crema: '#F2EFEA',
  texto: '#FFFFFF',
  textoSuave: '#E2E2E2',
  borde: 'rgba(255, 255, 255, 0.45)',
};

export default function Inicio() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);

  const [error, setError] = useState<string | null>(null);
  const [hasNavigated, setHasNavigated] = useState(false);

  useEffect(() => {
    let activo = true;

    obtenerMesasActivas()
      .then(() => {
        if (activo) setError(null);
      })
      .catch(() => {
        if (activo) setError('No se pudo conectar con el restaurante. Revisa tu conexión.');
      });

    return () => {
      activo = false;
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      setHasNavigated(false);
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    }, [])
  );

  const irACarta = () => {
    if (hasNavigated) return;
    setHasNavigated(true);
    router.push('/carta');
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (event.nativeEvent.contentOffset.y > 100) irACarta();
  };

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <StatusBar style="light" />

      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={styles.scrollContent}
      >
        <ImageBackground source={FONDO} style={styles.background} resizeMode="cover">
          <View style={styles.overlay} pointerEvents="none" />

          <BotonAdmin tamano="grande" style={styles.adminUbicacion} />

          <View style={styles.content}>
            <View style={styles.encabezado}>
              <Text style={styles.kicker}>KONYS PIZZA · BUCARAMANGA</Text>
              <Text style={styles.logo}>KONYS</Text>
              <View style={styles.linea} />
              <Text style={styles.eslogan}>La pizza más icónica de la ciudad</Text>
              <View style={styles.horario}>
                <Ionicons name="time-outline" size={16} color={COLORES.crema} />
                <Text style={styles.horarioTexto}>12:30–2:30 · 5–11 p. m.</Text>
              </View>
            </View>

            <View style={styles.acciones}>
              <Pressable style={styles.botonPrincipal} onPress={() => router.push('/reservar')}>
                <Ionicons name="calendar-outline" size={22} color={COLORES.texto} />
                <Text style={styles.botonPrincipalTexto}>Reservar mesa</Text>
              </Pressable>

              <Pressable style={styles.botonSecundario} onPress={irACarta}>
                <Ionicons name="restaurant-outline" size={20} color={COLORES.crema} />
                <Text style={styles.botonSecundarioTexto}>Ver la carta</Text>
              </Pressable>

              <Pressable style={styles.enlaceUbicacion} onPress={() => router.push('/contacto')}>
                <Ionicons name="location-outline" size={17} color={COLORES.crema} />
                <Text style={styles.enlaceUbicacionTexto}>Ver ubicación</Text>
              </Pressable>
            </View>

            {error && <Text style={styles.estadoError}>{error}</Text>}

            <View style={styles.pista} pointerEvents="none">
              <Ionicons name="chevron-down" size={18} color={COLORES.texto} />
              <Text style={styles.pistaTexto}>Desliza para ver la carta</Text>
            </View>
          </View>
        </ImageBackground>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#12100E',
  },
  scrollContent: {
    flexGrow: 1,
  },
  background: {
    width: '100%',
    minHeight: SCREEN_HEIGHT + 200,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.62)',
  },
  adminUbicacion: {
    position: 'absolute',
    top: 56,
    right: 20,
    zIndex: 10,
  },
  content: {
    minHeight: SCREEN_HEIGHT,
    paddingHorizontal: 26,
    paddingTop: SCREEN_HEIGHT * 0.2,
    paddingBottom: 40,
    alignItems: 'center',
  },
  encabezado: {
    alignItems: 'center',
    width: '100%',
  },
  kicker: {
    color: COLORES.crema,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 3,
    textAlign: 'center',
  },
  logo: {
    color: COLORES.texto,
    fontSize: 64,
    fontWeight: '800',
    letterSpacing: 8,
    marginTop: 8,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 12,
  },
  linea: {
    width: 64,
    height: 3,
    borderRadius: 2,
    backgroundColor: COLORES.naranja,
    marginTop: 10,
  },
  eslogan: {
    color: COLORES.texto,
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 14,
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  horario: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  horarioTexto: {
    color: COLORES.textoSuave,
    fontSize: 15,
    fontWeight: '600',
  },
  acciones: {
    width: '100%',
    marginTop: SCREEN_HEIGHT * 0.11,
    gap: 14,
  },
  botonPrincipal: {
    backgroundColor: COLORES.naranja,
    height: 60,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  botonPrincipalTexto: {
    color: COLORES.texto,
    fontSize: 19,
    fontWeight: '800',
  },
  botonSecundario: {
    height: 56,
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: COLORES.borde,
    backgroundColor: 'rgba(0,0,0,0.4)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  botonSecundarioTexto: {
    color: COLORES.crema,
    fontSize: 17,
    fontWeight: '700',
  },
  enlaceUbicacion: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 6,
  },
  enlaceUbicacionTexto: {
    color: COLORES.crema,
    fontSize: 15,
    fontWeight: '600',
  },
  estadoError: {
    marginTop: 18,
    color: '#FF8A80',
    fontSize: 14,
    textAlign: 'center',
  },
  pista: {
    marginTop: 30,
    alignItems: 'center',
    gap: 2,
  },
  pistaTexto: {
    color: COLORES.texto,
    fontSize: 13,
    fontWeight: '600',
    opacity: 0.85,
  },
});
