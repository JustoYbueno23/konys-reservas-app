import { useRouter } from 'expo-router';
import { Pressable, StyleProp, StyleSheet, Text, ViewStyle } from 'react-native';

type Props = {
  style?: StyleProp<ViewStyle>;
  tamano?: 'normal' | 'grande';
};

export function BotonAdmin({ style, tamano = 'normal' }: Props) {
  const router = useRouter();
  const grande = tamano === 'grande';

  return (
    <Pressable
      style={[styles.boton, grande && styles.botonGrande, style]}
      onPress={() => router.push('/admin')}
    >
      <Text style={[styles.letra, grande && styles.letraGrande]}>A</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  boton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.7)',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  botonGrande: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  letra: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  letraGrande: {
    fontSize: 20,
  },
});
