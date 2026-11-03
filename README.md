# Konys Pizza - App Móvil de Reservas

Aplicación móvil multiplataforma (Android e iOS) para reservar mesas en Konys Pizza (Bucaramanga), construida con React Native y Expo.

## Estado del proyecto

**Avance estimado: ~50%**

### ✅ Lo que ya está hecho
- Estructura del proyecto creada con Expo Router.
- Repositorio en GitHub con múltiples commits.
- Pantalla de Inicio con diseño visual completo (imagen de fondo, logo KONYS, eslogan, horarios, botón "Reservar mesa", botón de administrador "A").
- Conexión a Supabase funcionando: lee mesas reales y muestra cuántas hay disponibles.
- Navegación entre pantallas: Inicio → Reservar, Inicio → Carta, Inicio → Admin.
- Pantalla de elección de mesas (`app/reservar/index.tsx`) con burbujas por zona y botón "Continuar" desactivado hasta elegir mesa.
- Base de datos en Supabase con 4 tablas: `mesas`, `horarios`, `reservas`, `platos`.
- Cliente de Supabase configurado en `services/supabase.ts`.
- `.env` con credenciales de Supabase configurado localmente (no subido a GitHub).
- `.gitignore` y `.env.example` incluidos.
- Mockups de baja fidelidad (bocetos) en carpeta `/docs`.
- Documento del proyecto en `/docs`.

### ⏳ Lo que falta por hacer
- Pantalla de reserva completa: elegir fecha, ver horarios libres/ocupados, llenar formulario y confirmar.
- Pantalla de confirmación de reserva.
- Módulo de administrador: acceso con PIN, gestión de mesas, horarios, reservas y carta.
- Pantalla de carta digital (cliente).
- Generar APK con EAS Build.
- Grabar video explicativo (5-8 minutos).
- Pruebas en celular real y casos de error.

## Tecnologías
- React Native
- Expo (Expo Router)
- Supabase (base de datos en la nube)
- GitHub (control de versiones)
- AsyncStorage (sesión del administrador)

## Cómo ejecutarlo
1. Clona el repositorio.
2. Copia `.env.example` a `.env` y completa las credenciales de Supabase.
3. Instala las dependencias:
   ```bash
   npm installGo

## Enlaces

- APK / proyecto en Expo: (pendiente)
- Video explicativo: (pendiente)

## Autor

Juan José Medina Orozco
