export const forceDownload = (url, title, isPack) => {
  if (!url) return

  // Derive a clean filename from the title
  const cleanTitle = (title || 'document').replace(/[^a-z0-9]/gi, '_').toLowerCase()
  const ext = isPack || url.toLowerCase().includes('.pdf') ? 'pdf' : 'png'
  const filename = `${cleanTitle}.${ext}`

  // Fetch as blob — this works for same-origin URLs and CORS-enabled CDNs.
  // It guarantees a true "Save As" download dialog regardless of Content-Disposition headers.
  fetch(url)
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
      // Delay revocation to ensure iOS Safari has time to start the download
      setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl)
      }, 1000)
    })
    .catch(() => {
      // CORS blocked or network error. 
      // window.open inside async is blocked by Safari popup blocker, so we navigate directly.
      window.location.assign(url)
    })
}
