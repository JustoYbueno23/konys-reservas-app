import { useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';

export default function DiaYHora() {
  // El nombre entre llaves debe ser igual al del archivo: [mesaId]
  const { mesaId } = useLocalSearchParams<{ mesaId: string }>();

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#161616' }}>
      <Text style={{ fontSize: 24, fontWeight: '700', color: '#FFFFFF' }}>Día y hora</Text>
      <Text style={{ fontSize: 14, color: '#AAAAAA', marginTop: 4 }}>Mesa: {mesaId}</Text>
    </View>
  );
}