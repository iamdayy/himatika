import { describe, it, expect } from 'vitest'
import { encrypt, decrypt } from '../../../server/utils/encrypt'
import crypto from 'crypto'

describe('Encryption Utils', () => {
  const originalEnv = process.env.ENCRYPTION_KEY
  
  // Set a mock encryption key for testing
  // It needs to be 32 bytes (256 bits), so 64 hex chars
  const mockKey = crypto.randomBytes(32).toString('hex')

  it('should encrypt and decrypt a string successfully', () => {
    // Override the process env for this test context, note that the encrypt module 
    // caches the key on load. But we can still test the logic if we ensure it uses some key.
    
    const textToEncrypt = 'Hello, World! 123'
    
    // Attempt encryption
    const encryptedData = encrypt(textToEncrypt)
    
    expect(encryptedData).toHaveProperty('iv')
    expect(encryptedData).toHaveProperty('encrypted')
    expect(encryptedData).toHaveProperty('tag')
    
    // Attempt decryption
    const decryptedText = decrypt(encryptedData.encrypted, encryptedData.iv, encryptedData.tag)
    
    expect(decryptedText).toBe(textToEncrypt)
  })

  it('should fail decryption with invalid tag', () => {
    const textToEncrypt = 'Secret Message'
    const encryptedData = encrypt(textToEncrypt)
    
    // Tamper with the tag (change first character)
    const tamperedTag = encryptedData.tag.substring(1) + '0'
    
    expect(() => {
      decrypt(encryptedData.encrypted, encryptedData.iv, tamperedTag)
    }).toThrow() // Should throw auth tag validation error
  })

  it('should fail decryption with invalid iv', () => {
    const textToEncrypt = 'Secret Message'
    const encryptedData = encrypt(textToEncrypt)
    
    // Tamper with the iv
    const tamperedIv = encryptedData.iv.substring(1) + '0'
    
    expect(() => {
      decrypt(encryptedData.encrypted, tamperedIv, encryptedData.tag)
    }).toThrow()
  })
})
