import { Text, View } from 'react-native';

export default function Mesa() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#161616' }}>
      <Text style={{ fontSize: 24, fontWeight: '700', color: '#FFFFFF' }}>Elige tu mesa</Text>
      <Text style={{ fontSize: 14, color: '#AAAAAA', marginTop: 4 }}>Toca una burbuja</Text>
    </View>
  );
}                         