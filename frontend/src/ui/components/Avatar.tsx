import './Avatar.css'

interface AvatarProps {
  src: string
  alt: string
}

export function Avatar({ src, alt }: AvatarProps) {
  return <img className="avatar" src={src} alt={alt} width={200} height={200} />
}
