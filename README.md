# Control Gimnasio

PWA (aplicación web instalable) para llevar el control de los ejercicios en el
gimnasio: máquinas de musculación y actividades (spinning, remo, etc.).

## Funcionalidades

- **Máquinas**: nombre, categoría, foto e historial de sesiones (fecha,
  series × repeticiones × peso).
- **Actividades**: nombre, foto e historial de sesiones (fecha, duración).
- Fotos añadidas desde la cámara o la galería del móvil.
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

## Generar los iconos de nuevo

Los iconos PWA (`public/icons/*.png`) se generan con un pequeño script sin
dependencias:

```bash
node scripts/generate-icons.cjs
```

Sustituye ese script o los PNG resultantes si quieres un icono propio.
