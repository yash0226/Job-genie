export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      device_links: {
        Row: {
          id: string
          user_id: string
          device_id: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          device_id: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          device_id?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          user_id: string | null
          amount: number
          currency: string
          payment_id: string
          order_id: string
          status: string
          plan_id: string
          coupon_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          amount: number
          currency: string
          payment_id: string
          order_id: string
          status?: string
          plan_id: string
          coupon_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          amount?: number
          currency?: string
          payment_id?: string
          order_id?: string
          status?: string
          plan_id?: string
          coupon_id?: string | null
          created_at?: string
        }
      }
      users: {
        Row: {
          id: string
          email: string
          tokens_remaining: number
          subscription_type: 'monthly' | 'yearly' | null
          subscription_end_date: string | null
          password_set: boolean
          password_hash: string | null
          created_at: string
          updated_at: string
          plan: 'basic' | 'pro'
        }
        Insert: {
          id: string
          email: string
          tokens_remaining?: number
          subscription_type?: 'monthly' | 'yearly' | null
          subscription_end_date?: string | null
          password_set?: boolean
          password_hash?: string | null
          created_at?: string
          updated_at?: string
          plan?: 'basic' | 'pro'
        }
        Update: {
          id?: string
          email?: string
          tokens_remaining?: number
          subscription_type?: 'monthly' | 'yearly' | null
          subscription_end_date?: string | null
          password_set?: boolean
          password_hash?: string | null
          created_at?: string
          updated_at?: string
          plan?: 'basic' | 'pro'
        }
      }
      plans: {
        Row: {
          id: string
          name: string
          description: string
          price: number
          duration_months: number
          tokens: number
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description: string
          price: number
          duration_months: number
          tokens: number
          is_active?: boolean
          created_at?: string
        }
        Update: {
          name?: string
          description?: string
          price?: number
          duration_months?: number
          tokens?: number
          is_active?: boolean
        }
      }
      coupons: {
        Row: {
          id: string
          code: string
          discount_percentage: number
          max_uses: number
          current_uses: number
          expires_at: string
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          code: string
          discount_percentage: number
          max_uses: number
          current_uses?: number
          expires_at: string
          is_active?: boolean
          created_at?: string
        }
        Update: {
          code?: string
          discount_percentage?: number
          max_uses?: number
          current_uses?: number
          expires_at?: string
          is_active?: boolean
        }
      }
    }
  }
} 