import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { type, docId, docLabel } = req.body;

  try {
    let lineItems;
    let mode;
    let metadata = {};

    if (type === 'payper') {
      mode = 'payment';
      metadata = { docId, type: 'payper' };
      lineItems = [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `DocRight AI — ${docLabel}`,
              description: 'One-time unlock for this document type',
            },
            unit_amount: 199, // $1.99
          },
          quantity: 1,
        },
      ];
    } else if (type === 'monthly') {
      mode = 'subscription';
      metadata = { type: 'monthly' };
      lineItems = [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'DocRight AI — Monthly PRO',
              description: 'Unlimited access to all document types',
            },
            unit_amount: 999, // $9.99
            recurring: { interval: 'month' },
          },
          quantity: 1,
        },
      ];
    } else if (type === 'annual') {
      mode = 'subscription';
      metadata = { type: 'annual' };
      lineItems = [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'DocRight AI — Annual PRO',
              description: 'Unlimited access to all document types (best value)',
            },
            unit_amount: 7999, // $79.99
            recurring: { interval: 'year' },
          },
          quantity: 1,
        },
      ];
    } else {
      return res.status(400).json({ error: 'Invalid type' });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode,
      metadata,
      success_url: `${req.headers.origin}/?success=true&type=${type}&docId=${docId || ''}`,
      cancel_url: `${req.headers.origin}/?canceled=true`,
    });

    res.status(200).json({ url: session.url });
  } catch (error) {
    console.error('Stripe error:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
}
