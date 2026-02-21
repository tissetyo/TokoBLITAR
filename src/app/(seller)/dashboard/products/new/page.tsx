import { createSupabaseServerClient } from '@/lib/supabase/server'
import { ProductForm } from '@/components/seller/ProductForm'

export default async function NewProductPage() {
  const supabase = await createSupabaseServerClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: categories } = await (supabase as any)
    .from('categories')
    .select('id, name')
    .order('name')

  return <ProductForm categories={categories || []} />
}
