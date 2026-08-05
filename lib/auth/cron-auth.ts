/**
 * Verifies a request claiming to come from Vercel Cron.
 *
 * When a `CRON_SECRET` env var is set on the Vercel project, Vercel automatically sends
 * `Authorization: Bearer <CRON_SECRET>` on every invocation of a cron job defined in
 * vercel.json. We check that header against our own copy of the secret so the endpoint
 * can't be triggered by anyone who simply finds the URL.
 *
 * If `CRON_SECRET` isn't configured, the request is rejected outright — better to have
 * the cron silently fail (visible in Vercel's cron logs) than to run an unauthenticated
 * background job that writes data.
 */
export function isAuthorizedCronRequest(authorizationHeader: string | null): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return false;
  }
  return authorizationHeader === `Bearer ${secret}`;
}
