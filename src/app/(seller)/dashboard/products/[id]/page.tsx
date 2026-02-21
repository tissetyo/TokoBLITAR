import { createSupabaseServerClient } from '@/lib/supabase/server'
import { ProductForm } from '@/components/seller/ProductForm'
import { notFound } from 'next/navigation'

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return notFound()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: product } = await (supabase as any)
    .from('products')
    .select('*, stores!inner(user_id)')
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (!product || product.stores.user_id !== user.id) return notFound()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: categories } = await (supabase as any)
    .from('categories')
    .select('id, name')
    .order('name')

  return (
    <ProductForm
      initialData={{
        id: product.id,
        name: product.name,
        description: product.description || '',
        price: product.price,
        stock: product.stock,
        weight_gram: product.weight_gram,
        category_id: product.category_id,
        status: product.status,
      }}
      categories={categories || []}
    />
  )
}
