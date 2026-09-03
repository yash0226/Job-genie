import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

async function updateMonthlyPlanPrice() {
  try {
    // Get the monthly plan
    const { data: monthlyPlan, error: fetchError } = await supabase
      .from('plans')
      .select('*')
      .eq('name', 'Monthly Premium')
      .single()
    
    if (fetchError) {
      throw fetchError
    }

    if (!monthlyPlan) {
      throw new Error('Monthly plan not found')
    }

    console.log('Current monthly plan:', monthlyPlan)

    // Update the monthly plan price to 1 rupee (0.012 USD)
    const { error: updateError } = await supabase
      .from('plans')
      .update({ price: 0.012 }) // 1 rupee ≈ 0.012 USD
      .eq('id', monthlyPlan.id)
    
    if (updateError) {
      throw updateError
    }

    console.log('Successfully updated monthly plan price to 1 rupee (0.012 USD)!')
  } catch (error) {
    console.error('Error updating monthly plan price:', error)
  }
}

updateMonthlyPlanPrice() 