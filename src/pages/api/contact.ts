import type { APIRoute } from 'astro';
// Astro 6+ removed Astro.locals.runtime.env; bindings come from here.
import { env } from 'cloudflare:workers';

// The ONLY server-rendered route on the site. Everything else prerenders.
export const prerender = false;

const TURNSTILE_VERIFY = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const RESEND_SEND = 'https://api.resend.com/emails';
const MIN_FILL_MS = 3_000;
const TOPICS = ['demo', 'deploy', 'contribute', 'other'];

const redirect = (site: URL, path: string) =>
  // 303, not 302: guarantees the browser switches to GET, which kills
  // back-button resubmission of the POST.
  new Response(null, { status: 303, headers: { Location: new URL(path, site).href } });

const fail = (site: URL, kind: 'validation' | 'turnstile' | 'server') =>
  redirect(site, `/contact/error/${kind}`);

export const POST: APIRoute = async ({ request, clientAddress }) => {
  // Redirect relative to the origin the request actually arrived on, not the
  // configured `site`. On Workers the Host header is the real hostname, so
  // production still lands on librechart.org - and local dev stops bouncing
  // you to a domain that may not exist yet.
  const origin = new URL(request.url);

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return fail(origin, 'validation');
  }
  const s = (k: string) => (form.get(k) ?? '').toString().trim();

  // 1. Honeypot. Return SUCCESS, not an error - telling a bot it was caught
  //    is free intelligence for whoever wrote it.
  if (s('website')) return redirect(origin, '/contact/thanks');

  // 2. Time-to-submit floor.
  const renderedAt = Number(s('rendered_at'));
  if (!Number.isFinite(renderedAt) || Date.now() - renderedAt < MIN_FILL_MS) {
    return fail(origin, 'validation');
  }

  // 3. Field validation.
  const name = s('name');
  const email = s('email');
  const message = s('message');
  const organisation = s('organisation').slice(0, 160);
  const topic = s('topic') || 'other';
  if (
    !name || name.length > 120 ||
    !email || email.length > 254 || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) ||
    !message || message.length > 5000 ||
    !TOPICS.includes(topic)
  ) {
    return fail(origin, 'validation');
  }

  // 4. Verify Turnstile server-side. The widget alone proves nothing - a bot
  //    can skip the browser and POST here directly.
  const token = s('cf-turnstile-response');
  if (!token || !env.TURNSTILE_SECRET_KEY) {
    console.warn('turnstile: missing token or secret');
    return fail(origin, 'turnstile');
  }
  const body = new FormData();
  body.append('secret', env.TURNSTILE_SECRET_KEY);
  body.append('response', token);
  if (clientAddress) body.append('remoteip', clientAddress);
  body.append('idempotency_key', crypto.randomUUID());

  const verdict = (await fetch(TURNSTILE_VERIFY, { method: 'POST', body }).then((r) =>
    r.json(),
  )) as { success: boolean; 'error-codes'?: string[] };
  if (!verdict.success) {
    console.warn('turnstile rejected:', verdict['error-codes']);
    return fail(origin, 'turnstile');
  }

  const id = `${Date.now()}-${crypto.randomUUID()}`;
  const submission = {
    id, name, email, organisation, topic, message,
    ip: clientAddress ?? null,
    country: (request as unknown as { cf?: { country?: string } }).cf?.country ?? null,
    receivedAt: new Date().toISOString(),
  };

  // 5. Durability backstop. Store BEFORE sending, so a Resend outage cannot
  //    lose an enquiry. The binding is optional so the form works before the
  //    KV namespace exists (step A7) - but if it IS bound and the write fails,
  //    that is a real error and we say so rather than pretending.
  if (env.CONTACT_KV) {
    try {
      await env.CONTACT_KV.put(`submission:${id}`, JSON.stringify(submission), {
        expirationTtl: 60 * 60 * 24 * 365,
        metadata: { email, topic },
      });
    } catch (err) {
      console.error('KV write failed', err);
      return fail(origin, 'server');
    }
  } else {
    console.warn('CONTACT_KV not bound - submission not persisted (see step A7)');
  }

  // 6. Notify. Best-effort ONLY when KV already holds the submission;
  //    otherwise a send failure really does lose it, so surface that.
  if (!env.RESEND_API_KEY || !env.CONTACT_TO) {
    console.error('RESEND_API_KEY or CONTACT_TO not configured');
    return env.CONTACT_KV ? redirect(origin, '/contact/thanks') : fail(origin, 'server');
  }

  try {
    const res = await fetch(RESEND_SEND, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': id,
      },
      body: JSON.stringify({
        // Must be our own verified domain. Setting this to the submitter's
        // address fails DMARC and lands in spam.
        from: env.CONTACT_FROM,
        to: [env.CONTACT_TO],
        // snake_case in the raw HTTP API (the Node SDK uses replyTo).
        reply_to: `${name} <${email}>`,
        subject: `[librechart.org] ${topic} - ${name}${organisation ? ` (${organisation})` : ''}`,
        text: [
          `Name:         ${name}`,
          `Email:        ${email}`,
          `Organisation: ${organisation || '-'}`,
          `Topic:        ${topic}`,
          `Country:      ${submission.country ?? '-'}`,
          `Received:     ${submission.receivedAt}`,
          `KV key:       ${env.CONTACT_KV ? `submission:${id}` : '(not persisted)'}`,
          '',
          '---',
          '',
          message,
        ].join('\n'),
      }),
    });
    if (!res.ok) {
      console.error('resend failed', res.status, await res.text());
      if (!env.CONTACT_KV) return fail(origin, 'server');
    }
  } catch (err) {
    console.error('resend threw', err);
    if (!env.CONTACT_KV) return fail(origin, 'server');
  }

  return redirect(origin, '/contact/thanks');
};
