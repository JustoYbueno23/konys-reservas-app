import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Dimensions, ImageBackground, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../services/supabase';

export const options = {
  headerShown: false,
};

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const BORDE = 'rgba(255, 255, 255, 0.6)';
const CAJA = 'rgba(0, 0, 0, 0.45)';
const BOTON = '#F28C28';
const BOTON_TEXTO = '#FFFFFF';
const CIRCULO = 150;
const ANILLO = 190;

export default function Inicio() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);

  const [mesas, setMesas] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [hasNavigated, setHasNavigated] = useState(false);

  useEffect(() => {
    supabase
      .from('mesas')
      .select('*')
      .then(({ data, error }) => {
        if (error) {
          setError(error.message);
        } else {
          setMesas(data || []);
        }
      });
  }, []);

  useFocusEffect(
    useCallback(() => {
      setHasNavigated(false);
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    }, [])
  );

  const handleScroll = (event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    if (offsetY > 100 && !hasNavigated) {
      setHasNavigated(true);
      router.push('/carta');
    }
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
        <ImageBackground
          source={require('../assets/images/fondoInicio.jpg')}
          style={styles.background}
          resizeMode="cover"
        >
          <View style={styles.overlay} />

          <Pressable
            style={styles.adminButton}
            onPress={() => router.push('/admin')}
          >
            <Text style={styles.adminLetter}>A</Text>
          </Pressable>

          <View style={styles.content}>
            <View style={styles.logoBox}>
              <Text style={styles.logoText}>KONYS</Text>
            </View>

            <View style={styles.chip}>
              <Text style={styles.chipText}>La pizza más icónica</Text>
            </View>

            <View style={styles.chip}>
              <Text style={styles.chipText}>12:30–2:30 · 5–11 p. m.</Text>
            </View>

            <View style={styles.anillo}>
              <Pressable
                style={styles.reservarButton}
                onPress={() => router.push('/reservar')}
              >
                <Text style={styles.reservarButtonText}>
                  Reservar{'\n'}mesa
                </Text>
              </Pressable>
            </View>

            {error && <Text style={styles.estadoError}>Error: {error}</Text>}

            <View style={styles.hint} pointerEvents="none">
              <Text style={styles.hintText}>Desliza: ver la carta</Text>
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
    backgroundColor: '#000000',
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
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  adminButton: {
    position: 'absolute',
    top: 56,
    right: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    backgroundColor: CAJA,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  adminLetter: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 20,
  },
  content: {
    height: SCREEN_HEIGHT,
    alignItems: 'center',
    paddingTop: SCREEN_HEIGHT * 0.2,
    paddingHorizontal: 24,
  },
  logoBox: {
    width: '72%',
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDE,
    backgroundColor: CAJA,
    alignItems: 'center',
  },
  logoText: {
    fontSize: 52,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  chip: {
    marginTop: 12,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BORDE,
    backgroundColor: CAJA,
  },
  chipText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  anillo: {
    marginTop: SCREEN_HEIGHT * 0.1,
    width: ANILLO,
    height: ANILLO,
    borderRadius: ANILLO / 2,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reservarButton: {
    width: CIRCULO,
    height: CIRCULO,
    borderRadius: CIRCULO / 2,
    backgroundColor: BOTON,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  reservarButtonText: {
    color: BOTON_TEXTO,
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  estadoError: {
    marginTop: 16,
    color: '#FF6B6B',
    fontSize: 14,
    textAlign: 'center',
  },
  hint: {
    position: 'absolute',
    bottom: 48,
    alignSelf: 'center',
  },
  hintText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    opacity: 0.9,
    textShadowColor: '#000000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
});