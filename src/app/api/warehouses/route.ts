import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const warehouses = await prisma.warehouse.findMany();  // ← remove the 's'
  return NextResponse.json(warehouses);                  // ← was 'warehouse', add the 's'
}