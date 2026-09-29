# Auth email setup — SMTP, templates, redirect URLs

All of this lives in the Supabase project, not in the repo. It can be applied
two ways:

- **`npm run auth:setup`** — one command, does everything below (recommended).
- **By hand** in the dashboard, if you'd rather click. Section 5 lists the
  equivalent fields.

> **Never commit SMTP credentials.** They go in `scripts/.env.auth.local`, which
> is git-ignored. An SMTP password in git history is a mail-relay takeover —
> attackers use them to send phishing that passes your domain's SPF/DKIM checks.

---

## 1. Automated setup

```bash
cp scripts/.env.auth.example scripts/.env.auth.local
```

Fill in `scripts/.env.auth.local`:

| Variable | Where it comes from |
|---|---|
| `SUPABASE_ACCESS_TOKEN` | https://supabase.com/dashboard/account/tokens — starts with `sbp_` |
| `SUPABASE_PROJECT_REF` | optional; defaults to the linked project |
| `SITE_URL` | `https://siddhivinayakoverseas.com` |
| `SMTP_HOST` / `SMTP_PORT` | your mail provider's outgoing server, port `587` |
| `SMTP_USER` / `SMTP_PASS` | the mailbox and its password (or **app password**) |
| `SMTP_SENDER_EMAIL` / `SMTP_SENDER_NAME` | the From address and display name |

Then:

```bash
npm run auth:check
```

```bash
npm run auth:setup -- --dry-run
```

```bash
npm run auth:setup
```

`auth:setup` writes SMTP settings, the Site URL, the redirect allowlist, a
1-hour link expiry, and both HTML templates in this folder. It is safe to re-run:
every run replaces the same fields. Re-run it whenever a template here changes.

---

## 2. Why the reset link used to land on the home page

Three separate causes. All three are now handled.

### Cause A — the redirect URL was not allowlisted

Supabase only honours a `redirectTo` that appears in its allowlist. If it does
not match, Supabase silently substitutes the **Site URL** — the home page. No
error is shown. `auth:setup` writes the allowlist, so this cannot drift.

### Cause B — the app sent a hash URL (fixed in code)

`ForgotPasswordPage.tsx` used to request `${origin}/#/auth/reset-password`.
That is HashRouter syntax, but the app runs **BrowserRouter**, so the route
never matched. It also broke the token: the client uses `flowType: "pkce"`, so
Supabase appends `?code=…`, and with a `#` already in the URL the code landed
inside the fragment where `detectSessionInUrl` cannot see it.

### Cause C — the mail scanner spent the token first (fixed in the template)

Corporate mail filters, antivirus, and link-preview bots open links before the
recipient does. Recovery links are **single-use**, so the token was already
consumed by the time the person clicked — and Supabase's `/auth/v1/verify`
endpoint responds to a spent token by redirecting to the Site URL. Home page
again, with no explanation.

The template no longer uses `{{ .ConfirmationURL }}`. It links straight to:

```
{{ .SiteURL }}/auth/reset-password?token_hash={{ .TokenHash }}&type=recovery
```

`ResetPasswordPage.tsx` calls `verifyOtp()` with that token itself, so the
verify-and-redirect hop is gone. A spent or expired token now shows *"This link
is no longer valid"* on the reset page, with a button to request a new one,
instead of dumping the user on the home page.

The page also still accepts `?code=` (PKCE) and `#access_token=` (implicit)
links, so older mails already in someone's inbox keep working.

---

## 3. SMTP

Until custom SMTP is configured, Supabase sends auth mail from its own shared
service, which is **rate limited to a handful of messages per hour** and is not
intended for production. That alone looks like "password reset is broken": the
request succeeds, the mail never arrives.

Notes that cause most failures:

- **Google Workspace and Zoho need an app password**, not the account password,
  when 2FA is on. The normal password is rejected.
- **Amazon SES starts in sandbox mode** and will only send to verified
  addresses until you request production access.
- Use a `no-reply@` mailbox that actually exists. Some providers reject mail
  from an address with no mailbox behind it.
- Port `587` (STARTTLS) is the default. Use `465` only if your host requires it.

### Deliverability

Without these, reset mail lands in spam or is rejected outright. Set them in
your DNS:

- **SPF** — one TXT record at the root, including your provider. Never publish
  two SPF records; merge them.
- **DKIM** — the CNAME or TXT records your provider gives you.
- **DMARC** — start at `v=DMARC1; p=none; rua=mailto:you@siddhivinayakoverseas.com`
  and tighten to `p=quarantine` once reports look clean.

---

## 4. Templates

| File | Supabase template | Subject set by `auth:setup` |
|---|---|---|
| `reset-password.html` | Reset Password | `Reset your Siddhivinayak Overseas password` |
| `confirm-signup.html` | Confirm signup | `Confirm your email address` |

There is no separate "forgot password" template. The forgot-password page calls
`resetPasswordForEmail()`, which sends the **Reset Password** template — that
one file covers the whole flow.

`reset-password.html` must keep `{{ .SiteURL }}` and `{{ .TokenHash }}`;
`confirm-signup.html` must keep `{{ .ConfirmationURL }}`. `auth:setup` refuses
to upload a template that has lost them.

---

## 5. Doing it by hand instead

**Authentication → URL Configuration**

| Field | Value |
|---|---|
| Site URL | `https://siddhivinayakoverseas.com` |
| Redirect URLs | `https://siddhivinayakoverseas.com/auth/reset-password` |
| Redirect URLs | `https://siddhivinayakoverseas.com/reset-password` |
| Redirect URLs | `https://siddhivinayakoverseas.com/auth/callback` |
| Redirect URLs | `https://siddhivinayakoverseas.com/login` |
| Redirect URLs | `http://localhost:5001/**` *(local development only)* |

Add each as its own entry. Delete any older `…/#/auth/reset-password` entry.

**Authentication → Emails → SMTP Settings → Enable custom SMTP**, then fill in
the same values as `scripts/.env.auth.local`, with Minimum interval `60`.

**Authentication → Emails**, pick each template, switch the body to HTML/source
view, paste the file from this folder, save.

---

## 6. Test it

1. Go to `/forgot-password` on the deployed site and submit a real address.
2. The mail should arrive within about a minute. If not, check
   **Authentication → Logs** for the SMTP error.
3. Open the link. The address bar should read
   `…/auth/reset-password?token_hash=…`, and the page should show the
   new-password form.
4. Set a password, then sign in with it.
5. Open the same link a **second** time. It should say "This link is no longer
   valid" — recovery links are single-use. Landing on the home page instead
   means the deployed build predates this fix.
