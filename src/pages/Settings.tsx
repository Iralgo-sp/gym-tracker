import { useRef, useState, type ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { downloadBlob, exportData, importData } from '../lib/exportImport'

export default function Settings() {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [replace, setReplace] = useState(false)
  const [status, setStatus] = useState<string | undefined>()
  const [busy, setBusy] = useState(false)

  async function handleExport() {
    setBusy(true)
    setStatus(undefined)
    try {
      const blob = await exportData()
      const today = new Date().toISOString().slice(0, 10)
      downloadBlob(blob, `gym-tracker-${today}.zip`)
      setStatus('Exportación descargada.')
    } catch (err) {
      setStatus(`Error al exportar: ${(err as Error).message}`)
    } finally {
      setBusy(false)
    }
  }

  async function handleImportFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    if (
      replace &&
      !confirm('Esto borrará todos los datos actuales de la app antes de importar. ¿Continuar?')
    ) {
      return
    }

    setBusy(true)
    setStatus(undefined)
    try {
      const result = await importData(file, { replace })
      setStatus(`Importado: ${result.exercisesImported} fichas y ${result.sessionsImported} sesiones.`)
    } catch (err) {
      setStatus(`Error al importar: ${(err as Error).message}`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="page">
      <header className="app-header app-header--with-back">
        <button className="btn-back" onClick={() => navigate('/')} aria-label="Volver">
          ←
        </button>
        <h1>Datos y copia de seguridad</h1>
      </header>

      <section className="settings-section">
        <h2 className="section-title">Exportar</h2>
        <p className="settings-description">
          Descarga todas tus fichas, fotos e historial de sesiones en un archivo .zip con un
          formato abierto (JSON + fotos), pensado para poder leerlo desde cualquier otra app o
          herramienta en el futuro. El formato está documentado en el README del proyecto.
        </p>
        <button className="btn-primary btn-block" onClick={handleExport} disabled={busy}>
          Exportar datos
        </button>
      </section>

      <section className="settings-section">
        <h2 className="section-title">Importar</h2>
        <p className="settings-description">
          Restaura datos desde un archivo exportado previamente con esta app (por ejemplo, tras
          reinstalarla o al cambiar de móvil).
        </p>
        <label className="checkbox-field">
          <input
            type="checkbox"
            checked={replace}
            onChange={(e) => setReplace(e.target.checked)}
          />
          <span>Sustituir los datos actuales en vez de añadir</span>
        </label>
        <button
          type="button"
          className="btn-secondary btn-block"
          onClick={() => fileInputRef.current?.click()}
          disabled={busy}
        >
          Elegir archivo .zip
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".zip"
          onChange={handleImportFile}
          style={{ display: 'none' }}
        />
      </section>

      {status && <p className="settings-status">{status}</p>}
    </div>
  )
}
