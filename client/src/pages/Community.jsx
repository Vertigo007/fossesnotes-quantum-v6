import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Users, MessageCircle, Heart, Share, Plus } from 'lucide-react';

const Community = () => {
  const { language } = useLanguage();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {language === 'fr' ? 'Communauté' : 'Community'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {language === 'fr' 
              ? 'Connectez-vous avec d\'autres pêcheurs passionnés'
              : 'Connect with other passionate anglers'
            }
          </p>
        </div>

        <div className="mb-6">
          <button className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            {language === 'fr' ? 'Nouveau post' : 'New Post'}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="space-y-6">
              {[
                {
                  author: 'Michel Dubois',
                  avatar: 'M',
                  time: language === 'fr' ? 'Il y a 2 heures' : '2 hours ago',
                  content: language === 'fr' 
                    ? 'Excellente journée sur la Miramichi aujourd\'hui ! 3 belles prises de saumon. Les conditions étaient parfaites.'
                    : 'Great day on the Miramichi today! 3 beautiful salmon catches. Conditions were perfect.',
                  likes: 24,
                  comments: 8,
                  image: null
                },
                {
                  author: 'Sophie Tremblay',
                  avatar: 'S',
                  time: language === 'fr' ? 'Il y a 5 heures' : '5 hours ago',
                  content: language === 'fr'
                    ? 'Quelqu\'un a des conseils pour la pêche à la truite sur la Restigouche ?'
                    : 'Anyone have tips for trout fishing on the Restigouche?',
                  likes: 12,
                  comments: 15,
                  image: null
                }
              ].map((post, index) => (
                <div key={index} className="card">
                  <div className="flex items-start space-x-3 mb-4">
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                      {post.avatar}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900 dark:text-white">{post.author}</h3>
                        <span className="text-sm text-gray-500 dark:text-gray-400">{post.time}</span>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-gray-700 dark:text-gray-300 mb-4">{post.content}</p>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center space-x-4">
                      <button className="flex items-center space-x-1 text-gray-500 dark:text-gray-400 hover:text-red-500">
                        <Heart className="w-4 h-4" />
                        <span className="text-sm">{post.likes}</span>
                      </button>
                      <button className="flex items-center space-x-1 text-gray-500 dark:text-gray-400 hover:text-blue-500">
                        <MessageCircle className="w-4 h-4" />
                        <span className="text-sm">{post.comments}</span>
                      </button>
                    </div>
                    <button className="flex items-center space-x-1 text-gray-500 dark:text-gray-400 hover:text-green-500">
                      <Share className="w-4 h-4" />
                      <span className="text-sm">{language === 'fr' ? 'Partager' : 'Share'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {language === 'fr' ? 'Statistiques' : 'Statistics'}
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">{language === 'fr' ? 'Membres' : 'Members'}</span>
                  <span className="font-semibold">1,247</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">{language === 'fr' ? 'Posts aujourd\'hui' : 'Posts today'}</span>
                  <span className="font-semibold">23</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">{language === 'fr' ? 'En ligne' : 'Online'}</span>
                  <span className="font-semibold text-green-600">89</span>
                </div>
              </div>
            </div>

            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {language === 'fr' ? 'Membres actifs' : 'Active Members'}
              </h3>
              <div className="space-y-3">
                {[
                  { name: 'Michel Dubois', status: 'online', avatar: 'M' },
                  { name: 'Sophie Tremblay', status: 'online', avatar: 'S' },
                  { name: 'Jean-Pierre Bouchard', status: 'offline', avatar: 'J' }
                ].map((member, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="relative">
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                        {member.avatar}
                      </div>
                      <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
                        member.status === 'online' ? 'bg-green-500' : 'bg-gray-400'
                      }`}></div>
                    </div>
                    <span className="text-sm text-gray-700 dark:text-gray-300">{member.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Community; 