import { supabase } from '../supabase'
import type { Database } from '../database.types'

type Plan = Database['public']['Tables']['plans']['Row']
type Coupon = Database['public']['Tables']['coupons']['Row']

export const planService = {
  async getActivePlans() {
    const { data, error } = await supabase
      .from('plans')
      .select('*')
      .eq('is_active', true)
      .order('price', { ascending: true })
    
    if (error) throw error
    return data as Plan[]
  },

  async getPlanById(planId: string) {
    const { data, error } = await supabase
      .from('plans')
      .select('*')
      .eq('id', planId)
      .single()
    
    if (error) throw error
    return data as Plan
  },

  async validateCoupon(code: string): Promise<Coupon | null> {
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', code.toUpperCase())
      .eq('is_active', true)
      .single()
    
    if (error || !data) return null

    const coupon = data as Coupon
    const now = new Date()
    const expiresAt = new Date(coupon.expires_at)

    // Check if coupon is expired or max uses reached
    if (expiresAt < now || coupon.current_uses >= coupon.max_uses) {
      return null
    }

    return coupon
  },

  async incrementCouponUses(couponId: string) {
    const { error } = await supabase
      .from('coupons')
      .update({
        current_uses: supabase.rpc('increment_counter')
      })
      .eq('id', couponId)
    
    if (error) throw error
  },

  calculateDiscountedPrice(price: number, coupon: Coupon | null): number {
    if (!coupon) return price
    
    const discountAmount = (price * coupon.discount_percentage) / 100
    return Math.max(0, price - discountAmount)
  }
} 