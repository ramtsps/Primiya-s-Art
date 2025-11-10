// Quick Sample Data Generator for Razorpay
const Razorpay = require('razorpay');

const razorpay = new Razorpay({
  key_id: 'rzp_test_Rbdvj9GLm9FekU',
  key_secret: 'ts6zyODy1HUK9fe8bQnOokSC'
});

// Generate sample order for frontend testing
async function generateSampleOrder() {
  const sampleData = {
    amount: 2999,  // ₹29.99
    currency: 'INR',
    receipt: `art_order_${Date.now()}`,
    notes: {
      course: 'Digital Painting Masterclass',
      student: 'Test User',
      duration: '6 weeks',
      level: 'Beginner'
    }
  };

  try {
    const order = await razorpay.orders.create(sampleData);
    
    console.log('🎨 SAMPLE ORDER FOR FRONTEND:');
    console.log('=' .repeat(40));
    console.log('📦 Order Details:');
    console.log(`   ID: ${order.id}`);
    console.log(`   Amount: ₹${order.amount / 100}`);
    console.log(`   Currency: ${order.currency}`);
    console.log('');
    
    console.log('🔑 Frontend Integration Data:');
    console.log(JSON.stringify({
      key: 'rzp_test_Rbdvj9GLm9FekU',
      amount: order.amount,
      currency: order.currency,
      order_id: order.id,
      name: 'Art Academy',
      description: 'Digital Painting Masterclass',
      prefill: {
        name: 'Test Student',
        email: 'test@artacademy.com',
        contact: '9999999999'
      },
      theme: {
        color: '#8B5CF6'
      }
    }, null, 2));
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

generateSampleOrder();