import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  const reservation = await prisma.reservation.findUnique({
    where: { id },
  });

  if (!reservation) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (reservation.status !== "pending") {
    return NextResponse.json(
      { error: "Already processed" },
      { status: 400 }
    );
  }

  if (new Date() > reservation.expiresAt) {
    // Release stock
    await prisma.stock.update({
      where: { id: reservation.stockId },
      data: {
        reserved: { decrement: reservation.quantity },
      },
    });

    await prisma.reservation.update({
      where: { id },
      data: { status: "released" },
    });

    return NextResponse.json(
      { error: "Reservation expired" },
      { status: 410 }
    );
  }

  await prisma.$transaction([
    prisma.reservation.update({
      where: { id },
      data: { status: "confirmed" },
    }),

    prisma.stock.update({
      where: { id: reservation.stockId },
      data: {
        reserved: { decrement: reservation.quantity },
        total: { decrement: reservation.quantity },
      },
    }),
  ]);

  return NextResponse.json({ message: "Confirmed" });
}