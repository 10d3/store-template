import { CommissionStatus, PayoutStatus } from "../generated/prisma";
import { prisma } from "../prisma";
import { getStripeClient } from "../stripe";

export const sendMoney = async (
  stripeAccountId: string, // ID du compte Stripe Connect
  amount: number,
  affiliateId: string,
  // paymentMethod: PaymentMethod
) => {
  const stripe = getStripeClient();

  // Étape 1 : Créer un enregistrement "Payout" avec le statut PENDING.
  // Cet objet sert de "source de vérité" pour cette tentative de paiement.
  const payout = await prisma.payout.create({
    data: {
      affiliateId,
      amount,
      method: "STRIPE",
      status: PayoutStatus.PENDING,
    },
  });

  try {
    // Étape 2 : Valider le compte Stripe et les montants des commissions.
    const account = await stripe.accounts.retrieve(stripeAccountId);
    if (!account.charges_enabled || !account.payouts_enabled) {
      throw new Error("Ce compte Stripe ne peut pas recevoir de paiements.");
    }

    const eligibleCommissions = await prisma.commission.findMany({
      where: {
        affiliateId,
        status: CommissionStatus.APPROVED,
        payoutId: null,
      },
    });

    const totalCommissionAmount = eligibleCommissions.reduce(
      (sum, commission) => sum + commission.amount,
      0
    );

    // Vérification cruciale de la cohérence des montants
    if (totalCommissionAmount !== amount) {
      throw new Error(
        `Le montant du paiement (${amount}) ne correspond pas au total des commissions (${totalCommissionAmount}).`
      );
    }

    // Étape 3 : Exécuter le transfert d'argent via Stripe.
    // L'appel inclut une clé d'idempotence pour éviter les doubles paiements.
    // Note : "Transfer" déplace l'argent du solde de votre plateforme vers le solde Stripe du compte connecté.
    const transfer = await stripe.transfers.create(
      {
        amount: Math.round(amount * 100), // Montant en centimes
        currency: "usd", // À rendre dynamique si votre application est multi-devises
        destination: stripeAccountId,
        description: `Paiement des commissions de $${amount} pour l'affilié ${affiliateId}`,
        metadata: {
          affiliateId: affiliateId,
          payoutId: payout.id, // Lien vers notre enregistrement interne
        },
      },
      {
        // Clé d'idempotence : garantit que même si la fonction est appelée
        // plusieurs fois avec le même payout.id, le transfert ne sera effectué qu'une seule fois.
        idempotencyKey: payout.id,
      }
    );

    // Étape 4 : Si le transfert Stripe réussit, mettre à jour la base de données de manière atomique.
    // Une transaction garantit que soit toutes les mises à jour réussissent, soit aucune n'est appliquée.
    await prisma.$transaction(async (tx) => {
      // Marquer les commissions comme payées et les lier au Payout
      await tx.commission.updateMany({
        where: {
          id: {
            in: eligibleCommissions.map((c) => c.id),
          },
        },
        data: {
          payoutId: payout.id,
          status: CommissionStatus.PAID,
          paidAt: new Date(),
        },
      });

      // Mettre à jour le Payout comme étant complété
      await tx.payout.update({
        where: { id: payout.id },
        data: {
          status: PayoutStatus.COMPLETED,
          processedAt: new Date(),
          // Stocker l'ID du transfert pour référence future
          transactionId: transfer.id,
        },
      });
    });

    return transfer;
  } catch (error) {
    // Étape 5 : En cas d'échec à n'importe quelle étape, marquer le Payout comme "FAILED".
    // Cela permet de savoir exactement ce qui a échoué et de pouvoir investiguer.
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred.";

    await prisma.payout.update({
      where: { id: payout.id },
      data: {
        status: PayoutStatus.FAILED,
        failureReason: errorMessage,
      },
    });

    console.error(`Échec du traitement du paiement ${payout.id}:`, error);

    // Renvoyer l'erreur pour que la fonction appelante puisse la gérer
    throw error;
  }
};
