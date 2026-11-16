// Layout raíz: Stack sin encabezado (el diseño de cada pantalla lleva su propio título)
// Stack: https://docs.expo.dev/router/advanced/stack/
import { Stack } from 'expo-router';

export default function RootLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
