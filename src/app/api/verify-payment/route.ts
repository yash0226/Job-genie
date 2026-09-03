import { NextResponse } from 'next/server'
import { createHmac } from 'crypto'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { orderId, paymentId, signature } = body

    // Verify payment signature
    const expectedSignature = createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(`${orderId}|${paymentId}`)
      .digest('hex')

    const isValid = expectedSignature === signature

    return NextResponse.json({ success: isValid })
  } catch (error) {
    console.error('Error verifying payment:', error)
    return NextResponse.json(
      { error: 'Failed to verify payment' },
      { status: 500 }
    )
  }
} 