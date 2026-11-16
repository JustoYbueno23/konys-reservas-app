import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  ImageBackground,
  Modal,
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

const FONDO = require('../assets/images/fondos/pizzas.webp');

const fillStyle = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
} as const;

const CATEGORIAS = [
  { id: 'recomendados', label: 'Recomendados', imagen: require('../assets/images/categorias/recomendados.webp') },
  { id: 'entradas', label: 'Entradas', imagen: require('../assets/images/categorias/entradas.webp') },
  { id: 'menu-infantil', label: 'Menú Infantil', imagen: require('../assets/images/categorias/menu-infantil.webp') },
  { id: 'pizzas', label: 'Pizzas', imagen: require('../assets/images/categorias/pizzas.webp') },
  { id: 'desgranados', label: 'Desgranados', imagen: require('../assets/images/categorias/desgranados.webp') },
  { id: 'papas', label: 'Papas Ikónicas', imagen: require('../assets/images/categorias/papas.webp') },
  { id: 'lasana', label: 'Lasaña', imagen: require('../assets/images/categorias/lasana.webp') },
  { id: 'granizados', label: 'Granizados', imagen: require('../assets/images/categorias/granizados.webp') },
  { id: 'sodas', label: 'Sodas', imagen: require('../assets/images/categorias/sodas.webp') },
  { id: 'bebidas', label: 'Bebidas Frías', imagen: require('../assets/images/categorias/bebidas.webp') },
  { id: 'cerveza', label: 'Cerveza', imagen: require('../assets/images/categorias/cerveza.webp') },
  { id: 'cocteles', label: 'Cócteles', imagen: require('../assets/images/categorias/cocteles.webp') },
  { id: 'postres', label: 'Postres', imagen: require('../assets/images/categorias/postres.webp') },
  { id: 'almuerzos', label: 'Menú Almuerzos', imagen: require('../assets/images/categorias/almuerzos.webp') },
  { id: 'congelados', label: 'Congelados', imagen: require('../assets/images/categorias/congelados.webp') },
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

function FichaPlato({ plato, alCerrar }: { plato: Plato; alCerrar: () => void }) {
  const imagen = imagenPlato(plato.nombre);
  const categoria = CATEGORIAS.find((c) => c.id === plato.categoria);

  return (
    <Modal visible={!!plato} animationType="slide" onRequestClose={alCerrar}>
      <SafeAreaView style={styles.fichaPantalla}>
        <StatusBar style="light" />
        <ScrollView contentContainerStyle={styles.fichaContenido}>
          <View style={styles.fichaImagenCaja}>
            {imagen ? (
              <Image source={imagen} style={styles.fichaImagen} resizeMode="cover" />
            ) : (
              <View style={styles.fichaImagenVacia}>
                <Ionicons name="restaurant-outline" size={70} color="#F28C28" />
              </View>
            )}
            <Pressable style={styles.fichaCerrar} onPress={alCerrar}>
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </Pressable>
          </View>

          <View style={styles.fichaDatos}>
            <Text style={styles.fichaCategoria}>{categoria?.label ?? plato.categoria}</Text>
            <Text style={styles.fichaNombre}>{plato.nombre}</Text>
            <Text style={styles.fichaPrecio}>{formatoPrecio(plato.precio)}</Text>

            {plato.descripcion ? (
              <Text style={styles.fichaDescripcion}>{plato.descripcion}</Text>
            ) : (
              <Text style={styles.fichaSinDescripcion}>Producto de la carta de Konys</Text>
            )}

            {plato.recomendado && (
              <View style={styles.fichaRecomendado}>
                <Ionicons name="star" size={15} color="#F28C28" />
                <Text style={styles.fichaRecomendadoTexto}>Recomendado</Text>
              </View>
            )}

            <Pressable style={styles.fichaBoton} onPress={alCerrar}>
              <Text style={styles.fichaBotonTexto}>Volver a la carta</Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

export default function Carta() {
  const [seleccion, setSeleccion] = useState<string | null>(null);
  const [platos, setPlatos] = useState<Plato[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [intento, setIntento] = useState(0);
  const [platoAbierto, setPlatoAbierto] = useState<Plato | null>(null);

  useEffect(() => {
    let activo = true;

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
              return (
                <Pressable style={styles.carta} onPress={() => setPlatoAbierto(item)}>
                  {imagen ? (
                    <ImageBackground
                      source={imagen}
                      style={fillStyle}
                      imageStyle={styles.cartaImagen}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.cartaIconoFondo}>
                      <Ionicons name="restaurant-outline" size={44} color="#F28C28" />
                    </View>
                  )}

                  <View style={styles.cartaGradiente} pointerEvents="none" />

                  <View style={styles.cartaContenido}>
                    <Text style={styles.nombre} numberOfLines={2}>
                      {item.nombre}
                    </Text>
                    <View style={styles.filaInf}>
                      <Text style={styles.precio}>{formatoPrecio(item.precio)}</Text>
                      <Ionicons name="information-circle-outline" size={17} color="#F2EFEA" />
                    </View>
                  </View>
                </Pressable>
              );
            }}
          />
        </SafeAreaView>

        {platoAbierto && (
          <FichaPlato plato={platoAbierto} alCerrar={() => setPlatoAbierto(null)} />
        )}
      </ImageBackground>
    );
  }

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
    backgroundColor: 'rgba(0,0,0,0.38)',
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
  fichaPantalla: {
    flex: 1,
    backgroundColor: '#12100E',
  },
  fichaContenido: {
    paddingBottom: 30,
  },
  fichaImagenCaja: {
    width: '100%',
    height: 320,
    backgroundColor: '#241E17',
  },
  fichaImagen: {
    width: '100%',
    height: 320,
  },
  fichaImagenVacia: {
    width: '100%',
    height: 320,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fichaCerrar: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fichaDatos: {
    padding: 22,
  },
  fichaCategoria: {
    color: '#F28C28',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  fichaNombre: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '800',
    marginTop: 6,
  },
  fichaPrecio: {
    color: '#F2EFEA',
    fontSize: 22,
    fontWeight: '800',
    marginTop: 8,
  },
  fichaDescripcion: {
    color: '#E8E4DE',
    fontSize: 17,
    lineHeight: 26,
    marginTop: 20,
  },
  fichaSinDescripcion: {
    color: '#9DA9B7',
    fontSize: 15,
    fontStyle: 'italic',
    marginTop: 20,
  },
  fichaRecomendado: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 18,
  },
  fichaRecomendadoTexto: {
    color: '#F28C28',
    fontSize: 14,
    fontWeight: '700',
  },
  fichaBoton: {
    backgroundColor: '#F2EFEA',
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 26,
  },
  fichaBotonTexto: {
    color: '#1A1A1A',
    fontSize: 17,
    fontWeight: '800',
  },
});
