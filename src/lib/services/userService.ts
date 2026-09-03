import { supabase } from '../supabase'
import type { Database } from '../database.types'

type User = Database['public']['Tables']['users']['Row']
type DeviceLink = Database['public']['Tables']['device_links']['Row']

export const userService = {
  async createUser(userId: string, email: string) {
    return supabase
      .from('users')
      .insert({
        id: userId,
        email: email,
        tokens_remaining: 0,
        plan: 'basic',
      })
  },
  async updatePlan(userId: string, plan: string) {
    const { data, error } = await supabase
      .from('users')
      .update({ plan })
      .eq('id', userId)
      .select('id, plan')
      .single()
    if (error) return { error }
    if (!data) return { error: { message: 'No user row updated for plan change' } }
    return { data }
  },
  async getUser(userId: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()
    
    if (error) throw error
    return data as User
  },

  async updateUserSubscription(
    userId: string,
    type: 'monthly' | 'yearly' | 'daily',
    endDate: Date
  ) {
    return supabase
      .from('users')
      .update({
        subscription_type: type,
        subscription_end_date: endDate.toISOString(),
      })
      .eq('id', userId)
  },

  async addDeviceLink(userId: string, deviceId: string) {
    return supabase
      .from('device_links')
      .insert({
        user_id: userId,
        device_id: deviceId,
      })
  },

  async getDeviceLinks(userId: string) {
    const { data, error } = await supabase
      .from('device_links')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
    
    if (error) throw error
    return data as DeviceLink[]
  },

  async deactivateDevice(deviceId: string) {
    return supabase
      .from('device_links')
      .update({ is_active: false })
      .eq('device_id', deviceId)
  },
}
