import { H3Event } from "h3";
const TOKEN_TYPE = 'Bearer';

const extractToken = (authHeaderValue: string) => {
    const [, token] = authHeaderValue.split(`${TOKEN_TYPE} `)
    return token
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