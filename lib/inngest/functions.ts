import { sendMoney } from "../affiliation/send-money";
import { generatePayoutConfirmationEmail } from "../email/order-emails";
import { emailService } from "../email/payout";
import { prisma } from "../prisma";
import { inngest } from "./client";

const PAYMENT_THRESHOLD = 50.0; // Minimum amount required for payout

export const sendTransfer = inngest.createFunction(
  { id: "send-transfer" },
  { cron: "* * * * *" },
  async ({ step }) => {
    // load user that have affiliate
    const users = await step.run(
      "load-users",
      async () =>
        await prisma.affiliate.findMany({
          where: {
            bankAccount: {
              not: null,
            },
            availableBalance: {
              gte: PAYMENT_THRESHOLD,
            },
          },
          include: {
            user: true,
          },
        })
    );

    const events = users.map((user) => {
      return {
        name: "app/send.weekly.digest",
        data: {
          user_id: user.userId,
          email: user.user.email,
          bankAccount: user.bankAccount!,
          availableBalance: user.availableBalance,
          affiliateId: user.id,
          paymentMethod: user.paymentMethod!,
        },
      };
    });
    await step.sendEvent("send-digest-events", events);
  }
);

export const sendWeeklyDigest = inngest.createFunction(
  { id: "send-weekly-digest-email" },
  { event: "app/send.weekly.digest" },
  async ({ event }) => {
    // 3️⃣ We can now grab the email and user id from the event payload
    const { email } = event.data;

    await sendMoney(
      event.data.bankAccount,
      event.data.availableBalance,
      event.data.affiliateId,
      // event.data.paymentMethod
    );

    // 4️⃣ Finally, we send the email itself:
    const emailHtml = generatePayoutConfirmationEmail({
      affiliateName: event.data.user?.name || "Affiliate",
      amount: event.data.availableBalance,
      bankAccount: event.data.bankAccount,
      payoutDate: new Date(),
      referralCount: event.data.referralCount, // optionnel
      period: "Last 15 days", // optionnel
    });

    // Envoyer l'email
    await emailService.send({
      to: email,
      subject: "💸 Your Payout Has Been Processed!",
      data: emailHtml,
    });

    // 🎇 That's it! - We've used two functions to reliably perform a scheduled
    // task for a large list of users!
  }
);
