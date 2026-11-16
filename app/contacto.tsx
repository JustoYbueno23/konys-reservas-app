import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { Linking, ImageBackground, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BotonVolver } from '../components/BotonVolver';

const FONDO = require('../assets/images/fondoInicio.jpg');

const COLORES = {
  naranja: '#F28C28',
  oscuro: '#1A1A1A',
  texto: '#FFFFFF',
  textoSuave: '#C8C8C8',
  caja: 'rgba(18, 18, 18, 0.85)',
  borde: 'rgba(255, 255, 255, 0.2)',
};

const NOMBRE = 'Konys pizza kono';
const DIRECCION_COMPLETA = 'Konys pizza kono, Carrera 36 #38-41, El Prado, Bucaramanga, Santander, Colombia';

export default function Contacto() {
  const abrirMapa = () => {
    const url = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(DIRECCION_COMPLETA);
    Linking.openURL(url);
  };

  return (
    <ImageBackground source={FONDO} style={styles.fondo} resizeMode="cover">
      <View style={styles.capaOscura} />

      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />

        <ScrollView
          contentContainerStyle={styles.contenido}
          showsVerticalScrollIndicator={false}
        >
          <BotonVolver style={styles.margenVolver} />

          <Text style={styles.titulo}>Ubicación</Text>
          <Text style={styles.subtitulo}>Así llegas a Konys</Text>

          <View style={styles.caja}>
            <View style={styles.filaCabecera}>
              <Ionicons name="location-outline" size={30} color={COLORES.naranja} />
              <Text style={styles.nombreRestaurante}>{NOMBRE}</Text>
            </View>

            <View style={styles.filaDetalle}>
              <Ionicons name="map-outline" size={18} color={COLORES.textoSuave} />
              <Text style={styles.textoDetalle}>Carrera 36 #38-41</Text>
            </View>
            <View style={styles.filaDetalle}>
              <Ionicons name="navigate-outline" size={18} color={COLORES.textoSuave} />
              <Text style={styles.textoDetalle}>El Prado, Bucaramanga, Santander, Colombia</Text>
            </View>
            <View style={styles.filaDetalle}>
              <Ionicons name="time-outline" size={18} color={COLORES.textoSuave} />
              <Text style={styles.textoDetalle}>12:30–2:30 · 5–11 p. m.</Text>
            </View>
          </View>

          <Pressable style={styles.botonMaps} onPress={abrirMapa}>
            <Ionicons name="navigate" size={22} color={COLORES.oscuro} />
            <Text style={styles.textoMaps}>Cómo llegar</Text>
          </Pressable>
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
    backgroundColor: 'rgba(0, 0, 0, 0.62)',
  },
  container: {
    flex: 1,
  },
  contenido: {
    padding: 20,
    paddingBottom: 40,
  },
  margenVolver: {
    marginBottom: 14,
  },
  titulo: {
    color: COLORES.texto,
    fontSize: 38,
    fontWeight: '800',
  },
  subtitulo: {
    color: COLORES.textoSuave,
    fontSize: 16,
    marginTop: 4,
    marginBottom: 18,
  },
  caja: {
    backgroundColor: COLORES.caja,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORES.borde,
    padding: 18,
    marginBottom: 16,
    gap: 12,
  },
  filaCabecera: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 4,
  },
  nombreRestaurante: {
    color: COLORES.texto,
    fontSize: 22,
    fontWeight: 'bold',
    flexShrink: 1,
  },
  filaDetalle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  textoDetalle: {
    color: COLORES.texto,
    fontSize: 16,
    flexShrink: 1,
  },
  botonMaps: {
    backgroundColor: '#F2EFEA',
    height: 58,
    borderRadius: 29,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  textoMaps: {
    color: COLORES.oscuro,
    fontSize: 18,
    fontWeight: 'bold',
  },
});
