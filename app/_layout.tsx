import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="reservar/[mesaId]"
        options={{ title: "Reservar mesa" }}
      />
      <Stack.Screen name="confirmacion" options={{ title: "Confirmación" }} />
    </Stack>
  );
}
