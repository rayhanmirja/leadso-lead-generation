import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { rateLimit } from '@/utils/ratelimit';
import { z } from 'zod';

const PLAN_PRICES: Record<string, number> = {
  Basic: 1,
  Growth: 2,
  Scale: 3,
};

const PaymentSchema = z.object({
  planName: z.enum(['Basic', 'Growth', 'Scale']),
  amount: z.number().positive(),
});

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Prevent checkout spamming: max 5 attempts per hour per user
    const { success: withinLimit } = rateLimit(`payment:${user.id}`, 5, 60 * 60 * 1000);
    if (!withinLimit) {
      return NextResponse.json({ error: 'Too many payment attempts. Please try again later.' }, { status: 429 });
    }

    const rawBody = await request.json();
    const parsed = PaymentSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid plan or amount' }, { status: 400 });
    }

    const { planName, amount } = parsed.data;

    // Verify amount matches the expected plan price
    if (amount !== PLAN_PRICES[planName]) {
      return NextResponse.json({ error: 'Amount does not match plan price' }, { status: 400 });
    }

    const tran_id = `TRAN-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Log the transaction attempt in Supabase as 'pending'
    const { error: dbError } = await supabase
      .from('subscriptions')
      .insert({
        user_id: user.id,
        plan_name: planName,
        amount: amount,
        status: 'pending',
        tran_id: tran_id
      });

    if (dbError) {
      return NextResponse.json({ error: 'Failed to create subscription record' }, { status: 500 });
    }

    // Configure gateway credentials and environment
    const store_id = process.env.SSL_STORE_ID;
    const store_passwd = process.env.SSL_STORE_PASSWORD;
    const is_live = process.env.SSL_IS_LIVE === 'true';

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const sslData = new URLSearchParams();
    sslData.append('store_id', store_id || '');
    sslData.append('store_passwd', store_passwd || '');
    sslData.append('total_amount', amount.toString());
    sslData.append('currency', 'BDT');
    sslData.append('tran_id', tran_id);
    sslData.append('success_url', `${baseUrl}/api/payments/success`);
    sslData.append('fail_url', `${baseUrl}/api/payments/fail`);
    sslData.append('cancel_url', `${baseUrl}/api/payments/cancel`);
    sslData.append('ipn_url', `${baseUrl}/api/payments/ipn`);

    // Mandatory customer details for SSLCommerz
    sslData.append('cus_name', user.email?.split('@')[0] || 'Customer');
    sslData.append('cus_email', user.email || '');
    sslData.append('cus_add1', 'Dhaka');
    sslData.append('cus_city', 'Dhaka');
    sslData.append('cus_postcode', '1000');
    sslData.append('cus_country', 'Bangladesh');
    sslData.append('cus_phone', '01700000000');

    // Product Info
    sslData.append('shipping_method', 'NO');
    sslData.append('product_name', `Leadso ${planName} Plan`);
    sslData.append('product_category', 'SaaS');
    sslData.append('product_profile', 'non-physical-goods');

    const sslUrl = is_live
      ? 'https://securepay.sslcommerz.com/gwprocess/v4/api.php'
      : 'https://sandbox.sslcommerz.com/gwprocess/v4/api.php';

    // Environment fallback: mock activation for testing/demo where keys aren't configured
    if (!store_id || !store_passwd) {
      await supabase
        .from('subscriptions')
        .update({ status: 'active', val_id: 'MOCK_VALIDATION' })
        .eq('tran_id', tran_id);
      
      return NextResponse.json({ 
        url: `${baseUrl}/scrape?payment=success&mode=demo_activation`,
        isMock: true 
      });
    }

    const sslResponse = await fetch(sslUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: sslData.toString()
    });

    const sslResult = await sslResponse.json();

    if (sslResult.status === 'SUCCESS' && sslResult.GatewayPageURL) {
      return NextResponse.json({ url: sslResult.GatewayPageURL });
    } else {
      return NextResponse.json({
        error: 'Failed to initiate payment. Please try again later.'
      }, { status: 500 });
    }

  } catch (error: any) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
