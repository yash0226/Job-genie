import { NextResponse } from 'next/server'
import Razorpay from 'razorpay'

const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { orderId } = body

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      )
    }

    // Get order details from Razorpay
    const order = await razorpay.orders.fetch(orderId)

    return NextResponse.json(order)
  } catch (error: unknown) {
    console.error('Error fetching Razorpay order:', error)
    
    // Check if it's a Razorpay API error
    const razorpayError = error as { error?: { description: string }, statusCode?: number }
    if (razorpayError.error?.description) {
      return NextResponse.json(
        { error: razorpayError.error.description },
        { status: razorpayError.statusCode || 500 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to fetch order details' },
      { status: 500 }
    )
  }
} 