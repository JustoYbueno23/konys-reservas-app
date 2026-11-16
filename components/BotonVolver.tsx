import { useRouter } from 'expo-router';
import { Pressable, StyleProp, StyleSheet, Text, ViewStyle } from 'react-native';

type Props = {
  
  texto?: string;
  
  style?: StyleProp<ViewStyle>;
};

export function BotonVolver({ texto = 'Volver', style }: Props) {
  const router = useRouter();

  return (
    <Pressable style={[styles.boton, style]} onPress={() => router.back()}>
      <Text style={styles.texto}>{texto}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  boton: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  texto: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
