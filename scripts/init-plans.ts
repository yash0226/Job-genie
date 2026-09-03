import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

const plans = [
  {
    name: 'Monthly Premium',
    description: 'Get 100 tokens per month with our monthly subscription plan',
    price: 15,
    duration_months: 1,
    tokens: 100,
    is_active: true
  },
  {
    name: 'Yearly Premium',
    description: 'Get 500 tokens per year with our yearly subscription plan',
    price: 50,
    duration_months: 12,
    tokens: 500,
    is_active: true
  }
]

async function initializePlans() {
  try {
    // Delete existing plans
    await supabase.from('plans').delete().neq('id', '')

    // Insert new plans
    const { error } = await supabase.from('plans').insert(plans)
    
    if (error) {
      throw error
    }

    console.log('Successfully initialized plans!')
  } catch (error) {
    console.error('Error initializing plans:', error)
  }
}

initializePlans() 