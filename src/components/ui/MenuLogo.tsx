import { useState } from 'react'

const LOGO_URLS = ['/textures/hockey-club-logo.webp', '/textures/hockey-club-logo.png']

export function MenuLogo() {
  const [urlIndex, setUrlIndex] = useState(0)
  const [failed, setFailed] = useState(false)

  if (failed) {
    return (
      <h1 className="main-menu__title main-menu__title--fallback">HOCKEY CLUB</h1>
    )
  }

  const src = LOGO_URLS[urlIndex]

  return (
    <img
      className="main-menu__logo"
      src={src}
      alt="Hockey Club"
      decoding="async"
      onError={() => {
        if (urlIndex + 1 < LOGO_URLS.length) {
          setUrlIndex(urlIndex + 1)
        } else {
          setFailed(true)
        }
      }}
    />
  )
}
