import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  try {
    // 1. Initialize service role client (needed to update subscriptions)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SERVICE_ROLE!
    );

    const formData = await request.formData();
    const data = Object.fromEntries(formData.entries());
    const { status, tran_id, val_id } = data;

    if (!tran_id || !val_id) {
      return NextResponse.redirect(`${baseUrl}/scrape?payment=failed&reason=missing_data`, { status: 303 });
    }

    if (status !== 'VALID' && status !== 'SUCCESS') {
      return NextResponse.redirect(`${baseUrl}/scrape?payment=failed&reason=${status}`, { status: 303 });
    }

    // 2. Look up the pending subscription to verify it exists and get expected amount
    const { data: pendingSub, error: lookupError } = await supabase
      .from('subscriptions')
      .select('id, amount, status')
      .eq('tran_id', tran_id)
      .single();

    if (lookupError || !pendingSub) {
      return NextResponse.redirect(`${baseUrl}/scrape?payment=failed&reason=unknown_transaction`, { status: 303 });
    }

    // Prevent replay: only process pending subscriptions
    if (pendingSub.status !== 'pending') {
      return NextResponse.redirect(`${baseUrl}/scrape?payment=success&t=${Date.now()}`, { status: 303 });
    }

    // 3. Verify with SSLCommerz validation API
    const store_id = process.env.SSL_STORE_ID;
    const store_passwd = process.env.SSL_STORE_PASSWORD;
    const is_live = process.env.SSL_IS_LIVE === 'true';

    const validationUrl = is_live
      ? `https://securepay.sslcommerz.com/validator/api/validationserverAPI.php?val_id=${val_id}&store_id=${store_id}&store_passwd=${store_passwd}&format=json`
      : `https://sandbox.sslcommerz.com/validator/api/validationserverAPI.php?val_id=${val_id}&store_id=${store_id}&store_passwd=${store_passwd}&format=json`;

    const validationResponse = await fetch(validationUrl);
    const validationData = await validationResponse.json();

    if (validationData.status !== 'VALID' && validationData.status !== 'AUTHENTICATED') {
      return NextResponse.redirect(`${baseUrl}/scrape?payment=failed&reason=validation_failed`, { status: 303 });
    }

    // 4. Verify the paid amount matches what we expected
    const paidAmount = parseFloat(validationData.amount || '0');
    if (paidAmount < pendingSub.amount) {
      return NextResponse.redirect(`${baseUrl}/scrape?payment=failed&reason=amount_mismatch`, { status: 303 });
    }

    // 5. Verify the transaction ID matches
    if (validationData.tran_id && validationData.tran_id !== tran_id) {
      return NextResponse.redirect(`${baseUrl}/scrape?payment=failed&reason=tran_mismatch`, { status: 303 });
    }

    // 6. All checks passed — activate subscription
    const { error: dbError } = await supabase
      .from('subscriptions')
      .update({
        status: 'active',
        val_id: val_id as string
      })
      .eq('tran_id', tran_id)
      .eq('status', 'pending');

    if (dbError) {
      return NextResponse.redirect(`${baseUrl}/scrape?payment=error&details=db_fail`, { status: 303 });
    }

    return NextResponse.redirect(`${baseUrl}/scrape?payment=success&t=${Date.now()}`, { status: 303 });

  } catch (error: any) {
    return NextResponse.redirect(`${baseUrl}/scrape?payment=error&details=internal_error`, { status: 303 });
  }
}
