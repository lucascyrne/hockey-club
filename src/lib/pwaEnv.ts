/** App já aberto como PWA instalada. */
export function isStandalonePwa(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

export function isEmbeddedFrame(): boolean {
  try {
    return window.self !== window.top
  } catch {
    return true
  }
}

export function isIosDevice(): boolean {
  return (
    /iphone|ipad|ipod/i.test(navigator.userAgent) &&
    !(window as Window & { MSStream?: unknown }).MSStream
  )
}
