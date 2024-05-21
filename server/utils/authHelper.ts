import { H3Event } from "h3";
import { refreshSession } from "./Sessions";
const TOKEN_TYPE = 'Bearer';

const extractToken = (authHeaderValue: string) => {
    const [, token] = authHeaderValue.split(`${TOKEN_TYPE} `)
    return token
  }
export const checkAuth = (event: H3Event) => {
    const authHeaderValue = getRequestHeader(event, 'authorization')
    if (typeof authHeaderValue === 'undefined') {
      return false;
    }
    return true;
  }
export const ensureAuth = async (event: H3Event) => {
      const authHeaderValue = getRequestHeader(event, 'authorization')
      if (typeof authHeaderValue === 'undefined') {
        throw createError({ statusCode: 403, statusMessage: 'Need to pass valid Bearer-authorization header to access this endpoint' })
      }
    
      const extractedToken = extractToken(authHeaderValue)
      try {
        return await getSession(extractedToken)
      } catch (error) {
        console.error('Login failed. Here\'s the raw error:', error)
        throw createError({ statusCode: 403, statusMessage: 'You must be logged in to use this endpoint' })
      }
    }
    export const refreshAuth = async (event: H3Event) => {
      try {
        const refreshToken = getCookie(event, 'auth.refresh-token');
        if (typeof refreshToken === 'undefined') {
          throw createError({ statusCode: 403, statusMessage: 'Need to pass valid Bearer-authorization header to access this endpoint' })
        }
        const accessToken = refreshSession(refreshToken);
        return accessToken;
      } catch (error) {
        console.error('Login failed. Here\'s the raw error:', error)
        throw createError({ statusCode: 403, statusMessage: 'You must be logged in to use this endpoint' })
      }
    }
export const killAuth = async (event: H3Event) => {
      const authHeaderValue = getRequestHeader(event, 'authorization')
      if (typeof authHeaderValue === 'undefined') {
        throw createError({ statusCode: 403, statusMessage: 'Need to pass valid Bearer-authorization header to access this endpoint' })
      }
    
      const extractedToken = extractToken(authHeaderValue)
      try {
        return await clearSession(extractedToken)
      } catch (error) {
        console.error('Login failed. Here\'s the raw error:', error)
        throw createError({ statusCode: 403, statusMessage: 'You must be logged in to use this endpoint' })
      }
    }