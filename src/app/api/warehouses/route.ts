import {NextResponse} from "next/server";
import {prisma} from "@/lib/prisma";

export async function GET(){
    const warehouses=await prisma.warehouses.findMany();
    return NextResponse.json(warehouse);
}