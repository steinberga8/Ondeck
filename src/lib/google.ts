import { OAuth2Client } from "google-auth-library";

/**
 * Verifies a Google ID token server-side against the client ID the caller claims
 * to be using. This app lets each operator paste in their own Google OAuth Client
 * ID at runtime (Client IDs are public identifiers, not secrets — see Google's own
 * docs), so there's no single pre-registered audience to pin here. The security
 * property this still gives us: the token's signature, issuer and expiry are
 * cryptographically checked against Google's public certs, and the token must have
 * been minted for the exact client ID presented — it can't be a token lifted from a
 * different app and replayed here.
 */
export async function verifyGoogleIdToken(idToken: string, clientId: string) {
  const client = new OAuth2Client(clientId);
  const ticket = await client.verifyIdToken({ idToken, audience: clientId });
  const payload = ticket.getPayload();
  if (!payload || !payload.email) {
    throw new Error("Invalid Google token payload");
  }
  if (!payload.email_verified) {
    throw new Error("Google email not verified");
  }
  return {
    email: payload.email.toLowerCase(),
    name: payload.name ?? payload.email.split("@")[0],
    picture: payload.picture ?? null,
    sub: payload.sub,
  };
}
