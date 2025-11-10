import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Check, X, Clock } from 'lucide-react';

export function CheckoutResultPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'success' | 'pending' | 'failed'>('pending');

  useEffect(() => {
    const result = searchParams.get('result');
    if (result === 'success') {
      setStatus('success');
    } else if (result === 'failed') {
      setStatus('failed');
    }
  }, [searchParams]);

  const getStatusConfig = () => {
    switch (status) {
      case 'success':
        return {
          icon: Check,
          title: 'Payment Successful!',
          description: 'Your order has been confirmed and you will receive a confirmation email shortly.',
          color: 'text-green-600',
          bgColor: 'bg-green-50',
        };
      case 'failed':
        return {
          icon: X,
          title: 'Payment Failed',
          description: 'There was an issue processing your payment. Please try again.',
          color: 'text-red-600',
          bgColor: 'bg-red-50',
        };
      default:
        return {
          icon: Clock,
          title: 'Processing Payment',
          description: 'Your payment is being processed. Please wait...',
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className={`mx-auto w-16 h-16 rounded-full ${config.bgColor} flex items-center justify-center mb-4`}>
            <Icon className={`w-8 h-8 ${config.color}`} />
          </div>
          <CardTitle className={config.color}>{config.title}</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-gray-600">{config.description}</p>
          <div className="space-y-2">
            <Button 
              onClick={() => navigate('/')}
              className="w-full"
            >
              Return to Home
            </Button>
            {status === 'failed' && (
              <Button 
                onClick={() => navigate('/checkout')}
                variant="outline"
                className="w-full"
              >
                Try Again
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}