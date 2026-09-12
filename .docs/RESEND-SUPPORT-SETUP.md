# support@pallettai.org — Resend setup (do this on your end)

The site side is already done: every support link points at
`mailto:support@pallettai.org`, there is no support form, and the support page's
CSP is `form-action 'none'` (so no form can post from it). Nothing below needs a
site redeploy except the optional copy change at the end.

Domain: **pallettai.org**
Desired address: **support@pallettai.org**

---

## 0. Decide which model you want (do this first)

Resend is a sending service first; receiving is a separate feature driven by an
MX record plus a webhook. Because `pallettai.org` already has a working mailbox
(`pallettai@proton.me`), the MX record matters — **email is only delivered to the
MX record with the lowest priority**, so adding Resend's MX alongside an existing
provider either silently receives nothing or hijacks your normal mail.

Pick one:

| | Model | What `support@` is | Effort |
|---|---|---|---|
| **A** | **Alias in your current mail host** (recommended) | A real mailbox/alias. Resend is used only to *send* replies from the domain | 10 min, no MX risk |
| **B** | **Resend Receiving on a subdomain** | `support@inbound.pallettai.org` caught by Resend, forwarded into your inbox by webhook | ~30 min, needs a worker |
| **C** | **Resend Receiving on the root domain** | `support@pallettai.org` caught by Resend (moves the domain's MX to Resend) | Only if you don't need the existing inbox |

Most small studios want **A + Resend for sending**, then move to **B** later if
they want auto-ticketing. Do not do **C** if you still read mail at
`pallettai@proton.me` on the same domain.

---

## 1. Verify the sending domain in Resend (needed for A and B)

1. Resend Dashboard → **Domains** → **Add Domain** → enter `pallettai.org`
   (or a subdomain like `mail.pallettai.org` if you'd rather keep sending
   separate — the site copy uses the bare domain, so add the bare domain).
2. Choose a region close to you (e.g. `eu-west-1`).
3. Copy the DNS records Resend shows — typically:
   - `MX` record for the **Return-Path / send** subdomain (e.g. `send.pallettai.org`) → `feedback-smtp.<region>.amazonses.com`, priority 10
   - `TXT` **SPF** on the same host → `v=spf1 include:amazonses.com ~all`
   - `TXT` **DKIM** → `resend._domainkey.pallettai.org` with the `p=...` public key
   - optionally `TXT` **DMARC** → `_dmarc.pallettai.org` = `v=DMARC1; p=none; rua=mailto:support@pallettai.org`
   > Always copy the exact values from your dashboard — the hostnames vary by
   > region and by whether you added a root domain or a subdomain.
4. Click **Verify DNS Records**. Propagation is usually minutes but can take up
   to 72h. Use **Restart verification** if it stalls, and `dig` to confirm:
   ```
   dig +short TXT resend._domainkey.pallettai.org
   dig +short TXT send.pallettai.org
   ```
5. Create an API key: **API Keys → Create** → permission **Sending access**,
   limited to `pallettai.org`. Store it as `RESEND_API_KEY` in your server env
   (never in the website repo — it is a static site and anything in it is public).

You can now send **from** `support@pallettai.org` with:

```
POST https://api.resend.com/emails
Authorization: Bearer $RESEND_API_KEY
{ "from": "PallettAi Support <support@pallettai.org>",
  "to": "customer@example.com", "subject": "...", "text": "..." }
```

---

## 2A. Alias model — receive on `support@pallettai.org`

In your current mail provider (Proton, Google Workspace, Fastmail…):

1. Add an address/alias **`support@pallettai.org`** (Proton: *Settings →
   Addresses → Add address*; catch-all also works).
2. Point it at whoever handles support, or forward it to a shared inbox.
3. Set the alias's **send-as** identity so replies leave from
   `support@pallettai.org`, not a personal address.
4. Send a test to `support@pallettai.org` from an outside account and confirm it
   lands. Then reply and confirm the From line is right.

Optional later upgrade: instead of replying by hand, use the Resend Receiving +
webhook flow in 2B to pipe mail into a queue or your app.

---

## 2B. Resend Receiving model (subdomain, won't disturb existing mail)

1. Resend Dashboard → **Domains → pallettai.org → Receiving → enable**.
2. Copy the receiving **MX record** it shows.
3. Add it in DNS on a **subdomain**, e.g. `inbound.pallettai.org`:
   ```
   inbound.pallettai.org.  MX  10  <value shown in the dashboard>
   ```
   Do **not** add it to the root unless you intend to move all mail here.
   It must be the **lowest priority** for whichever host you choose, or nothing
   is delivered.
4. Click **I've added the record** and wait for the receiving record to show as
   **verified** (usually minutes).
5. **Create a webhook** for the `email.received` event pointing at your endpoint:
   ```js
   // minimal Cloudflare Worker / Node handler
   export default {
     async fetch(req, env) {
       const evt = await req.json();               // { type: "email.received", data: {...} }
       if (evt.type !== "email.received") return new Response("ok");
       // 1. fetch the body: GET https://api.resend.com/emails/receiving/{id}
       // 2. forward to the team inbox, or store as a ticket
       await fetch("https://api.resend.com/emails", {
         method: "POST",
         headers: {
           Authorization: `Bearer ${env.RESEND_API_KEY}`,
           "Content-Type": "application/json"
         },
         body: JSON.stringify({
           from: "PallettAi Support <support@inbound.pallettai.org>",
           to: "you@example.com",
           reply_to: evt.data.from,
           subject: `[support] ${evt.data.subject || "(no subject)"}`,
           text: evt.data.text || "(see attached)"
         })
       });
       return new Response("ok");
     }
   };
   ```
6. Verify the webhook signature (`svix-*` headers) before acting on the payload —
   Resend signs webhook deliveries; an unverified endpoint is an open relay.
7. Send a test to your receiving address and confirm it appears under
   **Emails → Receiving** in the dashboard.

If you want customers to write to the bare `support@pallettai.org` while using
this model, add a forwarding rule in your existing mailbox:
`support@pallettai.org → support@inbound.pallettai.org` (or straight to the SMTP
host from the receiving MX record).

---

## 3. Smoke test

1. Send from an external account (Gmail/Proton) to the support address with a
   real subject and body.
2. Confirm it arrives somewhere a human actually reads.
3. Reply and check: the customer sees `support@pallettai.org`, the message is
   not marked as spam, and SPF/DKIM pass (Gmail "Show original" → all PASS).
   A DKIM failure means the TXT record host or key is wrong — re-copy it from
   the dashboard.
4. Send a test from your own app/server and confirm it lands in the inbox, not
   the spam folder. If it spam-folders, the usual causes are DMARC missing,
   the Return-Path MX not verified, or a link-heavy first send.

---

## 4. Things to keep aligned if anything changes

- Site copy is centralised on the support address `support@pallettai.org`:
  `support.html`, `index.html` (contact block + JSON-LD), `privacy.html`,
  `terms.html`, `404.html`, and the fallback error string in `terminal.js`.
  Change them together, or the 48-hour promise contradicts itself.
- Response promises on the site: **support within 48 hours**, **new project
  enquiries within 24 hours**. If the inbox can't hold that, soften the copy on
  `support.html` before launch.
- Secrets: `RESEND_API_KEY` lives only in server/worker env vars. This repo is a
  static site — anything committed to it is public.
