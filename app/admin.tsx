import { Ionicons } from '@expo/vector-icons';
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
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { imagenPlato } from '../services/platos-imagenes';
import { supabase } from '../services/supabase';
import { DIAS_CORTOS, fechaATexto, formatoFechaLarga, proximosDias } from '../utils/fechas';
import { formatoPrecio } from '../utils/formato';

import { AdminLogin } from '../components/AdminLogin';
import { styles } from '../components/admin/estilos';
import { CATEGORIA_INFO, COLORES, FONDO, NOMBRE_ZONA } from '../constants/admin';

export default function Admin() {
  const router = useRouter();

  const [revisandoSesion, setRevisandoSesion] = useState(true);
  const [rol, setRol] = useState<string | null>(null);

  const [seccion, setSeccion] = useState<'reservas' | 'carta' | 'mesas' | 'horarios'>('reservas');

  const [fecha, setFecha] = useState(fechaATexto(new Date()));
  const [reservas, setReservas] = useState<any[]>([]);
  const [cargandoLista, setCargandoLista] = useState(false);
  const [errorLista, setErrorLista] = useState<string | null>(null);
  const [intento, setIntento] = useState(0);
  const [filtroMesa, setFiltroMesa] = useState<string | null>(null);
  const [mesasFiltro, setMesasFiltro] = useState<any[]>([]);

  const [platos, setPlatos] = useState<any[]>([]);
  const [cargandoPlatos, setCargandoPlatos] = useState(false);
  const [errorPlatos, setErrorPlatos] = useState<string | null>(null);

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

  async function verificarRol(userId: string): Promise<string | null> {
    const { data, error } = await supabase
      .from('perfiles')
      .select('rol, activo')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      return 'No se pudo verificar tu perfil. Revisa tu conexión.';
    }
    if (!data || !data.activo) {
      await supabase.auth.signOut();
      return 'Esta cuenta no tiene permisos de personal.';
    }
    setRol(data.rol);
    return null;
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

  async function entrar(correo: string, clave: string): Promise<string | null> {
    if (!correo.trim() || !clave) {
      return 'Escribe tu correo y tu contraseña.';
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: correo.trim(),
      password: clave,
    });

    if (error || !data.user) {
      return 'Correo o contraseña incorrectos.';
    }

    return verificarRol(data.user.id);
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

          
          {!revisandoSesion && !rol && <AdminLogin alEntrar={entrar} />}

          
          {!revisandoSesion && rol && (
            <>
              
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

