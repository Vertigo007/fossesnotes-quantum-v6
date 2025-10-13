import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Brain, MessageCircle, Send, Fish, Thermometer, Wind, Calendar, MapPin } from 'lucide-react';

const AIAdvisor = ({ riverData, weatherData, userLevel = 'intermediate' }) => {
  const { language } = useLanguage();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Conseils automatiques basés sur les conditions
  const generateAutomaticAdvice = () => {
    if (!riverData || !weatherData) return [];

    const advice = [];

    // Conseils basés sur la température de l'eau
    if (riverData.temperature_eau) {
      if (riverData.temperature_eau < 10) {
        advice.push({
          type: 'temperature',
          icon: <Thermometer className="w-4 h-4" />,
          title: language === 'fr' ? 'Température de l\'eau' : 'Water Temperature',
          message: language === 'fr' 
            ? 'Eau froide - Utilisez des mouches plus petites et pêchez plus lentement'
            : 'Cold water - Use smaller flies and fish slower',
          priority: 'high'
        });
      } else if (riverData.temperature_eau > 20) {
        advice.push({
          type: 'temperature',
          icon: <Thermometer className="w-4 h-4" />,
          title: language === 'fr' ? 'Température de l\'eau' : 'Water Temperature',
          message: language === 'fr'
            ? 'Eau chaude - Pêchez tôt le matin ou en soirée, évitez les heures chaudes'
            : 'Warm water - Fish early morning or evening, avoid hot hours',
          priority: 'high'
        });
      }
    }

    // Conseils basés sur le niveau d'eau
    if (riverData.niveau_eau_cm) {
      if (riverData.niveau_eau_cm < 30) {
        advice.push({
          type: 'water_level',
          icon: <Fish className="w-4 h-4" />,
          title: language === 'fr' ? 'Niveau d\'eau' : 'Water Level',
          message: language === 'fr'
            ? 'Niveau bas - Concentrez-vous sur les fosses profondes'
            : 'Low water level - Focus on deep pools',
          priority: 'medium'
        });
      } else if (riverData.niveau_eau_cm > 80) {
        advice.push({
          type: 'water_level',
          icon: <Fish className="w-4 h-4" />,
          title: language === 'fr' ? 'Niveau d\'eau' : 'Water Level',
          message: language === 'fr'
            ? 'Niveau élevé - Utilisez des mouches plus visibles et pêchez près des rives'
            : 'High water level - Use more visible flies and fish near banks',
          priority: 'medium'
        });
      }
    }

    // Conseils basés sur la météo
    if (weatherData && weatherData.current) {
      if (weatherData.current.windspeed > 25) {
        advice.push({
          type: 'wind',
          icon: <Wind className="w-4 h-4" />,
          title: language === 'fr' ? 'Conditions de vent' : 'Wind Conditions',
          message: language === 'fr'
            ? 'Vent fort - Pêchez dans les zones protégées et utilisez des lancers plus courts'
            : 'Strong wind - Fish in protected areas and use shorter casts',
          priority: 'medium'
        });
      }
    }

    // Conseils basés sur la saison
    const currentMonth = new Date().getMonth() + 1;
    if (currentMonth >= 6 && currentMonth <= 8) {
      advice.push({
        type: 'season',
        icon: <Calendar className="w-4 h-4" />,
        title: language === 'fr' ? 'Saison estivale' : 'Summer Season',
        message: language === 'fr'
          ? 'Été - Utilisez des mouches sèches et des émergences en fin de journée'
          : 'Summer - Use dry flies and emergers in late afternoon',
        priority: 'low'
      });
    }

    return advice;
  };

  // Conseils spécialisés par niveau
  const getLevelSpecificAdvice = () => {
    const advice = {
      beginner: [
        {
          type: 'technique',
          icon: <Fish className="w-4 h-4" />,
          title: language === 'fr' ? 'Technique débutant' : 'Beginner Technique',
          message: language === 'fr'
            ? 'Commencez par des mouches simples et des lancers courts'
            : 'Start with simple flies and short casts',
          priority: 'high'
        }
      ],
      intermediate: [
        {
          type: 'technique',
          icon: <Fish className="w-4 h-4" />,
          title: language === 'fr' ? 'Technique intermédiaire' : 'Intermediate Technique',
          message: language === 'fr'
            ? 'Expérimentez avec différentes tailles et couleurs de mouches'
            : 'Experiment with different fly sizes and colors',
          priority: 'medium'
        }
      ],
      expert: [
        {
          type: 'technique',
          icon: <Fish className="w-4 h-4" />,
          title: language === 'fr' ? 'Technique expert' : 'Expert Technique',
          message: language === 'fr'
            ? 'Affinez votre technique avec des mouches spécialisées et des présentations précises'
            : 'Refine your technique with specialized flies and precise presentations',
          priority: 'low'
        }
      ]
    };

    return advice[userLevel] || advice.intermediate;
  };

  // Envoyer un message à l'IA
  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    // Simuler une réponse IA
    setTimeout(() => {
      const aiResponse = generateAIResponse(inputMessage);
      const aiMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: aiResponse,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);
      setIsTyping(false);
    }, 1500);
  };

  // Générer une réponse IA basée sur le message
  const generateAIResponse = (message) => {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('mouche') || lowerMessage.includes('fly')) {
      return language === 'fr'
        ? `Pour la rivière ${riverData?.nom || 'cette rivière'}, je recommande des mouches sèches #12-16 en début de saison, et des nymphes #14-18 en profondeur. Les couleurs naturelles (brun, olive, noir) fonctionnent bien ici.`
        : `For ${riverData?.nom || 'this river'}, I recommend dry flies #12-16 early season, and nymphs #14-18 in depth. Natural colors (brown, olive, black) work well here.`;
    }
    
    if (lowerMessage.includes('technique') || lowerMessage.includes('technique')) {
      return language === 'fr'
        ? 'Pour cette rivière, utilisez des lancers en amont et laissez dériver naturellement. Surveillez les émergences en fin d\'après-midi. La pêche en nymphe sous indicateur est très efficace ici.'
        : 'For this river, use upstream casts and let drift naturally. Watch for emergences in late afternoon. Nymph fishing under indicator is very effective here.';
    }
    
    if (lowerMessage.includes('heure') || lowerMessage.includes('time')) {
      return language === 'fr'
        ? 'Les meilleures heures sont tôt le matin (6h-9h) et en soirée (18h-21h). Évitez les heures chaudes de midi. Les saumons sont plus actifs pendant ces périodes.'
        : 'Best times are early morning (6-9am) and evening (6-9pm). Avoid hot midday hours. Salmon are more active during these periods.';
    }
    
    return language === 'fr'
      ? 'Je suis votre conseiller IA spécialisé en pêche à la mouche. Posez-moi des questions sur les techniques, les mouches, les conditions ou tout autre aspect de la pêche !'
      : 'I am your AI advisor specialized in fly fishing. Ask me questions about techniques, flies, conditions or any other aspect of fishing!';
  };

  const automaticAdvice = generateAutomaticAdvice();
  const levelAdvice = getLevelSpecificAdvice();
  const allAdvice = [...automaticAdvice, ...levelAdvice];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      {/* En-tête */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {language === 'fr' ? 'Conseiller IA' : 'AI Advisor'}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {language === 'fr' ? 'Spécialiste pêche à la mouche' : 'Fly fishing specialist'}
            </p>
          </div>
        </div>
      </div>

      {/* Conseils automatiques */}
      {allAdvice.length > 0 && (
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
            {language === 'fr' ? 'Conseils automatiques' : 'Automatic Advice'}
          </h4>
          <div className="space-y-3">
            {allAdvice.map((advice, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border-l-4 ${
                  advice.priority === 'high' 
                    ? 'bg-red-50 dark:bg-red-900/20 border-red-400' 
                    : advice.priority === 'medium'
                    ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-400'
                    : 'bg-blue-50 dark:bg-blue-900/20 border-blue-400'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {advice.icon}
                  </div>
                  <div>
                    <h5 className="font-medium text-gray-900 dark:text-white text-sm">
                      {advice.title}
                    </h5>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {advice.message}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Chat IA */}
      <div className="p-6">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
          {language === 'fr' ? 'Posez vos questions' : 'Ask your questions'}
        </h4>
        
        {/* Messages */}
        <div className="space-y-4 mb-4 max-h-64 overflow-y-auto">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.type === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                }`}
              >
                <p className="text-sm">{message.content}</p>
                <p className="text-xs opacity-70 mt-1">
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-gray-100 dark:bg-gray-700 px-4 py-2 rounded-lg">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="flex gap-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder={language === 'fr' ? 'Posez une question...' : 'Ask a question...'}
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
          <button
            onClick={sendMessage}
            disabled={!inputMessage.trim() || isTyping}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

        {/* Suggestions rapides */}
        <div className="mt-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            {language === 'fr' ? 'Questions suggérées:' : 'Suggested questions:'}
          </p>
          <div className="flex flex-wrap gap-2">
            {[
              language === 'fr' ? 'Quelles mouches utiliser ?' : 'What flies to use?',
              language === 'fr' ? 'Meilleure technique ?' : 'Best technique?',
              language === 'fr' ? 'Meilleures heures ?' : 'Best times?',
              language === 'fr' ? 'Conditions actuelles ?' : 'Current conditions?'
            ].map((suggestion, index) => (
              <button
                key={index}
                onClick={() => setInputMessage(suggestion)}
                className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAdvisor;






