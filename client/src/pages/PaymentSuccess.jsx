import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { CheckCircle, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

const PaymentSuccess = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const paymentId = searchParams.get('paymentId');
  const payerId = searchParams.get('PayerID');

  useEffect(() => {
    if (paymentId && payerId) {
      processPayment();
    } else {
      setLoading(false);
    }
  }, [paymentId, payerId]);

  const processPayment = async () => {
    try {
      setProcessing(true);
      
      const response = await fetch('/api/paypal/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentId,
          payerId
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(language === 'fr' ? 'Paiement traité avec succès !' : 'Payment processed successfully!');
        // Rediriger vers le dashboard après un délai
        setTimeout(() => {
          navigate('/dashboard');
        }, 3000);
      } else {
        toast.error(data.error || (language === 'fr' ? 'Erreur lors du traitement du paiement' : 'Error processing payment'));
      }
    } catch (error) {
      console.error('Erreur traitement paiement:', error);
      toast.error(language === 'fr' ? 'Erreur lors du traitement du paiement' : 'Error processing payment');
    } finally {
      setProcessing(false);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {language === 'fr' ? 'Traitement du paiement...' : 'Processing payment...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {language === 'fr' ? 'Paiement réussi !' : 'Payment Successful!'}
          </h2>
          <p className="text-gray-600">
            {language === 'fr' 
              ? 'Votre abonnement a été activé avec succès.'
              : 'Your subscription has been successfully activated.'
            }
          </p>
        </div>

        {processing ? (
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">
              {language === 'fr' ? 'Finalisation de votre compte...' : 'Finalizing your account...'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {language === 'fr' ? 'Prochaines étapes' : 'Next Steps'}
              </h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• {language === 'fr' ? 'Accédez à votre tableau de bord' : 'Access your dashboard'}</li>
                <li>• {language === 'fr' ? 'Explorez les rivières à saumon' : 'Explore salmon rivers'}</li>
                <li>• {language === 'fr' ? 'Rejoignez la communauté' : 'Join the community'}</li>
              </ul>
            </div>

            <button
              onClick={() => navigate('/dashboard')}
              className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <ArrowRight className="w-4 h-4 mr-2" />
              {language === 'fr' ? 'Aller au tableau de bord' : 'Go to Dashboard'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentSuccess;



