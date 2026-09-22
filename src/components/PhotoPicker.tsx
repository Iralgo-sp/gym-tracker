import { useEffect, useState } from 'react'

interface Props {
  value?: Blob
  onChange: (file: Blob | undefined) => void
}

export default function PhotoPicker({ value, onChange }: Props) {
  const [previewUrl, setPreviewUrl] = useState<string | undefined>()

  useEffect(() => {
    if (!value) {
      setPreviewUrl(undefined)
      return
    }
    const url = URL.createObjectURL(value)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [value])

  return (
    <div className="photo-picker">
      <label className="photo-picker__preview">
        {previewUrl ? (
          <img src={previewUrl} alt="Foto seleccionada" />
        ) : (
          <span className="photo-picker__placeholder">📷 Añadir foto</span>
        )}
        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0]
            onChange(file)
            e.target.value = ''
          }}
        />
      </label>
      {previewUrl && (
        <button type="button" className="btn-link" onClick={() => onChange(undefined)}>
          Quitar foto
        </button>
      )}
    </div>
  )
}
