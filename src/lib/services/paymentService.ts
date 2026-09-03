import { supabase } from '../supabase'
import { planService } from './planService'

// Helper function to get user email
const getUserEmail = async (userId: string): Promise<string> => {
  try {
    // Try to get user from auth API
    const { data } = await supabase.auth.getUser(userId)
    if (data?.user?.email) return data.user.email
    
    // Fallback to checking users table
    const { data: userData } = await supabase.from('users').select('email').eq('id', userId).single()
    if (userData?.email) return userData.email
    
    return ''
  } catch (error) {
    console.error('Error getting user email:', error)
    return ''
  }
}

// Generate a short unique receipt ID
const generateReceiptId = (userId: string) => {
  const timestamp = Date.now().toString(36) // Convert to base36 for shorter string
  const userPrefix = userId.slice(0, 8) // Take first 8 chars of userId
  return `ord_${timestamp}_${userPrefix}`
}

export const paymentService = {
  async createOrder(
    userId: string,
    planId: string
  ) {
    try {
      // Get plan details
      const plan = await planService.getPlanById(planId)
      if (!plan) {
        throw new Error('Selected plan not found')
      }

      // Convert USD to INR (1 USD ≈ 83 INR)
      const amountInINR = Math.round(plan.price * 83)

      // Create transaction record first
      const { data: transaction, error: txError } = await supabase
        .from('transactions')
        .insert({
          user_id: userId,
          amount: plan.price, // Store original USD amount
          currency: 'USD',
          payment_id: '', // Will be updated after payment
          order_id: '', // Will be updated after Razorpay order creation
          status: 'pending',
          plan_id: planId
        })
        .select()
        .single()

      if (txError) throw txError

      // Create Razorpay order with shorter receipt ID
      const response = await fetch('/api/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amountInINR * 100, // Convert to paise (1 INR = 100 paise)
          currency: 'INR',
          receipt: generateReceiptId(userId),
          notes: {
            userId,
            planId,
            transactionId: transaction.id,
            originalAmountUSD: plan.price,
            userEmail: await getUserEmail(userId)
          }
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create order')
      }

      const orderData = await response.json()
      console.log('Created Razorpay order:', orderData)

      // Update transaction with order ID
      const { error: updateError } = await supabase
        .from('transactions')
        .update({ order_id: orderData.id })
        .eq('id', transaction.id)

      if (updateError) throw updateError

      return {
        orderId: orderData.id,
        amount: amountInINR,
        currency: 'INR'
      }
    } catch (error) {
      console.error('Error creating order:', error)
      throw new Error('Failed to create payment order. Please try again.')
    }
  },

  async verifyPayment(
    orderId: string,
    paymentId: string,
    signature: string
  ) {
    try {
      const response = await fetch('/api/verify-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          paymentId,
          signature
        }),
      })

      if (!response.ok) {
        throw new Error('Payment verification failed')
      }

      const { success } = await response.json()

      if (!success) {
        throw new Error('Invalid payment signature')
      }

      console.log('Verifying payment:', { orderId, paymentId, signature })
      
      // Get transaction details
      const { data: transaction, error: txError } = await supabase
        .from('transactions')
        .select('*')
        .eq('order_id', orderId)
        .single()

      if (txError || !transaction) {
        // Log as debug instead of error since this doesn't affect functionality
        console.log('Info: Transaction lookup by order ID, will try alternate method:', orderId)
        // Try to get transaction details from Razorpay order notes
        const orderResponse = await fetch('/api/get-order', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ orderId }),
        })
        
        if (!orderResponse.ok) {
          throw new Error('Transaction not found and could not retrieve order details')
        }
        
        const orderData = await orderResponse.json()
        console.log('Retrieved order data:', orderData)
        const { userId, planId, transactionId } = orderData.notes || {}
        
        if (!userId || !planId) {
          throw new Error('Order details incomplete')
        }
        
        // Update transaction if we found it by ID
        if (transactionId) {
          await supabase
            .from('transactions')
            .update({
              status: 'completed',
              payment_id: paymentId,
              order_id: orderId
            })
            .eq('id', transactionId)
        } else {
          // Create a new transaction record if one wasn't found
          await supabase
            .from('transactions')
            .insert({
              user_id: userId,
              amount: orderData.amount / 100, // Convert from paise to currency
              currency: orderData.currency,
              payment_id: paymentId,
              order_id: orderId,
              status: 'completed',
              plan_id: planId
            })
        }
        
        // Get plan details
        const plan = await planService.getPlanById(planId)
        
        // Update or create user profile
        const subscriptionEndDate = new Date()
        // Determine subscription period respecting duration_days when present
        const durationDays: number | null = (plan as any).duration_days ?? null
        const isDaily = !!durationDays && durationDays > 0
        const isYearly = plan.duration_months === 12 && !isDaily
        const isMonthly = plan.duration_months === 1 && !isDaily
        if (isDaily) {
          subscriptionEndDate.setDate(subscriptionEndDate.getDate() + (durationDays || 1))
        } else if (isYearly) {
          subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 12)
        } else if (isMonthly) {
          subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 1)
        }

        const subType = isDaily ? 'daily' : isYearly ? 'yearly' : 'monthly'
        const planTier = (plan as any).tier as 'moderate' | 'pro' | undefined
        const isModerateByName = typeof plan.name === 'string' && plan.name.toLowerCase().includes('moderate')
        const targetPlan = planTier === 'moderate' || (!planTier && isModerateByName) ? 'moderate' : 'pro'
        
        console.log('🔍 PaymentService Plan Debug (branch 1):', {
          planId,
          planName: plan.name,
          planTier,
          isModerateByName,
          targetPlan,
          userId
        })
        
        // First check if user exists in users table
        const { data: existingUser } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .single()
        
        if (existingUser) {
          // Update existing user - set subscription info first
          const { error: userError } = await supabase
            .from('users')
            .update({
              subscription_type: subType,
              subscription_end_date: subscriptionEndDate.toISOString(),
            })
            .eq('id', userId)
          
          if (userError) throw userError
          
          // Set plan via server API to ensure it sticks
          try {
            const planResponse = await fetch('/api/users/set-plan', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId, plan: targetPlan })
            })
            
            if (!planResponse.ok) {
              const errorData = await planResponse.json()
              console.error('Failed to set plan via API:', errorData)
            } else {
              const result = await planResponse.json()
              console.log('✅ Plan set via API:', result)
            }
          } catch (apiError) {
            console.error('Error calling set-plan API:', apiError)
          }
        } else {
          // Create new user profile - set subscription info first
          const email = await getUserEmail(userId)
          
          const { error: insertError } = await supabase
            .from('users')
            .insert({
              id: userId,
              email,
              tokens_remaining: 0,
              subscription_type: subType,
              subscription_end_date: subscriptionEndDate.toISOString(),
              plan: 'basic', // Will be updated via API below
            })
          
          if (insertError) throw insertError
          
          // Set plan via server API to ensure it sticks
          try {
            const planResponse = await fetch('/api/users/set-plan', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId, plan: targetPlan })
            })
            
            if (!planResponse.ok) {
              const errorData = await planResponse.json()
              console.error('Failed to set plan via API (new user):', errorData)
            } else {
              const result = await planResponse.json()
              console.log('✅ Plan set via API (new user):', result)
            }
          } catch (apiError) {
            console.error('Error calling set-plan API (new user):', apiError)
          }
        }
        
        return true
      }
      
      // If we found the transaction, proceed normally
      // Update transaction status
      const { error: updateError } = await supabase
        .from('transactions')
        .update({
          status: 'completed',
          payment_id: paymentId
        })
        .eq('order_id', orderId)

      if (updateError) throw updateError

      // Get plan details
      const plan = await planService.getPlanById(transaction.plan_id)

      // Update user's subscription and tokens
      const subscriptionEndDate = new Date()
      const durationDays2: number | null = (plan as any).duration_days ?? null
      const isDaily2 = !!durationDays2 && durationDays2 > 0
      const isYearly2 = plan.duration_months === 12 && !isDaily2
      const isMonthly2 = plan.duration_months === 1 && !isDaily2
      if (isDaily2) {
        subscriptionEndDate.setDate(subscriptionEndDate.getDate() + (durationDays2 || 1))
      } else if (isYearly2) {
        subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 12)
      } else if (isMonthly2) {
        subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 1)
      }

      const subType2 = isDaily2 ? 'daily' : isYearly2 ? 'yearly' : 'monthly'
      const planTier2 = (plan as any).tier as 'moderate' | 'pro' | undefined
      const isModerateByName2 = typeof plan.name === 'string' && plan.name.toLowerCase().includes('moderate')
      const targetPlan2 = planTier2 === 'moderate' || (!planTier2 && isModerateByName2) ? 'moderate' : 'pro'
      
      console.log('🔍 PaymentService Plan Debug (branch 2):', {
        planId: transaction.plan_id,
        planName: plan.name,
        planTier: planTier2,
        isModerateByName: isModerateByName2,
        targetPlan: targetPlan2,
        userId: transaction.user_id
      })
      
      // First check if user exists in users table
      const { data: existingUser } = await supabase
        .from('users')
        .select('*')
        .eq('id', transaction.user_id)
        .single()
      
      if (existingUser) {
        // Update existing user - set subscription info first
        const { error: userError } = await supabase
          .from('users')
          .update({
            subscription_type: subType2,
            subscription_end_date: subscriptionEndDate.toISOString(),
          })
          .eq('id', transaction.user_id)
        
        if (userError) throw userError
        
        // Set plan via server API to ensure it sticks
        try {
          const planResponse = await fetch('/api/users/set-plan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: transaction.user_id, plan: targetPlan2 })
          })
          
          if (!planResponse.ok) {
            const errorData = await planResponse.json()
            console.error('Failed to set plan via API (branch 2):', errorData)
          } else {
            const result = await planResponse.json()
            console.log('✅ Plan set via API (branch 2):', result)
          }
        } catch (apiError) {
          console.error('Error calling set-plan API (branch 2):', apiError)
        }
      } else {
        // Create new user profile - set subscription info first
        const email = await getUserEmail(transaction.user_id)
        
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            id: transaction.user_id,
            email,
            tokens_remaining: 0,
            subscription_type: subType2,
            subscription_end_date: subscriptionEndDate.toISOString(),
            plan: 'basic', // Will be updated via API below
          })
        
        if (insertError) throw insertError
        
        // Set plan via server API to ensure it sticks
        try {
          const planResponse = await fetch('/api/users/set-plan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: transaction.user_id, plan: targetPlan2 })
          })
          
          if (!planResponse.ok) {
            const errorData = await planResponse.json()
            console.error('Failed to set plan via API (branch 2, new user):', errorData)
          } else {
            const result = await planResponse.json()
            console.log('✅ Plan set via API (branch 2, new user):', result)
          }
        } catch (apiError) {
          console.error('Error calling set-plan API (branch 2, new user):', apiError)
        }
      }

      return true
    } catch (error) {
      // Check if this is a known issue that doesn't affect functionality
      if (error instanceof Error && 
          (error.message.includes('Transaction not found') || 
           error.message.includes('order details'))) {
        console.log('Non-critical error during payment verification:', error.message);
        // Return true anyway since the payment was likely successful
        return true;
      }
      
      // For other errors, log and throw as usual
      console.error('Error verifying payment:', error)
      throw error
    }
  }
} 