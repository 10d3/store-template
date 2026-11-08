"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export interface AddressState {
  error?: string;
  success?: boolean;
}

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function optional(formData: FormData, key: string) {
  return text(formData, key) || null;
}

function revalidateAddresses() {
  revalidatePath("/account/addresses");
  revalidatePath("/account");
  revalidatePath("/cart");
}

export async function saveAddress(
  _state: AddressState,
  formData: FormData
): Promise<AddressState> {
  const session = await requireUser();
  const id = text(formData, "id");

  const data = {
    label: optional(formData, "label"),
    name: text(formData, "name"),
    line1: text(formData, "line1"),
    line2: optional(formData, "line2"),
    city: text(formData, "city"),
    state: optional(formData, "state"),
    postalCode: text(formData, "postalCode"),
    country: text(formData, "country") || "US",
    phone: optional(formData, "phone"),
    isDefault: formData.get("isDefault") === "on",
  };

  if (!data.name || !data.line1 || !data.city || !data.postalCode) {
    return { error: "Name, address, city, and postal code are required." };
  }

  if (data.isDefault) {
    await prisma.address.updateMany({
      where: { userId: session.user.id },
      data: { isDefault: false },
    });
  }

  if (id) {
    const existing = await prisma.address.findFirst({
      where: { id, userId: session.user.id },
      select: { id: true },
    });
    if (!existing) return { error: "Address not found." };
    await prisma.address.update({ where: { id }, data });
  } else {
    await prisma.address.create({
      data: { ...data, userId: session.user.id },
    });
  }

  revalidateAddresses();
  return { success: true };
}

export async function deleteAddress(formData: FormData) {
  const session = await requireUser();
  const id = text(formData, "id");
  if (!id) return;
  await prisma.address.deleteMany({
    where: { id, userId: session.user.id },
  });
  revalidateAddresses();
}

export async function setDefaultAddress(formData: FormData) {
  const session = await requireUser();
  const id = text(formData, "id");
  if (!id) return;

  await prisma.$transaction([
    prisma.address.updateMany({
      where: { userId: session.user.id },
      data: { isDefault: false },
    }),
    prisma.address.updateMany({
      where: { id, userId: session.user.id },
      data: { isDefault: true },
    }),
  ]);

  revalidateAddresses();
}
