import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { styles } from './admin/estilos';
import { COLORES } from '../constants/admin';

type Props = {
  alEntrar: (correo: string, clave: string) => Promise<string | null>;
};

export function AdminLogin({ alEntrar }: Props) {
  const [correo, setCorreo] = useState('');
  const [clave, setClave] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [entrando, setEntrando] = useState(false);

  async function enviar() {
    setError(null);
    setEntrando(true);

    const problema = await alEntrar(correo, clave);
    if (problema) setError(problema);

    setEntrando(false);
  }

  return (
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

      {error && (
        <View style={styles.alertaError}>
          <Ionicons name="alert-circle-outline" size={18} color={COLORES.rojo} />
          <Text style={styles.alertaErrorTexto}>{error}</Text>
        </View>
      )}

      <Pressable
        style={[styles.botonPrimario, entrando && styles.botonDeshabilitado]}
        onPress={enviar}
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
  );
}
