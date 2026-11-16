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
import { supabase } from '../services/supabase';

export const options = {
  headerShown: false,
};

const FONDO = require('../assets/images/FondoReservarMesa.png');

// Propiedades equivalentes a absoluteFillObject, escritas explícitamente
const fillStyle = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
} as const;

const CATEGORIAS = [
  { id: 'recomendados', label: 'Recomendados', emoji: '⭐', imagen: require('../assets/images/categorias/recomendados.jpg') },
  { id: 'entradas', label: 'Entradas', emoji: '🥟', imagen: require('../assets/images/categorias/entradas.jpg') },
  { id: 'menu-infantil', label: 'Menú Infantil', emoji: '👶', imagen: require('../assets/images/categorias/menu-infantil.jpg') },
  { id: 'pizzas', label: 'Pizzas', emoji: '🍕', imagen: require('../assets/images/categorias/pizzas.jpg') },
  { id: 'desgranados', label: 'Desgranados', emoji: '🥘', imagen: require('../assets/images/categorias/desgranados.jpg') },
  { id: 'papas', label: 'Papas Ikónicas', emoji: '🍟', imagen: require('../assets/images/categorias/papas.jpg') },
  { id: 'lasana', label: 'Lasaña', emoji: '🍝', imagen: require('../assets/images/categorias/lasana.jpg') },
  { id: 'granizados', label: 'Granizados', emoji: '🧊', imagen: require('../assets/images/categorias/granizados.jpg') },
  { id: 'sodas', label: 'Sodas', emoji: '🧃', imagen: require('../assets/images/categorias/sodas.jpg') },
  { id: 'bebidas', label: 'Bebidas Frías', emoji: '🥤', imagen: require('../assets/images/categorias/bebidas.jpg') },
  { id: 'cerveza', label: 'Cerveza', emoji: '🍺', imagen: require('../assets/images/categorias/cerveza.jpg') },
  { id: 'cocteles', label: 'Cócteles', emoji: '🍹', imagen: require('../assets/images/categorias/cocteles.jpg') },
  { id: 'postres', label: 'Postres', emoji: '🍨', imagen: require('../assets/images/categorias/postres.jpg') },
  { id: 'almuerzos', label: 'Menú Almuerzos', emoji: '🍝', imagen: require('../assets/images/categorias/almuerzos.jpg') },
  { id: 'congelados', label: 'Congelados', emoji: '❄️', imagen: require('../assets/images/categorias/congelados.jpg') },
];

const PLATO_IMG: Record<string, any> = {
  'Entrada mini Konitos': require('../assets/images/platos/entrada-mini-konitos.jpg'),
  'Nachos Enchulados': require('../assets/images/platos/nachos-enchulados.jpg'),
  'Salchipuplitos': require('../assets/images/platos/salchipuplitos.jpg'),
  'Chezki Chicken': require('../assets/images/platos/chezki-chicken.jpg'),
  'Bukara Ganadora Pizza Master': require('../assets/images/platos/bukara-ganadora.jpg'),
  'Konys Dulcinea': require('../assets/images/platos/konys-dulcinea.jpg'),
  'Colombianisma': require('../assets/images/platos/colombianisima.jpg'),
  'Lasagna': require('../assets/images/platos/lasagna.jpg'),
  'Ikónica': require('../assets/images/platos/iconica.jpg'),
  'Carbonara': require('../assets/images/platos/carbonara.jpg'),
  'Hawaiiana': require('../assets/images/platos/hawaiana.jpg'),
  'Mexicana': require('../assets/images/platos/mexicana.jpg'),
  'Chicken': require('../assets/images/platos/chicken.jpg'),
  'Veggie': require('../assets/images/platos/veggie.jpg'),
  'BBQ': require('../assets/images/platos/bbq.jpg'),
  'Teriyork': require('../assets/images/platos/teriyork.jpg'),
  'Especial': require('../assets/images/platos/especial.jpg'),
  'Carnes (Auténtica Pepperoni)': require('../assets/images/platos/carnes.jpg'),
  'Mar & Tierra': require('../assets/images/platos/mar-y-tierra.jpg'),
  'Marinera': require('../assets/images/platos/marinera.jpg'),
  'Italianisma': require('../assets/images/platos/italianisma.jpg'),
  'Bonciola': require('../assets/images/platos/bonciola.jpg'),
  'Combo Amigos X4': require('../assets/images/platos/combo-amigos-x4.jpg'),
  'Combo Parche X6': require('../assets/images/platos/combo-parche-x6.jpg'),
  'Desgranado de Carne': require('../assets/images/platos/desgranado-de-carne.jpg'),
  'Desgranado Pollo': require('../assets/images/platos/desgranado-pollo.jpg'),
  'Papas Locas': require('../assets/images/platos/papas-locas.jpg'),
  'Chicken Fries Mini': require('../assets/images/platos/chicken-fries-mini.jpg'),
  'Chodrino Mini': require('../assets/images/platos/chodofries-mini.jpg'),
  'Salchichfries Mini': require('../assets/images/platos/salchichfries-mini.jpg'),
  'Porción de Papas': require('../assets/images/platos/porcion-de-papas.jpg'),
  'Lasaña (Sabor del Día)': require('../assets/images/platos/lasana.jpg'),
  'MaracuMango': require('../assets/images/platos/maracumango.jpg'),
  'Soda Frutos Rojos': require('../assets/images/platos/soda-frutos-rojos.jpg'),
};

const EMOJI_POR_CATEGORIA: Record<string, string> = {
  entradas: '🥟',
  'menu-infantil': '👶',
  pizzas: '🍕',
  desgranados: '🥘',
  papas: '🍟',
  lasana: '🍝',
  granizados: '🧊',
  sodas: '🧃',
  bebidas: '🥤',
  cerveza: '🍺',
  cocteles: '🍹',
  postres: '🍨',
  almuerzos: '🍝',
  congelados: '❄️',
};

function formatearPrecio(precio: number) {
  return '$ ' + String(precio).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

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

    async function cargar() {
      setCargando(true);
      setError(null);
      const { data, error: err } = await supabase
        .from('platos')
        .select('*')
        .eq('disponible', true)
        .order('categoria')
        .order('precio');

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
              <Text style={styles.atrasTexto}>‹ Volver</Text>
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
              const imagen = PLATO_IMG[item.nombre];
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
                      <Text style={styles.cartaIcono}>
                        {EMOJI_POR_CATEGORIA[item.categoria] ?? '🍽️'}
                      </Text>
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
                      <Text style={styles.precio}>{formatearPrecio(item.precio)}</Text>
                      {item.recomendado && <Text style={styles.chipRec}>⭐</Text>}
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
  cartaIcono: {
    fontSize: 56,
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
  chipRec: {
    fontSize: 15,
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