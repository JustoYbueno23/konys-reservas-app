// Componente reutilizable: botón principal (crema)
// Es el botón con la acción principal de cada pantalla: Continuar, Confirmar...
// Si se le pasa cargando=true, muestra un indicador y queda deshabilitado
import { ActivityIndicator, Pressable, StyleProp, StyleSheet, Text, ViewStyle } from 'react-native';

type Props = {
  texto: string;
  onPress: () => void;
  disabled?: boolean;
  cargando?: boolean;
  style?: StyleProp<ViewStyle>;
  // Opacidad del botón cuando está apagado (0.35 o 0.5 según la pantalla)
  opacidadDeshabilitado?: number;
};

export function BotonPrincipal({
  texto,
  onPress,
  disabled,
  cargando = false,
  style,
  opacidadDeshabilitado = 0.35,
}: Props) {
  const apagado = disabled || cargando;

  return (
    <Pressable
      style={[styles.boton, apagado && { opacity: opacidadDeshabilitado }, style]}
      onPress={onPress}
      disabled={apagado}
    >
      {cargando ? (
        <ActivityIndicator color="#1A1A1A" />
      ) : (
        <Text style={styles.texto}>{texto}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  boton: {
    backgroundColor: '#F2EFEA',
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texto: {
    color: '#1A1A1A',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
