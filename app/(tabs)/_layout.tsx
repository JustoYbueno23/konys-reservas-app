import { Tabs } from "expo-router";

export default function TabsLayout() {
  return (
    <Tabs>
      <Tabs.Screen name="index" options={{ title: "Inicio" }} />
      <Tabs.Screen name="carta" options={{ title: "Carta" }} />
      <Tabs.Screen name="admin" options={{ title: "Admin" }} />
    </Tabs>
  );
}
