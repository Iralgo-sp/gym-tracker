import { useEffect, useState } from 'react'

interface Props {
  photo?: Blob
  icon?: string
}

export default function ExerciseThumb({ photo, icon = '🏋️' }: Props) {
  const [url, setUrl] = useState<string | undefined>()

  useEffect(() => {
    if (!photo) {
      setUrl(undefined)
      return
    }
    const objectUrl = URL.createObjectURL(photo)
    setUrl(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [photo])

  if (url) {
    return <img className="thumb" src={url} alt="" />
  }
  return <div className="thumb thumb--placeholder">{icon}</div>
}
