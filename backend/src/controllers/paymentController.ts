import { Response } from "express";
import crypto from "crypto";
import { pool } from "../common/db";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const randomOrderId = () => {
  const suffix = crypto.randomBytes(10).toString("hex");
  return `order_mock_${suffix}`;
};

export const createMockOrder = async (req: any, res: Response) => {
  try {
    const userId = Number(req.user?.id);
    const { amount, artistName, paymentMethod } = req.body as {
      amount?: number;
      artistName?: string;
      paymentMethod?: 'card' | 'upi' | 'netbanking';
    };

    if (!Number.isFinite(userId) || userId <= 0) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const amountInt = Number(amount);
    if (!Number.isFinite(amountInt) || amountInt <= 0) {
      return res.status(400).json({ success: false, message: "amount is required" });
    }

    // Validate payment method
    const validPaymentMethods = ['card', 'upi', 'netbanking'];
    const selectedPaymentMethod = paymentMethod || 'card';
    
    if (!validPaymentMethods.includes(selectedPaymentMethod)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid payment method. Must be one of: card, upi, netbanking" 
      });
    }

    const razorpay_order_id = randomOrderId();

    const insert = await pool.query(
      `INSERT INTO transactions (user_id, razorpay_order_id, amount, currency, status, artist_name)
       VALUES ($1, $2, $3, 'INR', 'CREATED', $4)
       RETURNING id, razorpay_order_id, amount, currency, status`,
      [userId, razorpay_order_id, Math.floor(amountInt), (artistName ?? "").toString() || "Unknown"]
    );

    const tx = insert.rows?.[0];

    return res.json({
      success: true,
      order: {
        id: tx?.razorpay_order_id ?? razorpay_order_id,
        amount: tx?.amount ?? Math.floor(amountInt),
        currency: tx?.currency ?? "INR",
        status: tx?.status ?? "CREATED",
        paymentMethod: selectedPaymentMethod,
      }
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err?.message || "Failed to create mock order"
    });
  }
};

export const verifyMockPayment = async (req: any, res: Response) => {
  try {
    const userId = Number(req.user?.id);
    const { razorpay_order_id, artist_id, paymentMethod } = req.body as {
      razorpay_order_id?: string;
      artist_id?: number;
      paymentMethod?: 'card' | 'upi' | 'netbanking';
    };

    if (!Number.isFinite(userId) || userId <= 0) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const orderId = (razorpay_order_id ?? "").toString().trim();
    if (!orderId) {
      return res.status(400).json({ success: false, message: "razorpay_order_id is required" });
    }

    const artistId = Number(artist_id);
    if (!Number.isFinite(artistId) || artistId <= 0) {
      return res.status(400).json({ success: false, message: "artist_id is required" });
    }

    // Validate payment method
    const validPaymentMethods = ['card', 'upi', 'netbanking'];
    const selectedPaymentMethod = paymentMethod || 'card';
    
    if (!validPaymentMethods.includes(selectedPaymentMethod)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid payment method. Must be one of: card, upi, netbanking" 
      });
    }

    // Simulate payment processing delay based on payment method
    const processingDelays = {
      card: 2000,
      upi: 1500,
      netbanking: 3000
    };
    
    await sleep(processingDelays[selectedPaymentMethod]);

    const found = await pool.query(
      `SELECT id, user_id, razorpay_order_id, amount, currency, status
       FROM transactions
       WHERE razorpay_order_id = $1
       LIMIT 1`,
      [orderId]
    );

    const tx = found.rows?.[0] ?? null;

    if (!tx || Number(tx.user_id) !== userId) {
      return res.status(404).json({ success: false, message: "Transaction not found" });
    }

    const paymentConfirmedAt = new Date();
    const mockPaymentId = `pay_mock_${crypto.randomBytes(8).toString("hex")}`;
    const mockSignature = `sig_mock_${crypto.randomBytes(16).toString("hex")}`;

    const updated = await pool.query(
      `UPDATE transactions
       SET status = 'CAPTURED', payment_confirmed_at = $2, razorpay_payment_id = $3, razorpay_signature = $4
       WHERE razorpay_order_id = $1
       RETURNING id, user_id, razorpay_order_id, amount, currency, status, payment_confirmed_at, razorpay_payment_id, razorpay_signature`,
      [orderId, paymentConfirmedAt, mockPaymentId, mockSignature]
    );

    const updatedTx = updated.rows?.[0] ?? null;

    const now = new Date();
    const endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const subUpsert = await pool.query(
      `INSERT INTO subscriptions (user_id, artist_id, status, plan_type, start_date, end_date, auto_renew)
       VALUES ($1, $2, 'ACTIVE', 'MONTHLY', $3, $4, true)
       ON CONFLICT (user_id, artist_id)
       DO UPDATE SET status = 'ACTIVE', end_date = EXCLUDED.end_date, updated_at = now()
       RETURNING user_id, artist_id, status, start_date, end_date`,
      [userId, artistId, now, endDate]
    );

    const subscription = subUpsert.rows?.[0] ?? null;

    return res.json({
      success: true,
      message: "Mock payment captured successfully",
      paymentMethod: selectedPaymentMethod,
      transaction: {
        razorpay_order_id: updatedTx?.razorpay_order_id ?? orderId,
        razorpay_payment_id: updatedTx?.razorpay_payment_id ?? mockPaymentId,
        razorpay_signature: updatedTx?.razorpay_signature ?? mockSignature,
        status: updatedTx?.status ?? "CAPTURED",
        amount: updatedTx?.amount ?? tx.amount,
        currency: updatedTx?.currency ?? tx.currency ?? "INR",
        payment_confirmed_at: updatedTx?.payment_confirmed_at ?? paymentConfirmedAt,
      },
      subscription: {
        user_id: subscription?.user_id ?? userId,
        artist_id: subscription?.artist_id ?? artistId,
        status: subscription?.status ?? "ACTIVE",
        start_date: subscription?.start_date ?? now,
        end_date: subscription?.end_date ?? endDate,
      }
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err?.message || "Failed to verify mock payment"
    });
  }
};
