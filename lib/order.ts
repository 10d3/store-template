import { prisma } from "./prisma";

export const getOrders = async (userId: string) =>{
  const orders = await prisma.order.findMany({
    where: {
      userId: userId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return orders;
}

/**
 * Get a single order by orderNumber with owner verification.
 * Returns null if the user/email doesn't match the order owner.
 */
export const getOrderByNumber = async (orderNumber: string, userId?: string, customerEmail?: string) => {
  const order = await prisma.order.findUnique({
    where: { orderNumber },
  });

  if (!order) return null;

  if (userId && order.userId === userId) return order;
  if (customerEmail && order.customerEmail === customerEmail) return order;

  return null;
}

/**
 * Get order by orderNumber for public access.
 * Returns order with auth requirements for the page to handle.
 */
export const getOrderByNumberPublic = async (orderNumber: string, email?: string) => {
  const order = await prisma.order.findUnique({
    where: { orderNumber },
  });

  if (!order) return { order: null, requiresAuth: false };

  if (order.userId) {
    return { order, requiresAuth: true };
  }

  const emailMatches = email && order.customerEmail === email;
  return { 
    order: emailMatches ? order : null, 
    requiresAuth: false,
    emailRequired: !emailMatches 
  };
}