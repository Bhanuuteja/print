import express, { Request, Response } from 'express';
import multer from 'multer';
import Stripe from 'stripe';
import path from 'path';

const app = express();
const PORT = 4000;

// Stripe setup (replace with your test key)
const stripe = new Stripe('sk_test_...', { apiVersion: '2025-05-28.basil' });

// File upload setup
const upload = multer({ dest: 'uploads/' });

app.use(express.json());

// Payment intent endpoint
app.post('/api/create-payment-intent', async (req: Request, res: Response) => {
  const { amount } = req.body;
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100, // Stripe expects amount in cents/paise
      currency: 'inr',
      payment_method_types: ['card'],
    });
    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    res.status(500).json({ error: 'Payment intent creation failed' });
  }
});

// Print endpoint
app.post('/api/print', upload.single('file'), async (req: Request, res: Response): Promise<void> => {
  if (!req.file) {
    res.status(400).json({ error: 'No file uploaded' });
    return;
  }
  try {
    await printFile(path.resolve(req.file.path));
    res.json({ status: 'Print job sent' });
  } catch (err) {
    res.status(500).json({ error: 'Printing failed', details: err });
  }
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});