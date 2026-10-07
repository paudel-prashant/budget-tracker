import webpush from "web-push";
import { prisma } from "@/lib/db/prisma";
import { reportError } from "@/lib/utils/logger";

export type PushPayload = {
  title: string;
  body: string;
  /** Page opened when the notification is clicked. */
  url?: string;
  /** Notifications with the same tag replace each other instead of stacking. */
  tag?: string;
};

let configured: boolean | null = null;

/**
 * Push needs a VAPID key pair (generate once with `npx web-push generate-vapid-keys`).
 * Without it every send is a silent no-op, so the rest of the app works unchanged.
 */
export function isPushConfigured(): boolean {
  if (configured !== null) return configured;

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;

  if (!publicKey || !privateKey) {
    configured = false;
    return configured;
  }

  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:admin@example.com",
    publicKey,
    privateKey
  );
  configured = true;
  return configured;
}

/** Sends to every device the user subscribed. Returns how many deliveries succeeded. */
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<number> {
  if (!isPushConfigured()) return 0;

  const subscriptions = await prisma.pushSubscription.findMany({ where: { userId } });
  let delivered = 0;

  for (const subscription of subscriptions) {
    try {
      await webpush.sendNotification(
        {
          endpoint: subscription.endpoint,
          keys: { p256dh: subscription.p256dh, auth: subscription.auth },
        },
        JSON.stringify(payload)
      );
      delivered += 1;
    } catch (error) {
      const statusCode = (error as { statusCode?: number }).statusCode;

      // 404/410: the browser revoked or expired this subscription — forget it.
      if (statusCode === 404 || statusCode === 410) {
        await prisma.pushSubscription.deleteMany({ where: { id: subscription.id } });
      } else {
        reportError("Failed to send push notification", error, {
          scope: "push",
          userId,
          statusCode,
        });
      }
    }
  }

  return delivered;
}
