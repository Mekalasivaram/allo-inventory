"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Reservation = {
  id: string;
  productId: string;
  quantity: number;
  status: string;
  expiresAt: string;
};

export default function ReservationPage() {
  const { id } = useParams();
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/reservations/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setReservation(data);
        setLoading(false);
      });
  }, [id]);

  useEffect(() => {
    if (!reservation) return;
    const interval = setInterval(() => {
      const left = Math.max(
        0,
        Math.floor(
          (new Date(reservation.expiresAt).getTime() - Date.now()) / 1000
        )
      );
      setTimeLeft(left);
      if (left === 0) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
  }, [reservation]);

  async function handleConfirm() {
    const res = await fetch(`/api/reservations/${id}/confirm`, {
      method: "POST",
    });
    if (res.status === 410) {
      setMessage(" Reservation expired!");
      return;
    }
    setMessage(" Purchase confirmed!");
    setReservation((r) => (r ? { ...r, status: "confirmed" } : r));
  }

  async function handleCancel() {
    await fetch(`/api/reservations/${id}/release`, { method: "POST" });
    setMessage(" Reservation cancelled.");
    setReservation((r) => (r ? { ...r, status: "released" } : r));
  }

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  if (loading)
    return <div className="p-8 text-center">Loading...</div>;
  if (!reservation)
    return (
      <div className="p-8 text-center text-red-500">Reservation not found</div>
    );

  return (
    <main className="max-w-lg mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6"> Reservation Details</h1>
      <div className="border rounded-lg p-6 shadow-sm space-y-4">
        <div>
          <span className="font-medium">Reservation ID:</span> {reservation.id}
        </div>
        <div>
          <span className="font-medium">Quantity:</span> {reservation.quantity}
        </div>
        <div>
          <span className="font-medium">Status: </span>
          <span
            className={
              reservation.status === "confirmed"
                ? "text-green-600"
                : reservation.status === "released"
                ? "text-red-600"
                : "text-yellow-600"
            }
          >
            {reservation.status}
          </span>
        </div>

        {reservation.status === "pending" && (
          <div className="text-center bg-yellow-50 p-4 rounded">
            <p className="text-sm text-gray-600">Time remaining</p>
            <p
              className={`text-3xl font-bold ${
                timeLeft < 60 ? "text-red-600" : "text-yellow-600"
              }`}
            >
              {minutes}:{seconds.toString().padStart(2, "0")}
            </p>
          </div>
        )}

        {message && (
          <div className="bg-blue-50 border border-blue-200 p-3 rounded text-center">
            {message}
          </div>
        )}

        {reservation.status === "pending" && timeLeft > 0 && (
          <div className="flex gap-3">
            <button
              onClick={handleConfirm}
              className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700"
            >
               Confirm Purchase
            </button>
            <button
              onClick={handleCancel}
              className="flex-1 bg-red-600 text-white py-2 rounded hover:bg-red-700"
            >
               Cancel
            </button>
          </div>
        )}

        <button
          onClick={() => (window.location.href = "/")}
          className="w-full bg-gray-200 py-2 rounded hover:bg-gray-300"
        >
          ← Back to Products
        </button>
      </div>
    </main>
  );
}