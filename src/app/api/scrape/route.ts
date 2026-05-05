import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { rateLimit } from '@/utils/ratelimit';
import { z } from 'zod';
import demoLeads from '@/data/demoLeads.json';

const StartSchema = z.object({
  action: z.literal('start'),
  jobName: z.string().min(1).max(200),
  location: z.string().min(1).max(200),
  maxLeads: z.number().int().min(1).max(500).optional(),
});

const StatusSchema = z.object({
  action: z.literal('status'),
  runId: z.string().min(1).max(100),
  jobName: z.string().min(1).max(200),
  location: z.string().min(1).max(200),
  maxLeadsRequested: z.number().int().min(1).max(500).optional(),
});

const RequestSchema = z.discriminatedUnion('action', [StartSchema, StatusSchema]);

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rawBody = await request.json();
    const parsed = RequestSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request parameters' }, { status: 400 });
    }

    const body = parsed.data;

    if (body.action === 'start') {
      const { jobName, location, maxLeads } = body;

      // Check user's subscription tier to apply correct lead limits
      let limit = 5;
      let hourlyLimit = 30; // Standard hourly rate limit
      
      const { data: subs } = await supabase
        .from('subscriptions')
        .select('plan_name')
        .eq('user_id', user.id)
        .eq('status', 'active');

      if (subs && subs.length > 0) {
        const plans = subs.map(s => s.plan_name);
        if (plans.includes('Scale')) { limit = 500; hourlyLimit = 500; }
        else if (plans.includes('Growth')) { limit = 100; hourlyLimit = 100; }
        else if (plans.includes('Basic')) { limit = 50; hourlyLimit = 50; }
      }

      // Anti-spam measure: only throttle the initiation of new jobs
      const { success: withinLimit } = rateLimit(`scrape:${user.id}`, hourlyLimit, 60 * 60 * 1000);
      if (!withinLimit) {
        return NextResponse.json({ error: 'Rate limit exceeded. Please try again later.' }, { status: 429 });
      }

      // 2. Get API Key
      let apifyApiKey = process.env.APIFY_API_KEY;
      let isDemoMode = true;

      const { data: profile } = await supabase
        .from('profiles')
        .select('apify_key')
        .eq('id', user.id)
        .maybeSingle();

      if (profile?.apify_key && profile.apify_key.trim() !== '') {
        apifyApiKey = profile.apify_key.trim();
        isDemoMode = false;
      }

      // Simulation logic: allows users to experience the full UI flow without a live Apify key
      let finalLimit = Math.min(maxLeads || 5, limit);
      if (isNaN(finalLimit) || finalLimit < 1) finalLimit = 5;

      if (isDemoMode) {
        return NextResponse.json({ status: 'DEMO', isDemo: true, runId: 'demo', maxLeadsRequested: finalLimit });
      }

      // 3. Start Apify Run
      const actorId = process.env.APIFY_ACTOR_ID?.replace('/', '~');

      const response = await fetch(`https://api.apify.com/v2/acts/${actorId}/runs?token=${apifyApiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          searchStringsArray: [`${jobName} in ${location}`],
          maxResults: finalLimit,
          includeReviews: false,
          includeImages: false,
          includeWebsites: true,
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || 'Apify failed to start');
      }

      return NextResponse.json({ status: 'RUNNING', runId: result.data.id, maxLeadsRequested: finalLimit });
    }

    if (body.action === 'status') {
      const { runId, jobName, location } = body;
      const maxLeadsToReturn = body.maxLeadsRequested || 5;

      if (runId === 'demo') {
        await new Promise(resolve => setTimeout(resolve, 1500));
        const demoData = demoLeads as any;
        const industryLeads = demoData[jobName] || demoData["Real Estate"];
        
        // Loop through demo data to match the requested lead count exactly
        const processedLeads = [];
        for (let i = 0; i < maxLeadsToReturn; i++) {
          const lead = industryLeads[i % industryLeads.length];
          processedLeads.push({
            ...lead,
            "Address": `${lead.Address}, ${location}`
          });
        }
        
        const orderId = await saveOrder(user.id, `(DEMO) ${jobName} in ${location}`, processedLeads);
        return NextResponse.json({ status: 'SUCCEEDED', leads: processedLeads, orderId, isDemo: true });
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('apify_key')
        .eq('id', user.id)
        .maybeSingle();

      const apifyApiKey = profile?.apify_key?.trim() || process.env.APIFY_API_KEY;

      const statusResponse = await fetch(`https://api.apify.com/v2/actor-runs/${runId}?token=${apifyApiKey}`);
      const statusJson = await statusResponse.json();
      const statusData = statusJson.data || statusJson;

      if (statusData?.status === 'SUCCEEDED') {
        const datasetId = statusData.defaultDatasetId;
        const resultsResponse = await fetch(`https://api.apify.com/v2/datasets/${datasetId}/items?token=${apifyApiKey}`);
        const results = await resultsResponse.json();

        const rawResults = Array.isArray(results) ? results : (results.data || []);
        const processedLeads = rawResults.slice(0, maxLeadsToReturn).map((lead: any) => {
          let addressStr = lead.address;
          if (typeof lead.address === 'object' && lead.address !== null) {
            addressStr = Object.values(lead.address).filter(Boolean).join(', ');
          }
          return {
            "Company Name": lead.title || lead.companyName || 'N/A',
            "Category / Industry": lead.categoryName || 'N/A',
            "Website": lead.website || 'N/A',
            "Phone": lead.phone || 'N/A',
            "Address": addressStr || lead.location || 'N/A'
          };
        });

        const orderId = await saveOrder(user.id, `${jobName} in ${location}`, processedLeads);
        return NextResponse.json({ status: 'SUCCEEDED', leads: processedLeads, orderId });
      }

      if (['FAILED', 'ABORTED', 'TIMED-OUT'].includes(statusData?.status || '')) {
        return NextResponse.json({ status: 'FAILED', error: 'Scraping job failed. Please try again.' });
      }

      return NextResponse.json({ status: statusData?.status || 'RUNNING' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    let message = 'An error occurred while processing your request.';
    if (error.message?.includes('token is not valid') || error.message?.includes('User was not found')) {
      message = 'Invalid Apify API Key. Please check your Settings.';
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function saveOrder(userId: string, query: string, leads: any[]) {
  try {
    const supabase = await createClient();
    
    // Generate the next JOB-XXXX ID based on total history count
    const { count } = await supabase
      .from('jobs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    const nextJobNumber = (count || 0) + 1;
    const orderId = `JOB-${nextJobNumber.toString().padStart(4, '0')}`;

    const { error } = await supabase
      .from('jobs')
      .insert({
        user_id: userId,
        job_id: orderId,
        query: query,
        leads_count: leads.length,
        status: 'Completed',
        date: new Date().toLocaleDateString(),
        data: leads
      });

    if (error) throw error;
    return orderId;
  } catch (error) {
    console.error('Database error in saveOrder:', error);
    // Fallback: return a temporary ID so the user session isn't blocked if DB insert fails
    return `JOB-${Date.now().toString().slice(-4)}`;
  }
}
