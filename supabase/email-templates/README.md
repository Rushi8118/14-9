# Auth email setup — SMTP, templates, redirect URLs

Everything here is configured in the **Supabase dashboard**, not in this repo.
`supabase/config.toml` is empty, so this project is dashboard-managed: there is
no local file that sets SMTP or email templates. These HTML files are kept in
git so the templates are reviewable and restorable, but they have to be pasted
into the dashboard to take effect.

> **Never put SMTP credentials in this repo, in a chat, or in `.env`.**
> They are typed directly into the Supabase dashboard and stored there. An SMTP
> password in git history is a mail-relay takeover — attackers use them to send
> phishing that passes your domain's SPF/DKIM checks.

---

## 1. Why the reset link currently lands on the home page

Two separate causes. **Both** must be fixed or the flow stays broken.

### Cause A — the redirect URL was not allowlisted (dashboard)

Supabase only honours a `redirectTo` value that appears in its allowlist. If it
does not match, Supabase silently substitutes the **Site URL** — which is the
home page. No error is shown; the user just arrives at `/` with no form.

Go to **Authentication → URL Configuration** and set:

| Field | Value |
|---|---|
| Site URL | `https://siddhivinayakoverseas.com` |
| Redirect URLs | `https://siddhivinayakoverseas.com/auth/reset-password` |
| Redirect URLs | `https://siddhivinayakoverseas.com/reset-password` |
| Redirect URLs | `https://siddhivinayakoverseas.com/auth/callback` |
| Redirect URLs | `http://localhost:5001/**` *(local development only)* |

Add each as its own entry. If an older `…/#/auth/reset-password` entry is
present, delete it — that form is what broke the flow.

### Cause B — the app sent a hash URL (code, fixed)

`ForgotPasswordPage.tsx` requested `${origin}/#/auth/reset-password`. That is
HashRouter syntax, but the app runs **BrowserRouter**, so the route never
matched and the page rendered the home page.

It also broke the token. The client uses `flowType: "pkce"`
(`src/lib/supabase/client.ts`), so Supabase appends `?code=…` to the redirect
URL. With a `#` already in it, the code lands *inside* the fragment,
`window.location.search` is empty, and `detectSessionInUrl` finds nothing to
exchange — so even reaching the page would not have produced a session.

Fixed to `${origin}/auth/reset-password`. **This fix must be deployed** before
the flow works in production.

---

## 2. SMTP

Until custom SMTP is configured, Supabase sends auth mail from its own shared
service, which is **rate limited to a handful of messages per hour** and is not
intended for production. That alone can look like "password reset is broken":
the request succeeds, the mail never arrives.

**Authentication → Emails → SMTP Settings → Enable custom SMTP.**

| Field | What to enter |
|---|---|
| Sender email | `no-reply@siddhivinayakoverseas.com` |
| Sender name | `Siddhivinayak Overseas` |
| Host | your mail provider's SMTP host |
| Port | `587` (STARTTLS) — preferred. `465` if the host requires implicit TLS |
| Username | usually the full mailbox address |
| Password | typed directly into the dashboard, nowhere else |
| Minimum interval | `60` seconds |

Common hosts, for reference — confirm against your own provider's panel:

| Provider | Host | Port |
|---|---|---|
| Hostinger | `smtp.hostinger.com` | 587 |
| Zoho Mail | `smtp.zoho.in` | 587 |
| Google Workspace | `smtp.gmail.com` | 587 |
| Microsoft 365 | `smtp.office365.com` | 587 |
| Amazon SES | `email-smtp.<region>.amazonaws.com` | 587 |
| Brevo | `smtp-relay.brevo.com` | 587 |

Notes that cause most failures:

- **Google Workspace and Zoho need an app password**, not the account password,
  when 2FA is on. The normal password is rejected.
- **Amazon SES starts in sandbox mode** and will only send to verified
  addresses until you request production access.
- Use a `no-reply@` mailbox that exists. Some providers reject mail from an
  address with no real mailbox behind it.

### Deliverability

Without these, reset mail lands in spam or is rejected outright. Set them in
your DNS:

- **SPF** — one TXT record at the root, including your provider. Never publish
  two SPF records; merge them.
- **DKIM** — the CNAME or TXT records your provider gives you.
- **DMARC** — start at `v=DMARC1; p=none; rua=mailto:you@siddhivinayakoverseas.com`
  and tighten to `p=quarantine` once reports look clean.

---

## 3. Templates

**Authentication → Emails**, pick the template, switch the body to HTML/source
view, paste the file, save.

| File | Template |
|---|---|
| `reset-password.html` | Reset Password |
| `confirm-signup.html` | Confirm signup |

There is no separate "forgot password" template. The forgot-password page calls
`resetPasswordForEmail()`, which sends the **Reset Password** template — that
one file covers the whole flow.

Suggested subject lines:

- Reset Password → `Reset your Siddhivinayak Overseas password`
- Confirm signup → `Confirm your email address`

Keep `{{ .ConfirmationURL }}` exactly as written. Supabase substitutes it at
send time; editing or URL-encoding it breaks the link.

---

## 4. Test it

1. Go to `/forgot-password` on the deployed site and submit a real address.
2. The mail should arrive within about a minute. If not, check
   **Authentication → Logs** in the dashboard for the SMTP error.
3. Open the link. The address bar should read
   `…/auth/reset-password?code=…` — if it reads `…/#/…` or drops you on the
   home page, the fix is not deployed or the redirect URL is not allowlisted.
4. The page should show the new-password form, not "This link has expired".
5. Set a password, then sign in with it.

Worth confirming once: open the link a **second** time. It should show
"This link has expired" rather than a form — recovery links are single-use.
