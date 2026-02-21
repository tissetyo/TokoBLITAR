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
            users: {
                Row: {
                    id: string
                    role: 'buyer' | 'seller' | 'admin'
                    full_name: string | null
                    avatar_url: string | null
                    created_at: string
                    deleted_at: string | null
                }
                Insert: {
                    id: string
                    role?: 'buyer' | 'seller' | 'admin'
                    full_name?: string | null
                    avatar_url?: string | null
                    created_at?: string
                    deleted_at?: string | null
                }
                Update: {
                    id?: string
                    role?: 'buyer' | 'seller' | 'admin'
                    full_name?: string | null
                    avatar_url?: string | null
                    created_at?: string
                    deleted_at?: string | null
                }
            }
            stores: {
                Row: {
                    id: string
                    user_id: string
                    name: string
                    slug: string
                    description: string | null
                    logo_url: string | null
                    banner_url: string | null
                    address: string | null
                    lat: number | null
                    lng: number | null
                    google_maps_url: string | null
                    instagram_handle: string | null
                    status: 'active' | 'inactive' | 'suspended'
                    created_at: string
                    deleted_at: string | null
                }
                Insert: {
                    id?: string
                    user_id: string
                    name: string
                    slug: string
                    description?: string | null
                    logo_url?: string | null
                    banner_url?: string | null
                    address?: string | null
                    lat?: number | null
                    lng?: number | null
                    google_maps_url?: string | null
                    instagram_handle?: string | null
                    status?: 'active' | 'inactive' | 'suspended'
                    created_at?: string
                    deleted_at?: string | null
                }
                Update: {
                    id?: string
                    user_id?: string
                    name?: string
                    slug?: string
                    description?: string | null
                    logo_url?: string | null
                    banner_url?: string | null
                    address?: string | null
                    lat?: number | null
                    lng?: number | null
                    google_maps_url?: string | null
                    instagram_handle?: string | null
                    status?: 'active' | 'inactive' | 'suspended'
                    created_at?: string
                    deleted_at?: string | null
                }
            }
            categories: {
                Row: {
                    id: string
                    name: string
                    slug: string
                    icon_url: string | null
                    parent_id: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    slug: string
                    icon_url?: string | null
                    parent_id?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    slug?: string
                    icon_url?: string | null
                    parent_id?: string | null
                    created_at?: string
                }
            }
            products: {
                Row: {
                    id: string
                    store_id: string
                    category_id: string | null
                    name: string
                    description: string | null
                    price: number
                    stock: number
                    weight_gram: number
                    is_featured: boolean
                    status: 'active' | 'draft' | 'archived'
                    created_at: string
                    deleted_at: string | null
                }
                Insert: {
                    id?: string
                    store_id: string
                    category_id?: string | null
                    name: string
                    description?: string | null
                    price: number
                    stock?: number
                    weight_gram?: number
                    is_featured?: boolean
                    status?: 'active' | 'draft' | 'archived'
                    created_at?: string
                    deleted_at?: string | null
                }
                Update: {
                    id?: string
                    store_id?: string
                    category_id?: string | null
                    name?: string
                    description?: string | null
                    price?: number
                    stock?: number
                    weight_gram?: number
                    is_featured?: boolean
                    status?: 'active' | 'draft' | 'archived'
                    created_at?: string
                    deleted_at?: string | null
                }
            }
            product_images: {
                Row: {
                    id: string
                    product_id: string
                    url: string
                    is_primary: boolean
                    is_ai_enhanced: boolean
                    sort_order: number
                    created_at: string
                }
                Insert: {
                    id?: string
                    product_id: string
                    url: string
                    is_primary?: boolean
                    is_ai_enhanced?: boolean
                    sort_order?: number
                    created_at?: string
                }
                Update: {
                    id?: string
                    product_id?: string
                    url?: string
                    is_primary?: boolean
                    is_ai_enhanced?: boolean
                    sort_order?: number
                    created_at?: string
                }
            }
            marketplace_connections: {
                Row: {
                    id: string
                    store_id: string
                    platform: 'tokopedia' | 'shopee' | 'lazada'
                    access_token_enc: string | null
                    refresh_token_enc: string | null
                    shop_id: string | null
                    status: 'connected' | 'disconnected' | 'error'
                    last_sync_at: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    store_id: string
                    platform: 'tokopedia' | 'shopee' | 'lazada'
                    access_token_enc?: string | null
                    refresh_token_enc?: string | null
                    shop_id?: string | null
                    status?: 'connected' | 'disconnected' | 'error'
                    last_sync_at?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    store_id?: string
                    platform?: 'tokopedia' | 'shopee' | 'lazada'
                    access_token_enc?: string | null
                    refresh_token_enc?: string | null
                    shop_id?: string | null
                    status?: 'connected' | 'disconnected' | 'error'
                    last_sync_at?: string | null
                    created_at?: string
                }
            }
            marketplace_products: {
                Row: {
                    id: string
                    product_id: string
                    connection_id: string
                    platform_product_id: string | null
                    platform_url: string | null
                    sync_status: 'synced' | 'pending' | 'error'
                    last_synced_at: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    product_id: string
                    connection_id: string
                    platform_product_id?: string | null
                    platform_url?: string | null
                    sync_status?: 'synced' | 'pending' | 'error'
                    last_synced_at?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    product_id?: string
                    connection_id?: string
                    platform_product_id?: string | null
                    platform_url?: string | null
                    sync_status?: 'synced' | 'pending' | 'error'
                    last_synced_at?: string | null
                    created_at?: string
                }
            }
            promo_codes: {
                Row: {
                    id: string
                    store_id: string | null
                    created_by: string
                    code: string
                    type: 'percentage' | 'fixed'
                    value: number
                    min_purchase: number
                    max_uses: number | null
                    used_count: number
                    starts_at: string
                    ends_at: string
                    is_active: boolean
                    created_at: string
                }
                Insert: {
                    id?: string
                    store_id?: string | null
                    created_by: string
                    code: string
                    type: 'percentage' | 'fixed'
                    value: number
                    min_purchase?: number
                    max_uses?: number | null
                    used_count?: number
                    starts_at: string
                    ends_at: string
                    is_active?: boolean
                    created_at?: string
                }
                Update: {
                    id?: string
                    store_id?: string | null
                    created_by?: string
                    code?: string
                    type?: 'percentage' | 'fixed'
                    value?: number
                    min_purchase?: number
                    max_uses?: number | null
                    used_count?: number
                    starts_at?: string
                    ends_at?: string
                    is_active?: boolean
                    created_at?: string
                }
            }
            orders: {
                Row: {
                    id: string
                    buyer_id: string
                    store_id: string
                    promo_code_id: string | null
                    status: 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
                    total_amount: number
                    discount_amount: number
                    payment_method: string | null
                    payment_gateway_id: string | null
                    source: 'web' | 'marketplace'
                    shipping_address: Json | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    buyer_id: string
                    store_id: string
                    promo_code_id?: string | null
                    status?: 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
                    total_amount: number
                    discount_amount?: number
                    payment_method?: string | null
                    payment_gateway_id?: string | null
                    source?: 'web' | 'marketplace'
                    shipping_address?: Json | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    buyer_id?: string
                    store_id?: string
                    promo_code_id?: string | null
                    status?: 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
                    total_amount?: number
                    discount_amount?: number
                    payment_method?: string | null
                    payment_gateway_id?: string | null
                    source?: 'web' | 'marketplace'
                    shipping_address?: Json | null
                    created_at?: string
                }
            }
            order_items: {
                Row: {
                    id: string
                    order_id: string
                    product_id: string
                    quantity: number
                    unit_price: number
                    subtotal: number
                    created_at: string
                }
                Insert: {
                    id?: string
                    order_id: string
                    product_id: string
                    quantity: number
                    unit_price: number
                    subtotal: number
                    created_at?: string
                }
                Update: {
                    id?: string
                    order_id?: string
                    product_id?: string
                    quantity?: number
                    unit_price?: number
                    subtotal?: number
                    created_at?: string
                }
            }
            shipments: {
                Row: {
                    id: string
                    order_id: string
                    courier: string
                    tracking_code: string | null
                    status: 'pending' | 'picked_up' | 'in_transit' | 'delivered' | 'failed'
                    estimated_delivery: string | null
                    shipped_at: string | null
                    delivered_at: string | null
                    kiriminaja_order_id: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    order_id: string
                    courier: string
                    tracking_code?: string | null
                    status?: 'pending' | 'picked_up' | 'in_transit' | 'delivered' | 'failed'
                    estimated_delivery?: string | null
                    shipped_at?: string | null
                    delivered_at?: string | null
                    kiriminaja_order_id?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    order_id?: string
                    courier?: string
                    tracking_code?: string | null
                    status?: 'pending' | 'picked_up' | 'in_transit' | 'delivered' | 'failed'
                    estimated_delivery?: string | null
                    shipped_at?: string | null
                    delivered_at?: string | null
                    kiriminaja_order_id?: string | null
                    created_at?: string
                }
            }
            memberships: {
                Row: {
                    id: string
                    user_id: string
                    tier: 'bronze' | 'silver' | 'gold'
                    points: number
                    member_since: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    tier?: 'bronze' | 'silver' | 'gold'
                    points?: number
                    member_since?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    tier?: 'bronze' | 'silver' | 'gold'
                    points?: number
                    member_since?: string
                }
            }
            instagram_posts: {
                Row: {
                    id: string
                    store_id: string
                    product_id: string | null
                    caption: string | null
                    image_url: string | null
                    ig_post_id: string | null
                    status: 'draft' | 'published' | 'failed'
                    scheduled_at: string | null
                    published_at: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    store_id: string
                    product_id?: string | null
                    caption?: string | null
                    image_url?: string | null
                    ig_post_id?: string | null
                    status?: 'draft' | 'published' | 'failed'
                    scheduled_at?: string | null
                    published_at?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    store_id?: string
                    product_id?: string | null
                    caption?: string | null
                    image_url?: string | null
                    ig_post_id?: string | null
                    status?: 'draft' | 'published' | 'failed'
                    scheduled_at?: string | null
                    published_at?: string | null
                    created_at?: string
                }
            }
            ai_sessions: {
                Row: {
                    id: string
                    user_id: string
                    messages: Json
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    messages?: Json
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    messages?: Json
                    created_at?: string
                    updated_at?: string
                }
            }
        }
        Views: Record<string, never>
        Functions: Record<string, never>
        Enums: Record<string, never>
    }
}
