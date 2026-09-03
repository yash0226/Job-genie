import { supabase } from '../supabase'
import type { Database } from '../database.types'

type Transaction = Database['public']['Tables']['transactions']['Row']

export const transactionService = {
  async createTransaction(
    userId: string,
    amount: number,
    currency: string,
    paymentId: string,
    orderId: string,
    planId: string
  ) {
    return supabase
      .from('transactions')
      .insert({
        user_id: userId,
        amount,
        currency,
        payment_id: paymentId,
        order_id: orderId,
        status: 'pending',
        plan_id: planId,
      })
  },

  async updateTransactionStatus(transactionId: string, status: string) {
    return supabase
      .from('transactions')
      .update({ status })
      .eq('id', transactionId)
  },

  async getUserTransactions(userId: string) {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data as Transaction[]
  },

  async getTransactionById(transactionId: string) {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', transactionId)
      .single()
    
    if (error) throw error
    return data as Transaction
  },
} 