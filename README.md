# Konys Pizza - App Móvil de Reservas

Aplicación móvil multiplataforma (Android e iOS) para reservar mesas en Konys Pizza (Bucaramanga), construida con React Native y Expo.

## Estado del proyecto

**Avance estimado: ~70%**

### ✅ Lo que ya está hecho
- Estructura del proyecto creada con Expo Router.
- Repositorio en GitHub con múltiples commits.
- Pantalla de Inicio con diseño visual completo (imagen de fondo, logo KONYS, eslogan, horarios, botón de administrador "A").
- Conexión a Supabase funcionando: lee mesas reales y platos reales.
- Navegación entre pantallas: Inicio → Reservar, Inicio → Carta, Inicio → Admin.
- Flujo completo de reserva: elegir mesa → elegir día y hora (franjas libres/ocupadas/pasadas) → confirmar.
- Pantalla de confirmación con registro de reserva y detección de doble reserva.
- Pantalla de elección de mesas (`app/reservar/index.tsx`) con fotos por zona (Terraza / Salón) y botón "Continuar".
- Carta digital (`app/carta.tsx`) con 15 apartados: recomendados, entradas, pizzas, desgranados, papas, lasaña, granizados, sodas, bebidas, cerveza, cócteles, postres, almuerzos y congelados.
- Base de datos en Supabase con tablas: `mesas`, `horarios`, `reservas`, `platos` y `perfiles` (roles admin / mesero).
- Módulo de administrador completo (solo rol `admin`):
  - Reservas: ver por día, cancelar, con contador de confirmadas.
  - Carta: agregar / editar / eliminar platos, marcar Disponible / Agotado, filtrar recomendados.
  - Mesas: listar, crear, editar, activar / desactivar y eliminar.
  - Horarios: editar jornadas por día con duración de slot.
- Seguridad en la base de datos con Row Level Security (RLS) y roles.
- Cliente de Supabase configurado en `services/supabase.ts`.
- `.env` con credenciales de Supabase configurado localmente (no subido a GitHub).
- `.gitignore` y `.env.example` incluidos.
- Mockups de baja fidelidad (bocetos) en carpeta `/docs`.
- Documento del proyecto en `/docs`.
- Variables de entorno del preview y production subidas a EAS.

### ⏳ Lo que falta por hacer
- Distribución en iOS (requiere Apple Developer Program USD $99/año; para probar en iPhone usa Expo Go).
- Grabar video explicativo (5-8 minutos).
- Pruebas en celular real y casos de error.
- Fotos de los 35 productos que faltan (Granizados, Sodas, Bebidas Frías, Cerveza, Cócteles, Postres, Almuerzos y Congelados).

## Tecnologías
- React Native
- Expo (Expo Router)
- Supabase (base de datos en la nube y autenticación)
- GitHub (control de versiones)
- AsyncStorage (sesión del administrador)

## Cómo ejecutarlo
1. Clona el repositorio.
2. Copia `.env.example` a `.env` y completa las credenciales de Supabase.
3. Instala las dependencias:
   ```bash
   npm install
   ```
4. Inicia el proyecto:
   ```bash
   npx expo start
   ```
5. Escanea el código QR con la app Expo Go en tu celular.

## Enlaces
- APK Android para instalación y prueba: https://expo.dev/artifacts/eas/MUsoqLQc9S3F4xw80Epk3DH6u86qxq8o-Qgu5M9qsmU.apk
- Proyecto en Expo / Expo Go: https://expo.dev/accounts/juanmedinao3/projects/konys-reservas-app
- Video explicativo: (pendiente)

## Autor
Juan José Medina Orozco