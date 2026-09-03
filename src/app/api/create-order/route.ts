import { NextResponse } from 'next/server'
import Razorpay from 'razorpay'
import { createClient } from '@supabase/supabase-js'

const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!
})

const RECEIPT_MAX_LENGTH = 40

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { receipt, notes, planId: bodyPlanId, currency: bodyCurrency } = body

    // Basic required fields
    if (!receipt) {
      return NextResponse.json(
        { error: 'Missing receipt' },
        { status: 400 }
      )
    }

    // Validate receipt length
    if (receipt.length > RECEIPT_MAX_LENGTH) {
      return NextResponse.json(
        { error: `Receipt length must not exceed ${RECEIPT_MAX_LENGTH} characters` },
        { status: 400 }
      )
    }

    // Create Supabase service client to read pricing from DB
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    if (!url || !serviceKey) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
    }
    const supabaseAdmin = createClient(url, serviceKey)

    // Extract planId from request (prefer notes.planId if present)
    const planId = notes?.planId || bodyPlanId
    if (!planId) {
      return NextResponse.json({ error: 'Missing planId' }, { status: 400 })
    }

    // Load plan securely from DB
    const { data: plan, error: planErr } = await supabaseAdmin
      .from('plans')
      .select('id, price, is_active')
      .eq('id', planId)
      .single()

    if (planErr || !plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 400 })
    }
    if (!plan.is_active) {
      return NextResponse.json({ error: 'Plan is not active' }, { status: 400 })
    }

    // Compute amount on server; ignore any client-provided amount/currency
    const amountInINR = Math.max(1, Math.round(Number(plan.price) * 83))
    const amountPaise = amountInINR * 100
    const currency = 'INR'

    // Prepare sanitized notes (limit size, add serverApprovedAmount)
    const safeNotes = {
      ...(typeof notes === 'object' && notes ? notes : {}),
      planId,
      serverApprovedAmountINR: amountInINR,
      environment: process.env.NODE_ENV,
    }

    const order = await razorpay.orders.create({
      amount: amountPaise,
      currency,
      receipt,
      notes: safeNotes,
    })

    return NextResponse.json(order)
  } catch (error: any) {
    console.error('Error creating Razorpay order:', error)
    
    // Check if it's a Razorpay API error
    if (error.error?.description) {
      return NextResponse.json(
        { error: error.error.description },
        { status: error.statusCode || 500 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create order. Please try again.' },
      { status: 500 }
    )
  }
} 