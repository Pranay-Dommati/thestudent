const isIOS = () =>
  /iPad|iPhone|iPod/.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

export const forceDownload = (url, title, isPack) => {
  if (!url) return Promise.resolve()

  // Derive a clean filename from the title
  const cleanTitle = (title || 'document').replace(/[^a-z0-9]/gi, '_').toLowerCase()
  const ext = isPack || url.toLowerCase().includes('.pdf') ? 'pdf' : 'png'
  const filename = `${cleanTitle}.${ext}`

  // iOS Safari completely ignores the `download` attribute on anchor tags.
  // The only reliable way is to open the URL in a new tab and let the user
  // use the native share sheet to "Save to Files".
  if (isIOS()) {
    window.open(url, '_blank')
    return Promise.resolve()
  }

  // Desktop & Android: fetch as blob and trigger a true Save-As dialog.
  return fetch(url)
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return res.blob()
    })
    .then((blob) => {
      const blobUrl = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl)
      }, 1000)
    })
    .catch(() => {
      // CORS blocked or network error — open in a new tab as fallback.
      window.open(url, '_blank')
    })
}
