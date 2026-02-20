import { createClient } from '@/lib/supabase/server';
import { v4 as uuidv4 } from 'uuid';

/**
 * Wallet Service
 * Handles crypto payments and QR-based delayed release (escrow).
 */
export class WalletService {
    /**
     * Create a delayed release payment (Escrow)
     */
    async createDelayedPayment(params: {
        userId: string;
        amount: number;
        currency: string;
        recipientId: string;
        releaseCondition: 'delivery' | 'time' | 'qr_scan';
    }) {
        const supabase = await createClient();

        const paymentId = uuidv4();
        const qrCode = `pay_escrow_${paymentId}`;

        const { data, error } = await (supabase as any).from('payments').insert({
            id: paymentId,
            user_id: params.userId,
            amount: params.amount,
            currency: params.currency,
            recipient_id: params.recipientId,
            status: 'held',
            escrow_condition: params.releaseCondition,
            qr_code: qrCode,
            created_at: new Date().toISOString()
        });

        if (error) throw error;
        return { paymentId, qrCode };
    }

    /**
     * Release payment via QR Scan
     */
    async releaseByQR(qrCode: string, scannerId: string) {
        const supabase = await createClient();

        // 1. Fetch payment
        const { data: payment } = await (supabase as any)
            .from('payments')
            .select('*')
            .eq('qr_code', qrCode)
            .eq('status', 'held')
            .single();

        if (!payment) throw new Error('Invalid or already released payment');

        // 2. Release funds to recipient
        await (supabase as any).from('payments').update({
            status: 'released',
            released_at: new Date().toISOString(),
            released_by: scannerId
        } as any).eq('id', payment.id);

        return { success: true, releasedAmount: (payment as any).amount };
    }
}
