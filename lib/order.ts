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