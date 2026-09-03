-- Create plans table
CREATE TABLE IF NOT EXISTS public.plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    duration_months INTEGER NOT NULL,
    tokens INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    payment_id VARCHAR(255),
    order_id VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL,
    plan_id UUID REFERENCES public.plans(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create RLS policies
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Plans policies (only authenticated users can read)
CREATE POLICY "Enable read access for authenticated users" ON public.plans
    FOR SELECT
    TO authenticated
    USING (is_active = true);

-- Transactions policies (users can only see their own transactions)
CREATE POLICY "Enable read access for user's own transactions" ON public.transactions
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Enable insert access for user's own transactions" ON public.transactions
    FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

-- Insert default plans
INSERT INTO public.plans (name, description, price, duration_months, tokens, is_active)
VALUES 
    ('Monthly Premium', 'Get 100 tokens per month with our monthly subscription plan', 15, 1, 100, true),
    ('Yearly Premium', 'Get 500 tokens per year with our yearly subscription plan', 50, 12, 500, true);

-- Create function to add tokens
CREATE OR REPLACE FUNCTION public.add_tokens(amount INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_tokens INTEGER;
BEGIN
    SELECT tokens_remaining INTO current_tokens FROM public.users WHERE id = auth.uid();
    RETURN COALESCE(current_tokens, 0) + amount;
END;
$$; 