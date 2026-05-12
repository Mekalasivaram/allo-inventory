import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import {z} from "zod";
import { prisma } from "@/lib/prisma";

const ReserveSchema=z.object({
    productId: z.string(),
    warehouseId: z.string(),
    quantity: z.number().int().positive(),
});

export async function POST(req: NextRequest){
    const body=await req.json();
    const parsed= ReserveSchema.safeParse(body);
    if(!parsed.success){
        return NextResponse.json({error: "Invalid input"},{status: 400});
    }
    const {productId,warehouseId, quantity}=parsed.data;
    const lockKey=`lock:${productId}:${warehouseId}`;

    const lock=await redis.set(lockKey,"1",{nx:true,ex:10});
    if(!lock){
        return NextResponse.json({error:"Try again"},{status: 409});
    }

    try{
        const stock=await prisma.stock.findUnique({
            where: {productId_warehouseId: {productId,warehouseId}},
        });
        if(!stock){
            return NextResponse.json({error: "stock not found"},{status: 404});
        }

        const available =stock.total-stock.reserved;
        if(available<quantity){
            return NextResponse.json({error: "Not enough stock"},{status: 409});
        }

        const expiresAt=new Date(Date.now()+10*60*1000); //10 minutes
    const [reservation]= await prisma.$transaction([
        prisma.reservation.create({
            data:{
                productId,
                warehouseId,
                stockId: stock.id,
                quantity,
                status: "pending",
                expiresAt,
            },
        }),
        prisma.stock.update({
            where: {id: stock.id},
            data: {reserved: {increment: quantity}},
        }),
    ]);
    return NextResponse.json(reservation, {status: 201});
    }finally{
        await redis.del(lockKey);
    }

}

