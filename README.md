# Konys Pizza - App Móvil de Reservas

Aplicación móvil multiplataforma (Android e iOS) para reservar mesas en Konys Pizza (Bucaramanga), construida con React Native y Expo.

## Estado del proyecto

**Avance estimado: ~90%** — el código está completo y probado; solo falta grabar el video, publicarlo y recompilar el APK con los últimos cambios.

### ✅ Lo que ya está hecho

- Estructura del proyecto: `app/` (pantallas), `components/` (botones e íconos reutilizables), `services/` (capa de datos), `constants/` (paleta) y `utils/` (fechas y formato).
- Repositorio en GitHub con más de 40 commits.
- Pantalla de Inicio con diseño visual completo (imagen de fondo, logo KONYS, eslogan, horarios, botón de administrador "A" y botón **Ubicación**).
- Navegación entre pantallas: Inicio → Reservar, Inicio → Carta, Inicio → Admin, Inicio → **Ubicación**.
- Flujo completo de reserva: elegir mesa → elegir día (solo días con servicio activo) y hora → confirmar.
- Pantalla de confirmación con registro de reserva y detección de doble reserva.
- Pantalla de elección de mesas (`app/reservar/index.tsx`) con fotos por zona (Terraza / Salón) y botón "Continuar".
- Carta digital (`app/carta.tsx`) por categorías: recomendados, entradas, menú infantil, pizzas, desgranados, papas, lasaña, granizados, sodas, bebidas frías, cerveza, cócteles, postres, menú almuerzos y congelados.
- **Fotos oficiales de los 67 platos** del menú, tomadas de la carta digital oficial de Konys (API pública `soyclubify.com/d/konys`).
- **Descripciones oficiales de 50 platos** aplicadas a la base de datos (las que el sitio oficial publica).
- Base de datos en Supabase con tablas: `mesas`, `horarios`, `reservas`, `platos` y `perfiles` (roles admin / mesero).
- Módulo de administrador completo (solo rol `admin`):
  - Reservas: ver por día, cancelar, con contador de confirmadas y filtro por mesa.
  - Carta: agregar / editar / eliminar platos, marcar Disponible / Agotado, filtrar recomendados.
  - Mesas: listar, crear, editar, activar / desactivar y eliminar.
  - Horarios: editar jornadas por día con duración de slot.
- Seguridad en la base de datos con **Row Level Security (RLS) verificada**:
  - Cliente anónimo: solo ve mesas y horarios activos, crea reservas en estado `confirmada` y no puede leer ni borrar reservas ni perfiles.
  - Admin / mesero: acceso autenticado a las tablas para la operación del restaurante; solo el admin modifica mesas, platos, horarios y puede borrar reservas/mesas.
- Scripts SQL versionados en `docs/sql/` para reconstruir y auditar la base de datos (descripciones del menú y políticas RLS).
- Pantalla de **Ubicación** con la dirección oficial de Konys (Carrera 36 #38-41, El Prado, Bucaramanga) y botón para abrir Google Maps.
- Nuevo ícono de la app en naranja de Konys (requerido por EAS para Android e iOS).
- Cliente de Supabase configurado en `services/supabase.ts`.
- `.env` con credenciales de Supabase configurado localmente (no subido a GitHub).
- `.gitignore` y `.env.example` incluidos.
- Mockups de baja fidelidad (bocetos) en carpeta `/docs`.
- Documento del proyecto en `/docs`.
- Presentación de sustentación en Canva (enlace en la sección "Enlaces").
- Variables de entorno del preview y production subidas a EAS.

### ⏳ Lo que falta por hacer

- iPhone: probar o demostrar la app en un iPhone con Expo Go (gratis, disponible en el App Store). Distribución nativa vía TestFlight requeriría el Apple Developer Program (USD $99/año, no requerido por el PDF).
- Grabar video explicativo (5-8 minutos). ✅ Ya disponible en la sección "Enlaces".
- Recompilar el APK con todos los cambios del proyecto (ícono Konys, fotos del menú, pantalla de Ubicación, RLS y descripciones). ✅ APK actualizado en la sección "Enlaces".
- Pruebas en celular real y casos de error.

## Tecnologías

- React Native
- Expo (Expo Router)
- Supabase (base de datos en la nube y autenticación)
- GitHub (control de versiones)
- AsyncStorage (sesión del administrador)
- EAS Build (compilación en la nube del APK)

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

### iPhone (Expo Go)

1. En el iPhone: instala **Expo Go** desde el App Store (gratis).
2. Pon el iPhone y el computador en la misma red Wi‑Fi.
3. En el computador, ejecuta `npx expo start`.
4. Abre Expo Go en el iPhone y escanea el QR → la app corre idéntica en iOS.

No se necesita pagar Apple Developer Program; una distribución nativa (.ipa/TestFlight) sí lo requeriría, pero no hace falta por el proyecto.

Para aplicar los datos iniciales al proyecto de Supabase:

1. Editor SQL de Supabase → pega primero `docs/sql/llenar-descripciones.sql` y ejecútalo.
2. Luego pega `docs/sql/rls.sql` y ejecútalo (activa RLS y todas las políticas).

## Enlaces

- APK Android para instalación y prueba: https://expo.dev/artifacts/eas/Aq1YT95nCJgYOyOSFoN9gKnXN2yRS4NebepAPrFkejQ.apk
- Proyecto en Expo / Expo Go: https://expo.dev/accounts/juanmedinao3/projects/konys-reservas-app
- Presentación / sustentación (Canva): https://www.canva.com/design/DAHbI5KiXUg/zoCEprHHhp1eFJcN-hnMgg/edit
- Repositorio en GitHub: https://github.com/JustoYbueno23/konys-reservas-app
- Video explicativo: https://youtu.be/ulLyQzf8vpE

## Autor

Juan José Medina Orozco
