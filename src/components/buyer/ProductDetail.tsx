"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useCartStore } from "@/store/cartStore";
import { formatPrice } from "@/lib/utils";
import {
  ShoppingCart,
  Minus,
  Plus,
  Store,
  MapPin,
  Check,
  Star,
  Heart,
  Share2,
  Truck,
  ShieldCheck,
  MessageCircle,
} from "lucide-react";
import { toast } from "sonner";

interface ProductDetailProps {
  product: {
    id: string;
    name: string;
    description: string | null;
    price: number;
    stock: number;
    weight_gram: number;
    status: string;
    product_images: {
      id: string;
      url: string;
      is_primary: boolean;
      sort_order: number;
    }[];
    stores: {
      id: string;
      name: string;
      slug: string;
      logo_url: string | null;
      description: string | null;
      address: string | null;
    };
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  recommendations?: any[];
  sellerPhone?: string | null;
}

export function ProductDetail({
  product,
  recommendations = [],
  sellerPhone,
}: ProductDetailProps) {
  const router = useRouter();
  const [selectedImage, setSelectedImage] = useState(0);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const addItem = useCartStore((s) => s.addItem);

  const sortedImages = [...product.product_images].sort((a, b) => {
    if (a.is_primary) return -1;
    if (b.is_primary) return 1;
    return a.sort_order - b.sort_order;
  });

  function handleAddToCart() {
    addItem({
      product_id: product.id,
      name: product.name,
      price: product.price,
      quantity: qty,
      image_url: sortedImages[0]?.url || "",
      weight_gram: product.weight_gram || 1000,
      store_id: product.stores.id,
    });
    setAdded(true);
    toast.success("Ditambahkan ke keranjang!");
    setTimeout(() => setAdded(false), 2000);
  }

  function handleBuyNow() {
    addItem({
      product_id: product.id,
      name: product.name,
      price: product.price,
      quantity: qty,
      image_url: sortedImages[0]?.url || "",
      weight_gram: product.weight_gram || 1000,
      store_id: product.stores.id,
    });
    router.push("/checkout");
  }

  function handleShare() {
    if (navigator.share) {
      navigator
        .share({
          title: product.name,
          url: window.location.href,
        })
        .catch(console.error);
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link disalin ke clipboard");
    }
  }

  const waLink = sellerPhone
    ? `https://wa.me/${sellerPhone.replace(/[^0-9]/g, "").replace(/^0/, "62")}?text=${encodeURIComponent(`Halo Kak, saya tertarik dengan produk ${product.name} yang ada di TokoBLITAR. Apakah masih tersedia?`)}`
    : "#";

  return (
    <main className="min-h-screen bg-gray-50 pb-20">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-2">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="aspect-square overflow-hidden rounded-xl border bg-white shadow-sm">
              {sortedImages.length > 0 ? (
                <img
                  src={sortedImages[selectedImage]?.url}
                  alt={product.name}
                  className="h-full w-full object-contain"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <ShoppingCart className="h-20 w-20 text-gray-200" />
                </div>
              )}
            </div>
            {sortedImages.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
                {sortedImages.map((img, i) => (
                  <button
                    key={img.id}
                    onClick={() => setSelectedImage(i)}
                    className={`h-20 w-20 shrink-0 overflow-hidden rounded-lg border-2 transition-all hover:opacity-80 ${
                      i === selectedImage
                        ? "border-blue-500 shadow-md transform scale-[1.02]"
                        : "border-transparent"
                    }`}
                    style={
                      i === selectedImage
                        ? { borderColor: "var(--color-tb-primary)" }
                        : undefined
                    }
                  >
                    <img
                      src={img.url}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold lg:text-3xl text-gray-900 leading-tight">
                    {product.name}
                  </h1>
                  <div className="mt-2.5 flex items-center gap-2">
                    <div className="flex items-center text-yellow-400">
                      <Star className="h-4 w-4 fill-current" />
                      <Star className="h-4 w-4 fill-current" />
                      <Star className="h-4 w-4 fill-current" />
                      <Star className="h-4 w-4 fill-current" />
                      <Star className="h-4 w-4 fill-current text-yellow-200" />
                    </div>
                    <span className="text-sm font-bold text-gray-700">4.8</span>
                    <span className="text-sm text-gray-500 hover:underline cursor-pointer">
                      (124 ulasan)
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-full text-gray-400 hover:text-red-500 transition-colors shadow-sm"
                  >
                    <Heart className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-full text-gray-400 hover:text-blue-500 transition-colors shadow-sm"
                    onClick={handleShare}
                  >
                    <Share2 className="h-5 w-5" />
                  </Button>
                </div>
              </div>
              <p
                className="mt-4 text-3xl font-extrabold tracking-tight"
                style={{ color: "var(--color-tb-primary)" }}
              >
                {formatPrice(product.price)}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm bg-gray-100/80 px-4 py-2.5 rounded-lg w-fit">
              <span className="text-gray-600">
                Stok: <strong className="text-gray-900">{product.stock}</strong>
              </span>
              <div className="h-1 w-1 rounded-full bg-gray-300" />
              <span className="text-gray-600">
                Berat:{" "}
                <strong className="text-gray-900">
                  {product.weight_gram}g
                </strong>
              </span>
            </div>

            {/* Qty + Action Buttons */}
            <div className="flex flex-col gap-3 pt-2">
              <div className="flex items-center gap-4">
                <div className="flex items-center rounded-lg border h-12 bg-white shadow-sm">
                  <button
                    className="px-4 h-full hover:bg-gray-50 rounded-l-lg border-r transition-colors"
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                  >
                    <Minus className="h-4 w-4 text-gray-600" />
                  </button>
                  <span className="w-14 text-center text-sm font-bold text-gray-800">
                    {qty}
                  </span>
                  <button
                    className="px-4 h-full hover:bg-gray-50 rounded-r-lg border-l transition-colors"
                    onClick={() =>
                      setQty((q) => Math.min(product.stock, q + 1))
                    }
                  >
                    <Plus className="h-4 w-4 text-gray-600" />
                  </button>
                </div>
                <Button
                  size="lg"
                  variant="outline"
                  className="flex-1 h-12 text-base font-bold transition-all shadow-sm bg-white"
                  style={{
                    borderColor: "var(--color-tb-primary)",
                    color: "var(--color-tb-primary)",
                  }}
                  onClick={handleAddToCart}
                  disabled={product.stock === 0}
                >
                  {added ? (
                    <>
                      <Check className="mr-2 h-5 w-5" /> Ditambahkan!
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="mr-2 h-5 w-5" /> + Keranjang
                    </>
                  )}
                </Button>
              </div>
              <Button
                size="lg"
                className="w-full h-12 text-white font-bold text-base shadow-md transition-transform active:scale-[0.98] hover:opacity-90 mt-1"
                style={{ backgroundColor: "var(--color-tb-primary)" }}
                onClick={handleBuyNow}
                disabled={product.stock === 0}
              >
                Beli Langsung
              </Button>
            </div>

            <Separator className="my-2" />

            {/* Shipping Info Mock */}
            <div className="rounded-xl border bg-blue-50/40 p-5 space-y-3.5 shadow-sm">
              <div className="flex items-center gap-2 font-bold text-gray-900">
                <Truck className="h-5 w-5 text-blue-600" />
                <span>Informasi Pengiriman</span>
              </div>
              <div className="text-sm text-gray-700 flex flex-col gap-2.5">
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                  <span>
                    Dikirim dari:{" "}
                    <strong>{product.stores.address || "Kota Blitar"}</strong>
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <ShieldCheck className="h-4 w-4 text-green-600 mt-0.5" />
                  <span className="flex-1 leading-snug">
                    Didukung oleh: JNE, J&T, SiCepat, AnterAja, GoSend (Instan)
                    & GrabExpress
                  </span>
                </div>
              </div>
            </div>

            <Separator className="my-2" />

            {/* Store Info */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center rounded-xl border p-4 bg-white shadow-sm hover:border-gray-300 transition-colors">
              <Link
                href={`/store/${product.stores.slug}`}
                className="flex min-w-0 items-center gap-4 transition-opacity hover:opacity-80 flex-1 w-full"
              >
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-lg font-bold text-white overflow-hidden shadow-sm border"
                  style={{ backgroundColor: "var(--color-tb-primary)" }}
                >
                  {product.stores.logo_url ? (
                    <img
                      src={product.stores.logo_url}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    product.stores.name.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold flex items-center gap-2 text-gray-900 text-base">
                    <Store className="h-4 w-4 text-gray-500" />
                    {product.stores.name}
                  </p>
                  {product.stores.address && (
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-1 truncate">
                      {product.stores.address}
                    </p>
                  )}
                </div>
              </Link>

              {sellerPhone && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full sm:w-auto shrink-0 border-green-500 text-green-600 hover:bg-green-50 hover:text-green-700 font-bold bg-white"
                  asChild
                >
                  <a href={waLink} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Chat Penjual
                  </a>
                </Button>
              )}
            </div>

            <Separator className="my-2" />

            {/* Description */}
            {product.description && (
              <div>
                <h3 className="mb-3 font-bold text-lg text-gray-900">
                  Deskripsi Produk
                </h3>
                <p className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed font-medium">
                  {product.description}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recommendation Grid */}
      {recommendations && recommendations.length > 0 && (
        <div className="mx-auto max-w-6xl px-4 mt-12 sm:px-6">
          <Separator className="mb-10" />
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Produk Lain dari Toko Ini
            </h2>
            <Link
              href={`/store/${product.stores.slug}`}
              className="text-sm font-semibold hover:underline"
              style={{ color: "var(--color-tb-primary)" }}
            >
              Lihat Semua
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {recommendations.map((rec) => (
              <Link
                key={rec.id}
                href={`/products/${rec.id}`}
                className="group relative rounded-2xl border bg-white p-3 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
              >
                <div className="aspect-square w-full overflow-hidden rounded-xl bg-gray-50 mb-3 border">
                  {rec.product_images?.[0]?.url ? (
                    <img
                      src={rec.product_images[0].url}
                      alt={rec.name}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <Store className="h-8 w-8 text-gray-300" />
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <h3 className="line-clamp-2 text-sm font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">
                    {rec.name}
                  </h3>
                  <p
                    className="font-extrabold text-base tracking-tight"
                    style={{ color: "var(--color-tb-primary)" }}
                  >
                    {formatPrice(rec.price)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
