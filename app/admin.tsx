import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../services/supabase';
import { fechaATexto, proximosDias } from '../utils/fechas';

export const options = {
  headerShown: false,
};

const FONDO = require('../assets/images/FondoReservarMesa.png');

const DIAS_CORTOS = ['Dom', 'Lun', 'Mar', 'MiÃ©', 'Jue', 'Vie', 'SÃ¡b'];
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const NOMBRE_ZONA: Record<string, string> = { terraza: 'Terraza', salon: 'SalÃ³n' };

const CATEGORIA_INFO: Record<string, { label: string; emoji: string }> = {
  entradas: { label: 'Entradas', emoji: 'ðŸ¥Ÿ' },
  'menu-infantil': { label: 'MenÃº Infantil', emoji: 'ðŸ‘¶' },
  pizzas: { label: 'Pizzas', emoji: 'ðŸ•' },
  desgranados: { label: 'Desgranados', emoji: 'ðŸ¥˜' },
  papas: { label: 'Papas IkÃ³nicas', emoji: 'ðŸŸ' },
  lasana: { label: 'LasaÃ±a', emoji: 'ðŸ' },
  granizados: { label: 'Granizados', emoji: 'ðŸ§Š' },
  sodas: { label: 'Sodas', emoji: 'ðŸ§ƒ' },
  bebidas: { label: 'Bebidas FrÃ­as', emoji: 'ðŸ¥¤' },
  cerveza: { label: 'Cerveza', emoji: 'ðŸº' },
  cocteles: { label: 'CÃ³cteles', emoji: 'ðŸ¹' },
  postres: { label: 'Postres', emoji: 'ðŸ¨' },
  almuerzos: { label: 'MenÃº Almuerzos', emoji: 'ðŸ' },
  congelados: { label: 'Congelados', emoji: 'â„ï¸' },
};

function formatoPrecio(p: number) {
  return '$ ' + String(p).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function formatoFechaLarga(fechaTexto: string) {
  const [a, m, d] = fechaTexto.split('-').map(Number);
  const dia = DIAS_CORTOS[new Date(a, m - 1, d).getDay()];
  return `${dia} ${d} ${MESES[m - 1]}`;
}

export default function Admin() {
  const router = useRouter();

  // SesiÃ³n y rol
  const [revisandoSesion, setRevisandoSesion] = useState(true);
  const [rol, setRol] = useState<string | null>(null);
  const [correo, setCorreo] = useState('');
  const [clave, setClave] = useState('');
  const [errorLogin, setErrorLogin] = useState<string | null>(null);
  const [entrando, setEntrando] = useState(false);

  // PestaÃ±a seleccionada (solo para admin)
  const [seccion, setSeccion] = useState<'reservas' | 'carta' | 'mesas' | 'horarios'>('reservas');

  // Lista de reservas
  const [fecha, setFecha] = useState(fechaATexto(new Date()));
  const [reservas, setReservas] = useState<any[]>([]);
  const [cargandoLista, setCargandoLista] = useState(false);
  const [errorLista, setErrorLista] = useState<string | null>(null);
  const [intento, setIntento] = useState(0);

  // SecciÃ³n Carta (solo admin)
  const [platos, setPlatos] = useState<any[]>([]);
  const [cargandoPlatos, setCargandoPlatos] = useState(false);
  const [errorPlatos, setErrorPlatos] = useState<string | null>(null);

  // SecciÃ³n Horarios (solo admin)
  const [horarios, setHorarios] = useState<any[]>([]);
  const [cargandoHorarios, setCargandoHorarios] = useState(false);
  const [errorHorarios, setErrorHorarios] = useState<string | null>(null);
  const [intentoHorarios, setIntentoHorarios] = useState(0);
  const [diaEditar, setDiaEditar] = useState<string>(() =>
    ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'][new Date().getDay()]
  );
  const [mAlmuerzoInicio, setMAlmuerzoInicio] = useState('12:30');
  const [mAlmuerzoFin, setMAlmuerzoFin] = useState('14:30');
  const [mAlmuerzoDur, setMAlmuerzoDur] = useState('60');
  const [mAlmuerzoAct, setMAlmuerzoAct] = useState(true);
  const [mNocheInicio, setMNocheInicio] = useState('17:00');
  const [mNocheFin, setMNocheFin] = useState('23:00');
  const [mNocheDur, setMNocheDur] = useState('60');
  const [mNocheAct, setMNocheAct] = useState(true);
  const [guardandoHorario, setGuardandoHorario] = useState(false);

  // SecciÃ³n Mesas (solo admin): listar, crear, editar, activar/desactivar
  const [mesas, setMesas] = useState<any[]>([]);
  const [cargandoMesas, setCargandoMesas] = useState(false);
  const [errorMesas, setErrorMesas] = useState<string | null>(null);
  const [intentoMesas, setIntentoMesas] = useState(0);
  // Formulario para crear / editar una mesa
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [formNombre, setFormNombre] = useState('');
  const [formZona, setFormZona] = useState<string>('terraza');
  const [formCapacidad, setFormCapacidad] = useState(4);
  const [formActiva, setFormActiva] = useState(true);
  const [guardandoMesa, setGuardandoMesa] = useState(false);

  // SecciÃ³n Platos: gestiÃ³n completa (crear, editar, eliminar)
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
      setErrorLogin('No se pudo verificar tu perfil. Revisa tu conexiÃ³n.');
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
      setErrorLogin('Escribe tu correo y tu contraseÃ±a.');
      return;
    }
    setEntrando(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: correo.trim(),
      password: clave,
    });
    if (error || !data.user) {
      setErrorLogin('Correo o contraseÃ±a incorrectos.');
    } else {
      await verificarRol(data.user.id);
    }
    setEntrando(false);
  }

  async function cerrarSesion() {
    await supabase.auth.signOut();
    setRol(null);
    setReservas([]);
    setPlatos([]);
    setMesas([]);
    setClave('');
    setSeccion('reservas');
    resetFormMesa();
  }

  async function volverYCerrarSesion() {
    await supabase.auth.signOut();
    setRol(null);
    setReservas([]);
    setPlatos([]);
    setMesas([]);
    setClave('');
    setSeccion('reservas');
    resetFormMesa();
    router.back();
  }

  useEffect(() => {
    if (!rol) return;
    let activo = true;

    async function cargarReservas() {
      setCargandoLista(true);
      setErrorLista(null);
      const { data, error } = await supabase
        .from('reservas')
        .select(
          'id, cliente_nombre, cliente_contacto, num_personas, hora_inicio, hora_fin, estado, mesas(nombre, zona)'
        )
        .eq('fecha', fecha)
        .order('hora_inicio', { ascending: true });

      if (!activo) return;
      if (error) {
        setErrorLista('No se pudieron cargar las reservas. Revisa tu conexiÃ³n.');
      } else {
        setReservas(data ?? []);
      }
      setCargandoLista(false);
    }

    cargarReservas();
    return () => {
      activo = false;
    };
  }, [rol, fecha, intento]);

  useEffect(() => {
    if (rol !== 'admin' || seccion !== 'carta') return;
    let activo = true;

    async function cargarPlatos() {
      setCargandoPlatos(true);
      setErrorPlatos(null);
      const { data, error } = await supabase
        .from('platos')
        .select('id, nombre, categoria, precio, disponible')
        .order('categoria')
        .order('precio');

      if (!activo) return;
      if (error) {
        setErrorPlatos('No se pudieron cargar los platos. Revisa tu conexiÃ³n.');
      } else {
        setPlatos(data ?? []);
      }
      setCargandoPlatos(false);
    }

    cargarPlatos();
    return () => {
      activo = false;
    };
  }, [rol, seccion]);

  // Cargar mesas cada vez que el admin abre la secciÃ³n Mesas (o reintenta)
  useEffect(() => {
    if (rol !== 'admin' || seccion !== 'mesas') return;
    let activo = true;

    setCargandoMesas(true);
    setErrorMesas(null);

    supabase
      .from('mesas')
      .select('id, nombre, zona, capacidad, activa')
      .order('nombre', { ascending: true })
      .then(({ data, error }) => {
        if (!activo) return;
        if (error) {
          setErrorMesas('No se pudieron cargar las mesas. Revisa tu conexiÃ³n.');
        } else {
          setMesas(data ?? []);
        }
        setCargandoMesas(false);
      });

    return () => {
      activo = false;
    };
  }, [rol, seccion, intentoMesas]);

  function pedirCancelacion(reserva: any) {
    Alert.alert(
      'Cancelar reserva',
      `Â¿Cancelar la reserva de ${reserva.cliente_nombre} a las ${reserva.hora_inicio.slice(
        0,
        5
      )}?`,
      [{ text: 'No', style: 'cancel' }, { text: 'SÃ­, cancelar', style: 'destructive', onPress: () => cancelar(reserva.id) }]
    );
  }

  async function cancelar(id: string) {
    const { data, error } = await supabase
      .from('reservas')
      .update({ estado: 'cancelada' })
      .eq('id', id)
      .select();

    if (error || !data || data.length === 0) {
      Alert.alert('No se pudo cancelar', 'Revisa tu conexiÃ³n o tus permisos.');
      return;
    }
    setIntento((i) => i + 1);
  }

  async function alternarDisponible(plato: any) {
    const nuevo = !plato.disponible;
    setPlatos((actuales) =>
      actuales.map((p) => (p.id === plato.id ? { ...p, disponible: nuevo } : p))
    );
    const { error } = await supabase
      .from('platos')
      .update({ disponible: nuevo })
      .eq('id', plato.id);
    if (error) {
      Alert.alert('Error', 'No se pudo cambiar la disponibilidad.');
      setPlatos((actuales) =>
        actuales.map((p) => (p.id === plato.id ? { ...p, disponible: !nuevo } : p))
      );
    }
  }

  // ---------- MESAS: cargar, crear, editar, activar/desactivar ----------
  function resetFormMesa() {
    setEditandoId(null);
    setFormNombre('');
    setFormZona('terraza');
    setFormCapacidad(4);
    setFormActiva(true);
  }

  async function cargarMesas() {
    setCargandoMesas(true);
    setErrorMesas(null);
    const { data, error } = await supabase
      .from('mesas')
      .select('id, nombre, zona, capacidad, activa')
      .order('nombre', { ascending: true });
    if (error) {
      setErrorMesas('No se pudieron cargar las mesas. Revisa tu conexiÃ³n.');
    } else {
      setMesas(data ?? []);
    }
    setCargandoMesas(false);
  }

  function iniciarEdicion(mesa: any) {
    setEditandoId(mesa.id);
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
    const capacidadNum = Math.max(1, Math.floor(Number(formCapacidad) || 0));
    if (!capacidadNum) {
      Alert.alert('Capacidad invÃ¡lida', 'La capacidad debe ser al menos 1 persona.');
      return;
    }

    setGuardandoMesa(true);
    const payload = {
      nombre: nombreLimpio,
      zona: formZona,
      capacidad: capacidadNum,
      activa: formActiva,
    };

    let error;
    if (editandoId) {
      const res = await supabase.from('mesas').update(payload).eq('id', editandoId);
      error = res.error;
    } else {
      const res = await supabase.from('mesas').insert(payload);
      error = res.error;
    }
    setGuardandoMesa(false);

    if (error) {
      Alert.alert('Error', 'No se pudo guardar la mesa. Revisa tu conexiÃ³n o permisos.');
      return;
    }
    resetFormMesa();
    setIntentoMesas((i) => i + 1);
  }

  async function alternarActivaMesa(mesa: any) {
    const nueva = !mesa.activa;
    setMesas((actuales) => actuales.map((m) => (m.id === mesa.id ? { ...m, activa: nueva } : m)));
    const { error } = await supabase
      .from('mesas')
      .update({ activa: nueva })
      .eq('id', mesa.id);
    if (error) {
      Alert.alert('Error', 'No se pudo cambiar el estado de la mesa.');
      setMesas((actuales) => actuales.map((m) => (m.id === mesa.id ? { ...m, activa: !nueva } : m)));
    }
  }

  async function eliminarMesa(mesa: any) {
    Alert.alert(
      'Eliminar mesa',
      `Â¿Eliminar "${mesa.nombre}"? Las reservas se conservarÃ¡n.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase.from('mesas').delete().eq('id', mesa.id);
            if (error) {
              Alert.alert('No se pudo eliminar', 'Revisa tu conexiÃ³n o tus permisos.');
              return;
            }
            if (editandoId === mesa.id) resetFormMesa();
            setIntentoMesas((i) => i + 1);
          },
        },
      ]
    );
  }

  // ---------- HORARIOS ----------
  const DIAS_SEMANA_COMPLETOS = [
    { clave: 'lunes', etiqueta: 'L' },
    { clave: 'martes', etiqueta: 'M' },
    { clave: 'miercoles', etiqueta: 'X' },
    { clave: 'jueves', etiqueta: 'J' },
    { clave: 'viernes', etiqueta: 'V' },
    { clave: 'sabado', etiqueta: 'S' },
    { clave: 'domingo', etiqueta: 'D' },
  ];

  // Formatea "12:30:00" -> "12:30"
  function soloHora(t: string) {
    return t ? t.slice(0, 5) : '';
  }

  function cargarHorarioAFormulario(h: any) {
    if (h?.jornada === 'almuerzo') {
      setMAlmuerzoInicio(soloHora(h.hora_inicio));
      setMAlmuerzoFin(soloHora(h.hora_fin));
      setMAlmuerzoDur(String(h.duracion_slot ?? 60));
      setMAlmuerzoAct(h.activo !== false);
    } else {
      setMNocheInicio(soloHora(h.hora_inicio));
      setMNocheFin(soloHora(h.hora_fin));
      setMNocheDur(String(h.duracion_slot ?? 60));
      setMNocheAct(h.activo !== false);
    }
  }

  async function guardarHorarios() {
    setGuardandoHorario(true);
    const actualizar = async (jornada: string, inicio: string, fin: string, dur: string, act: boolean) => {
      // Si existe la fila para ese dÃ­a y esa jornada, la actualiza. Si no, la crea.
      const existentes = horarios.find((h) => h.dia_semana === diaEditar && h.jornada === jornada);
      const payload = {
        dia_semana: diaEditar,
        jornada,
        hora_inicio: inicio,
        hora_fin: fin,
        duracion_slot: Math.max(15, Number(dur) || 60),
        activo: act,
      };
      if (existentes) {
        return supabase.from('horarios').update(payload).eq('id', existentes.id);
      }
      return supabase.from('horarios').insert(payload);
    };
    const [res1, res2] = await Promise.all([
      actualizar('almuerzo', mAlmuerzoInicio, mAlmuerzoFin, mAlmuerzoDur, mAlmuerzoAct),
      actualizar('noche', mNocheInicio, mNocheFin, mNocheDur, mNocheAct),
    ]);
    if (res1.error || res2.error) {
      Alert.alert('Error', 'No se pudieron guardar los horarios. Revisa tu conexiÃ³n o permisos.');
    } else {
      setIntentoHorarios((i) => i + 1);
    }
    setGuardandoHorario(false);
  }

  // ---------- PLATOS: crear, editar, eliminar ----------
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
      Alert.alert('Datos invÃ¡lidos', 'Escribe un nombre y un precio mayor a 0.');
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
      // Al editar, no sobreescribir disponible
      const { disponible, ...sinDisponible } = payload;
      const res = await supabase.from('platos').update(sinDisponible).eq('id', editandoPlatoId);
      error = res.error;
    } else {
      const res = await supabase.from('platos').insert(payload);
      error = res.error;
    }

    setGuardandoPlato(false);
    if (error) {
      Alert.alert('Error', 'No se pudo guardar el plato. Revisa tu conexiÃ³n o permisos.');
      return;
    }
    setEditandoPlatoId(null);
    setFormPlatoNombre('');
    setFormPlatoCategoria('pizzas');
    setFormPlatoPrecio('');
    setFormPlatoDescripcion('');
    setFormPlatoRecomendado(false);
    setIntento((i) => i + 1); // recarga la lista de platos
  }

  async function eliminarPlato(plato: any) {
    Alert.alert(
      'Eliminar plato',
      `Â¿Eliminar "${plato.nombre}"? Esta acciÃ³n no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase.from('platos').delete().eq('id', plato.id);
            if (error) {
              Alert.alert('No se pudo eliminar', 'Revisa tu conexiÃ³n o tus permisos.');
              return;
            }
            setIntento((i) => i + 1);
          },
        },
      ]
    );
  }

  // ---------- Horarios: cargar ----------
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
          setErrorHorarios('No se pudieron cargar los horarios. Revisa tu conexiÃ³n.');
        } else {
          setHorarios(data ?? []);
          // Cargar almuerzo y noche del dÃ­a seleccionado al formulario
          const dia = (data ?? []).find((h: any) => h.dia_semana === diaEditar) ?? [];
          const alu = dia.find((h: any) => h.jornada === 'almuerzo');
          const noc = dia.find((h: any) => h.jornada === 'noche');
          if (alu) cargarHorarioAFormulario(alu);
          if (noc) cargarHorarioAFormulario(noc);
        }
        setCargandoHorarios(false);
      });
    return () => {
      activo = false;
    };
  }, [rol, seccion, intentoHorarios, diaEditar]);
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
          <View style={styles.barraSuperior}>
            <Pressable style={styles.botonBarra} onPress={volverYCerrarSesion}>
              <Text style={styles.textoBarra}>â€¹ Volver</Text>
            </Pressable>
            {rol && (
              <Pressable style={styles.botonBarra} onPress={cerrarSesion}>
                <Text style={styles.textoBarra}>Cerrar sesiÃ³n</Text>
              </Pressable>
            )}
          </View>

          {revisandoSesion && <ActivityIndicator size="large" color="#F28C28" style={styles.cargando} />}

          {/* ---------- INICIO DE SESIÃ“N ---------- */}
          {!revisandoSesion && !rol && (
            <View style={styles.loginCard}>
              <Text style={styles.titulo}>Acceso del personal</Text>
              <Text style={styles.subtitulo}>Inicia sesiÃ³n para ver las reservas</Text>

              <Text style={styles.etiqueta}>Correo</Text>
              <TextInput
                style={styles.input}
                value={correo}
                onChangeText={setCorreo}
                placeholder="correo@ejemplo.com"
                placeholderTextColor="rgba(255,255,255,0.45)"
                autoCapitalize="none"
                keyboardType="email-address"
                editable={!entrando}
              />

              <Text style={styles.etiqueta}>ContraseÃ±a</Text>
              <TextInput
                style={styles.input}
                value={clave}
                onChangeText={setClave}
                placeholder="ContraseÃ±a"
                placeholderTextColor="rgba(255,255,255,0.45)"
                secureTextEntry
                autoCapitalize="none"
                editable={!entrando}
              />

              {errorLogin && <Text style={styles.textoError}>{errorLogin}</Text>}

              <Pressable
                style={[styles.botonPrincipal, entrando && styles.botonDeshabilitado]}
                onPress={iniciarSesion}
                disabled={entrando}
              >
                {entrando ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.textoPrincipal}>Entrar</Text>
                )}
              </Pressable>
            </View>
          )}

          {/* ---------- PANEL (con rol autenticado) ---------- */}
          {!revisandoSesion && rol && (
            <>
              {rol === 'admin' && (
                <View style={styles.tabsBar}>
                  <Pressable
                    style={[styles.tab, seccion === 'reservas' && styles.tabActivo]}
                    onPress={() => setSeccion('reservas')}
                  >
                    <Text style={[styles.tabTexto, seccion === 'reservas' && styles.tabTextoActivo]}>
                      Reservas
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[styles.tab, seccion === 'carta' && styles.tabActivo]}
                    onPress={() => setSeccion('carta')}
                  >
                    <Text style={[styles.tabTexto, seccion === 'carta' && styles.tabTextoActivo]}>
                      Carta
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[styles.tab, seccion === 'mesas' && styles.tabActivo]}
                    onPress={() => setSeccion('mesas')}
                  >
                    <Text style={[styles.tabTexto, seccion === 'mesas' && styles.tabTextoActivo]}>
                      Mesas
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[styles.tab, seccion === 'horarios' && styles.tabActivo]}
                    onPress={() => setSeccion('horarios')}
                  >
                    <Text style={[styles.tabTexto, seccion === 'horarios' && styles.tabTextoActivo]}>
                      Horarios
                    </Text>
                  </Pressable>
                </View>
              )}

              {/* ============ SECCIÃ“N: RESERVAS ============ */}
              {(rol === 'mesero' || seccion === 'reservas') && (
                <>
                  <View style={styles.encabezadoReservas}>
                    <View>
                      <Text style={styles.titulo}>Reservas</Text>
                      <View style={styles.metaRow}>
                        <Text style={styles.pillRol}>{rol === 'admin' ? 'Admin' : 'Mesero'}</Text>
                        <Text style={styles.metaTexto}>
                          {confirmadas}{' '}
                          {confirmadas === 1 ? 'confirmada hoy' : 'confirmadas hoy'}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <Text style={styles.fechaTitulo}>{formatoFechaLarga(fecha)}</Text>

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

                  {cargandoLista && (
                    <ActivityIndicator size="large" color="#F28C28" style={styles.cargando} />
                  )}

                  {errorLista && (
                    <View style={styles.mensajeCaja}>
                      <View style={styles.mensajeCard}>
                        <Text style={styles.mensajeTexto}>{errorLista}</Text>
                        <Pressable style={styles.botonClaro} onPress={() => setIntento(intento + 1)}>
                          <Text style={styles.textoBotonClaro}>Reintentar</Text>
                        </Pressable>
                      </View>
                    </View>
                  )}

                  {!cargandoLista && !errorLista && reservas.length === 0 && (
                    <View style={styles.vacioCaja}>
                      <Text style={styles.vacioEmoji}>ðŸ½ï¸</Text>
                      <Text style={styles.vacioTexto}>No hay reservas para este dÃ­a</Text>
                      <Text style={styles.vacioSub}>
                        Cuando alguien reserve desde la app aparecerÃ¡ aquÃ­.
                      </Text>
                    </View>
                  )}

                  {!cargandoLista &&
                    !errorLista &&
                    reservas.map((r) => {
                      const cancelada = r.estado === 'cancelada';
                      return (
                        <View key={r.id} style={[styles.tarjeta, cancelada && styles.tarjetaCancelada]}>
                          <View
                            style={[
                              styles.acentoLateral,
                              cancelada ? styles.acentoCancelar : styles.acentoOk,
                            ]}
                          />
                          <View style={styles.tarjetaContenido}>
                            <View style={styles.tarjetaCabecera}>
                              <Text style={styles.hora}>
                                {r.hora_inicio.slice(0, 5)} â€“ {r.hora_fin.slice(0, 5)}
                              </Text>
                              <Text style={[styles.estado, cancelada && styles.estadoCancelada]}>
                                {cancelada ? 'CANCELADA' : 'CONFIRMADA'}
                              </Text>
                            </View>

                            <Text style={styles.cliente}>{r.cliente_nombre}</Text>
                            <Text style={styles.detalle}>
                              {r.mesas?.nombre ?? 'Mesa'} Â· {NOMBRE_ZONA[r.mesas?.zona] ?? r.mesas?.zona ?? ''} Â·{' '}
                              {r.num_personas} {r.num_personas === 1 ? 'persona' : 'personas'}
                            </Text>
                            <Text style={styles.detalle}>Tel: {r.cliente_contacto ?? 'â€”'}</Text>

                            {puedeCancelar && !cancelada && (
                              <Pressable style={styles.botonCancelar} onPress={() => pedirCancelacion(r)}>
                                <Text style={styles.textoCancelar}>Cancelar reserva</Text>
                              </Pressable>
                            )}
                          </View>
                        </View>
                      );
                    })}
                </>
              )}

              {/* ============ SECCIÃ“N: CARTA (solo admin) ============ */}
              {rol === 'admin' && seccion === 'carta' && (
                <>
                  <Text style={styles.titulo}>Carta</Text>
                  <Text style={styles.subtitulo}>
                    {editandoPlatoId != null ? 'Editando plato' : 'Agrega un plato nuevo'} o cambia Disponible/Agotado
                  </Text>

                  {/* Formulario crear / editar plato */}
                  <View style={styles.mesaForm}>
                    <Text style={styles.etiqueta}>Nombre</Text>
                    <TextInput
                      style={styles.input}
                      value={formPlatoNombre}
                      onChangeText={setFormPlatoNombre}
                      placeholder="Ej. Hawaiiana"
                      placeholderTextColor="rgba(255,255,255,0.45)"
                      editable={!guardandoPlato}
                    />

                    <Text style={styles.etiqueta}>CategorÃ­a</Text>
                    <View style={styles.chipsFila}>
                      {Object.keys(CATEGORIA_INFO).map((clave) => {
                        const elegido = formPlatoCategoria === clave;
                        const info = CATEGORIA_INFO[clave];
                        return (
                          <Pressable
                            key={clave}
                            style={[styles.chip, elegido && styles.chipToggle]}
                            onPress={() => !guardandoPlato && setFormPlatoCategoria(clave)}
                          >
                            <Text style={[styles.chipTexto, elegido && styles.chipTextoActivo]}>
                              {info.emoji} {info.label}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>

                    <View style={styles.capacidadFila}>
                      <View style={styles.capacidadTextos}>
                        <Text style={styles.etiqueta}>Precio (COP)</Text>
                      </View>
                      <TextInput
                        style={[styles.input, styles.inputPrecio]}
                        value={formPlatoPrecio}
                        onChangeText={setFormPlatoPrecio}
                        placeholder="27900"
                        placeholderTextColor="rgba(255,255,255,0.45)"
                        keyboardType="number-pad"
                        editable={!guardandoPlato}
                      />
                    </View>

                    <Text style={styles.etiqueta}>DescripciÃ³n (opcional)</Text>
                    <TextInput
                      style={styles.input}
                      value={formPlatoDescripcion}
                      onChangeText={setFormPlatoDescripcion}
                      placeholder="Ej. JamÃ³n, piÃ±a y queso mozzarella"
                      placeholderTextColor="rgba(255,255,255,0.45)"
                      editable={!guardandoPlato}
                    />

                    <Pressable
                      style={styles.activaFila}
                      onPress={() => !guardandoPlato && setFormPlatoRecomendado(!formPlatoRecomendado)}
                    >
                      <Text style={styles.etiqueta}>â­ Recomendado</Text>
                      <View style={[styles.switchRecomendado, formPlatoRecomendado && styles.switchRecomendadoActivo]}>
                        <Text style={[styles.switchRecomendadoTexto, formPlatoRecomendado && styles.switchRecomendadoTextoActivo]}>
                          {formPlatoRecomendado ? 'SÃ­' : 'No'}
                        </Text>
                      </View>
                    </Pressable>

                    <View style={styles.botonesFormulario}>
                      {editandoPlatoId != null && (
                        <Pressable
                          style={[styles.botonSecundario, guardandoPlato && styles.botonDeshabilitado]}
                          onPress={() => {
                            if (guardandoPlato) return;
                            setEditandoPlatoId(null);
                            setFormPlatoNombre('');
                            setFormPlatoCategoria('pizzas');
                            setFormPlatoPrecio('');
                            setFormPlatoDescripcion('');
                            setFormPlatoRecomendado(false);
                          }}
                        >
                          <Text style={styles.textoBotonSecundario}>Cancelar</Text>
                        </Pressable>
                      )}
                      <Pressable
                        style={[styles.botonGuardar, guardandoPlato && styles.botonDeshabilitado, editandoPlatoId == null && { flex: 1 }]}
                        onPress={guardarPlato}
                        disabled={guardandoPlato}
                      >
                        {guardandoPlato ? (
                          <ActivityIndicator color="#FFFFFF" />
                        ) : (
                          <Text style={styles.textoBotonGuardar}>
                            {editandoPlatoId != null ? 'Guardar cambios' : 'Agregar plato'}
                          </Text>
                        )}
                      </Pressable>
                    </View>
                  </View>

                  {cargandoPlatos && <ActivityIndicator size="large" color="#F28C28" style={styles.cargando} />}

                  {errorPlatos && (
                    <View style={styles.mensajeCaja}>
                      <View style={styles.mensajeCard}>
                        <Text style={styles.mensajeTexto}>{errorPlatos}</Text>
                        <Text style={styles.mensajeTexto}></Text>
                        <Pressable style={styles.botonClaro} onPress={() => setSeccion('carta')}>
                          <Text style={styles.textoBotonClaro}>Reintentar</Text>
                        </Pressable>
                      </View>
                    </View>
                  )}

                  {!cargandoPlatos &&
                    !errorPlatos &&
                    [...ordenGrupos, ...otrosGrupos].map((cat) => {
                      const info = CATEGORIA_INFO[cat];
                      return (
                        <View key={cat} style={styles.grupo}>
                          <Text style={styles.grupoTitulo}>
                            {info ? `${info.emoji}  ${info.label}` : cat}
                          </Text>

                          {grupos[cat].map((plato: any) => (
                            <View key={plato.id} style={styles.platoFila}>
                              <View style={styles.platoInfo}>
                                <Text style={styles.platoNombre} numberOfLines={2}>
                                  {plato.recomendado ? 'â­ ' : ''}{plato.nombre}
                                </Text>
                                <Text style={styles.platoPrecio}>
                                  {formatoPrecio(plato.precio)}
                                </Text>
                              </View>

                              <View style={styles.platoAcciones}>
                                <Pressable
                                  style={[
                                    styles.chipDisponible,
                                    plato.disponible ? styles.chipOk : styles.chipAgotado,
                                  ]}
                                  onPress={() => alternarDisponible(plato)}
                                >
                                  <Text
                                    style={[
                                      styles.chipDisponibleTexto,
                                      !plato.disponible && styles.chipAgotadoTexto,
                                    ]}
                                  >
                                    {plato.disponible ? 'Disponible' : 'Agotado'}
                                  </Text>
                                </Pressable>

                                <Pressable style={styles.botonIcono} onPress={() => iniciarEdicionPlato(plato)}>
                                  <Text style={styles.botonIconoTexto}>âœï¸</Text>
                                </Pressable>
                                <Pressable style={styles.botonIcono} onPress={() => eliminarPlato(plato)}>
                                  <Text style={styles.botonIconoTexto}>ðŸ—‘ï¸</Text>
                                </Pressable>
                              </View>
                            </View>
                          ))}
                        </View>
                      );
                    })}
                </>
              )}
                      {/* ============ SECCIÃ“N: MESAS (solo admin) ============ */}
              {rol === 'admin' && seccion === 'mesas' && (
                <>
                  <Text style={styles.titulo}>Mesas</Text>
                  <Text style={styles.subtitulo}>
                    {editandoId ? 'Editando mesa' : 'Crea una nueva mesa'} Â· o selecciona una de la lista para editarla
                  </Text>

                  {/* Formulario crear / editar */}
                  <View style={styles.mesaForm}>
                    <Text style={styles.etiqueta}>Nombre</Text>
                    <TextInput
                      style={styles.input}
                      value={formNombre}
                      onChangeText={setFormNombre}
                      placeholder="Ej. Mesa 3"
                      placeholderTextColor="rgba(255,255,255,0.45)"
                      autoCapitalize="words"
                      editable={!guardandoMesa}
                    />

                    <Text style={styles.etiqueta}>Zona</Text>
                    <View style={styles.zonaFila}>
                      {['terraza', 'salon'].map((z) => {
                        const elegido = formZona === z;
                        return (
                          <Pressable
                            key={z}
                            style={[styles.zonaPill, elegido && styles.zonaPillActiva]}
                            onPress={() => !guardandoMesa && setFormZona(z)}
                          >
                            <Text style={[styles.zonaPillTexto, elegido && styles.zonaPillTextoActiva]}>
                              {NOMBRE_ZONA[z]}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>

                    <View style={styles.capacidadFila}>
                      <View style={styles.capacidadTextos}>
                        <Text style={styles.etiqueta}>Capacidad</Text>
                        <Text style={styles.capacidadSubtitulo}>Hasta cuÃ¡ntas personas</Text>
                      </View>
                      <View style={styles.capacidadControles}>
                        <Pressable
                          style={styles.botonContador}
                          onPress={() => !guardandoMesa && setFormCapacidad(Math.max(1, formCapacidad - 1))}
                        >
                          <Text style={styles.contadorTexto}>âˆ’</Text>
                        </Pressable>
                        <Text style={styles.numeroCapacidad}>{formCapacidad}</Text>
                        <Pressable
                          style={styles.botonContador}
                          onPress={() => !guardandoMesa && setFormCapacidad(Math.min(20, formCapacidad + 1))}
                        >
                          <Text style={styles.contadorTexto}>+</Text>
                        </Pressable>
                      </View>
                    </View>

                    <View style={styles.activaFila}>
                      <View style={styles.activaTextos}>
                        <Text style={styles.etiqueta}>Activa</Text>
                        <Text style={styles.capacidadSubtitulo}>
                          Si la apagas, el cliente no podrÃ¡ reservarla desde la app
                        </Text>
                      </View>
                      <View style={styles.activaControles}>
                        <Pressable
                          style={[styles.activoPill, formActiva && styles.activoPillActivo]}
                          onPress={() => !guardandoMesa && setFormActiva(true)}
                        >
                          <Text style={[styles.activoPillTexto, formActiva && styles.activoPillTextoActivo]}>Activa</Text>
                        </Pressable>
                        <Pressable
                          style={[styles.activoPill, !formActiva && styles.inactivoPillActivo]}
                          onPress={() => !guardandoMesa && setFormActiva(false)}
                        >
                          <Text style={[styles.activoPillTexto, !formActiva && styles.inactivoPillTextoActivo]}>Inactiva</Text>
                        </Pressable>
                      </View>
                    </View>

                    <View style={styles.botonesFormulario}>
                      {editandoId && (
                        <Pressable
                          style={[styles.botonSecundario, guardandoMesa && styles.botonDeshabilitado]}
                          onPress={() => !guardandoMesa && resetFormMesa()}
                        >
                          <Text style={styles.textoBotonSecundario}>Cancelar</Text>
                        </Pressable>
                      )}
                      <Pressable
                        style={[styles.botonGuardar, guardandoMesa && styles.botonDeshabilitado]}
                        onPress={guardarMesa}
                        disabled={guardandoMesa}
                      >
                        {guardandoMesa ? (
                          <ActivityIndicator color="#FFFFFF" />
                        ) : (
                          <Text style={styles.textoBotonGuardar}>
                            {editandoId ? 'Guardar cambios' : 'Crear mesa'}
                          </Text>
                        )}
                      </Pressable>
                    </View>
                  </View>

                  {/* Encabezado de la lista */}
                  <Text style={styles.listaTitulo}>Mesas existentes</Text>

                  {cargandoMesas && (
                    <ActivityIndicator size="large" color="#F28C28" style={styles.cargando} />
                  )}

                  {errorMesas && (
                    <View style={styles.mensajeCard}>
                      <Text style={styles.mensajeTexto}>{errorMesas}</Text>
                      <Pressable style={styles.botonClaro} onPress={() => setIntentoMesas((i) => i + 1)}>
                        <Text style={styles.textoBotonClaro}>Reintentar</Text>
                      </Pressable>
                    </View>
                  )}

                  {!cargandoMesas && mesas.length === 0 && !errorMesas && (
                    <View style={styles.vacioMesa}>
                      <Text style={styles.vacioEmoji}>ðŸª‘</Text>
                      <Text style={styles.vacioTexto}>AÃºn no hay mesas</Text>
                      <Text style={styles.vacioSub}>Crea la primera mesa con el formulario de arriba.</Text>
                    </View>
                  )}

                  {!cargandoMesas &&
                    !errorMesas &&
                    mesas.map((mesa) => (
                      <View key={mesa.id} style={styles.mesaFila}>
                        <View style={styles.mesaIzq}>
                          <View style={[styles.mesaCirculo, { backgroundColor: mesa.activa ? '#F28C28' : '#4A4A4A' }]}>
                            <Text style={styles.mesaCirculoTexto}>
                              {(mesa.nombre?.replace(/\D/g, '') || mesa.nombre.slice(0, 1)).slice(0, 2)}
                            </Text>
                          </View>
                          <View style={styles.mesaTextos}>
                            <Text style={styles.mesaNombre} numberOfLines={2}>
                              {mesa.nombre}
                            </Text>
                            <Text style={styles.mesaDetalle}>
                              {NOMBRE_ZONA[mesa.zona] ?? mesa.zona} Â· {mesa.capacidad} pers.
                            </Text>
                          </View>
                        </View>

                        <View style={styles.mesaAcciones}>
                          <Pressable
                            style={[styles.toggleActiva, mesa.activa ? styles.toggleApagada : styles.toggleEncendida]}
                            onPress={() => alternarActivaMesa(mesa)}
                          >
                            <Text style={[styles.toggleActivaTexto, !mesa.activa && styles.toggleActivaTextoEncendido]}>
                              {mesa.activa ? 'Activa' : 'Inactiva'}
                            </Text>
                          </Pressable>

                          <Pressable
                            style={styles.botonEditar}
                            onPress={() => iniciarEdicion(mesa)}
                          >
                            <Text style={styles.botonEditarTexto}>Editar</Text>
                          </Pressable>

                          <Pressable
                            style={styles.botonEliminar}
                            onPress={() => eliminarMesa(mesa)}
                          >
                            <Text style={styles.botonEliminarTexto}>Borrar</Text>
                          </Pressable>
                        </View>
                      </View>
                    ))}
                </>
              )}

              {/* ============ SECCIÃ“N: HORARIOS (solo admin) ============ */}
              {rol === 'admin' && seccion === 'horarios' && (
                <>
                  <Text style={styles.titulo}>Horarios</Text>
                  <Text style={styles.subtitulo}>
                    Configura los horarios por dÃ­a. Los cambios afectan quÃ© franjas ven los clientes al reservar.
                  </Text>

                  {/* SelecciÃ³n de dÃ­a */}
                  <Text style={styles.etiqueta}>DÃ­a</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.filaNumero}
                  >
                    {DIAS_SEMANA_COMPLETOS.map((d) => {
                      const elegido = diaEditar === d.clave;
                      return (
                        <Pressable
                          key={d.clave}
                          style={[styles.diaBtn, elegido && styles.diaBtnActivo]}
                          onPress={() => !guardandoHorario && setDiaEditar(d.clave)}
                        >
                          <Text style={[styles.diaBtnTexto, elegido && styles.diaBtnTextoActivo]}>
                            {d.etiqueta}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>

                  {cargandoHorarios && (
                    <ActivityIndicator size="large" color="#F28C28" style={styles.cargando} />
                  )}

                  {errorHorarios && (
                    <View style={styles.mensajeCard}>
                      <Text style={styles.mensajeTexto}>{errorHorarios}</Text>
                      <Pressable style={styles.botonClaro} onPress={() => setIntentoHorarios((i) => i + 1)}>
                        <Text style={styles.textoBotonClaro}>Reintentar</Text>
                      </Pressable>
                    </View>
                  )}

                  {!cargandoHorarios && (
                    <>
                      {/* Jornada almuerzo */}
                      <View style={styles.horarioCard}>
                        <View style={styles.horarioEncabezado}>
                          <Text style={styles.horarioEmoji}>ðŸ½ï¸</Text>
                          <Text style={styles.horarioTitulo}>Almuerzo</Text>
                          <Pressable
                            style={[styles.chipToggle, mAlmuerzoAct && styles.chipToggleOn]}
                            onPress={() => !guardandoHorario && setMAlmuerzoAct(!mAlmuerzoAct)}
                          >
                            <Text style={[styles.chipToggleTexto, mAlmuerzoAct && styles.chipToggleTextoOn]}>
                              {mAlmuerzoAct ? 'Activa' : 'Apagada'}
                            </Text>
                          </Pressable>
                        </View>
                        <View style={styles.horarioFila}>
                          <View style={styles.horarioCampo}>
                            <Text style={styles.horarioEtiqueta}>Inicio</Text>
                            <TextInput
                              style={styles.input}
                              value={mAlmuerzoInicio}
                              onChangeText={setMAlmuerzoInicio}
                              placeholder="12:30"
                              placeholderTextColor="rgba(255,255,255,0.45)"
                              editable={!guardandoHorario && mAlmuerzoAct}
                            />
                          </View>
                          <View style={styles.horarioCampo}>
                            <Text style={styles.horarioEtiqueta}>Fin</Text>
                            <TextInput
                              style={styles.input}
                              value={mAlmuerzoFin}
                              onChangeText={setMAlmuerzoFin}
                              placeholder="14:30"
                              placeholderTextColor="rgba(255,255,255,0.45)"
                              editable={!guardandoHorario && mAlmuerzoAct}
                            />
                          </View>
                          <View style={styles.horarioCampo}>
                            <Text style={styles.horarioEtiqueta}>Dur. (min)</Text>
                            <TextInput
                              style={styles.input}
                              value={mAlmuerzoDur}
                              onChangeText={setMAlmuerzoDur}
                              keyboardType="number-pad"
                              placeholderTextColor="rgba(255,255,255,0.45)"
                              editable={!guardandoHorario && mAlmuerzoAct}
                            />
                          </View>
                        </View>
                      </View>

                      {/* Jornada noche */}
                      <View style={styles.horarioCard}>
                        <View style={styles.horarioEncabezado}>
                          <Text style={styles.horarioEmoji}>ðŸŒ™</Text>
                          <Text style={styles.horarioTitulo}>Noche</Text>
                          <Pressable
                            style={[styles.chipToggle, mNocheAct && styles.chipToggleOn]}
                            onPress={() => !guardandoHorario && setMNocheAct(!mNocheAct)}
                          >
                            <Text style={[styles.chipToggleTexto, mNocheAct && styles.chipToggleTextoOn]}>
                              {mNocheAct ? 'Activa' : 'Apagada'}
                            </Text>
                          </Pressable>
                        </View>
                        <View style={styles.horarioFila}>
                          <View style={styles.horarioCampo}>
                            <Text style={styles.horarioEtiqueta}>Inicio</Text>
                            <TextInput
                              style={styles.input}
                              value={mNocheInicio}
                              onChangeText={setMNocheInicio}
                              placeholder="17:00"
                              placeholderTextColor="rgba(255,255,255,0.45)"
                              editable={!guardandoHorario && mNocheAct}
                            />
                          </View>
                          <View style={styles.horarioCampo}>
                            <Text style={styles.horarioEtiqueta}>Fin</Text>
                            <TextInput
                              style={styles.input}
                              value={mNocheFin}
                              onChangeText={setMNocheFin}
                              placeholder="23:00"
                              placeholderTextColor="rgba(255,255,255,0.45)"
                              editable={!guardandoHorario && mNocheAct}
                            />
                          </View>
                          <View style={styles.horarioCampo}>
                            <Text style={styles.horarioEtiqueta}>Dur. (min)</Text>
                            <TextInput
                              style={styles.input}
                              value={mNocheDur}
                              onChangeText={setMNocheDur}
                              keyboardType="number-pad"
                              placeholderTextColor="rgba(255,255,255,0.45)"
                              editable={!guardandoHorario && mNocheAct}
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
                          <ActivityIndicator color="#FFFFFF" />
                        ) : (
                          <Text style={styles.textoBotonGuardar}>Guardar horarios de este dÃ­a</Text>
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
  fondo: { flex: 1, backgroundColor: '#0d2b3e' },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.42)',
  },
  container: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  cargando: { marginVertical: 32 },
  barraSuperior: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  botonBarra: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  textoBarra: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },

  /* ---------- Login ---------- */
  loginCard: {
    backgroundColor: 'rgba(18,18,18,0.85)',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    padding: 22,
    marginTop: 12,
  },
  titulo: {
    fontSize: 30,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  subtitulo: { fontSize: 15, color: '#D0D0D0', marginTop: 6, marginBottom: 18 },
  etiqueta: { color: '#FFF', fontSize: 15, fontWeight: '700', marginTop: 14, marginBottom: 8 },
  input: {
    height: 54,
    borderRadius: 16,
    paddingHorizontal: 16,
    color: '#FFF',
    fontSize: 16,
    backgroundColor: 'rgba(255,255,255,0.09)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  textoError: {
    color: '#FF9A94',
    fontSize: 14,
    marginTop: 14,
    textAlign: 'center',
    backgroundColor: 'rgba(255,80,80,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,138,128,0.35)',
    borderRadius: 12,
    padding: 12,
    overflow: 'hidden',
  },
  botonPrincipal: {
    backgroundColor: '#F28C28',
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 22,
  },
  botonDeshabilitado: { opacity: 0.55 },
  textoPrincipal: { color: '#FFF', fontSize: 18, fontWeight: '800' },

  /* ---------- PestaÃ±as admin ---------- */
  tabsBar: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  tab: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(18,18,18,0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabActivo: { backgroundColor: '#F2EFEA', borderColor: '#F28C28', borderWidth: 2 },
  tabTexto: { color: '#C8C8C8', fontSize: 15, fontWeight: '700' },
  tabTextoActivo: { color: '#1A1A1A' },

  /* ---------- Reservas: encabezado con contador ---------- */
  encabezadoReservas: { marginBottom: 6 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 },
  pillRol: {
    color: '#1A1A1A',
    backgroundColor: '#F2EFEA',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },
  metaTexto: { color: '#C8C8C8', fontSize: 14, fontWeight: '600' },
  fechaTitulo: { color: '#FFFFFF', fontSize: 18, fontWeight: '800', marginBottom: 8 },

  /* ---------- DÃ­as (altura FIJA) ---------- */
  diasScroll: { height: 78, marginBottom: 16 },
  filaDias: { alignItems: 'center', gap: 8, paddingRight: 8, paddingVertical: 2 },
  dia: {
    width: 60,
    height: 66,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(18,18,18,0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  diaElegido: { backgroundColor: '#F2EFEA', borderColor: '#F28C28', borderWidth: 2 },
  diaNombre: { color: '#C8C8C8', fontSize: 12, fontWeight: '700' },
  diaNumero: { color: '#FFF', fontSize: 20, fontWeight: '800', marginTop: 2 },
  textoOscuro: { color: '#1A1A1A' },

  /* ---------- Tarjeta de reserva con acento lateral ---------- */
  tarjeta: {
    flexDirection: 'row',
    borderRadius: 20,
    marginBottom: 12,
    backgroundColor: 'rgba(18,18,18,0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    overflow: 'hidden',
  },
  acentoLateral: { width: 6, height: '100%' },
  acentoOk: { backgroundColor: '#F28C28' },
  acentoCancelar: { backgroundColor: '#FF6B6B' },
  tarjetaContenido: { flex: 1, padding: 16 },
  tarjetaCancelada: { opacity: 0.6 },
  tarjetaCabecera: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  hora: { color: '#FFF', fontSize: 20, fontWeight: '800' },
  estado: {
    color: '#FFB066',
    fontSize: 12,
    fontWeight: '800',
    backgroundColor: 'rgba(242,140,40,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(242,140,40,0.35)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },
  estadoCancelada: {
    color: '#FF9A94',
    backgroundColor: 'rgba(255,107,107,0.14)',
    borderColor: 'rgba(255,107,107,0.35)',
  },
  cliente: { color: '#FFF', fontSize: 18, fontWeight: '700', marginBottom: 4 },
  detalle: { color: '#D0D0D0', fontSize: 15, marginTop: 2 },
  botonCancelar: {
    marginTop: 14,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#FF8A80',
    backgroundColor: 'rgba(255,107,107,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textoCancelar: { color: '#FF9A94', fontSize: 15, fontWeight: '800' },

  /* ---------- Estado vacÃ­o ---------- */
  vacioCaja: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
    backgroundColor: 'rgba(18,18,18,0.7)',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    marginTop: 8,
  },
  vacioEmoji: { fontSize: 56, marginBottom: 12 },
  vacioTexto: { color: '#FFF', fontSize: 19, fontWeight: '800', textAlign: 'center' },
  vacioSub: {
    color: '#B0B0B0',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 6,
  },

  /* ---------- Mensajes ---------- */
  mensajeCaja: { marginVertical: 16 },
  mensajeCard: {
    alignItems: 'center',
    gap: 14,
    padding: 18,
    backgroundColor: 'rgba(18,18,18,0.75)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  mensajeTexto: { color: '#FFF', fontSize: 16, textAlign: 'center' },
  botonClaro: {
    backgroundColor: '#F2EFEA',
    paddingHorizontal: 28,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
  },
  textoBotonClaro: { color: '#1A1A1A', fontSize: 15, fontWeight: '800' },

  /* ---------- Carta (admin) ---------- */
  grupo: { marginBottom: 16 },
  grupoTitulo: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 8,
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  platoFila: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(18,18,18,0.8)',
    borderRadius: 16,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  platoInfo: { flex: 1, marginRight: 10 },
  platoNombre: { color: '#FFF', fontSize: 15, fontWeight: '800' },
  platoPrecio: { color: '#F2EFEA', fontSize: 14, fontWeight: '700', marginTop: 4 },
  chipDisponible: { borderRadius: 16, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1.5 },
  chipOk: { backgroundColor: 'rgba(76,175,80,0.18)', borderColor: '#4CAF50' },
  chipAgotado: { backgroundColor: 'rgba(255,107,107,0.15)', borderColor: '#FF6B6B' },
  chipDisponibleTexto: { color: '#7EE2A5', fontWeight: '800', fontSize: 13 },
  chipAgotadoTexto: { color: '#FF8A80' },

  /* ---------- Mesas (admin) ---------- */
  mesaForm: {
    backgroundColor: 'rgba(18,18,18,0.85)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    padding: 18,
    marginBottom: 22,
  },
  zonaFila: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  zonaPill: {
    flex: 1,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  zonaPillActiva: {
    backgroundColor: '#F28C28',
    borderColor: '#FFFFFF',
    borderWidth: 2,
  },
  zonaPillTexto: { color: '#C8C8C8', fontWeight: '700', fontSize: 15 },
  zonaPillTextoActiva: { color: '#FFFFFF' },
  capacidadFila: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 16,
  },
  capacidadTextos: { flex: 1 },
  capacidadSubtitulo: { color: '#B5B5B5', fontSize: 12, marginTop: 2 },
  capacidadControles: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  botonContador: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contadorTexto: { color: '#FFFFFF', fontSize: 22, fontWeight: '800' },
  numeroCapacidad: { color: '#FFFFFF', fontSize: 22, fontWeight: '800', minWidth: 28, textAlign: 'center' },
  activaFila: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 16,
  },
  activaTextos: { flex: 1 },
  activaControles: { flexDirection: 'row', gap: 6 },
  activoPill: {
    paddingHorizontal: 14,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
  },
  activoPillActivo: { backgroundColor: '#4CAF50', borderColor: '#7EE2A5' },
  activoPillTexto: { color: '#C8C8C8', fontWeight: '800', fontSize: 13 },
  activoPillTextoActivo: { color: '#FFFFFF' },
  inactivoPillActivo: { backgroundColor: 'rgba(255,107,107,0.2)', borderColor: '#FF6B6B' },
  inactivoPillTextoActivo: { color: '#FFB0A8' },
  botonesFormulario: { flexDirection: 'row', gap: 10 },
  botonSecundario: {
    flex: 1,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  textoBotonSecundario: { color: '#FFFFFF', fontWeight: '800', fontSize: 15 },
  botonGuardar: {
    flex: 2,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F28C28',
  },
  textoBotonGuardar: { color: '#FFFFFF', fontWeight: '800', fontSize: 16 },
  listaTitulo: { color: '#FFFFFF', fontSize: 20, fontWeight: '800', marginBottom: 12 },
  mesaFila: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(18,18,18,0.85)',
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    gap: 10,
  },
  mesaIzq: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  mesaCirculo: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  mesaCirculoTexto: { color: '#FFFFFF', fontWeight: '900', fontSize: 24 },
  mesaTextos: { flex: 1 },
  mesaNombre: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  mesaDetalle: { color: '#C8C8C8', fontSize: 13, marginTop: 4 },
  mesaAcciones: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  toggleActiva: {
    paddingHorizontal: 10,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleEncendida: { backgroundColor: 'rgba(76,175,80,0.18)', borderColor: '#4CAF50' },
  toggleApagada: { backgroundColor: 'rgba(255,107,107,0.15)', borderColor: '#FF6B6B' },
  toggleActivaTexto: { color: '#FFB0A8', fontWeight: '800', fontSize: 12 },
  toggleActivaTextoEncendido: { color: '#7EE2A5' },
  botonEditar: {
    paddingHorizontal: 12,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(242,140,40,0.25)',
    borderWidth: 1,
    borderColor: '#F28C28',
    justifyContent: 'center',
  },
  botonEditarTexto: { color: '#FFFFFF', fontWeight: '800', fontSize: 12 },
  botonEliminar: {
    paddingHorizontal: 12,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,107,107,0.18)',
    borderWidth: 1,
    borderColor: '#FF6B6B',
    justifyContent: 'center',
  },
  botonEliminarTexto: { color: '#FF9A94', fontWeight: '800', fontSize: 12 },
  vacioMesa: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: 'rgba(18,18,18,0.7)',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },

  /* ---------- Grupo de chips (categorÃ­as, etc.) ---------- */
  chipsFila: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip: {
    paddingHorizontal: 12,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.09)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
  },
  chipActivo: { backgroundColor: '#F28C28', borderColor: '#FFFFFF', borderWidth: 2 },
  chipTexto: { color: '#C8C8C8', fontWeight: '700', fontSize: 13 },
  chipTextoActivo: { color: '#FFFFFF' },
  inputPrecio: { flex: 1, maxWidth: 180 },

  /* ---------- Switch recomendado ---------- */
  switchRecomendado: {
    minWidth: 64,
    height: 38,
    borderRadius: 19,
    paddingHorizontal: 18,
    backgroundColor: 'rgba(255,255,255,0.09)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchRecomendadoActivo: { backgroundColor: '#F2B928', borderColor: '#FFFFFF' },
  switchRecomendadoTexto: { color: '#C8C8C8', fontWeight: '800', fontSize: 15 },
  switchRecomendadoTextoActivo: { color: '#1A1A1A' },

  /* ---------- Acciones de plato (editar / borrar) ---------- */
  platoAcciones: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  botonIcono: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.09)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  botonIconoTexto: { fontSize: 16 },

  /* ---------- Horarios ---------- */
  filaNumero: { flexDirection: 'row', gap: 8, paddingBottom: 14, alignItems: 'center' },
  diaBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(18,18,18,0.78)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  diaBtnActivo: { backgroundColor: '#F28C28', borderColor: '#FFFFFF', borderWidth: 2 },
  diaBtnTexto: { color: '#C8C8C8', fontWeight: '800', fontSize: 15 },
  diaBtnTextoActivo: { color: '#FFFFFF' },

  horarioCard: {
    backgroundColor: 'rgba(18,18,18,0.85)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    padding: 16,
    marginBottom: 16,
  },
  horarioEncabezado: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  horarioEmoji: { fontSize: 22 },
  horarioTitulo: { flex: 1, color: '#FFFFFF', fontSize: 18, fontWeight: '800' },
  chipToggle: {
    paddingHorizontal: 14,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
  },
  chipToggleOn: { backgroundColor: '#4CAF50', borderColor: '#7EE2A5' },
  chipToggleTexto: { color: '#FFB0A8', fontWeight: '800', fontSize: 12 },
  chipToggleTextoOn: { color: '#FFFFFF' },
  horarioFila: { flexDirection: 'row', gap: 8 },
  horarioCampo: { flex: 1 },
  horarioEtiqueta: { color: '#C8C8C8', fontSize: 12, fontWeight: '700', marginBottom: 6 },
});
