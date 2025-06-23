import Instamojo from 'instamojo-nodejs';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  Instamojo.setKeys(process.env.INSTAMOJO_API_KEY, process.env.INSTAMOJO_AUTH_TOKEN);
  Instamojo.isSandboxMode(true); // Set to false for production

  const { amount, buyerName, email, phone } = req.body;

  const data = new Instamojo.PaymentData();
  data.purpose = 'Print Service Payment';
  data.amount = amount.toString();
  data.buyer_name = buyerName;
  data.email = email;
  data.phone = phone;
  data.redirect_url = 'https://your-frontend-url.com/payment-success'; // Change to your frontend success page

  try {
    const response = await Instamojo.createPayment(data);
    res.status(200).json({ paymentUrl: response.payment_request.longurl });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create payment', details: err.message });
  }
}
