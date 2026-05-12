import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";

dotenv.config();

const connectionString = process.env.DIRECT_URL!;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("  Seeding...");

  const warehouse1 = await prisma.warehouse.create({
    data: { name: "Mumbai Warehouse", location: "Mumbai, India" },
  });

  const warehouse2 = await prisma.warehouse.create({
    data: { name: "Delhi Warehouse", location: "Delhi, India" },
  });

  await prisma.product.create({
    data: {
      name: "Wireless Headphones",
      description: "Premium noise-cancelling headphones",
      stocks: {
        create: [
          { warehouseId: warehouse1.id, total: 10, reserved: 0 },
          { warehouseId: warehouse2.id, total: 5, reserved: 0 },
        ],
      },
    },
  });

  await prisma.product.create({
    data: {
      name: "Mechanical Keyboard",
      description: "RGB mechanical gaming keyboard",
      stocks: {
        create: [
          { warehouseId: warehouse1.id, total: 3, reserved: 0 },
          { warehouseId: warehouse2.id, total: 8, reserved: 0 },
        ],
      },
    },
  });

  await prisma.product.create({
    data: {
      name: "USB-C Hub",
      description: "7-in-1 USB-C multiport adapter",
      stocks: {
        create: [
          { warehouseId: warehouse1.id, total: 1, reserved: 0 },
          { warehouseId: warehouse2.id, total: 2, reserved: 0 },
        ],
      },
    },
  });

  console.log(" Seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());