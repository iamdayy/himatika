import { describe, it, expect } from 'vitest'
import { generateKeyPair, signData, verifyDocSignature } from '../../../server/utils/encryption'

describe('RSA Encryption/Signing Utils', () => {
  it('should generate a keypair correctly', () => {
    const keypair = generateKeyPair()
    expect(keypair).toHaveProperty('privateKey')
    expect(keypair).toHaveProperty('publicKey')
    expect(typeof keypair.privateKey).toBe('string')
    expect(typeof keypair.publicKey).toBe('string')
    expect(keypair.privateKey).toContain('BEGIN RSA PRIVATE KEY')
    expect(keypair.publicKey).toContain('BEGIN PUBLIC KEY')
  })

  it('should sign and verify data successfully', () => {
    const { privateKey, publicKey } = generateKeyPair()
    const dataToSign = 'document-hash-123456789'
    
    const signature = signData(privateKey, dataToSign)
    expect(typeof signature).toBe('string')
    
    const isVerified = verifyDocSignature(publicKey, dataToSign, signature)
    expect(isVerified).toBe(true)
  })

  it('should fail verification with tampered data', () => {
    const { privateKey, publicKey } = generateKeyPair()
    const dataToSign = 'original-document-data'
    const signature = signData(privateKey, dataToSign)
    
    const tamperedData = 'tampered-document-data'
    const isVerified = verifyDocSignature(publicKey, tamperedData, signature)
    expect(isVerified).toBe(false)
  })

  it('should fail verification with wrong public key', () => {
    const { privateKey } = generateKeyPair()
    const { publicKey: wrongPublicKey } = generateKeyPair()
    
    const dataToSign = 'some-data'
    const signature = signData(privateKey, dataToSign)
    
    const isVerified = verifyDocSignature(wrongPublicKey, dataToSign, signature)
    expect(isVerified).toBe(false)
  })
})
