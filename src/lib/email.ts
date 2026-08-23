import { Resend } from "resend";

// Uses Resend's shared testing domain until a custom domain is verified —
// works immediately with no DNS setup, but arrives "via resend.dev". Swap
// EMAIL_FROM once a real domain (e.g. ondeck.app) is verified with Resend.
const EMAIL_FROM = process.env.EMAIL_FROM ?? "Ondeck <onboarding@resend.dev>";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  if (!resend) {
    // No provider configured — fall back to logging so local/dev flows still work.
    console.log(`[password reset] ${to} -> ${resetUrl}`);
    return;
  }

  await resend.emails.send({
    from: EMAIL_FROM,
    to,
    subject: "Reset your Ondeck password",
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
        <div style="font-size: 20px; font-weight: 600; color: #111; margin-bottom: 24px;">Ondeck</div>
        <div style="font-size: 16px; color: #111; margin-bottom: 12px;">Reset your password</div>
        <p style="font-size: 14px; color: #555; line-height: 1.6;">
          We received a request to reset the password for your Ondeck account. Click the button below to choose a new one — this link expires in 1 hour.
        </p>
        <div style="margin: 28px 0;">
          <a href="${resetUrl}" style="display: inline-block; background: #111; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: 600;">
            Reset password
          </a>
        </div>
        <p style="font-size: 12.5px; color: #999; line-height: 1.6;">
          If you didn't request this, you can safely ignore this email — your password won't be changed.
        </p>
      </div>
    `,
  });
}
