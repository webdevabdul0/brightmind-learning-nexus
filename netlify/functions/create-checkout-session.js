const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY); // Use environment variable for security

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  try {
    const { courseId, price, userId } = JSON.parse(event.body);

    // Optionally, validate course and price here

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: { name: `Course: ${courseId}` },
          unit_amount: price * 100, // in cents
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: 'https://yourdomain.com/enroll/success?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: 'https://yourdomain.com/enroll/cancel',
      metadata: { courseId, userId },
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ url: session.url }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
}; 