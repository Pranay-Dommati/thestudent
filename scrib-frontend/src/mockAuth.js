import { useEffect, useState } from 'react'

const STORAGE_KEY = 'scrib_mock_user'

export const getMockUser = () => {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export const setMockUser = (user) => {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
  window.dispatchEvent(new Event('mock-auth-changed'))
}

export const clearMockUser = () => {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(STORAGE_KEY)
  window.dispatchEvent(new Event('mock-auth-changed'))
}

export const getInitials = (name) => {
  if (!name) return 'U'
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('')
}

export const useMockAuth = () => {
  const [user, setUser] = useState(getMockUser())

  useEffect(() => {
    const handleChange = () => setUser(getMockUser())
    window.addEventListener('mock-auth-changed', handleChange)
    window.addEventListener('storage', handleChange)
    return () => {
      window.removeEventListener('mock-auth-changed', handleChange)
      window.removeEventListener('storage', handleChange)
    }
  }, [])

  return {
    user,
    login: setMockUser,
    logout: clearMockUser,
  }
}
