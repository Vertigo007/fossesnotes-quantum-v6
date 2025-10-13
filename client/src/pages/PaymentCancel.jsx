import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { XCircle, ArrowLeft } from 'lucide-react';

const PaymentCancel = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <XCircle className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {language === 'fr' ? 'Paiement annulé' : 'Payment Cancelled'}
          </h2>
          <p className="text-gray-600">
            {language === 'fr' 
              ? 'Votre paiement a été annulé. Vous pouvez réessayer à tout moment.'
              : 'Your payment was cancelled. You can try again at any time.'
            }
          </p>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {language === 'fr' ? 'Que faire maintenant ?' : 'What to do next?'}
            </h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• {language === 'fr' ? 'Retourner à l\'inscription' : 'Return to registration'}</li>
              <li>• {language === 'fr' ? 'Choisir un plan gratuit' : 'Choose a free plan'}</li>
              <li>• {language === 'fr' ? 'Réessayer le paiement plus tard' : 'Try payment again later'}</li>
            </ul>
          </div>

          <div className="flex space-x-4">
            <button
              onClick={() => navigate('/register')}
              className="flex-1 flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {language === 'fr' ? 'Retour à l\'inscription' : 'Back to Registration'}
            </button>
            
            <button
              onClick={() => navigate('/')}
              className="flex-1 flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {language === 'fr' ? 'Accueil' : 'Home'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentCancel;



