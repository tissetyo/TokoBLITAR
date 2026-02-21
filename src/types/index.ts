export type { Database, Json } from './supabase'

import type { Database } from './supabase'

// Convenience type aliases
export type User = Database['public']['Tables']['users']['Row']
export type Store = Database['public']['Tables']['stores']['Row']
export type Category = Database['public']['Tables']['categories']['Row']
export type Product = Database['public']['Tables']['products']['Row']
export type ProductImage = Database['public']['Tables']['product_images']['Row']
export type MarketplaceConnection = Database['public']['Tables']['marketplace_connections']['Row']
export type MarketplaceProduct = Database['public']['Tables']['marketplace_products']['Row']
export type PromoCode = Database['public']['Tables']['promo_codes']['Row']
export type Order = Database['public']['Tables']['orders']['Row']
export type OrderItem = Database['public']['Tables']['order_items']['Row']
export type Shipment = Database['public']['Tables']['shipments']['Row']
export type Membership = Database['public']['Tables']['memberships']['Row']
export type InstagramPost = Database['public']['Tables']['instagram_posts']['Row']
export type AISession = Database['public']['Tables']['ai_sessions']['Row']

// Insert types
export type UserInsert = Database['public']['Tables']['users']['Insert']
export type StoreInsert = Database['public']['Tables']['stores']['Insert']
export type ProductInsert = Database['public']['Tables']['products']['Insert']
export type OrderInsert = Database['public']['Tables']['orders']['Insert']

// Update types
export type UserUpdate = Database['public']['Tables']['users']['Update']
export type StoreUpdate = Database['public']['Tables']['stores']['Update']
export type ProductUpdate = Database['public']['Tables']['products']['Update']
export type OrderUpdate = Database['public']['Tables']['orders']['Update']
