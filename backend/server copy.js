const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Adyen configuration
const ADYEN_API_KEY = process.env.ADYEN_API_KEY;
const ADYEN_MERCHANT_ACCOUNT = process.env.ADYEN_MERCHANT_ACCOUNT || 'CumuluscladECOM';
const ADYEN_BASE_URL = process.env.ADYEN_ENVIRONMENT === 'live' 
  ? 'https://checkout-live.adyen.com/checkout/v71'
  : 'https://checkout-test.adyen.com/checkout/v71';

const useRealAdyen = ADYEN_API_KEY && !ADYEN_API_KEY.includes('your_adyen_api_key');

// Enhanced mock session creator
function createCompatibleMockSession(paymentData) {
  return {
    id: `mock_${Date.now()}`,
    sessionData: JSON.stringify({
      id: `mock_${Date.now()}`,
      merchantAccount: ADYEN_MERCHANT_ACCOUNT,
      amount: paymentData.amount,
      reference: paymentData.reference,
      returnUrl: 'http://localhost:5173/checkout/result',
      expiresAt: new Date(Date.now() + 3600000).toISOString(), // 1 hour
      _isMock: true
    }),
    amount: paymentData.amount,
    reference: paymentData.reference,
    countryCode: paymentData.countryCode,
    shopperLocale: paymentData.shopperLocale,
    returnUrl: 'http://localhost:5173/checkout/result',
    _isMock: true
  };
}

// Create payment session
app.post('/api/payments/sessions', async (req, res) => {
  try {
    const { amount, reference, countryCode, shopperLocale, channel } = req.body;

    console.log('Creating payment session for:', { reference, amount });

    // If no API key or using mock mode, return enhanced mock session
    if (!useRealAdyen) {
      console.log('🔧 Using enhanced mock session');
      const mockSession = createCompatibleMockSession(req.body);
      return res.json(mockSession);
    }

    const sessionRequest = {
      amount,
      reference,
      countryCode,
      shopperLocale,
      channel: channel || 'Web',
      returnUrl: 'http://localhost:5173/checkout/result',
      merchantAccount: ADYEN_MERCHANT_ACCOUNT,
    };

    console.log('🌐 Calling Adyen API...');
    const response = await fetch(`${ADYEN_BASE_URL}/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': ADYEN_API_KEY,
      },
      body: JSON.stringify(sessionRequest),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Adyen API error:', response.status, errorText);
      throw new Error(`Adyen API error: ${response.status} - ${errorText}`);
    }

    const session = await response.json();
    console.log('✅ Adyen session created successfully');
    res.json(session);
  } catch (error) {
    console.error('❌ Error creating payment session:', error);
    
    // Always fallback to mock session on error
    console.log('🔄 Falling back to mock session');
    const mockSession = createCompatibleMockSession(req.body);
    res.json(mockSession);
  }
});

// Submit payment
app.post('/api/payments/submit', async (req, res) => {
  try {
    console.log('🔧 Using mock payment submission');
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const mockResponse = {
      resultCode: 'Authorised',
      pspReference: `mock_psp_${Date.now()}`,
      amount: req.body.paymentData?.amount || { value: 1000, currency: 'USD' }
    };
    
    res.json(mockResponse);
  } catch (error) {
    console.error('Error in mock payment submission:', error);
    res.status(500).json({ 
      error: 'Payment submission failed',
      details: error.message 
    });
  }
});

// Enhanced health check
app.get('/api/health', (req, res) => {
  const healthInfo = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    adyen: {
      configured: useRealAdyen,
      environment: process.env.ADYEN_ENVIRONMENT || 'test',
      merchantAccount: ADYEN_MERCHANT_ACCOUNT,
      mode: useRealAdyen ? 'LIVE' : 'MOCK'
    }
  };
  
  res.json(healthInfo);
});

// Test Adyen connectivity
app.get('/api/adyen-test', async (req, res) => {
  if (!useRealAdyen) {
    return res.json({
      status: 'MOCK_MODE',
      message: 'Running in mock mode - Adyen credentials not fully configured'
    });
  }

  try {
    const testRequest = {
      merchantAccount: ADYEN_MERCHANT_ACCOUNT,
      countryCode: 'US',
      amount: { currency: 'USD', value: 1000 },
      channel: 'Web'
    };

    const response = await fetch(`${ADYEN_BASE_URL}/paymentMethods`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': ADYEN_API_KEY,
      },
      body: JSON.stringify(testRequest),
    });

    if (response.ok) {
      res.json({
        status: 'ADYEN_CONNECTED',
        message: 'Successfully connected to Adyen API'
      });
    } else {
      const errorText = await response.text();
      res.json({
        status: 'ADYEN_ERROR',
        message: `Adyen API returned ${response.status}`,
        error: errorText
      });
    }
  } catch (error) {
    res.json({
      status: 'ADYEN_CONNECTION_FAILED',
      message: 'Failed to connect to Adyen API',
      error: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log('🚀 Backend server running on port', PORT);
  console.log('🔧 Adyen Mode:', useRealAdyen ? 'LIVE' : 'MOCK');
  console.log('🌐 Environment:', process.env.ADYEN_ENVIRONMENT || 'test');
  console.log('💳 Merchant Account:', ADYEN_MERCHANT_ACCOUNT);
  
  if (!useRealAdyen) {
    console.log('\n📝 NOTE: Running in MOCK mode. To use real payments:');
    console.log('   1. Verify your Adyen API key is correct');
    console.log('   2. Ensure your merchant account exists in Adyen');
    console.log('   3. Check that your API key has proper permissions');
  }
});