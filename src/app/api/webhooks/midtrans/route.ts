import { NextResponse } from 'next/server'

// POST: Midtrans webhook notification
export async function POST(request: Request) {
    try {
        const body = await request.json()

        // In production, verify the signature hash with Midtrans server key
        const { order_id, transaction_status, fraud_status } = body

        if (!order_id) {
            return NextResponse.json({ error: 'Missing order_id' }, { status: 400 })
        }

        // Map Midtrans statuses to our order statuses
        let newStatus: string | null = null

        if (transaction_status === 'capture' || transaction_status === 'settlement') {
            if (fraud_status === 'accept' || !fraud_status) {
                newStatus = 'paid'
            }
        } else if (transaction_status === 'pending') {
            newStatus = 'pending'
        } else if (
            transaction_status === 'deny' ||
            transaction_status === 'cancel' ||
            transaction_status === 'expire'
        ) {
            newStatus = 'cancelled'
        } else if (transaction_status === 'refund' || transaction_status === 'partial_refund') {
            newStatus = 'refunded'
        }

        if (newStatus) {
            // Update order status via Supabase
            // In production, use adminSupabase to bypass RLS
            const { getAdminSupabase } = await import('@/lib/supabase/admin')
            const admin = getAdminSupabase()

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (admin as any)
                .from('orders')
                .update({ status: newStatus })
                .eq('id', order_id)

            // TODO: Send email notifications on payment success
        }

        return NextResponse.json({ message: 'OK' })
    } catch {
        return NextResponse.json({ error: 'Webhook error' }, { status: 500 })
    }
}
