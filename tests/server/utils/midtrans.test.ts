import { describe, it, expect, vi } from 'vitest'
import { verifySignature } from '../../../server/utils/midtrans'

// Mock useRuntimeConfig
;(globalThis as any).useRuntimeConfig = () => ({
  midtrans_server_key: 'test-server-key',
  midtrans_client_key: 'test-client-key',
  public: {
    appname: 'TestApp',
    midtrans_production: false,
  }
});
;(globalThis as any).createError = (opts: { statusCode: number; statusMessage: string }) => {
  const err = new Error(opts.statusMessage) as Error & { statusCode: number }
  err.statusCode = opts.statusCode
  return err
};

describe('Midtrans Utils', () => {
  it('should verify a valid signature correctly', () => {
    // Generate a valid signature simulation
    const crypto = require('crypto')
    // We mocked useRuntimeConfig globally above, so the internal function will use this key
    const serverKey = 'test-server-key'
    
    const mockPayload = {
      order_id: 'order-123',
      status_code: '200',
      gross_amount: '100000.00',
      transaction_status: 'settlement',
      fraud_status: 'accept',
      payment_type: 'gopay',
      transaction_time: '2024-01-01 10:00:00',
      transaction_id: 'trans-123',
      status_message: 'Success',
      signature_key: '' // will compute below
    }
    
    const computedSignature = crypto
      .createHash("sha512")
      .update(`${mockPayload.order_id}${mockPayload.status_code}${mockPayload.gross_amount}${serverKey}`)
      .digest("hex")
      
    mockPayload.signature_key = computedSignature
    
    const result = verifySignature(mockPayload)
    expect(result).toBe(true)
  })

  it('should reject an invalid signature', () => {
    const mockPayload = {
      order_id: 'order-123',
      status_code: '200',
      gross_amount: '100000.00',
      transaction_status: 'settlement',
      fraud_status: 'accept',
      payment_type: 'gopay',
      transaction_time: '2024-01-01 10:00:00',
      transaction_id: 'trans-123',
      status_message: 'Success',
      signature_key: 'invalid-signature-key-1234567890' 
    }
    
    const result = verifySignature(mockPayload)
    expect(result).toBe(false)
  })

  it('should reject if signature length mismatches', () => {
    const mockPayload = {
      order_id: 'order-123',
      status_code: '200',
      gross_amount: '100000.00',
      transaction_status: 'settlement',
      fraud_status: 'accept',
      payment_type: 'gopay',
      transaction_time: '2024-01-01 10:00:00',
      transaction_id: 'trans-123',
      status_message: 'Success',
      signature_key: 'short' 
    }
    
    const result = verifySignature(mockPayload)
    expect(result).toBe(false)
  })
})
