"use client";
import { useEffect, useState } from "react";

type Stock = {
  warehouseId: string;
  warehouseName: string;
  available: number;
};

type Product = {
  id: string;
  name: string;
  description: string;
  stocks: Stock[];
};

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => { setProducts(data); setLoading(false); })
      .catch(() => { setError("Failed to load products"); setLoading(false); });
  }, []);

  async function handleReserve(productId: string, warehouseId: string) {
    const res = await fetch("/api/reservations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, warehouseId, quantity: 1 }),
    });

    if (res.status === 409) {
      alert(" Not enough stock available!");
      return;
    }

    const reservation = await res.json();
    window.location.href = `/reservation/${reservation.id}`;
  }

  if (loading) return <div className="p-8 text-center">Loading products...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

  return (
    <main className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Allo Inventory</h1>
      <div className="grid gap-6">
        {products.map((product) => (
          <div key={product.id} className="border rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold">{product.name}</h2>
            <p className="text-gray-500 mb-4">{product.description}</p>
            <div className="space-y-2">
              {product.stocks.map((stock) => (
                <div key={stock.warehouseId} className="flex items-center justify-between bg-gray-50 p-3 rounded">
                  <div>
                    <span className="font-medium">{stock.warehouseName}</span>
                    <span className="ml-3 text-sm text-gray-600">
                      {stock.available > 0 ? `${stock.available} available` : "Out of stock"}
                    </span>
                  </div>
                  <button
                    onClick={() => handleReserve(product.id, stock.warehouseId)}
                    disabled={stock.available === 0}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    Reserve
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}