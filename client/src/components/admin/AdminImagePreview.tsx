import clsx from 'clsx'
import { ExternalLink, ImageIcon } from 'lucide-react'

type AdminImagePreviewSize = 'lg' | 'md' | 'sm'

const sizeClasses: Record<AdminImagePreviewSize, string> = {
  lg: 'size-24',
  md: 'size-16',
  sm: 'size-12',
}

const tiltClasses = ['rotate-0', '-rotate-2', 'rotate-2', '-rotate-1']

function AdminImagePreview({
  alt,
  badge,
  className,
  href,
  size = 'md',
  src,
  tilt = false,
}: {
  alt: string
  badge?: string
  className?: string
  href?: string
  size?: AdminImagePreviewSize
  src?: string
  tilt?: boolean
}) {
  const content = (
    <>
      {src ? (
        <img className="h-full w-full object-cover transition duration-300 group-hover:scale-110" src={src} alt={alt} />
      ) : (
        <span className="grid h-full w-full place-items-center bg-surfaceMuted text-primaryDark">
          <ImageIcon size={size === 'sm' ? 18 : 22} />
        </span>
      )}
      <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/35 via-transparent to-white/10 opacity-0 transition group-hover:opacity-100" />
      {href && (
        <span className="pointer-events-none absolute bottom-1.5 right-1.5 grid size-6 place-items-center rounded-full bg-white/95 text-primaryDark opacity-0 shadow-soft transition group-hover:opacity-100">
          <ExternalLink size={13} />
        </span>
      )}
      {badge && (
        <span className="absolute -right-1.5 -top-1.5 min-w-6 rounded-full border border-white bg-accent px-1.5 py-0.5 text-center text-xs font-black text-white shadow-soft">
          {badge}
        </span>
      )}
    </>
  )

  const previewClass = clsx(
    'group relative isolate shrink-0 overflow-hidden rounded-md border border-lineStrong/60 bg-white shadow-soft ring-2 ring-white transition duration-200 hover:-translate-y-0.5 hover:border-primary/60 hover:shadow-liquid',
    sizeClasses[size],
    tilt && 'origin-bottom-left',
    className,
  )

  if (!href) {
    return <span className={previewClass}>{content}</span>
  }

  return (
    <a className={previewClass} href={href} target="_blank" rel="noreferrer">
      {content}
    </a>
  )
}

export function AdminImageMosaic({
  alt,
  className,
  images,
  max = 4,
  size = 'sm',
}: {
  alt: string
  className?: string
  images: string[]
  max?: number
  size?: AdminImagePreviewSize
}) {
  const visibleImages = images.filter(Boolean).slice(0, max)
  const remainingCount = Math.max(images.length - visibleImages.length, 0)

  if (visibleImages.length === 0) return null

  return (
    <div className={clsx('flex flex-wrap items-center gap-2', className)}>
      {visibleImages.map((image, index) => (
        <AdminImagePreview
          key={`${image}-${index}`}
          alt={`${alt} ${index + 1}`}
          badge={index === visibleImages.length - 1 && remainingCount > 0 ? `+${remainingCount}` : undefined}
          className={tiltClasses[index % tiltClasses.length]}
          href={image}
          size={size}
          src={image}
          tilt
        />
      ))}
    </div>
  )
}

export default AdminImagePreview
