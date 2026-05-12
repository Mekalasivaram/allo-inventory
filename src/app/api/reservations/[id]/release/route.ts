import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const reservation = await prisma.reservation.findUnique({
    where: { id: params.id },
  });

  if (!reservation) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (reservation.status !== "pending") {
    return NextResponse.json({ error: "Already processed" }, { status: 400 });
  }

  await prisma.$transaction([
    prisma.reservation.update({
      where: { id: params.id },
      data: { status: "released" },
    }),
    prisma.stock.update({
      where: { id: reservation.stockId },
      data: { reserved: { decrement: reservation.quantity } },
    }),
  ]);

  return NextResponse.json({ message: "Released" });
}