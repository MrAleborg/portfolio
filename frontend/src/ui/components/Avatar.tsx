import { useState } from 'react'
import './Avatar.css'

interface AvatarProps {
  src: string
  fallbackSrc: string
  alt: string
}

export function Avatar({ src, fallbackSrc, alt }: AvatarProps) {
  const [failed, setFailed] = useState(false)

  return (
    <img
      className="avatar"
      src={failed ? fallbackSrc : src}
      onError={() => setFailed(true)}
      alt={alt}
      width={200}
      height={200}
    />
  )
}
