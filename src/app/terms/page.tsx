import { LogoMark } from "@/components/icons";

const SECTIONS: { title: string; body: React.ReactNode }[] = [
  {
    title: "01 — Agreement to Terms",
    body: (
      <p style={{ margin: 0, color: "var(--text)" }}>
        By creating an account or using Ondeck (&quot;the Service&quot;), you agree to these Terms of Service. If you don&apos;t agree, please
        don&apos;t use the Service. We may update these terms from time to time; continued use after a change means you accept the update.
      </p>
    ),
  },
  {
    title: "02 — The Service",
    body: (
      <p style={{ margin: 0 }}>
        Ondeck is a job-application tracking tool: a Kanban and table pipeline, application analytics, CV storage, an AI-assisted CV builder, and
        an experimental ATS scoring feature (labeled BETA). Some features may connect to third parties you authorize, such as LinkedIn, email,
        Google, PayPal or Apple Pay.
      </p>
    ),
  },
  {
    title: "03 — Accounts & Eligibility",
    body: (
      <p style={{ margin: 0 }}>
        You must provide accurate information when signing up and keep your credentials secure. You&apos;re responsible for activity under your
        account. You must be at least 16 years old to use Ondeck.
      </p>
    ),
  },
  {
    title: "04 — Billing, Trial & Cancellation",
    body: (
      <>
        <p style={{ margin: "0 0 10px" }}>
          Ondeck offers a 14-day free trial. After the trial, continued access to analytics, CV uploads and the ATS checker requires a
          $5.00/month subscription, billed to the payment method you connect. Subscriptions renew automatically each month until cancelled.
        </p>
        <p style={{ margin: "0 0 10px" }}>
          If no payment method is connected when the trial ends, associated application data, analytics and uploaded CVs may be deleted. You can
          cancel or disconnect a payment method at any time from Profile → Billing; cancellation takes effect at the end of the current billing
          period. No refunds are issued for partial months.
        </p>
        <p style={{ margin: 0 }}>We never store your full card number — payment details are handled by our PCI-compliant payment processor.</p>
      </>
    ),
  },
  {
    title: "05 — Your Content",
    body: (
      <p style={{ margin: 0 }}>
        You retain ownership of the CVs, job descriptions and other content you upload. You grant Ondeck a limited license to process that
        content solely to provide the Service — including generating ATS scores, CV rewrite suggestions, and analytics. We do not sell your
        content.
      </p>
    ),
  },
  {
    title: "06 — AI Features",
    body: (
      <p style={{ margin: 0 }}>
        The CV builder, mock screening-call agent, and ATS breakdown use automated and AI-assisted analysis. They are decision-support tools, not
        guarantees of interview or hiring outcomes, and scores/suggestions may be inaccurate or incomplete. Always review AI-generated content
        before sending it to an employer.
      </p>
    ),
  },
  {
    title: "07 — Third-Party Integrations",
    body: (
      <p style={{ margin: 0 }}>
        Connecting LinkedIn, Google, email, PayPal or Apple Pay is optional and requires your explicit permission. We only request the access
        needed to provide the related feature (e.g., billing, sign-in, sync status), and you can disconnect any integration at any time from your
        Profile.
      </p>
    ),
  },
  {
    title: "08 — Acceptable Use",
    body: (
      <p style={{ margin: 0 }}>
        Don&apos;t use Ondeck to violate any law, misrepresent your identity, scrape or resell data, or interfere with the Service&apos;s
        operation or security.
      </p>
    ),
  },
  {
    title: "09 — Disclaimers & Liability",
    body: (
      <p style={{ margin: 0 }}>
        The Service is provided &quot;as is&quot; without warranties of any kind. To the extent permitted by law, Ondeck is not liable for
        indirect, incidental or consequential damages arising from your use of the Service, including reliance on analytics, ATS scores, or
        AI-generated suggestions.
      </p>
    ),
  },
  {
    title: "10 — Termination",
    body: (
      <p style={{ margin: 0 }}>
        You may stop using Ondeck and delete your account at any time. We may suspend or terminate accounts that violate these terms.
      </p>
    ),
  },
  {
    title: "11 — Contact",
    body: (
      <p style={{ margin: 0 }}>
        Questions about these terms? Reach us at{" "}
        <a href="mailto:legal@ondeck.app" style={{ color: "var(--accent)" }}>
          legal@ondeck.app
        </a>
        .
      </p>
    ),
  },
];

export default function TermsPage() {
  return (
    <div style={{ minHeight: "100vh", width: "100%", background: "var(--bg)", color: "var(--text)", fontFamily: "var(--font-ui)" }}>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "64px 24px 100px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 40 }}>
          <div style={{ width: 26, height: 26, borderRadius: 7, background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
            <LogoMark />
          </div>
          <div style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 400, fontSize: 20 }}>Ondeck</div>
        </div>

        <div style={{ fontFamily: "var(--font-display)", fontSize: 40, fontWeight: 400, marginBottom: 8 }}>Terms of Service</div>
        <div style={{ fontSize: 12.5, fontFamily: "var(--font-mono)", color: "var(--text-faint)", marginBottom: 44 }}>Last updated: July 26, 2026</div>

        <div style={{ display: "flex", flexDirection: "column", gap: 36, fontSize: 14, lineHeight: 1.7, color: "var(--text-dim)" }}>
          {SECTIONS.map((s) => (
            <div key={s.title}>
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--text-faint)", marginBottom: 10 }}>{s.title}</div>
              {s.body}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
