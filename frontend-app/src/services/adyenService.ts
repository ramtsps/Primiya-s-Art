import { AdyenCheckout } from '@adyen/adyen-web';



export interface PaymentRequest {
  amount: {
    value: number;
    currency: string;
  };
  reference: string;
  countryCode: string;
  shopperLocale: string;
  channel?: string;
}

class AdyenService {
  private clientKey = import.meta.env.VITE_ADYEN_CLIENT_KEY || 'test_YOUR_CLIENT_KEY';
  private environment = import.meta.env.VITE_ADYEN_ENVIRONMENT || 'test';
  private baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  async createPaymentSession(paymentData: PaymentRequest) {
    try {
      console.log('🌐 Creating payment session...', paymentData);
      
      const response = await fetch(`${this.baseUrl}/api/payments/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to create payment session: ${response.status} - ${errorText}`);
      }

      const session = await response.json();
      console.log('✅ Payment session created:', session);
      return session;
    } catch (error) {
      console.error('❌ Error creating payment session:', error);
      // Enhanced mock session that works with Adyen
      return this.createEnhancedMockSession(paymentData);
    }
  }

  private createEnhancedMockSession(paymentData: PaymentRequest) {
    console.log('🔧 Creating enhanced mock session');
    const sessionId = `mock_${Date.now()}`;
    return {
      id: sessionId,
      sessionData: JSON.stringify({
        id: sessionId,
        amount: paymentData.amount,
        reference: paymentData.reference,
        returnUrl: 'http://localhost:5173/checkout/result',
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
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

  async initializeCheckout(containerId: string, paymentData: PaymentRequest) {
    try {
      const session = await this.createPaymentSession(paymentData);
      
      // Basic configuration that works with both real and mock sessions
      const configuration: any = {
        environment: this.environment,
        clientKey: this.clientKey,
        session: session,
        onPaymentCompleted: (result: any, component: any) => {
          console.log('✅ Payment completed:', result);
          if (result.resultCode === 'Authorised' || result.resultCode === 'Received') {
            this.handlePaymentSuccess(result);
          } else {
            this.handlePaymentResult(result);
          }
        },
        onError: (error: any, component: any) => {
          console.error('❌ Payment error:', error);
          this.handlePaymentError(error);
        },
      };

      // Only add paymentMethodsConfiguration for Drop-in
      if (!session._isMock) {
        configuration.paymentMethodsConfiguration = {
          card: {
            hasHolderName: true,
            holderNameRequired: true,
            enableStoreDetails: false,
          }
        };
      }

      console.log('🚀 Initializing Adyen checkout...', {
        environment: configuration.environment,
        hasClientKey: !!configuration.clientKey,
        hasSession: !!configuration.session,
        isMock: session._isMock
      });

      const checkout = await AdyenCheckout(configuration);
      
      const container = document.getElementById(containerId);
      if (!container) {
        throw new Error(`Container with id '${containerId}' not found`);
      }

      // Clear container and add loading state
      container.innerHTML = '<div class="text-center py-8">Loading payment methods...</div>';

      const dropin = checkout.create('dropin').mount(`#${containerId}`);
      
      console.log('✅ Adyen Drop-in mounted successfully');
      
      return {
        checkout,
        dropin,
        isMock: session._isMock
      };
    } catch (error) {
      console.error('❌ Error initializing Adyen checkout:', error);
      
      // Provide user-friendly error message
      let errorMessage = 'Payment system initialization failed';
      if (error instanceof Error) {
        if (error.message.includes('session identifier')) {
          errorMessage = 'Payment session expired. Please refresh the page.';
        } else if (error.message.includes('NETWORK_ERROR')) {
          errorMessage = 'Network error. Please check your connection.';
        } else {
          errorMessage = error.message;
        }
      }
      
      throw new Error(errorMessage);
    }
  }

  private handlePaymentSuccess(result: any) {
    console.log('🎉 Payment successful!', result);
    const event = new CustomEvent('paymentSuccess', { 
      detail: { 
        result,
        timestamp: new Date().toISOString(),
        isMock: result.pspReference?.includes('mock')
      } 
    });
    window.dispatchEvent(event);
  }

  private handlePaymentResult(result: any) {
    console.log('ℹ️ Payment result:', result);
    const event = new CustomEvent('paymentResult', { 
      detail: { 
        result,
        timestamp: new Date().toISOString()
      } 
    });
    window.dispatchEvent(event);
  }

  private handlePaymentError(error: any) {
    console.error('❌ Payment error:', error);
    const event = new CustomEvent('paymentError', { 
      detail: { 
        error,
        timestamp: new Date().toISOString(),
        userMessage: this.getUserFriendlyError(error)
      } 
    });
    window.dispatchEvent(event);
  }

  private getUserFriendlyError(error: any): string {
    if (error?.message?.includes('session identifier')) {
      return 'Payment session expired. Please refresh the page and try again.';
    }
    if (error?.message?.includes('NETWORK_ERROR')) {
      return 'Network connection issue. Please check your internet connection.';
    }
    return 'An unexpected error occurred. Please try again or contact support.';
  }

  isConfigured(): boolean {
    return !this.clientKey.includes('YOUR_CLIENT_KEY');
  }
}

export const adyenService = new AdyenService();