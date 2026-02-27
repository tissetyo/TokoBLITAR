import { createSupabaseServerClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { ProductDetail } from "@/components/buyer/ProductDetail";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: product } = await (supabase as any)
    .from("products")
    .select(
      "*, product_images(*), stores(id, name, slug, logo_url, description, address, user_id)",
    )
    .eq("id", id)
    .eq("status", "active")
    .is("deleted_at", null)
    .single();

  if (!product) return notFound();

  // Fetch Recommended Products (same store)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: recommendations } = await (supabase as any)
    .from("products")
    .select("*, product_images(*), stores(name, slug)")
    .eq("store_id", product.store_id)
    .eq("status", "active")
    .is("deleted_at", null)
    .neq("id", id)
    .limit(4);

  // Fetch Seller Phone
  let sellerPhone = null;
  if (product.stores?.user_id) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: seller } = await (supabase as any)
      .from("users")
      .select("phone")
      .eq("id", product.stores.user_id)
      .single();
    sellerPhone = seller?.phone || null;
  }

  return (
    <ProductDetail
      product={product}
      recommendations={recommendations || []}
      sellerPhone={sellerPhone}
    />
  );
}
