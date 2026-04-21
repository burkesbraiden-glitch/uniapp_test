const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

export const hasRemoteApiConfig = Boolean(import.meta.env.VITE_API_BASE_URL)

export const API_BASE_URL = BASE_URL

export const getApiUrl = (path: string): string => {
  if (path.startsWith('http')) return path
  if (path.startsWith('/')) return `${BASE_URL}${path}`
  return `${BASE_URL}/${path}`
}

export const getImageUrl = (url: string): string => {
  if (!url) return createMockImage('校园闲置', '#eef2f3', '#3a4a5a')
  if (url.startsWith('http')) return url
  if (url.startsWith('data:image')) return url
  return getApiUrl(url)
}

export const createMockImage = (label: string, bgColor = '#f2eadf', textColor = '#5a4634'): string => {
  const safeLabel = encodeURIComponent(label)
  const safeBg = encodeURIComponent(bgColor)
  const safeText = encodeURIComponent(textColor)
  return `data:image/svg+xml;charset=UTF-8,${`<svg xmlns="http://www.w3.org/2000/svg" width="300" height="220" viewBox="0 0 300 220"><rect width="300" height="220" fill="${safeBg}"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="24" fill="${safeText}" font-family="sans-serif">${safeLabel}</text></svg>`}`
}

export const isH5 = (): boolean => {
  if (typeof window === 'undefined') return false
  const runtimeWindow = window as any
  if (runtimeWindow.plus) return false
  const ua = runtimeWindow.navigator?.userAgent || ''
  const isMiniProgram = /miniProgram/i.test(ua) || runtimeWindow.__wxjs_environment === 'miniprogram'
  return !isMiniProgram
}

export const isApp = (): boolean => {
  if (typeof window === 'undefined') return false
  return (window as any).plus !== undefined
}

export const isWeixin = (): boolean => {
  if (typeof window === 'undefined') return false
  const ua = (window as any).navigator?.userAgent || ''
  return /MicroMessenger/i.test(ua) && /miniProgram/i.test(ua)
}
