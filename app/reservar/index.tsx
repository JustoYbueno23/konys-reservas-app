import { StatusBar } from 'expo-status-bar';
import { Image, ImageBackground, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export const options = {
    headerShown: false,
};

const FONDO = require('../../assets/images/FondoReservarMesa.png');
const MESA = require('../../assets/images/MesasFondo.png');

type Estado = 'libre' | 'seleccionada' | 'ocupada';
type Mesa = { numero: number; personas: number; estado: Estado };
type Zona = { nombre: string; libres: number; mesas: Mesa[] };

const ZONAS: Zona[] = [
    {
        nombre: 'Terraza',
        libres: 2,
        mesas: [
            { numero: 1, personas: 2, estado: 'libre' },
            { numero: 2, personas: 4, estado: 'libre' },
        ],
    },
    {
        nombre: 'Salón',
        libres: 2,
        mesas: [
            { numero: 3, personas: 6, estado: 'seleccionada' },
            { numero: 4, personas: 4, estado: 'libre' },
            { numero: 5, personas: 4, estado: 'ocupada' },
        ],
    },
];

const TAMANO = 68;

/* La imagen de la mesa tiene mucho espacio blanco arriba y abajo,
   así que la escalo y la centro para que solo se vea la mesa circular. */
const IMG_W = 345;
const IMG_H = 724;
const MESA_CX = 172;
const MESA_CY = 365;
const MESA_DIAMETRO = 290;
const ESCALA = TAMANO / MESA_DIAMETRO;

function MesaCirculo({ mesa }: { mesa: Mesa }) {
    const seleccionada = mesa.estado === 'seleccionada';
    const ocupada = mesa.estado === 'ocupada';

    return (
        <View style={styles.mesaItem}>
            <Pressable
                style={[
                    styles.burbuja,
                    seleccionada && styles.burbujaSeleccionada,
                    ocupada && styles.burbujaOcupada,
                ]}
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
                {ocupada && <View style={styles.velo} />}
                <View style={[styles.numeroCirculo, seleccionada && styles.numeroCirculoSel]}>
                    <Text style={[styles.numero, seleccionada && styles.numeroSel]}>
                        {mesa.numero}
                    </Text>
                </View>
            </Pressable>
            <Text style={styles.capacidad}>{mesa.personas} pers.</Text>
        </View>
    );
}

function TarjetaZona({ zona }: { zona: Zona }) {
    return (
        <View style={styles.tarjeta}>
            <View style={styles.foto}>
                <View style={styles.pastilla}>
                    <Text style={styles.pastillaTexto}>
                        {zona.nombre} · {zona.libres} libres
                    </Text>
                </View>
            </View>

            <View style={styles.filaMesas}>
                {zona.mesas.map((mesa) => (
                    <MesaCirculo key={mesa.numero} mesa={mesa} />
                ))}
            </View>
        </View>
    );
}

export default function ReservarIndex() {
    return (
        <ImageBackground source={FONDO} style={styles.fondo} resizeMode="cover">
            {/* Capa oscura para que se lea el contenido */}
            <View style={styles.overlay} />

            <SafeAreaView style={styles.container}>
                <StatusBar style="light" />

                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                >
                    <View style={styles.encabezado}>
                        <View>
                            <Text style={styles.titulo}>Elige tu mesa</Text>
                            <Text style={styles.subtitulo}>Toca una burbuja</Text>
                        </View>

                        <Pressable style={styles.adminButton}>
                            <Text style={styles.adminLetter}>A</Text>
                        </Pressable>
                    </View>

                    {ZONAS.map((zona) => (
                        <TarjetaZona key={zona.nombre} zona={zona} />
                    ))}

                    <Pressable style={styles.botonContinuar}>
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
        backgroundColor: '#000',
    },
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.72)',
    },
    container: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 32,
    },

    /* Encabezado */
    encabezado: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 20,
    },
    titulo: {
        fontSize: 28,
        fontWeight: '700',
        color: '#FFFFFF',
        letterSpacing: 0.3,
    },
    subtitulo: {
        fontSize: 14,
        color: '#C8C8C8',
        marginTop: 4,
    },
    adminButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.7)',
        backgroundColor: 'rgba(0,0,0,0.35)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    adminLetter: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 16,
    },

    /* Zona */
    tarjeta: {
        marginBottom: 28,
    },
    foto: {
        height: 130,
        borderRadius: 18,
        backgroundColor: 'rgba(28,28,28,0.7)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.18)',
        overflow: 'hidden',
    },
    pastilla: {
        position: 'absolute',
        top: 10,
        left: 10,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.75)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.25)',
    },
    pastillaTexto: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '700',
    },

    /* Mesas */
    filaMesas: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'flex-start',
        gap: 16,
        marginTop: 16,
    },
    mesaItem: {
        alignItems: 'center',
        width: 76,
    },
    burbuja: {
        width: TAMANO,
        height: TAMANO,
        borderRadius: TAMANO / 2,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.45)',
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#3b2a20',
    },
    burbujaSeleccionada: {
        borderColor: '#F28C28',
        borderWidth: 3,
    },
    burbujaOcupada: {
        borderColor: 'rgba(255,255,255,0.2)',
    },
    velo: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.7)',
    },
    numeroCirculo: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    numeroCirculoSel: {
        backgroundColor: '#F2EFEA',
    },
    numero: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '700',
    },
    numeroSel: {
        color: '#1A1A1A',
    },
    capacidad: {
        marginTop: 8,
        color: '#E0E0E0',
        fontSize: 12,
        textAlign: 'center',
    },

    /* Botón */
    botonContinuar: {
        backgroundColor: '#F2EFEA',
        height: 52,
        borderRadius: 26,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 'auto',
        marginHorizontal: 12,
    },
    textoContinuar: {
        color: '#1A1A1A',
        fontSize: 17,
        fontWeight: '700',
        letterSpacing: 0.4,
    },
});