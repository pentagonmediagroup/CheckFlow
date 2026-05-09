import Image from 'next/image'

interface Props {
  size?: number
  className?: string
}

export default function PentagonLogo({ size = 44, className }: Props) {
  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: 10,
        overflow: 'hidden',
        flexShrink: 0,
        background: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <img
        src="/logo.jpg"
        alt="The Pentagon"
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
    </div>
  )
}
