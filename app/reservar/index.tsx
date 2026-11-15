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
import { obtenerMesasActivas } from '../../services/mesas';

export const options = {
    headerShown: false,
};

const FONDO = require('../../assets/images/FondoReservarMesa.png');
const MESA = require('../../assets/images/MesasFondo.png');
const TERRAZA_FONDO = require('../../assets/images/TerrazaFondo.jpg');
const SALON_FONDO = require('../../assets/images/SalonFondo.jpg');

// Zona según la base de datos
type Mesa = { id: string; nombre: string; zona: string; capacidad: number };

// Zonas que muestra la pantalla: nombre en la base, título bonito y foto
const ZONAS = [
    { clave: 'terraza', titulo: 'Terraza', foto: TERRAZA_FONDO, emoji: '🌿', icono: 'PORCIÓN DE PATIO' },
    { clave: 'salon', titulo: 'Salón', foto: SALON_FONDO, emoji: '🕯️', icono: 'PORCIÓN DE SALÓN' },
];

const TAMANO = 96;

const IMG_W = 345;
const IMG_H = 724;
const MESA_CX = 172;
const MESA_CY = 365;
const MESA_DIAMETRO = 290;
const ESCALA = TAMANO / MESA_DIAMETRO;

// "Mesa 3" -> "3"
function numeroDeMesa(nombre: string) {
    return nombre.replace(/\D/g, '');
}

function MesaCirculo({
    mesa,
    seleccionada,
    alTocar,
}: {
    mesa: Mesa;
    seleccionada: boolean;
    alTocar: () => void;
}) {
    return (
        <View style={styles.mesaItem}>
            <Pressable
                onPress={alTocar}
                style={[styles.burbuja, seleccionada && styles.burbujaSeleccionada]}
            >
                <Image
                    source={MESA}
                    resizeMode="stretch"
                    style={{
                        position: 'absolute',
                        width: IMG_W * ESCALA,
                        height: IMG_H * ESCALA,
                        left: TAMANO / 2 - MESA_CX * ESCALA,
                        top: TAMANO / 2 - MESA_CY * ESCALA,
                    }}
                />
                <View style={[styles.numeroCirculo, seleccionada && styles.numeroCirculoSel]}>
                    <Text style={[styles.numero, seleccionada && styles.numeroSel]}>
                        {numeroDeMesa(mesa.nombre)}
                    </Text>
                </View>
            </Pressable>
            <View style={styles.capacidadPill}>
                <Text style={styles.capacidad}>{mesa.capacidad} pers.</Text>
            </View>
        </View>
    );
}

function TarjetaZona({
    titulo,
    foto,
    emoji,
    mesas,
    mesaElegida,
    alElegir,
}: {
    titulo: string;
    foto: any;
    emoji: string;
    mesas: Mesa[];
    mesaElegida: string | null;
    alElegir: (id: string) => void;
}) {
    return (
        <ImageBackground
            source={foto}
            style={styles.tarjeta}
            imageStyle={styles.tarjetaFoto}
            resizeMode="cover"
        >
            <View style={styles.tarjetaOverlay} pointerEvents="none" />
            <View style={styles.pastilla}>
                <Text style={styles.pastillaTexto}>
                    {emoji} {titulo} · {mesas.length} {mesas.length === 1 ? 'mesa' : 'mesas'}
                </Text>
            </View>
            <View style={styles.filaMesas}>
                {mesas.map((mesa) => (
                    <MesaCirculo
                        key={mesa.id}
                        mesa={mesa}
                        seleccionada={mesaElegida === mesa.id}
                        alTocar={() => alElegir(mesa.id)}
                    />
                ))}
            </View>
        </ImageBackground>
    );
}

export default function ReservarIndex() {
    const router = useRouter();

    const [mesas, setMesas] = useState<Mesa[]>([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [mesaElegida, setMesaElegida] = useState<string | null>(null);

    async function cargarMesas() {
        setCargando(true);
        setError(null);
        try {
            const { data } = await obtenerMesasActivas();
            setMesas(data);
        } catch (e) {
            setError('No se pudieron cargar las mesas. Revisa tu conexión.');
        }
        setCargando(false);
    }

    useEffect(() => {
        cargarMesas();
    }, []);

    function continuar() {
        if (!mesaElegida) return;
        router.push({
            pathname: '/reservar/[mesaId]',
            params: { mesaId: mesaElegida },
        });
    }

    function mesasDeZona(clave: string) {
        return mesas
            .filter((m) => m.zona === clave)
            .sort((a, b) => Number(numeroDeMesa(a.nombre)) - Number(numeroDeMesa(b.nombre)));
    }

    return (
        <ImageBackground source={FONDO} style={styles.fondo} resizeMode="cover">
            <View style={styles.overlay} pointerEvents="none" />

            <SafeAreaView style={styles.container}>
                <StatusBar style="light" />

                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                >
                    {/* Barra superior */}
                    <View style={styles.barraSuperior}>
                        <Pressable style={styles.botonBarra} onPress={() => router.back()}>
                            <Text style={styles.textoBarra}>‹ Volver</Text>
                        </Pressable>
                        <Pressable
                            style={styles.adminButton}
                            onPress={() => router.push('/admin')}
                        >
                            <Text style={styles.adminLetter}>A</Text>
                        </Pressable>
                    </View>

                    {/* Encabezado */}
                    <Text style={styles.titulo}>Elige tu mesa</Text>
                    <Text style={styles.subtitulo}>Toca una burbuja para seleccionarla</Text>

                    {cargando && <ActivityIndicator size="large" color="#F28C28" style={styles.cargando} />}

                    {error && (
                        <View style={styles.mensajeCard}>
                            <Text style={styles.mensajeTexto}>{error}</Text>
                            <Pressable style={styles.botonClaro} onPress={cargarMesas}>
                                <Text style={styles.textoBotonClaro}>Reintentar</Text>
                            </Pressable>
                        </View>
                    )}

                    {!cargando && !error && mesas.length === 0 && (
                        <View style={styles.vacioCaja}>
                            <Text style={styles.vacioEmoji}>🪑</Text>
                            <Text style={styles.vacioTexto}>No hay mesas disponibles por ahora</Text>
                            <Text style={styles.vacioSub}>
                                Estamos esperando nuevas mesas. Vuelve pronto.
                            </Text>
                        </View>
                    )}

                    {!cargando &&
                        !error &&
                        ZONAS.map((zona) => {
                            const mesasZona = mesasDeZona(zona.clave);
                            if (mesasZona.length === 0) return null;
                            return (
                                <TarjetaZona
                                    key={zona.clave}
                                    titulo={zona.titulo}
                                    foto={zona.foto}
                                    emoji={zona.emoji}
                                    mesas={mesasZona}
                                    mesaElegida={mesaElegida}
                                    alElegir={setMesaElegida}
                                />
                            );
                        })}

                    <Pressable
                        style={[styles.botonContinuar, !mesaElegida && styles.botonDeshabilitado]}
                        onPress={continuar}
                        disabled={!mesaElegida}
                    >
                        <Text style={styles.textoContinuar}>Continuar</Text>
                    </Pressable>
                </ScrollView>
            </SafeAreaView>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    fondo: {
        flex: 1,
        backgroundColor: '#060c12',
    },
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.42)',
    },
    container: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 40,
    },
    cargando: {
        marginTop: 40,
    },
    barraSuperior: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    botonBarra: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.45)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.18)',
    },
    textoBarra: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '600',
    },
    adminButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.7)',
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    adminLetter: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 18,
    },

    /* ---------- Encabezado principal ---------- */
    titulo: {
        fontSize: 36,
        fontWeight: '900',
        color: '#FFFFFF',
        letterSpacing: 0.3,
        textShadowColor: '#000',
        textShadowOffset: { width: 1.5, height: 1.5 },
        textShadowRadius: 4,
    },
    subtitulo: {
        fontSize: 15,
        color: '#C9C9C9',
        marginTop: 6,
        marginBottom: 18,
    },

    /* ---------- Tarjeta por zona ---------- */
    tarjeta: {
        marginBottom: 22,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.18)',
        padding: 14,
        overflow: 'hidden',
        minHeight: 185,
        justifyContent: 'space-between',
    },
    tarjetaFoto: {
        borderRadius: 24,
    },
    tarjetaOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.55)',
    },
    pastilla: {
        alignSelf: 'flex-start',
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.78)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.28)',
        marginBottom: 12,
    },
    pastillaTexto: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '800',
        textShadowColor: '#000',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    filaMesas: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'flex-start',
        gap: 18,
        marginTop: 6,
    },
    mesaItem: {
        alignItems: 'center',
        width: 108,
    },
    burbuja: {
        width: TAMANO,
        height: TAMANO,
        borderRadius: TAMANO / 2,
        borderWidth: 2.5,
        borderColor: 'rgba(255,255,255,0.55)',
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#3b2a20',
        shadowColor: '#000',
        shadowOpacity: 0.3,
        shadowRadius: 6,
    },
    burbujaSeleccionada: {
        borderColor: '#F28C28',
        borderWidth: 3.5,
        shadowColor: '#F28C28',
        shadowOpacity: 0.6,
        shadowRadius: 10,
    },
    numeroCirculo: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.65)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    numeroCirculoSel: {
        backgroundColor: '#F28C28',
    },
    numero: {
        color: '#FFFFFF',
        fontSize: 22,
        fontWeight: '800',
    },
    numeroSel: {
        color: '#1A1A1A',
    },
    capacidadPill: {
        marginTop: 8,
        backgroundColor: 'rgba(0,0,0,0.8)',
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.22)',
    },
    capacidad: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '800',
        textAlign: 'center',
    },

    /* ---------- Botón continuar ---------- */
    botonContinuar: {
        backgroundColor: '#F2EFEA',
        height: 60,
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 6,
        marginHorizontal: 12,
        borderWidth: 2,
        borderColor: '#F28C28',
    },
    botonDeshabilitado: {
        opacity: 0.35,
    },
    textoContinuar: {
        color: '#1A1A1A',
        fontSize: 18,
        fontWeight: '800',
        letterSpacing: 0.5,
    },

    /* ---------- Mensajes / vacío ---------- */
    mensajeCard: {
        backgroundColor: 'rgba(18,18,18,0.82)',
        borderRadius: 22,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.14)',
        alignItems: 'center',
        marginVertical: 16,
    },
    mensajeTexto: {
        color: '#FFFFFF',
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 14,
    },
    botonClaro: {
        backgroundColor: '#F2EFEA',
        height: 46,
        paddingHorizontal: 26,
        borderRadius: 23,
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#F28C28',
    },
    textoBotonClaro: {
        color: '#1A1A1A',
        fontSize: 15,
        fontWeight: '800',
    },
    vacioCaja: {
        alignItems: 'center',
        backgroundColor: 'rgba(18,18,18,0.7)',
        borderRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.12)',
        padding: 40,
        marginVertical: 24,
    },
    vacioEmoji: { fontSize: 64, marginBottom: 14 },
    vacioTexto: { color: '#FFF', fontSize: 20, fontWeight: '800', textAlign: 'center' },
    vacioSub: {
        color: '#B0B0B0',
        fontSize: 14,
        textAlign: 'center',
        marginTop: 8,
    },
});