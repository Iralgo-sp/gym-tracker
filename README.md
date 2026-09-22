# Control Gimnasio

PWA (aplicación web instalable) para llevar el control de los ejercicios en el
gimnasio: máquinas de musculación y actividades (spinning, remo, etc.).

## Funcionalidades

- **Máquinas**: nombre, categoría, foto e historial de sesiones (fecha,
  series × repeticiones × peso).
- **Actividades**: nombre, foto e historial de sesiones (fecha, duración).
- Fotos añadidas desde la cámara o la galería del móvil.
- Calendario del mes con marcas de color por día (máquinas / actividades);
  al pulsar un día se ve el detalle de todo lo hecho ese día.
- Funciona offline y se puede instalar en la pantalla de inicio (PWA).
- Todos los datos se guardan localmente en el dispositivo (IndexedDB), no
  hay servidor ni cuenta que configurar.

## Desarrollo

```bash
npm install
npm run dev
```

Abre la URL que muestra la terminal. Para probar la instalación como PWA en
el móvil, conéctate desde el móvil a la misma red y usa la IP que muestra
`npm run dev -- --host`, o despliega la rama `main` (ver más abajo).

## Compilar

```bash
npm run build
npm run preview
```

## Despliegue (GitHub Pages)

Cada `push` a `main` despliega automáticamente la app a GitHub Pages
mediante el workflow en `.github/workflows/deploy.yml`. La primera vez hay
que activar Pages en el repositorio: **Settings → Pages → Source: GitHub
Actions**.

La URL final instalable será `https://<usuario>.github.io/<repositorio>/`.

Si cambias el nombre del repositorio, actualiza también la constante
`repoName` en `vite.config.ts` para que las rutas de los recursos sigan
siendo correctas.

## Datos y copias de seguridad

Los datos (fichas de máquinas/actividades, fotos e historial de sesiones)
se guardan solo en el navegador/dispositivo donde se usa la app
(IndexedDB), no se sincronizan entre dispositivos. Si borras los datos del
navegador o desinstalas la PWA, se pierden. Si en el futuro quieres
sincronización entre varios dispositivos o copia de seguridad en la nube,
se puede añadir un backend (por ejemplo Supabase o Firebase) sin rehacer
la interfaz.

Desde **Ajustes** (icono ⚙️ en la pantalla principal) puedes exportar todos
los datos a un archivo `.zip` y volver a importarlos (por ejemplo tras
reinstalar la app o cambiar de móvil).

## Formato de exportación

El `.zip` generado usa un formato abierto y autodescriptivo, pensado para
poder leerse desde cualquier app o script futuro sin depender de esta base
de código ni de IndexedDB:

```
gym-tracker-2026-09-22.zip
├── data.json
└── photos/
    ├── 1.jpg
    ├── 3.png
    └── ...
```

`data.json`:

```jsonc
{
  "schemaVersion": 1,
  "exportedAt": "2026-09-22T10:00:00.000Z",
  "exercises": [
    {
      "id": 1,
      "type": "machine",            // "machine" | "activity"
      "name": "Press banca",
      "category": "Pecho",          // solo presente en "machine"
      "photo": { "file": "photos/1.jpg", "mimeType": "image/jpeg" }, // opcional
      "createdAt": "2026-01-10T09:00:00.000Z"
    },
    {
      "id": 2,
      "type": "activity",
      "name": "Spinning",
      "createdAt": "2026-01-12T08:00:00.000Z"
    }
  ],
  "sessions": [
    {
      "id": 1,
      "exerciseId": 1,
      "date": "2026-09-20",         // YYYY-MM-DD
      "sets": [                     // solo presente si exerciseId es de tipo "machine"
        { "reps": 10, "weight": 40 },
        { "reps": 8, "weight": 42.5 }
      ]
    },
    {
      "id": 2,
      "exerciseId": 2,
      "date": "2026-09-21",
      "durationMin": 45,            // solo presente si exerciseId es de tipo "activity"
      "notes": "Clase intensa"
    }
  ]
}
```

Notas para consumir este formato desde otra app:

- `exercises[].photo.file` es una ruta relativa dentro del mismo `.zip`;
  `mimeType` indica el tipo real del archivo (no te fíes solo de la
  extensión).
- `sessions[].exerciseId` referencia el `id` dentro de este mismo export,
  no un id interno de la base de datos del navegador.
- Los campos no aplicables al tipo de ejercicio (`category` en
  actividades, `sets`/`durationMin` cruzados) simplemente no aparecen.
- `schemaVersion` solo sube si cambia el significado de un campo ya
  existente; añadir campos opcionales nuevos no la incrementa, así que un
  lector tolerante debería ignorar campos desconocidos.
- La lógica de export/import está en `src/lib/exportImport.ts` si quieres
  ver el detalle exacto de generación/lectura.

## Generar los iconos de nuevo

Los iconos PWA (`public/icons/*.png`) se generan con un pequeño script sin
dependencias:

```bash
node scripts/generate-icons.cjs
```

Sustituye ese script o los PNG resultantes si quieres un icono propio.
