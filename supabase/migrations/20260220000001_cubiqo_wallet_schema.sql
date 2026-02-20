-- Cubiqo Flagship Wallet Migration
-- Supports QR-based delayed release (escrow) and commerce tracking

CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    recipient_id UUID REFERENCES auth.users(id),
    amount DECIMAL(12, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'USD',
    status VARCHAR(20) DEFAULT 'held', -- held, released, cancelled
    escrow_condition VARCHAR(50), -- qr_scan, time, delivery
    qr_code VARCHAR(255) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    released_at TIMESTAMP WITH TIME ZONE,
    released_by UUID REFERENCES auth.users(id),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_qr_code ON public.payments(qr_code);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);

-- RLS Policies
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own payments"
ON public.payments FOR SELECT
USING (auth.uid() = user_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can initiate payments"
ON public.payments FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Recipients can view QR codes for scanning"
ON public.payments FOR SELECT
USING (auth.uid() = recipient_id);
