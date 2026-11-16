// Layout del flujo de reservas: Stack sin encabezado
// Stack: https://docs.expo.dev/router/advanced/stack/
import { Stack } from 'expo-router';

export default function ReservarLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
