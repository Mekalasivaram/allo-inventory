import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

type ProductWithStocks = Prisma.ProductGetPayload<{
  include: { stocks: { include: { warehouse: true } } };
}>;

export async function GET() {
  const products = await prisma.product.findMany({
    include: {
      stocks: {
        include: {
          warehouse: true,
        },
      },
    },
  });

  const result = products.map((product: ProductWithStocks) => ({
    id: product.id,
    name: product.name,
    description: product.description,
    stocks: product.stocks.map((stock) => ({
      warehouseId: stock.warehouseId,
      warehouseName: stock.warehouse.name,
      total: stock.total,
      reserved: stock.reserved,
      available: stock.total - stock.reserved,
    })),
  }));

  return NextResponse.json(result);
}