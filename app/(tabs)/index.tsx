import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { supabase } from "../../services/supabase";

export default function Inicio() {
  const [mensaje, setMensaje] = useState("Conectando...");

  useEffect(() => {
    supabase
      .from("mesas")
      .select("*")
      .then(({ data, error }) => {
        if (error) setMensaje("Error: " + error.message);
        else setMensaje("Conexión OK. Mesas encontradas: " + data.length);
      });
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>{mensaje}</Text>
    </View>
  );
}
