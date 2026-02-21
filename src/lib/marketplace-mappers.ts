import 'server-only'

// Product mappers for each marketplace platform
interface TokoBLITARProduct {
    id: string
    name: string
    description: string | null
    price: number
    stock: number
    weight_gram: number
    product_images: { url: string; is_primary: boolean }[]
}

// Tokopedia product schema
export function mapToTokopedia(product: TokoBLITARProduct) {
    return {
        name: product.name,
        description: product.description || '',
        price: product.price,
        stock: product.stock,
        weight: product.weight_gram,
        weight_unit: 'GR',
        status: 1, // active
        pictures: product.product_images.map((img) => ({ file_path: img.url })),
    }
}

// Shopee product schema
export function mapToShopee(product: TokoBLITARProduct) {
    return {
        item_name: product.name,
        description: product.description || '',
        original_price: product.price,
        normal_stock: product.stock,
        weight: product.weight_gram / 1000, // Shopee uses kg
        image: {
            image_url_list: product.product_images.map((img) => img.url),
        },
        item_status: 'NORMAL',
    }
}

// Lazada product schema
export function mapToLazada(product: TokoBLITARProduct) {
    return {
        Request: {
            Product: {
                PrimaryCategory: 0, // Must be set by seller
                Attributes: {
                    name: product.name,
                    short_description: product.description || '',
                },
                Skus: {
                    Sku: [{
                        price: product.price,
                        quantity: product.stock,
                        package_weight: (product.weight_gram / 1000).toFixed(2),
                        Images: {
                            Image: product.product_images.map((img) => img.url),
                        },
                    }],
                },
            },
        },
    }
}

export type { TokoBLITARProduct }
