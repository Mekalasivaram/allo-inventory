import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const expiredReservations = await prisma.reservation.findMany({
    where: {
      status: "pending",
      expiresAt: { lt: new Date() },
    },
  });

  for (const reservation of expiredReservations) {
    await prisma.$transaction([
      prisma.reservation.update({
        where: { id: reservation.id },
        data: { status: "released" },
      }),
      prisma.stock.update({
        where: { id: reservation.stockId },
        data: { reserved: { decrement: reservation.quantity } },
      }),
    ]);
  }

  return NextResponse.json({
    message: `Released ${expiredReservations.length} reservations`,
  });
}