import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'

interface LazyViewportProps {
  children: ReactNode
  className?: string
  fallback?: ReactNode
  minHeight?: number
  onEnter?: () => void
  rootMargin?: string
}

function LazyViewport({
  children,
  className,
  fallback,
  minHeight = 320,
  onEnter,
  rootMargin = '240px 0px',
}: LazyViewportProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [hasEnteredViewport, setHasEnteredViewport] = useState(false)

  useEffect(() => {
    if (hasEnteredViewport) return undefined
    if (typeof IntersectionObserver === 'undefined') {
      setHasEnteredViewport(true)
      onEnter?.()
      return undefined
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return
        setHasEnteredViewport(true)
        onEnter?.()
        observer.disconnect()
      },
      { rootMargin, threshold: 0.01 },
    )

    const element = containerRef.current
    if (element) {
      observer.observe(element)
    }

    return () => observer.disconnect()
  }, [hasEnteredViewport, onEnter, rootMargin])

  return (
    <div
      ref={containerRef}
      className={className}
      style={hasEnteredViewport ? undefined : { minHeight }}
    >
      {hasEnteredViewport ? children : fallback}
    </div>
  )
}

export default LazyViewport
