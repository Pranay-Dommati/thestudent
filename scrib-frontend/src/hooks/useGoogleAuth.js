import { useEffect, useState } from 'react'
import customToast from '../utils/customToast'

export const useGoogleAuth = (onSuccess, onError) => {
  const [isReady, setIsReady] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID

  useEffect(() => {
    const handleGoogleResponse = async (response) => {
      try {
        if (!response?.credential) {
          throw new Error('No credential received from Google')
        }
        await onSuccess(response.credential)
      } catch (error) {
        onError?.(error.message || 'Google authentication failed')
      }
    }

    const loadScript = () => new Promise((resolve, reject) => {
      if (window.google?.accounts?.id) {
        resolve()
        return
      }
      const existing = document.querySelector('script[src*="accounts.google.com/gsi/client"]')
      if (existing) {
        existing.onload = resolve
        existing.onerror = reject
        return
      }
      const script = document.createElement('script')
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      script.defer = true
      script.onload = resolve
      script.onerror = reject
      document.head.appendChild(script)
    })

    const init = async () => {
      try {
        setIsLoading(true)
        if (!clientId) {
          customToast.error('Google Sign-In not configured')
          setIsReady(false)
          setIsLoading(false)
          return
        }
        await loadScript()
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleGoogleResponse,
          auto_select: false,
          ux_mode: 'popup',
        })
        setIsReady(true)
      } catch (error) {
        customToast.error('Google Sign-In failed to load')
        setIsReady(false)
      } finally {
        setIsLoading(false)
      }
    }

    init()
  }, [clientId, onSuccess, onError])

  const renderGoogleButton = (elementId) => {
    if (!isReady || !window.google) {
      customToast.error('Google Sign-In not ready. Please refresh the page.')
      return
    }
    const element = document.getElementById(elementId)
    if (element) {
      window.google.accounts.id.renderButton(element, {
        theme: 'outline',
        size: 'large',
        type: 'standard',
        text: 'continue_with',
        shape: 'pill',
        logo_alignment: 'center',
        width: element.parentElement?.offsetWidth || 300
      })
    }
  }

  return { renderGoogleButton, isReady, isLoading }
}
