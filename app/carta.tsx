// -------------------------------------------------------------
// PANTALLA: Carta
// Dos vistas: la lista de apartados (Recomendados, Pizzas...)
// y la lista de platos del apartado elegido.
// Solo se muestran los platos disponibles en la base de datos.
// FlatList y SectionList: https://reactnative.dev/docs/flatlist
// -------------------------------------------------------------
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
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
import { obtenerPlatosDisponibles } from '../services/platos';
import { imagenPlato } from '../services/platos-imagenes';
import { formatoPrecio } from '../utils/formato';

const FONDO = require('../assets/images/FondoReservarMesa.png');

// Propiedades equivalentes a absoluteFillObject, escritas explícitamente
const fillStyle = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
} as const;

// Apartados de la carta. La clave "id" es la misma categoria de la base de datos
const CATEGORIAS = [
  { id: 'recomendados', label: 'Recomendados', imagen: require('../assets/images/categorias/recomendados.jpg') },
  { id: 'entradas', label: 'Entradas', imagen: require('../assets/images/categorias/entradas.jpg') },
  { id: 'menu-infantil', label: 'Menú Infantil', imagen: require('../assets/images/categorias/menu-infantil.jpg') },
  { id: 'pizzas', label: 'Pizzas', imagen: require('../assets/images/categorias/pizzas.jpg') },
  { id: 'desgranados', label: 'Desgranados', imagen: require('../assets/images/categorias/desgranados.jpg') },
  { id: 'papas', label: 'Papas Ikónicas', imagen: require('../assets/images/categorias/papas.jpg') },
  { id: 'lasana', label: 'Lasaña', imagen: require('../assets/images/categorias/lasana.jpg') },
  { id: 'granizados', label: 'Granizados', imagen: require('../assets/images/categorias/granizados.jpg') },
  { id: 'sodas', label: 'Sodas', imagen: require('../assets/images/categorias/sodas.jpg') },
  { id: 'bebidas', label: 'Bebidas Frías', imagen: require('../assets/images/categorias/bebidas.jpg') },
  { id: 'cerveza', label: 'Cerveza', imagen: require('../assets/images/categorias/cerveza.jpg') },
  { id: 'cocteles', label: 'Cócteles', imagen: require('../assets/images/categorias/cocteles.jpg') },
  { id: 'postres', label: 'Postres', imagen: require('../assets/images/categorias/postres.jpg') },
  { id: 'almuerzos', label: 'Menú Almuerzos', imagen: require('../assets/images/categorias/almuerzos.jpg') },
  { id: 'congelados', label: 'Congelados', imagen: require('../assets/images/categorias/congelados.jpg') },
];

type Plato = {
  id: number;
  nombre: string;
  categoria: string;
  subcategoria: string | null;
  descripcion: string | null;
  precio: number;
  disponible: boolean;
  recomendado: boolean;
};

export default function Carta() {
  const [seleccion, setSeleccion] = useState<string | null>(null);
  const [platos, setPlatos] = useState<Plato[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    let activo = true;

    // Si la pantalla se cierra antes de terminar, el resultado se ignora
    async function cargar() {
      setCargando(true);
      setError(null);
      const { data, error: err } = await obtenerPlatosDisponibles();

      if (!activo) return;
      if (err) {
        setError('No se pudo cargar la carta. Revisa tu conexión.');
      } else {
        setPlatos((data as Plato[]) || []);
      }
      setCargando(false);
    }

    cargar();
    return () => {
      activo = false;
    };
  }, [intento]);

  const categoriaActual = CATEGORIAS.find((c) => c.id === seleccion) || null;

  const filtrados = useMemo(() => {
    if (!seleccion) return [];
    if (seleccion === 'recomendados') return platos.filter((p) => p.recomendado);
    return platos.filter((p) => p.categoria === seleccion);
  }, [platos, seleccion]);

  const conteo = useMemo(() => {
    const mapa: Record<string, number> = {};
    for (const p of platos) {
      mapa[p.categoria] = (mapa[p.categoria] ?? 0) + 1;
    }
    return mapa;
  }, [platos]);

  if (cargando) {
    return (
      <ImageBackground source={FONDO} style={styles.fondo} resizeMode="cover">
        <View style={styles.overlay} pointerEvents="none" />
        <View style={styles.cargando}>
          <ActivityIndicator size="large" color="#F28C28" />
        </View>
      </ImageBackground>
    );
  }

  if (error) {
    return (
      <ImageBackground source={FONDO} style={styles.fondo} resizeMode="cover">
        <View style={styles.overlay} pointerEvents="none" />
        <SafeAreaView style={styles.center}>
          <Text style={styles.errorTexto}>{error}</Text>
          <Pressable style={styles.botonReintentar} onPress={() => setIntento((i) => i + 1)}>
            <Text style={styles.botonReintentarTexto}>Reintentar</Text>
          </Pressable>
        </SafeAreaView>
      </ImageBackground>
    );
  }

  // ===== VISTA DE PRODUCTOS DE UN APARTADO =====
  if (categoriaActual) {
    return (
      <ImageBackground source={FONDO} style={styles.fondo} resizeMode="cover">
        <View style={styles.overlay} pointerEvents="none" />

        <SafeAreaView style={styles.container}>
          <StatusBar style="light" />

          <View style={styles.encabezadoLista}>
            <Pressable style={styles.botonAtras} onPress={() => setSeleccion(null)}>
              <Text style={styles.atrasTexto}>Volver</Text>
            </Pressable>
            <View>
              <Text style={styles.tituloLista}>{categoriaActual.label}</Text>
              <Text style={styles.subtituloLista}>{filtrados.length} productos</Text>
            </View>
          </View>

          <FlatList
            data={filtrados}
            keyExtractor={(plato) => String(plato.id)}
            numColumns={2}
            columnWrapperStyle={styles.fila}
            contentContainerStyle={styles.grid}
            ListEmptyComponent={<Text style={styles.vacio}>No hay productos en este apartado.</Text>}
            renderItem={({ item }) => {
              const imagen = imagenPlato(item.nombre);
              const agotado = !item.disponible;
              return (
                <View style={[styles.carta, agotado && styles.cartaAgotada]}>
                  {imagen ? (
                    <ImageBackground
                      source={imagen}
                      style={fillStyle}
                      imageStyle={styles.cartaImagen}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.cartaIconoFondo}>
                      {/* Icono de reserva si el plato no tiene foto */}
                      <Ionicons name="restaurant-outline" size={44} color="#F28C28" />
                    </View>
                  )}

                  <View style={styles.cartaGradiente} pointerEvents="none" />

                  {agotado && (
                    <View style={styles.badgeAgotado}>
                      <Text style={styles.badgeAgotadoTexto}>AGOTADO</Text>
                    </View>
                  )}

                  <View style={styles.cartaContenido}>
                    <Text style={styles.nombre} numberOfLines={2}>
                      {item.nombre}
                    </Text>
                    <View style={styles.filaInf}>
                      <Text style={styles.precio}>{formatoPrecio(item.precio)}</Text>
                      {item.recomendado && (
                        <Ionicons name="star" size={16} color="#F28C28" />
                      )}
                    </View>
                  </View>
                </View>
              );
            }}
          />
        </SafeAreaView>
      </ImageBackground>
    );
  }

  // ===== VISTA DE APARTADOS (HOME DE LA CARTA) =====
  return (
    <ImageBackground source={FONDO} style={styles.fondo} resizeMode="cover">
      <View style={styles.overlay} pointerEvents="none" />

      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />

        <View style={styles.encabezado}>
          <Text style={styles.titulo}>Carta</Text>
          <Text style={styles.subtitulo}>Elige un apartado</Text>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listaCategorias}
        >
          {CATEGORIAS.map((c) => {
            const cantidad = c.id === 'recomendados'
              ? platos.filter((p) => p.recomendado).length
              : conteo[c.id] ?? 0;
            return (
              <Pressable
                key={c.id}
                style={styles.tarjetaCategoria}
                onPress={() => setSeleccion(c.id)}
              >
                <ImageBackground
                  source={c.imagen}
                  style={fillStyle}
                  imageStyle={styles.tarjetaCategoriaImagen}
                  resizeMode="cover"
                />
                <View style={styles.tarjetaCategoriaOverlay} pointerEvents="none" />
                <View style={styles.tarjetaCategoriaContenido}>
                  <Text style={styles.tarjetaCategoriaTitulo}>{c.label}</Text>
                  <Text style={styles.tarjetaCategoriaMeta}>{cantidad} productos</Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  fondo: {
    flex: 1,
    backgroundColor: '#0d2b3e',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  container: {
    flex: 1,
  },
  encabezado: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
  },
  titulo: {
    fontSize: 34,
    fontWeight: '800',
    color: '#FFFFFF',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 2 },
    textShadowRadius: 4,
  },
  subtitulo: {
    fontSize: 15,
    color: '#E2E2E2',
    marginTop: 4,
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  listaCategorias: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 14,
  },
  tarjetaCategoria: {
    height: 148,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  tarjetaCategoriaImagen: {
    borderRadius: 20,
  },
  tarjetaCategoriaOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.32)',
  },
  tarjetaCategoriaContenido: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 18,
  },
  tarjetaCategoriaTitulo: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  tarjetaCategoriaMeta: {
    fontSize: 13,
    color: '#EDEDED',
    marginTop: 2,
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  encabezadoLista: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
  },
  botonAtras: {
    width: 88,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.6)',
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  atrasTexto: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  tituloLista: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFF',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  subtituloLista: {
    fontSize: 13,
    color: '#D6D6D6',
    marginTop: 2,
  },
  grid: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  fila: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  carta: {
    width: '48.5%',
    height: 190,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    backgroundColor: 'rgba(18,18,18,0.85)',
  },
  cartaAgotada: {
    opacity: 0.55,
  },
  cartaImagen: {
    borderRadius: 18,
  },
  cartaIconoFondo: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#241E17',
  },
  cartaGradiente: {
    position: 'absolute',
    top: '45%',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  cartaContenido: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 10,
  },
  nombre: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 18,
  },
  filaInf: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  precio: {
    color: '#F2EFEA',
    fontSize: 15,
    fontWeight: '800',
  },
  badgeAgotado: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.75)',
    borderWidth: 1.5,
    borderColor: '#FF6B6B',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeAgotadoTexto: {
    color: '#FF6B6B',
    fontSize: 11,
    fontWeight: '800',
  },
  vacio: {
    color: '#FFF',
    textAlign: 'center',
    marginTop: 60,
    fontSize: 16,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  cargando: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorTexto: {
    color: '#FF6B6B',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 24,
  },
  botonReintentar: {
    backgroundColor: '#F28C28',
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 24,
  },
  botonReintentarTexto: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: 16,
  },
});