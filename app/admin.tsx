// -------------------------------------------------------------
// PANTALLA: Panel de administración (solo personal del restaurante)
// Secciones: Reservas, Carta, Mesas y Horarios.
// El login usa correo y contraseña; el rol se lee de la
// tabla perfiles (admin ve todo, mesero solo reservas).
// Navegación: https://docs.expo.dev/router/advanced/navigation/
// Autenticación: https://supabase.com/docs/guides/auth
// -------------------------------------------------------------
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../services/supabase';
import { imagenPlato } from '../services/platos-imagenes';
import { fechaATexto, proximosDias } from '../utils/fechas';
import { formatoPrecio } from '../utils/formato';

const FONDO = require('../assets/images/FondoReservarMesa.png');

const DIAS_CORTOS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const NOMBRE_ZONA: Record<string, string> = { terraza: 'Terraza', salon: 'Salón' };

const CATEGORIA_INFO: Record<string, { label: string; icon: keyof typeof Ionicons.glyphMap }> = {
  entradas: { label: 'Entradas', icon: 'fast-food' },
  'menu-infantil': { label: 'Menú Infantil', icon: 'happy' },
  pizzas: { label: 'Pizzas', icon: 'pizza' },
  desgranados: { label: 'Desgranados', icon: 'layers' },
  papas: { label: 'Papas Ikónicas', icon: 'return-up-back' },
  lasana: { label: 'Lasaña', icon: 'pizza' },
  granizados: { label: 'Granizados', icon: 'snow' },
  sodas: { label: 'Sodas', icon: 'water' },
  bebidas: { label: 'Bebidas Frías', icon: 'cafe' },
  cerveza: { label: 'Cerveza', icon: 'beer' },
  cocteles: { label: 'Cócteles', icon: 'wine' },
  postres: { label: 'Postres', icon: 'ice-cream' },
  almuerzos: { label: 'Menú Almuerzos', icon: 'restaurant' },
  congelados: { label: 'Congelados', icon: 'snow' },
};

function formatoFechaLarga(fechaTexto: string) {
  const [a, m, d] = fechaTexto.split('-').map(Number);
  const dia = DIAS_CORTOS[new Date(a, m - 1, d).getDay()];
  return `${dia} ${d} ${MESES[m - 1]}`;
}

const COLORES = {
  fondo: '#0D1826',
  card: 'rgba(22, 28, 38, 0.92)',
  cardSuave: 'rgba(255, 255, 255, 0.06)',
  linea: 'rgba(255, 255, 255, 0.10)',
  ambar: '#F2A03F',
  crema: '#F5EFE6',
  texto: '#F5EFE6',
  textoSuave: '#9DA9B7',
  verde: '#3ED598',
  rojo: '#FF5A5A',
};

export default function Admin() {
  const router = useRouter();

  // Sesión y rol
  const [revisandoSesion, setRevisandoSesion] = useState(true);
  const [rol, setRol] = useState<string | null>(null);
  const [correo, setCorreo] = useState('');
  const [clave, setClave] = useState('');
  const [errorLogin, setErrorLogin] = useState<string | null>(null);
  const [entrando, setEntrando] = useState(false);

  // Pestaña seleccionada
  const [seccion, setSeccion] = useState<'reservas' | 'carta' | 'mesas' | 'horarios'>('reservas');

  // Reservas
  const [fecha, setFecha] = useState(fechaATexto(new Date()));
  const [reservas, setReservas] = useState<any[]>([]);
  const [cargandoLista, setCargandoLista] = useState(false);
  const [errorLista, setErrorLista] = useState<string | null>(null);
  const [intento, setIntento] = useState(0);
  const [filtroMesa, setFiltroMesa] = useState<string | null>(null);
  const [mesasFiltro, setMesasFiltro] = useState<any[]>([]);

  // Carta
  const [platos, setPlatos] = useState<any[]>([]);
  const [cargandoPlatos, setCargandoPlatos] = useState(false);
  const [errorPlatos, setErrorPlatos] = useState<string | null>(null);

  // Mesas
  const [mesas, setMesas] = useState<any[]>([]);
  const [cargandoMesas, setCargandoMesas] = useState(false);
  const [errorMesas, setErrorMesas] = useState<string | null>(null);
  const [intentoMesas, setIntentoMesas] = useState(0);
  const [editandoMesaId, setEditandoMesaId] = useState<string | null>(null);
  const [formNombre, setFormNombre] = useState('');
  const [formZona, setFormZona] = useState<string>('terraza');
  const [formCapacidad, setFormCapacidad] = useState(4);
  const [formActiva, setFormActiva] = useState(true);
  const [guardandoMesa, setGuardandoMesa] = useState(false);

  // Horarios
  const [horarios, setHorarios] = useState<any[]>([]);
  const [cargandoHorarios, setCargandoHorarios] = useState(false);
  const [errorHorarios, setErrorHorarios] = useState<string | null>(null);
  const [intentoHorarios, setIntentoHorarios] = useState(0);
  const [diaEditar, setDiaEditar] = useState<string>(() =>
    ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'][new Date().getDay()]
  );
  const [almuerzoInicio, setAlmuerzoInicio] = useState('12:30');
  const [almuerzoFin, setAlmuerzoFin] = useState('14:30');
  const [almuerzoDur, setAlmuerzoDur] = useState('60');
  const [almuerzoActivo, setAlmuerzoActivo] = useState(true);
  const [nocheInicio, setNocheInicio] = useState('17:00');
  const [nocheFin, setNocheFin] = useState('23:00');
  const [nocheDur, setNocheDur] = useState('60');
  const [nocheActivo, setNocheActivo] = useState(true);
  const [guardandoHorario, setGuardandoHorario] = useState(false);

  // Platos CRUD
  const [editandoPlatoId, setEditandoPlatoId] = useState<number | null>(null);
  const [formPlatoNombre, setFormPlatoNombre] = useState('');
  const [formPlatoCategoria, setFormPlatoCategoria] = useState<string>('pizzas');
  const [formPlatoPrecio, setFormPlatoPrecio] = useState('');
  const [formPlatoDescripcion, setFormPlatoDescripcion] = useState('');
  const [formPlatoRecomendado, setFormPlatoRecomendado] = useState(false);
  const [guardandoPlato, setGuardandoPlato] = useState(false);

  useEffect(() => {
    if (rol === 'mesero') setSeccion('reservas');
  }, [rol]);

  async function verificarRol(userId: string) {
    const { data, error } = await supabase
      .from('perfiles')
      .select('rol, activo')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      setErrorLogin('No se pudo verificar tu perfil. Revisa tu conexión.');
      return;
    }
    if (!data || !data.activo) {
      await supabase.auth.signOut();
      setErrorLogin('Esta cuenta no tiene permisos de personal.');
      return;
    }
    setRol(data.rol);
  }

  useEffect(() => {
    async function revisarSesion() {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        await verificarRol(data.session.user.id);
      }
      setRevisandoSesion(false);
    }
    revisarSesion();
  }, []);

  async function iniciarSesion() {
    setErrorLogin(null);
    if (!correo.trim() || !clave) {
      setErrorLogin('Escribe tu correo y tu contraseña.');
      return;
    }
    setEntrando(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: correo.trim(),
      password: clave,
    });
    if (error || !data.user) {
      setErrorLogin('Correo o contraseña incorrectos.');
    } else {
      await verificarRol(data.user.id);
    }
    setEntrando(false);
  }

  async function cerrarSesion() {
    await supabase.auth.signOut();
    reiniciarEstado();
  }

  function reiniciarEstado() {
    setRol(null);
    setReservas([]);
    setPlatos([]);
    setMesas([]);
    setClave('');
    setSeccion('reservas');
    resetFormMesa();
    resetFormPlato();
    limpiarFormularioHorarios();
  }

  async function volverYCerrarSesion() {
    await supabase.auth.signOut();
    reiniciarEstado();
    router.back();
  }

  // ============ RESERVAS ============
  useEffect(() => {
    if (!rol) return;
    let activo = true;

    async function cargarReservas() {
      setCargandoLista(true);
      setErrorLista(null);
      let query = supabase
        .from('reservas')
        .select('id, cliente_nombre, cliente_contacto, num_personas, hora_inicio, hora_fin, estado, mesas(nombre, zona)')
        .eq('fecha', fecha)
        .order('hora_inicio', { ascending: true });
      if (filtroMesa) query = query.eq('mesa_id', filtroMesa);
      const { data, error } = await query;

      if (!activo) return;
      if (error) {
        setErrorLista('No se pudieron cargar las reservas. Revisa tu conexión.');
      } else {
        setReservas(data ?? []);
      }
      setCargandoLista(false);
    }

    cargarReservas();
    return () => {
      activo = false;
    };
  }, [rol, fecha, intento, filtroMesa]);

  // Cargar mesas activas para el filtro
  useEffect(() => {
    if (!rol) return;
    let activo = true;

    async function cargarMesasFiltro() {
      const { data } = await supabase
        .from('mesas')
        .select('id, nombre, zona, capacidad')
        .eq('activa', true)
        .order('nombre');
      if (activo) setMesasFiltro(data ?? []);
    }

    cargarMesasFiltro();
    return () => {
      activo = false;
    };
  }, [rol]);

  function pedirCancelacion(reserva: any) {
    Alert.alert(
      'Cancelar reserva',
      `¿Cancelar la reserva de ${reserva.cliente_nombre} a las ${reserva.hora_inicio.slice(0, 5)}?`,
      [{ text: 'No', style: 'cancel' }, { text: 'Sí, cancelar', style: 'destructive', onPress: () => cancelar(reserva.id) }]
    );
  }

  async function marcarCompletada(id: string) {
    const { error } = await supabase
      .from('reservas')
      .update({ estado: 'completada' })
      .eq('id', id);

    if (error) {
      Alert.alert('Error', 'No se pudo marcar la reserva como completada.');
      return;
    }
    setIntento((i) => i + 1);
  }

  async function cancelar(id: string) {
    const { data, error } = await supabase
      .from('reservas')
      .update({ estado: 'cancelada' })
      .eq('id', id)
      .select();

    if (error || !data || data.length === 0) {
      Alert.alert('No se pudo cancelar', 'Revisa tu conexión o tus permisos.');
      return;
    }
    setIntento((i) => i + 1);
  }

  // ============ CARTA ============
  useEffect(() => {
    if (rol !== 'admin' || seccion !== 'carta') return;
    let activo = true;

    async function cargarPlatos() {
      setCargandoPlatos(true);
      setErrorPlatos(null);
      const { data, error } = await supabase
        .from('platos')
        .select('id, nombre, categoria, precio, disponible, subcategoria, recomendado')
        .order('categoria')
        .order('precio');

      if (!activo) return;
      if (error) {
        setErrorPlatos('No se pudieron cargar los platos. Revisa tu conexión.');
      } else {
        setPlatos(data ?? []);
      }
      setCargandoPlatos(false);
    }

    cargarPlatos();
    return () => {
      activo = false;
    };
  }, [rol, seccion, intento]);

  async function alternarDisponible(plato: any) {
    const nuevo = !plato.disponible;
    setPlatos((actuales) => actuales.map((p) => (p.id === plato.id ? { ...p, disponible: nuevo } : p)));
    const { error } = await supabase.from('platos').update({ disponible: nuevo }).eq('id', plato.id);
    if (error) {
      Alert.alert('Error', 'No se pudo cambiar la disponibilidad.');
      setPlatos((actuales) => actuales.map((p) => (p.id === plato.id ? { ...p, disponible: !nuevo } : p)));
    }
  }

  function resetFormPlato() {
    setEditandoPlatoId(null);
    setFormPlatoNombre('');
    setFormPlatoCategoria('pizzas');
    setFormPlatoPrecio('');
    setFormPlatoDescripcion('');
    setFormPlatoRecomendado(false);
  }

  function iniciarEdicionPlato(plato: any) {
    setEditandoPlatoId(plato.id);
    setFormPlatoNombre(plato.nombre);
    setFormPlatoCategoria(plato.categoria);
    setFormPlatoPrecio(String(plato.precio));
    setFormPlatoDescripcion(plato.descripcion ?? '');
    setFormPlatoRecomendado(!!plato.recomendado);
  }

  async function guardarPlato() {
    const nombreLimpio = formPlatoNombre.trim();
    const precioNumero = Number(formPlatoPrecio);
    if (!nombreLimpio || Number.isNaN(precioNumero) || precioNumero <= 0) {
      Alert.alert('Datos incompletos', 'Escribe un nombre y un precio mayor a 0.');
      return;
    }
    setGuardandoPlato(true);
    const payload = {
      nombre: nombreLimpio,
      categoria: formPlatoCategoria,
      precio: precioNumero,
      descripcion: formPlatoDescripcion.trim() || null,
      recomendado: formPlatoRecomendado,
      disponible: true,
    };

    let error;
    if (editandoPlatoId != null) {
      const { disponible, ...sinDisponible } = payload;
      const res = await supabase.from('platos').update(sinDisponible).eq('id', editandoPlatoId);
      error = res.error;
    } else {
      const res = await supabase.from('platos').insert(payload);
      error = res.error;
    }

    setGuardandoPlato(false);
    if (error) {
      Alert.alert('Error', 'No se pudo guardar el plato.');
      return;
    }
    resetFormPlato();
    setIntento((i) => i + 1);
  }

  async function eliminarPlato(plato: any) {
    Alert.alert(
      'Eliminar plato',
      `¿Eliminar "${plato.nombre}"? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase.from('platos').delete().eq('id', plato.id);
            if (error) {
              Alert.alert('No se pudo eliminar', 'Revisa tu conexión o tus permisos.');
              return;
            }
            setIntento((i) => i + 1);
          },
        },
      ]
    );
  }

  // ============ MESAS ============
  function resetFormMesa() {
    setEditandoMesaId(null);
    setFormNombre('');
    setFormZona('terraza');
    setFormCapacidad(4);
    setFormActiva(true);
  }

  useEffect(() => {
    if (rol !== 'admin' || seccion !== 'mesas') return;
    let activo = true;

    async function cargarMesas() {
      setCargandoMesas(true);
      setErrorMesas(null);
      const { data, error } = await supabase
        .from('mesas')
        .select('id, nombre, zona, capacidad, activa')
        .order('nombre');

      if (!activo) return;
      if (error) {
        setErrorMesas('No se pudieron cargar las mesas.');
      } else {
        setMesas(data ?? []);
      }
      setCargandoMesas(false);
    }

    cargarMesas();
    return () => {
      activo = false;
    };
  }, [rol, seccion, intentoMesas]);

  function iniciarEdicionMesa(mesa: any) {
    setEditandoMesaId(mesa.id);
    setFormNombre(mesa.nombre);
    setFormZona(mesa.zona);
    setFormCapacidad(mesa.capacidad);
    setFormActiva(mesa.activa);
  }

  async function guardarMesa() {
    const nombreLimpio = formNombre.trim();
    if (!nombreLimpio) {
      Alert.alert('Falta el nombre', 'Escribe un nombre para la mesa (ej. Mesa 3).');
      return;
    }
    setGuardandoMesa(true);
    const payload = {
      nombre: nombreLimpio,
      zona: formZona,
      capacidad: Math.max(1, Math.floor(formCapacidad || 1)),
      activa: formActiva,
    };

    let error;
    if (editandoMesaId) {
      const res = await supabase.from('mesas').update(payload).eq('id', editandoMesaId);
      error = res.error;
    } else {
      const res = await supabase.from('mesas').insert(payload);
      error = res.error;
    }

    setGuardandoMesa(false);
    if (error) {
      Alert.alert('Error', 'No se pudo guardar la mesa.');
      return;
    }
    resetFormMesa();
    setIntentoMesas((i) => i + 1);
  }

  async function alternarActivaMesa(mesa: any) {
    const nueva = !mesa.activa;
    setMesas((actuales) => actuales.map((m) => (m.id === mesa.id ? { ...m, activa: nueva } : m)));
    const { error } = await supabase.from('mesas').update({ activa: nueva }).eq('id', mesa.id);
    if (error) {
      Alert.alert('Error', 'No se pudo cambiar el estado de la mesa.');
      setMesas((actuales) => actuales.map((m) => (m.id === mesa.id ? { ...m, activa: !nueva } : m)));
    }
  }

  async function eliminarMesa(mesa: any) {
    // Verificar si tiene reservas pendientes (confirmadas futuras o de hoy) antes de borrar
    const hoy = fechaATexto(new Date());
    const { data: reservasMesa, error: errorConsulta } = await supabase
      .from('reservas')
      .select('id, estado, fecha')
      .eq('mesa_id', mesa.id)
      .eq('estado', 'confirmada')
      .gte('fecha', hoy);

    if (errorConsulta) {
      Alert.alert('Error', 'No se pudieron verificar las reservas de la mesa.');
      return;
    }

    if (reservasMesa && reservasMesa.length > 0) {
      Alert.alert(
        'No se puede eliminar',
        `"${mesa.nombre}" tiene ${reservasMesa.length} reserva(s) confirmada(s). Desactivala en su lugar.`,
        [
          { text: 'Entendido', style: 'cancel' },
          { text: 'Desactivar', onPress: () => alternarActivaMesa(mesa) },
        ]
      );
      return;
    }

    Alert.alert('Eliminar mesa', `¿Eliminar "${mesa.nombre}"? Esta acción no se puede deshacer.`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.from('mesas').delete().eq('id', mesa.id);
          if (error) {
            Alert.alert('No se pudo eliminar', 'Revisa tu conexión o tus permisos.');
            return;
          }
          if (editandoMesaId === mesa.id) resetFormMesa();
          setIntentoMesas((i) => i + 1);
        },
      },
    ]);
  }

  // ============ HORARIOS ============
  const DIAS_SEMANA = [
    { clave: 'lunes', etiqueta: 'Lun' },
    { clave: 'martes', etiqueta: 'Mar' },
    { clave: 'miercoles', etiqueta: 'Mié' },
    { clave: 'jueves', etiqueta: 'Jue' },
    { clave: 'viernes', etiqueta: 'Vie' },
    { clave: 'sabado', etiqueta: 'Sáb' },
    { clave: 'domingo', etiqueta: 'Dom' },
  ];

  function soloHora(t: string) {
    return t ? t.slice(0, 5) : '';
  }

  function limpiarFormularioHorarios() {
    setAlmuerzoInicio('12:30');
    setAlmuerzoFin('14:30');
    setAlmuerzoDur('60');
    setAlmuerzoActivo(true);
    setNocheInicio('17:00');
    setNocheFin('23:00');
    setNocheDur('60');
    setNocheActivo(true);
  }

  function cargarFormularioHorarios(data: any[]) {
    const alu = data.find((h) => h.dia_semana === diaEditar && h.jornada === 'almuerzo');
    const noc = data.find((h) => h.dia_semana === diaEditar && h.jornada === 'noche');
    if (alu) {
      setAlmuerzoInicio(soloHora(alu.hora_inicio));
      setAlmuerzoFin(soloHora(alu.hora_fin));
      setAlmuerzoDur(String(alu.duracion_slot ?? 60));
      setAlmuerzoActivo(alu.activo !== false);
    }
    if (noc) {
      setNocheInicio(soloHora(noc.hora_inicio));
      setNocheFin(soloHora(noc.hora_fin));
      setNocheDur(String(noc.duracion_slot ?? 60));
      setNocheActivo(noc.activo !== false);
    }
  }

  useEffect(() => {
    if (rol !== 'admin' || seccion !== 'horarios') return;
    let activo = true;

    setCargandoHorarios(true);
    setErrorHorarios(null);

    supabase
      .from('horarios')
      .select('*')
      .then(({ data, error }) => {
        if (!activo) return;
        if (error) {
          setErrorHorarios('No se pudieron cargar los horarios. Revisa tu conexión.');
        } else {
          setHorarios(data ?? []);
          cargarFormularioHorarios(data ?? []);
        }
        setCargandoHorarios(false);
      });

    return () => {
      activo = false;
    };
  }, [rol, seccion, intentoHorarios, diaEditar]);

  async function guardarHorarios() {
    setGuardandoHorario(true);

    const upsert = async (jornada: string, inicio: string, fin: string, dur: string, act: boolean) => {
      const existente = horarios.find((h) => h.dia_semana === diaEditar && h.jornada === jornada);
      const payload = {
        dia_semana: diaEditar,
        jornada,
        hora_inicio: inicio,
        hora_fin: fin,
        duracion_slot: Math.max(15, Number(dur) || 60),
        activo: act,
      };
      if (existente) {
        return supabase.from('horarios').update(payload).eq('id', existente.id);
      }
      return supabase.from('horarios').insert(payload);
    };

    const [r1, r2] = await Promise.all([
      upsert('almuerzo', almuerzoInicio, almuerzoFin, almuerzoDur, almuerzoActivo),
      upsert('noche', nocheInicio, nocheFin, nocheDur, nocheActivo),
    ]);

    if (r1.error || r2.error) {
      Alert.alert('Error', 'No se pudieron guardar los horarios. Revisa tu conexión o permisos.');
    } else {
      setIntentoHorarios((i) => i + 1);
    }
    setGuardandoHorario(false);
  }

  const puedeCancelar = rol === 'admin' || rol === 'mesero';
  const dias = proximosDias(14);
  const confirmadas = reservas.filter((r) => r.estado === 'confirmada').length;

  const grupos = useMemo(() => {
    const mapa: Record<string, any[]> = {};
    for (const p of platos) {
      const clave = p.categoria ?? 'otros';
      if (!mapa[clave]) mapa[clave] = [];
      mapa[clave].push(p);
    }
    return mapa;
  }, [platos]);

  const ordenGrupos = Object.keys(CATEGORIA_INFO).filter((c) => grupos[c]?.length);
  const otrosGrupos = Object.keys(grupos).filter((c) => !CATEGORIA_INFO[c]);

  return (
    <ImageBackground source={FONDO} style={styles.fondo} resizeMode="cover">
      <View style={styles.overlay} pointerEvents="none" />

      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
        >
          {/* Barra superior */}
          <View style={styles.barraSuperior}>
            <Pressable style={styles.botonBarra} onPress={volverYCerrarSesion}>
              <Ionicons name="chevron-back" size={20} color="#F5EFE6" />
              <Text style={styles.textoBarra}>Volver</Text>
            </Pressable>
            {rol && (
              <Pressable style={styles.botonBarra} onPress={cerrarSesion}>
                <Ionicons name="log-out-outline" size={18} color="#F5EFE6" />
                <Text style={styles.textoBarra}>Cerrar sesión</Text>
              </Pressable>
            )}
          </View>

          {revisandoSesion && <ActivityIndicator size="large" color={COLORES.ambar} style={styles.cargando} />}

          {/* ============ LOGIN ============ */}
          {!revisandoSesion && !rol && (
            <View style={styles.loginCard}>
              <View style={styles.loginEncabezado}>
                <Ionicons name="restaurant" size={44} color={COLORES.ambar} />
                <Text style={styles.logoKicker}>KONYS PIZZA</Text>
                <Text style={styles.loginTitulo}>Acceso del personal</Text>
                <Text style={styles.loginSubtexto}>
                  Inicia sesión para gestionar reservas, mesas y carta.
                </Text>
              </View>

              <View style={styles.campo}>
                <Ionicons name="mail-outline" size={20} color={COLORES.textoSuave} style={styles.campoIcono} />
                <TextInput
                  style={styles.input}
                  value={correo}
                  onChangeText={setCorreo}
                  placeholder="correo@konys.com"
                  placeholderTextColor="rgba(255,255,255,0.35)"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  editable={!entrando}
                />
              </View>

              <View style={styles.campo}>
                <Ionicons name="lock-closed-outline" size={20} color={COLORES.textoSuave} style={styles.campoIcono} />
                <TextInput
                  style={styles.input}
                  value={clave}
                  onChangeText={setClave}
                  placeholder="Contraseña"
                  placeholderTextColor="rgba(255,255,255,0.35)"
                  secureTextEntry
                  autoCapitalize="none"
                  editable={!entrando}
                />
              </View>

              {errorLogin && (
                <View style={styles.alertaError}>
                  <Ionicons name="alert-circle-outline" size={18} color={COLORES.rojo} />
                  <Text style={styles.alertaErrorTexto}>{errorLogin}</Text>
                </View>
              )}

              <Pressable
                style={[styles.botonPrimario, entrando && styles.botonDeshabilitado]}
                onPress={iniciarSesion}
                disabled={entrando}
              >
                {entrando ? (
                  <ActivityIndicator color="#1A1A1A" />
                ) : (
                  <View style={styles.botonPrimarioContenido}>
                    <Ionicons name="log-in-outline" size={20} color="#1A1A1A" />
                    <Text style={styles.botonPrimarioTexto}>Entrar</Text>
                  </View>
                )}
              </Pressable>
            </View>
          )}

          {/* ============ PANEL AUTENTICADO ============ */}
          {!revisandoSesion && rol && (
            <>
              {/* Tabs */}
              {rol === 'admin' && (
                <View style={styles.tabs}>
                  {(['reservas', 'carta', 'mesas', 'horarios'] as const).map((t) => {
                    const activo = seccion === t;
                    const tabConfig = {
                      reservas: { icon: 'calendar-outline', label: 'Reservas' },
                      carta: { icon: 'restaurant-outline', label: 'Carta' },
                      mesas: { icon: 'grid-outline', label: 'Mesas' },
                      horarios: { icon: 'time-outline', label: 'Horarios' },
                    };
                    return (
                      <Pressable
                        key={t}
                        style={[styles.tab, activo && styles.tabActivo]}
                        onPress={() => setSeccion(t as any)}
                      >
                        <Ionicons
                          name={tabConfig[t].icon as any}
                          size={18}
                          color={activo ? '#1A1A1A' : COLORES.textoSuave}
                        />
                        <Text style={[styles.tabTexto, activo && styles.tabTextoActivo]}>
                          {tabConfig[t].label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              )}

              {/* ========== RESERVA (admin y mesero) ========== */}
              {(rol === 'mesero' || seccion === 'reservas') && (
                <>
                  <View style={styles.encabezadoSeccion}>
                    <View>
                      <Text style={styles.kicker}>Avance del día</Text>
                      <Text style={styles.tituloSeccion}>Reservas</Text>
                      <View style={styles.metaRow}>
                        <View style={styles.pillRol}>
                          <Ionicons name={rol === 'admin' ? 'shield-checkmark' : 'person'} size={12} color="#1A1A1A" />
                          <Text style={styles.pillRolTexto}>{rol === 'admin' ? 'Admin' : 'Mesero'}</Text>
                        </View>
                        <Text style={styles.metaTexto}>
                          {confirmadas} {confirmadas === 1 ? 'confirmada' : 'confirmadas'} hoy
                        </Text>
                      </View>
                    </View>
                  </View>

                  <Text style={styles.fechaTexto}>{formatoFechaLarga(fecha)}</Text>

                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.diasScroll}
                    contentContainerStyle={styles.filaDias}
                  >
                    {dias.map((d, i) => {
                      const texto = fechaATexto(d);
                      const elegido = texto === fecha;
                      return (
                        <Pressable
                          key={texto}
                          onPress={() => setFecha(texto)}
                          style={[styles.dia, elegido && styles.diaElegido]}
                        >
                          <Text style={[styles.diaNombre, elegido && styles.textoOscuro]}>
                            {i === 0 ? 'Hoy' : DIAS_CORTOS[d.getDay()]}
                          </Text>
                          <Text style={[styles.diaNumero, elegido && styles.textoOscuro]}>
                            {d.getDate()}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>

                  {/* Filtro por mesa */}
                  {mesasFiltro.length > 0 && (
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      style={styles.filtroMesaScroll}
                      contentContainerStyle={styles.filtroMesaContenido}
                    >
                      <Pressable
                        style={[styles.chipMesa, !filtroMesa && styles.chipMesaActiva]}
                        onPress={() => setFiltroMesa(null)}
                      >
                        <Ionicons name="grid-outline" size={14} color={!filtroMesa ? '#1A1A1A' : COLORES.textoSuave} />
                        <Text style={[styles.chipMesaTexto, !filtroMesa && styles.chipMesaTextoActivo]}>Todas</Text>
                      </Pressable>
                      {mesasFiltro.map((m) => {
                        const elegido = filtroMesa === m.id;
                        return (
                          <Pressable
                            key={m.id}
                            style={[styles.chipMesa, elegido && styles.chipMesaActiva]}
                            onPress={() => setFiltroMesa(elegido ? null : m.id)}
                          >
                            <Text style={[styles.chipMesaTexto, elegido && styles.chipMesaTextoActivo]}>
                              {m.nombre}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </ScrollView>
                  )}

                  {cargandoLista && <ActivityIndicator size="large" color={COLORES.ambar} style={styles.cargando} />}

                  {errorLista && (
                    <View style={styles.mensajeCard}>
                      <Ionicons name="cloud-offline-outline" size={28} color={COLORES.rojo} />
                      <Text style={styles.mensajeTexto}>{errorLista}</Text>
                      <Pressable style={styles.botonClaro} onPress={() => setIntento(intento + 1)}>
                        <Text style={styles.textoBotonClaro}>Reintentar</Text>
                      </Pressable>
                    </View>
                  )}

                  {!cargandoLista && !errorLista && reservas.length === 0 && (
                    <View style={styles.vacioCaja}>
                      <Ionicons name="restaurant-outline" size={52} color={COLORES.textoSuave} />
                      <Text style={styles.vacioTexto}>No hay reservas para este día</Text>
                      <Text style={styles.vacioSub}>Cuando alguien reserve desde la app aparecerá aquí.</Text>
                    </View>
                  )}

                  {!cargandoLista &&
                    !errorLista &&
                    reservas.map((r) => {
                      const cancelada = r.estado === 'cancelada';
                      const completada = r.estado === 'completada';
                      const activa = !cancelada && !completada;
                      return (
                        <View key={r.id} style={[styles.tarjetaReserva, cancelada && styles.tarjetaCancelada, completada && styles.tarjetaCompletada]}>
                          <View
                            style={[
                              styles.acentoLateral,
                              cancelada ? styles.acentoCancelar : completada ? styles.acentoCompletada : styles.acentoOk,
                            ]}
                          />
                          <View style={styles.tarjetaContenido}>
                            <View style={styles.tarjetaCabecera}>
                              <View style={styles.horaBloque}>
                                <Ionicons name="time-outline" size={16} color={COLORES.textoSuave} />
                                <Text style={styles.hora}>
                                  {r.hora_inicio.slice(0, 5)} – {r.hora_fin.slice(0, 5)}
                                </Text>
                              </View>
                              <View style={[styles.estadoPill, cancelada ? styles.estadoCancelada : completada ? styles.estadoCompletadaPill : null]}>
                                <Text style={[styles.estadoPillTexto, cancelada ? styles.estadoCanceladaTexto : completada ? styles.estadoCompletadaPillTexto : null]}>
                                  {cancelada ? 'CANCELADA' : completada ? 'COMPLETADA' : 'CONFIRMADA'}
                                </Text>
                              </View>
                            </View>

                            <Text style={styles.cliente}>{r.cliente_nombre}</Text>
                            <View style={styles.detalleFila}>
                              <Ionicons name="grid-outline" size={16} color={COLORES.textoSuave} />
                              <Text style={styles.detalle}>
                                {r.mesas?.nombre ?? 'Mesa'} · {r.num_personas}{' '}
                                {r.num_personas === 1 ? 'persona' : 'personas'}
                              </Text>
                            </View>
                            <View style={styles.detalleFila}>
                              <Ionicons name="call-outline" size={16} color={COLORES.textoSuave} />
                              <Text style={styles.detalle}>{r.cliente_contacto ?? '—'}</Text>
                            </View>

                            {activa && puedeCancelar && (
                              <View style={styles.accionesReserva}>
                                <Pressable style={styles.botonCompletar} onPress={() => marcarCompletada(r.id)}>
                                  <Ionicons name="checkmark-circle-outline" size={18} color="#7EE2A5" />
                                  <Text style={styles.textoCompletar}>Completada</Text>
                                </Pressable>
                                <Pressable style={styles.botonCancelar} onPress={() => pedirCancelacion(r)}>
                                  <Ionicons name="close-circle-outline" size={18} color="#FF9A94" />
                                  <Text style={styles.textoCancelar}>Cancelar</Text>
                                </Pressable>
                              </View>
                            )}
                          </View>
                        </View>
                      );
                    })}
                </>
              )}

              {/* ========== CARTA (admin) ========== */}
              {rol === 'admin' && seccion === 'carta' && (
                <>
                  <View style={styles.encabezadoSeccion}>
                    <View>
                      <Text style={styles.kicker}>Administración</Text>
                      <Text style={styles.tituloSeccion}>Carta</Text>
                      <Text style={styles.metaTexto}>
                        {platos.length} platos registrados · {platos.filter((p) => p.disponible).length} disponibles
                      </Text>
                    </View>
                  </View>

                  {/* Formulario Crear/Editar plato */}
                  <View style={styles.formCard}>
                    <View style={styles.formEncabezado}>
                      <Ionicons
                        name={editandoPlatoId != null ? 'create-outline' : 'add-circle-outline'}
                        size={20}
                        color={COLORES.ambar}
                      />
                      <Text style={styles.formTitulo}>
                        {editandoPlatoId != null ? 'Editar plato' : 'Nuevo plato'}
                      </Text>
                    </View>

                    <Text style={styles.campoLabel}>Nombre</Text>
                    <TextInput
                      style={styles.inputSimple}
                      value={formPlatoNombre}
                      onChangeText={setFormPlatoNombre}
                      placeholder="Ej. Hawaiiana"
                      placeholderTextColor="rgba(255,255,255,0.35)"
                      editable={!guardandoPlato}
                    />

                    <Text style={styles.campoLabel}>Categoría</Text>
                    <View style={styles.categoriaGrid}>
                      {Object.keys(CATEGORIA_INFO).map((clave) => {
                        const sel = formPlatoCategoria === clave;
                        const info = CATEGORIA_INFO[clave];
                        return (
                          <Pressable
                            key={clave}
                            style={[styles.categoriaPill, sel && styles.categoriaPillActiva]}
                            onPress={() => !guardandoPlato && setFormPlatoCategoria(clave)}
                          >
                            <Ionicons
                              name={info.icon as any}
                              size={14}
                              color={sel ? '#1A1A1A' : COLORES.texto}
                            />
                            <Text style={[styles.categoriaPillTexto, sel && styles.categoriaPillTextoActiva]}>
                              {info.label}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>

                    <View style={styles.filaPrecioRecomendado}>
                      <View style={styles.campoPrecio}>
                        <Text style={styles.campoLabel}>Precio (COP)</Text>
                        <TextInput
                          style={styles.inputSimple}
                          value={formPlatoPrecio}
                          onChangeText={setFormPlatoPrecio}
                          placeholder="27900"
                          placeholderTextColor="rgba(255,255,255,0.35)"
                          keyboardType="number-pad"
                          editable={!guardandoPlato}
                        />
                      </View>
                      <View style={styles.campoSwitch}>
                        <Text style={styles.campoLabel}>Recomendado</Text>
                        <Switch
                          value={formPlatoRecomendado}
                          onValueChange={(v) => {
                            if (!guardandoPlato) setFormPlatoRecomendado(v);
                          }}
                          trackColor={{ false: '#3A4452', true: COLORES.ambar }}
                          thumbColor="#F5EFE6"
                        />
                      </View>
                    </View>

                    <Text style={styles.campoLabel}>Descripción (opcional)</Text>
                    <TextInput
                      style={styles.inputSimple}
                      value={formPlatoDescripcion}
                      onChangeText={setFormPlatoDescripcion}
                      placeholder="Ej. Jamón, piña y queso mozzarella"
                      placeholderTextColor="rgba(255,255,255,0.35)"
                      editable={!guardandoPlato}
                    />

                    <View style={styles.botonesFormulario}>
                      {editandoPlatoId != null && (
                        <Pressable
                          style={styles.botonSecundario}
                          onPress={() => !guardandoPlato && resetFormPlato()}
                        >
                          <Text style={styles.botonSecundarioTexto}>Cancelar</Text>
                        </Pressable>
                      )}
                      <Pressable
                        style={[styles.botonGuardar, guardandoPlato && styles.botonDeshabilitado]}
                        onPress={guardarPlato}
                        disabled={guardandoPlato}
                      >
                        {guardandoPlato ? (
                          <ActivityIndicator color="#1A1A1A" />
                        ) : (
                          <View style={styles.botonGuardarContenido}>
                            <Ionicons name="checkmark-circle-outline" size={20} color="#1A1A1A" />
                            <Text style={styles.botonGuardarTexto}>
                              {editandoPlatoId != null ? 'Guardar cambios' : 'Agregar plato'}
                            </Text>
                          </View>
                        )}
                      </Pressable>
                    </View>
                  </View>

                  {cargandoPlatos && <ActivityIndicator size="large" color={COLORES.ambar} style={styles.cargando} />}

                  {errorPlatos && (
                    <View style={styles.mensajeCard}>
                      <Ionicons name="cloud-offline-outline" size={28} color={COLORES.rojo} />
                      <Text style={styles.mensajeTexto}>{errorPlatos}</Text>
                      <Pressable style={styles.botonClaro} onPress={() => setIntento((i) => i + 1)}>
                        <Text style={styles.textoBotonClaro}>Reintentar</Text>
                      </Pressable>
                    </View>
                  )}

                  {!cargandoPlatos &&
                    !errorPlatos &&
                    [...ordenGrupos, ...otrosGrupos].map((cat) => {
                      const info = CATEGORIA_INFO[cat];
                      return (
                        <View key={cat} style={styles.grupo}>
                          <View style={styles.grupoEncabezado}>
                            <Ionicons name={(info?.icon as any) ?? 'pizza'} size={20} color={COLORES.ambar} />
                            <Text style={styles.grupoTitulo}>{info?.label ?? cat}</Text>
                            <View style={styles.grupoContador}>
                              <Text style={styles.grupoContadorTexto}>{grupos[cat].length}</Text>
                            </View>
                          </View>

                          {grupos[cat].map((plato: any) => {
                            const img = imagenPlato(plato.nombre);
                            return (
                              <View key={plato.id} style={styles.platoFila}>
                                <View style={styles.platoImagen}>
                                  {img ? (
                                    <Image source={img} style={styles.platoImagenFuente} />
                                  ) : (
                                    <Ionicons name={(info?.icon as any) ?? 'pizza'} size={28} color={COLORES.textoSuave} />
                                  )}
                                </View>
                                <View style={styles.platoInfo}>
                                  <View style={styles.platoNombreFila}>
                                    {plato.recomendado && (
                                      <Ionicons name="star" size={13} color={COLORES.ambar} />
                                    )}
                                    <Text style={styles.platoNombre} numberOfLines={2}>{plato.nombre}</Text>
                                  </View>
                                  <Text style={styles.platoPrecio}>{formatoPrecio(plato.precio)}</Text>
                                </View>
                                <Pressable
                                  style={[styles.chipDisponibilidad, plato.disponible ? styles.chipOk : styles.chipAgotado]}
                                  onPress={() => alternarDisponible(plato)}
                                >
                                  <Ionicons
                                    name={plato.disponible ? 'checkmark' : 'close'}
                                    size={14}
                                    color={plato.disponible ? COLORES.verde : COLORES.rojo}
                                  />
                                  <Text style={[styles.chipTexto, plato.disponible ? styles.chipTextoOk : styles.chipTextoAgotado]}>
                                    {plato.disponible ? 'Disponible' : 'Agotado'}
                                  </Text>
                                </Pressable>
                                <Pressable style={styles.iconoBoton} onPress={() => iniciarEdicionPlato(plato)}>
                                  <Ionicons name="pencil-outline" size={18} color={COLORES.ambar} />
                                </Pressable>
                                <Pressable style={styles.iconoBotonRojo} onPress={() => eliminarPlato(plato)}>
                                  <Ionicons name="trash-outline" size={18} color={COLORES.rojo} />
                                </Pressable>
                              </View>
                            );
                          })}
                        </View>
                      );
                    })}
                </>
              )}

              {/* ========== MESAS (admin) ========== */}
              {rol === 'admin' && seccion === 'mesas' && (
                <>
                  <View style={styles.encabezadoSeccion}>
                    <View>
                      <Text style={styles.kicker}>Administración</Text>
                      <Text style={styles.tituloSeccion}>Mesas</Text>
                      <Text style={styles.metaTexto}>
                        {mesas.filter((m) => m.activa).length} activas de {mesas.length} mesas
                      </Text>
                    </View>
                  </View>

                  {/* Formulario Crear/Editar mesa */}
                  <View style={styles.formCard}>
                    <View style={styles.formEncabezado}>
                      <Ionicons name="grid-outline" size={20} color={COLORES.ambar} />
                      <Text style={styles.formTitulo}>
                        {editandoMesaId ? 'Editar mesa' : 'Nueva mesa'}
                      </Text>
                    </View>

                    <Text style={styles.campoLabel}>Nombre</Text>
                    <TextInput
                      style={styles.inputSimple}
                      value={formNombre}
                      onChangeText={setFormNombre}
                      placeholder="Ej. Mesa 3"
                      placeholderTextColor="rgba(255,255,255,0.35)"
                      editable={!guardandoMesa}
                    />

                    <Text style={styles.campoLabel}>Zona</Text>
                    <View style={styles.zonaFila}>
                      {['terraza', 'salon'].map((z) => {
                        const elegido = formZona === z;
                        return (
                          <Pressable
                            key={z}
                            style={[styles.zonaPill, elegido && styles.zonaPillActiva]}
                            onPress={() => !guardandoMesa && setFormZona(z)}
                          >
                            <Ionicons
                              name={z === 'terraza' ? 'leaf-outline' : 'home-outline'}
                              size={16}
                              color={elegido ? '#1A1A1A' : COLORES.texto}
                            />
                            <Text style={[styles.zonaPillTexto, elegido && styles.zonaPillTextoActiva]}>
                              {NOMBRE_ZONA[z]}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>

                    <View style={styles.filaCapacidad}>
                      <View style={styles.capacidadTextos}>
                        <Text style={styles.campoLabel}>Capacidad</Text>
                        <Text style={styles.capacidadAyuda}>Hasta cuántas personas</Text>
                      </View>
                      <View style={styles.capacidadControles}>
                        <Pressable
                          style={styles.stepButton}
                          onPress={() => !guardandoMesa && setFormCapacidad(Math.max(1, formCapacidad - 1))}
                        >
                          <Ionicons name="remove" size={22} color={COLORES.texto} />
                        </Pressable>
                        <Text style={styles.capacidadNumero}>{formCapacidad}</Text>
                        <Pressable
                          style={styles.stepButton}
                          onPress={() => !guardandoMesa && setFormCapacidad(Math.min(20, formCapacidad + 1))}
                        >
                          <Ionicons name="add" size={22} color={COLORES.texto} />
                        </Pressable>
                      </View>
                    </View>

                    <View style={styles.filaActiva}>
                      <View style={styles.activaTextos}>
                        <Text style={styles.campoLabel}>Estado</Text>
                        <Text style={styles.capacidadAyuda}>
                          {formActiva ? 'La mesa acepta reservas' : 'No acepta reservas'}
                        </Text>
                      </View>
                      <View style={styles.activaBotones}>
                        <Pressable
                          style={[styles.estadoPillMesa, styles.estadoPillActivo]}
                          onPress={() => !guardandoMesa && setFormActiva(true)}
                        >
                          <Text style={[styles.estadoPillMesaTexto, formActiva && styles.estadoPillMesaTextoActivo]}>
                            Activa
                          </Text>
                        </Pressable>
                        <Pressable
                          style={[styles.estadoPillMesa, styles.estadoPillInactivo]}
                          onPress={() => !guardandoMesa && setFormActiva(false)}
                        >
                          <Text style={[styles.estadoPillMesaTexto, !formActiva && styles.estadoPillMesaTextoActivo]}>
                            Inactiva
                          </Text>
                        </Pressable>
                      </View>
                    </View>

                    <View style={styles.botonesFormulario}>
                      {editandoMesaId && (
                        <Pressable style={styles.botonSecundario} onPress={resetFormMesa}>
                          <Text style={styles.botonSecundarioTexto}>Cancelar</Text>
                        </Pressable>
                      )}
                      <Pressable
                        style={[styles.botonGuardar, guardandoMesa && styles.botonDeshabilitado]}
                        onPress={guardarMesa}
                        disabled={guardandoMesa}
                      >
                        {guardandoMesa ? (
                          <ActivityIndicator color="#1A1A1A" />
                        ) : (
                          <View style={styles.botonGuardarContenido}>
                            <Ionicons name="checkmark-circle-outline" size={20} color="#1A1A1A" />
                            <Text style={styles.botonGuardarTexto}>
                              {editandoMesaId ? 'Guardar cambios' : 'Crear mesa'}
                            </Text>
                          </View>
                        )}
                      </Pressable>
                    </View>
                  </View>

                  <Text style={styles.seccionLabel}>Mesas existentes</Text>

                  {cargandoMesas && <ActivityIndicator size="large" color={COLORES.ambar} style={styles.cargando} />}

                  {errorMesas && (
                    <View style={styles.mensajeCard}>
                      <Ionicons name="cloud-offline-outline" size={28} color={COLORES.rojo} />
                      <Text style={styles.mensajeTexto}>{errorMesas}</Text>
                      <Pressable style={styles.botonClaro} onPress={() => setIntentoMesas((i) => i + 1)}>
                        <Text style={styles.textoBotonClaro}>Reintentar</Text>
                      </Pressable>
                    </View>
                  )}

                  {!cargandoMesas && mesas.length === 0 && !errorMesas && (
                    <View style={styles.vacioCaja}>
                      <Ionicons name="grid-outline" size={52} color={COLORES.textoSuave} />
                      <Text style={styles.vacioTexto}>No hay mesas registradas</Text>
                    </View>
                  )}

                  {!cargandoMesas &&
                    !errorMesas &&
                    mesas.map((mesa) => (
                      <View key={mesa.id} style={styles.mesaFila}>
                        <View style={styles.mesaInfo}>
                          <View style={[styles.mesaIcono, { backgroundColor: mesa.activa ? COLORES.ambar : '#3A4452' }]}>
                            <Text style={styles.mesaIconoTexto}>
                              {String(mesa.nombre).replace(/\D/g, '') || '·'}
                            </Text>
                          </View>
                          <View style={styles.mesaTextos}>
                            <Text style={styles.mesaNombre} numberOfLines={1}>
                              {mesa.nombre}
                            </Text>
                            <Text style={styles.mesaDetalle}>
                              {NOMBRE_ZONA[mesa.zona] ?? mesa.zona} · {mesa.capacidad} pers.
                            </Text>
                          </View>
                        </View>

                        <View style={styles.mesaAcciones}>
                          <Pressable
                            style={[styles.toggleActivo, mesa.activa ? styles.toggleOk : styles.toggleOff]}
                            onPress={() => alternarActivaMesa(mesa)}
                          >
                            <Text style={[styles.toggleActivoTexto, mesa.activa ? styles.toggleActivoTextoOk : styles.toggleActivoTextoOff]}>
                              {mesa.activa ? 'Activa' : 'Inactiva'}
                            </Text>
                          </Pressable>
                          <Pressable style={styles.iconoBoton} onPress={() => iniciarEdicionMesa(mesa)}>
                            <Ionicons name="pencil-outline" size={18} color={COLORES.ambar} />
                          </Pressable>
                          <Pressable style={styles.iconoBotonRojo} onPress={() => eliminarMesa(mesa)}>
                            <Ionicons name="trash-outline" size={18} color={COLORES.rojo} />
                          </Pressable>
                        </View>
                      </View>
                    ))}
                </>
              )}

              {/* ========== HORARIOS (admin) ========== */}
              {rol === 'admin' && seccion === 'horarios' && (
                <>
                  <View style={styles.encabezadoSeccion}>
                    <View>
                      <Text style={styles.kicker}>Administración</Text>
                      <Text style={styles.tituloSeccion}>Horarios</Text>
                      <Text style={styles.metaTexto}>Los cambios afectan las franjas que ven los clientes</Text>
                    </View>
                  </View>

                  <Text style={styles.campoLabel}>Día de la semana</Text>
                  <View style={styles.diasSemanaFila}>
                    {DIAS_SEMANA.map((d) => {
                      const elegido = diaEditar === d.clave;
                      return (
                        <Pressable
                          key={d.clave}
                          style={[styles.diaSemanaBtn, elegido && styles.diaSemanaBtnActivo]}
                          onPress={() => !guardandoHorario && setDiaEditar(d.clave)}
                        >
                          <Text style={[styles.diaSemanaTexto, elegido && styles.diaSemanaTextoActivo]}>
                            {d.etiqueta}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  {cargandoHorarios && <ActivityIndicator size="large" color={COLORES.ambar} style={styles.cargando} />}

                  {errorHorarios && (
                    <View style={styles.mensajeCard}>
                      <Ionicons name="cloud-offline-outline" size={28} color={COLORES.rojo} />
                      <Text style={styles.mensajeTexto}>{errorHorarios}</Text>
                      <Pressable style={styles.botonClaro} onPress={() => setIntentoHorarios((i) => i + 1)}>
                        <Text style={styles.textoBotonClaro}>Reintentar</Text>
                      </Pressable>
                    </View>
                  )}

                  {!cargandoHorarios && (
                    <>
                      {/* Jornada Almuerzo */}
                      <View style={styles.horarioCard}>
                        <View style={styles.horarioEncabezado}>
                          <Ionicons name="sunny-outline" size={22} color={COLORES.ambar} />
                          <Text style={styles.horarioTitulo}>Almuerzo</Text>
                          <Switch
                            value={almuerzoActivo}
                            onValueChange={(v) => {
                              if (!guardandoHorario) setAlmuerzoActivo(v);
                            }}
                            trackColor={{ false: '#3A4452', true: COLORES.ambar }}
                            thumbColor="#F5EFE6"
                          />
                        </View>
                        <View style={styles.horarioFila}>
                          <View style={styles.horarioCampo}>
                            <Text style={styles.horarioEtiqueta}>Inicio</Text>
                            <TextInput
                              style={styles.inputSimple}
                              value={almuerzoInicio}
                              onChangeText={setAlmuerzoInicio}
                              placeholder="12:30"
                              placeholderTextColor="rgba(255,255,255,0.35)"
                              editable={!guardandoHorario && almuerzoActivo}
                            />
                          </View>
                          <View style={styles.horarioCampo}>
                            <Text style={styles.horarioEtiqueta}>Fin</Text>
                            <TextInput
                              style={styles.inputSimple}
                              value={almuerzoFin}
                              onChangeText={setAlmuerzoFin}
                              placeholder="14:30"
                              placeholderTextColor="rgba(255,255,255,0.35)"
                              editable={!guardandoHorario && almuerzoActivo}
                            />
                          </View>
                          <View style={styles.horarioCampo}>
                            <Text style={styles.horarioEtiqueta}>Dur. (min)</Text>
                            <TextInput
                              style={styles.inputSimple}
                              value={almuerzoDur}
                              onChangeText={setAlmuerzoDur}
                              keyboardType="number-pad"
                              placeholderTextColor="rgba(255,255,255,0.35)"
                              editable={!guardandoHorario && almuerzoActivo}
                            />
                          </View>
                        </View>
                      </View>

                      {/* Jornada Noche */}
                      <View style={styles.horarioCard}>
                        <View style={styles.horarioEncabezado}>
                          <Ionicons name="moon-outline" size={22} color={COLORES.ambar} />
                          <Text style={styles.horarioTitulo}>Noche</Text>
                          <Switch
                            value={nocheActivo}
                            onValueChange={(v) => {
                              if (!guardandoHorario) setNocheActivo(v);
                            }}
                            trackColor={{ false: '#3A4452', true: COLORES.ambar }}
                            thumbColor="#F5EFE6"
                          />
                        </View>
                        <View style={styles.horarioFila}>
                          <View style={styles.horarioCampo}>
                            <Text style={styles.horarioEtiqueta}>Inicio</Text>
                            <TextInput
                              style={styles.inputSimple}
                              value={nocheInicio}
                              onChangeText={setNocheInicio}
                              placeholder="17:00"
                              placeholderTextColor="rgba(255,255,255,0.35)"
                              editable={!guardandoHorario && nocheActivo}
                            />
                          </View>
                          <View style={styles.horarioCampo}>
                            <Text style={styles.horarioEtiqueta}>Fin</Text>
                            <TextInput
                              style={styles.inputSimple}
                              value={nocheFin}
                              onChangeText={setNocheFin}
                              placeholder="23:00"
                              placeholderTextColor="rgba(255,255,255,0.35)"
                              editable={!guardandoHorario && nocheActivo}
                            />
                          </View>
                          <View style={styles.horarioCampo}>
                            <Text style={styles.horarioEtiqueta}>Dur. (min)</Text>
                            <TextInput
                              style={styles.inputSimple}
                              value={nocheDur}
                              onChangeText={setNocheDur}
                              keyboardType="number-pad"
                              placeholderTextColor="rgba(255,255,255,0.35)"
                              editable={!guardandoHorario && nocheActivo}
                            />
                          </View>
                        </View>
                      </View>

                      <Pressable
                        style={[styles.botonGuardar, guardandoHorario && styles.botonDeshabilitado]}
                        onPress={guardarHorarios}
                        disabled={guardandoHorario}
                      >
                        {guardandoHorario ? (
                          <ActivityIndicator color="#1A1A1A" />
                        ) : (
                          <View style={styles.botonGuardarContenido}>
                            <Ionicons name="save-outline" size={20} color="#1A1A1A" />
                            <Text style={styles.botonGuardarTexto}>Guardar horarios del día</Text>
                          </View>
                        )}
                      </Pressable>
                    </>
                  )}
                </>
              )}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  fondo: { flex: 1, backgroundColor: COLORES.fondo },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(10,14,22,0.88)',
  },
  container: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 40,
  },

  /* ========== Barra superior ========== */
  barraSuperior: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  botonBarra: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    gap: 6,
  },
  textoBarra: { color: COLORES.texto, fontSize: 14, fontWeight: '600' },

  /* ========== Login ========== */
  loginCard: {
    backgroundColor: COLORES.card,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORES.linea,
    padding: 26,
    marginTop: 10,
    alignItems: 'center',
  },
  loginEncabezado: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoKicker: {
    color: COLORES.ambar,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 4,
    marginTop: 12,
  },
  loginTitulo: {
    color: COLORES.texto,
    fontSize: 30,
    fontWeight: '900',
    marginTop: 4,
  },
  loginSubtexto: {
    color: COLORES.textoSuave,
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  campo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    height: 58,
    paddingHorizontal: 16,
    width: '100%',
    marginBottom: 14,
  },
  campoIcono: { marginRight: 12 },
  input: {
    flex: 1,
    color: COLORES.texto,
    fontSize: 16,
  },
  alertaError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,90,90,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,90,90,0.35)',
    borderRadius: 14,
    padding: 12,
    width: '100%',
    marginBottom: 8,
  },
  alertaErrorTexto: { color: '#FFB4B4', flex: 1, fontSize: 13, lineHeight: 18 },
  botonPrimario: {
    backgroundColor: COLORES.ambar,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    width: '100%',
  },
  botonPrimarioContenido: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  botonPrimarioTexto: {
    color: '#1A1A1A',
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  botonDeshabilitado: { opacity: 0.55 },

  /* ========== Tabs ========== */
  tabs: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 18,
    padding: 4,
    marginBottom: 18,
    gap: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 46,
    borderRadius: 15,
  },
  tabActivo: {
    backgroundColor: COLORES.ambar,
  },
  tabTexto: {
    color: COLORES.textoSuave,
    fontSize: 12,
    fontWeight: '700',
  },
  tabTextoActivo: {
    color: '#1A1A1A',
  },

  /* ========== Encabezados de sección ========== */
  encabezadoSeccion: {
    marginBottom: 14,
  },
  kicker: {
    color: COLORES.ambar,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  tituloSeccion: {
    color: COLORES.texto,
    fontSize: 28,
    fontWeight: '900',
    marginTop: 2,
  },
  metaTexto: {
    color: COLORES.textoSuave,
    fontSize: 13,
    marginTop: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
  },
  pillRol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORES.ambar,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  pillRolTexto: { color: '#1A1A1A', fontSize: 11, fontWeight: '900', textTransform: 'uppercase' },

  /* ========== Reservas: días ========== */
  fechaTexto: {
    color: COLORES.texto,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 12,
  },
  diasScroll: { marginBottom: 14 },
  filtroMesaScroll: { marginBottom: 14 },
  filtroMesaContenido: { gap: 8, paddingVertical: 2 },
  chipMesa: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 12,
  },
  chipMesaActiva: {
    backgroundColor: COLORES.ambar,
    borderColor: '#FFFFFF',
    borderWidth: 2,
  },
  chipMesaTexto: { color: COLORES.textoSuave, fontSize: 13, fontWeight: '700' },
  chipMesaTextoActivo: { color: '#1A1A1A' },
  filaDias: { gap: 8, paddingRight: 4 },
  dia: {
    width: 58,
    height: 64,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  diaElegido: {
    backgroundColor: COLORES.ambar,
    borderColor: '#FFFFFF',
    borderWidth: 2,
  },
  diaNombre: { color: COLORES.textoSuave, fontSize: 11, fontWeight: '700' },
  diaNumero: { color: COLORES.texto, fontSize: 19, fontWeight: '900', marginTop: 2 },
  textoOscuro: { color: '#1A1A1A' },

  /* ========== Tarjeta de reserva ========== */
  tarjetaReserva: {
    flexDirection: 'row',
    backgroundColor: COLORES.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORES.linea,
    overflow: 'hidden',
    marginBottom: 12,
  },
  tarjetaCancelada: { opacity: 0.55 },
  acentoLateral: { width: 5 },
  acentoOk: { backgroundColor: COLORES.ambar },
  acentoCancelar: { backgroundColor: COLORES.rojo },
  tarjetaContenido: { flex: 1, padding: 14 },
  tarjetaCabecera: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  horaBloque: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  hora: { color: COLORES.texto, fontSize: 17, fontWeight: '800' },
  estadoPill: {
    backgroundColor: 'rgba(242,160,63,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(242,160,63,0.45)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  estadoPillTexto: { color: COLORES.ambar, fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
  estadoCancelada: {
    backgroundColor: 'rgba(255,90,90,0.14)',
    borderColor: 'rgba(255,90,90,0.4)',
  },
  estadoCanceladaTexto: { color: '#FF8A8A' },
  tarjetaCompletada: { opacity: 0.7 },
  acentoCompletada: { backgroundColor: COLORES.verde },
  estadoCompletadaPill: {
    backgroundColor: 'rgba(62,213,152,0.16)',
    borderColor: 'rgba(62,213,152,0.5)',
  },
  estadoCompletadaPillTexto: { color: COLORES.verde },
  accionesReserva: { flexDirection: 'row', gap: 10, marginTop: 10 },
  botonCompletar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(62,213,152,0.5)',
    backgroundColor: 'rgba(62,213,152,0.12)',
    paddingHorizontal: 14,
  },
  textoCompletar: { color: '#7EE2A5', fontSize: 13, fontWeight: '800' },
  cliente: { color: COLORES.texto, fontSize: 18, fontWeight: '800', marginBottom: 8 },
  detalleFila: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  detalle: { color: COLORES.textoSuave, fontSize: 14 },
  botonCancelar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(255,90,90,0.45)',
    backgroundColor: 'rgba(255,90,90,0.08)',
    paddingHorizontal: 14,
    marginTop: 10,
  },
  textoCancelar: { color: '#FF8A8A', fontSize: 13, fontWeight: '800' },

  /* ========== Estado vacío / errores ========== */
  vacioCaja: {
    alignItems: 'center',
    backgroundColor: COLORES.card,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: COLORES.linea,
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  vacioTexto: { color: COLORES.texto, fontSize: 17, fontWeight: '800', marginTop: 14, textAlign: 'center' },
  vacioSub: { color: COLORES.textoSuave, fontSize: 13, textAlign: 'center', marginTop: 6 },
  mensajeCard: {
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORES.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORES.linea,
    padding: 22,
  },
  mensajeTexto: { color: COLORES.texto, fontSize: 15, textAlign: 'center' },
  botonClaro: {
    backgroundColor: COLORES.crema,
    paddingHorizontal: 24,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textoBotonClaro: { color: '#1A1A1A', fontSize: 14, fontWeight: '800' },

  /* ========== Formularios ========== */
  formCard: {
    backgroundColor: COLORES.card,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: COLORES.linea,
    padding: 18,
    marginBottom: 16,
  },
  formEncabezado: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  formTitulo: { color: COLORES.texto, fontSize: 17, fontWeight: '800' },
  campoLabel: {
    color: COLORES.textoSuave,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginTop: 4,
  },
  inputSimple: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    borderRadius: 14,
    height: 50,
    paddingHorizontal: 14,
    color: COLORES.texto,
    fontSize: 15,
  },

  /* ========== Categoría chips (2 col) ========== */
  categoriaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  categoriaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  categoriaPillActiva: {
    backgroundColor: COLORES.ambar,
    borderColor: '#FFFFFF',
  },
  categoriaPillTexto: { color: COLORES.texto, fontSize: 12, fontWeight: '700' },
  categoriaPillTextoActiva: { color: '#1A1A1A' },

  /* ========== Fila precio + recomendado ========== */
  filaPrecioRecomendado: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'flex-end',
    marginBottom: 4,
  },
  campoPrecio: { flex: 1 },
  campoSwitch: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
  },

  /* ========== Botones formulario ========== */
  botonesFormulario: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  botonSecundario: {
    flex: 1,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  botonSecundarioTexto: { color: COLORES.texto, fontSize: 15, fontWeight: '700' },
  botonGuardar: {
    flex: 2,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORES.ambar,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botonGuardarContenido: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  botonGuardarTexto: { color: '#1A1A1A', fontSize: 15, fontWeight: '900' },

  /* ========== Lista de grupos carta ========== */
  grupo: { marginBottom: 18 },
  grupoEncabezado: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  grupoTitulo: { color: COLORES.texto, fontSize: 17, fontWeight: '800' },
  grupoContador: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  grupoContadorTexto: { color: COLORES.textoSuave, fontSize: 11, fontWeight: '800' },

  platoFila: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORES.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORES.linea,
    padding: 10,
    marginBottom: 8,
  },
  platoImagen: {
    width: 64,
    height: 64,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    overflow: 'hidden',
  },
  platoImagenFuente: { width: 64, height: 64 },
  platoInfo: { flex: 1, marginRight: 8 },
  platoNombre: { color: COLORES.texto, fontSize: 14, fontWeight: '800' },
  platoNombreFila: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  platoPrecio: { color: COLORES.crema, fontSize: 14, fontWeight: '700', marginTop: 2 },
  chipDisponibilidad: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
  },
  chipOk: { backgroundColor: 'rgba(62,213,152,0.15)', borderColor: 'rgba(62,213,152,0.5)' },
  chipAgotado: { backgroundColor: 'rgba(255,90,90,0.12)', borderColor: 'rgba(255,90,90,0.5)' },
  chipTexto: { fontSize: 11, fontWeight: '800' },
  chipTextoOk: { color: COLORES.verde },
  chipTextoAgotado: { color: '#FF8A8A' },
  iconoBoton: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  iconoBotonRojo: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: 'rgba(255,90,90,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,90,90,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },

  /* ========== Mesas ========== */
  zonaFila: { flexDirection: 'row', gap: 10, marginBottom: 6 },
  zonaPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  zonaPillActiva: { backgroundColor: COLORES.ambar, borderColor: '#FFFFFF', borderWidth: 2 },
  zonaPillTexto: { color: COLORES.texto, fontSize: 14, fontWeight: '700' },
  zonaPillTextoActiva: { color: '#1A1A1A' },
  filaCapacidad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
  },
  capacidadTextos: { flex: 1 },
  capacidadAyuda: { color: COLORES.textoSuave, fontSize: 11, marginTop: 2 },
  capacidadControles: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  capacidadNumero: { color: COLORES.texto, fontSize: 22, fontWeight: '900', minWidth: 28, textAlign: 'center' },
  filaActiva: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
  },
  activaTextos: { flex: 1, marginRight: 10 },
  activaBotones: { flexDirection: 'row', gap: 8 },
  estadoPillMesa: {
    paddingHorizontal: 14,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  estadoPillActivo: { backgroundColor: 'rgba(62,213,152,0.15)', borderColor: 'rgba(62,213,152,0.5)' },
  estadoPillInactivo: { backgroundColor: 'rgba(255,90,90,0.12)', borderColor: 'rgba(255,90,90,0.4)' },
  estadoPillMesaTexto: { color: '#8BE3B2', fontSize: 12, fontWeight: '800' },
  estadoPillMesaTextoActivo: { color: '#FFFFFF' },

  seccionLabel: {
    color: COLORES.texto,
    fontSize: 17,
    fontWeight: '800',
    marginTop: 4,
    marginBottom: 12,
  },

  mesaFila: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORES.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORES.linea,
    padding: 12,
    marginBottom: 10,
  },
  mesaInfo: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  mesaIcono: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mesaIconoTexto: { color: '#1A1A1A', fontWeight: '900', fontSize: 20 },
  mesaTextos: { flex: 1 },
  mesaNombre: { color: COLORES.texto, fontSize: 15, fontWeight: '800' },
  mesaDetalle: { color: COLORES.textoSuave, fontSize: 12, marginTop: 2 },
  mesaAcciones: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  toggleActivo: {
    height: 34,
    paddingHorizontal: 10,
    borderRadius: 17,
    borderWidth: 1,
    justifyContent: 'center',
  },
  toggleOk: { backgroundColor: 'rgba(62,213,152,0.15)', borderColor: 'rgba(62,213,152,0.5)' },
  toggleOff: { backgroundColor: 'rgba(255,90,90,0.12)', borderColor: 'rgba(255,90,90,0.4)' },
  toggleActivoTexto: { fontSize: 11, fontWeight: '800' },
  toggleActivoTextoOk: { color: '#8BE3B2' },
  toggleActivoTextoOff: { color: '#FF8A8A' },

  /* ========== Horarios ========== */
  diasSemanaFila: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 16,
  },
  diaSemanaBtn: {
    flex: 1,
    height: 46,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  diaSemanaBtnActivo: { backgroundColor: COLORES.ambar, borderColor: '#FFFFFF', borderWidth: 2 },
  diaSemanaTexto: { color: COLORES.textoSuave, fontSize: 12, fontWeight: '800' },
  diaSemanaTextoActivo: { color: '#1A1A1A' },
  horarioCard: {
    backgroundColor: COLORES.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORES.linea,
    padding: 16,
    marginBottom: 12,
  },
  horarioEncabezado: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  horarioTitulo: { flex: 1, color: COLORES.texto, fontSize: 16, fontWeight: '800' },
  horarioFila: { flexDirection: 'row', gap: 8 },
  horarioCampo: { flex: 1 },
  horarioEtiqueta: { color: COLORES.textoSuave, fontSize: 11, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6 },

  /* ========== Utilidades ========== */
  cargando: { marginVertical: 30 },
 });
