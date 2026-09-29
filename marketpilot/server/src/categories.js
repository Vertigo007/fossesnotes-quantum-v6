// Facebook Marketplace "Item for sale" categories (Canada), with the FR and
// EN labels shown in the create-listing dropdown. The extension matches the
// dropdown option against both labels, so small wording changes on Facebook's
// side still resolve.

export const CATEGORIES = [
  { id: 'tools', fr: 'Outils', en: 'Tools', keywords: ['perceuse', 'drill', 'scie', 'saw', 'outil', 'dewalt', 'milwaukee', 'makita', 'ryobi', 'compresseur', 'tournevis', 'cle'] },
  { id: 'furniture', fr: 'Meubles', en: 'Furniture', keywords: ['sofa', 'divan', 'canape', 'table', 'chaise', 'chair', 'commode', 'dresser', 'lit', 'bed', 'bureau', 'desk', 'bibliotheque', 'etagere', 'ikea'] },
  { id: 'household', fr: 'Articles ménagers', en: 'Household', keywords: ['vaisselle', 'lampe', 'lamp', 'rideau', 'tapis', 'rug', 'decoration', 'miroir', 'mirror', 'casserole', 'poele'] },
  { id: 'garden', fr: 'Jardin', en: 'Garden', keywords: ['tondeuse', 'mower', 'jardin', 'garden', 'patio', 'bbq', 'barbecue', 'souffleuse', 'snowblower', 'pelle', 'boyau'] },
  { id: 'appliances', fr: 'Électroménagers', en: 'Appliances', keywords: ['frigo', 'refrigerateur', 'fridge', 'laveuse', 'secheuse', 'washer', 'dryer', 'four', 'oven', 'micro-onde', 'microwave', 'lave-vaisselle', 'dishwasher', 'aspirateur', 'vacuum'] },
  { id: 'video_games', fr: 'Jeux vidéo', en: 'Video Games', keywords: ['ps5', 'ps4', 'playstation', 'xbox', 'nintendo', 'switch', 'manette', 'controller', 'jeu video'] },
  { id: 'books_movies_music', fr: 'Livres, films et musique', en: 'Books, Movies & Music', keywords: ['livre', 'book', 'dvd', 'blu-ray', 'vinyle', 'vinyl', 'cd', 'bd', 'manga'] },
  { id: 'bags_luggage', fr: 'Sacs et bagages', en: 'Bags & Luggage', keywords: ['sac', 'bag', 'valise', 'luggage', 'backpack', 'sac a dos'] },
  { id: 'womens_clothing', fr: 'Vêtements et chaussures pour femmes', en: "Women's Clothing & Shoes", keywords: ['robe', 'dress', 'jupe', 'blouse', 'femme', 'women', 'escarpins', 'sacoche'] },
  { id: 'mens_clothing', fr: 'Vêtements et chaussures pour hommes', en: "Men's Clothing & Shoes", keywords: ['homme', 'men', 'chemise', 'veston', 'suit', 'cravate'] },
  { id: 'jewelry', fr: 'Bijoux et accessoires', en: 'Jewelry & Accessories', keywords: ['bague', 'ring', 'collier', 'necklace', 'montre', 'watch', 'bracelet', 'boucles'] },
  { id: 'health_beauty', fr: 'Santé et beauté', en: 'Health & Beauty', keywords: ['parfum', 'perfume', 'maquillage', 'makeup', 'seche-cheveux', 'dyson airwrap', 'rasoir'] },
  { id: 'pet_supplies', fr: 'Fournitures pour animaux', en: 'Pet Supplies', keywords: ['chien', 'dog', 'chat', 'cat', 'cage', 'aquarium', 'litiere'] },
  { id: 'baby_kids', fr: 'Bébés et enfants', en: 'Baby & Kids', keywords: ['bebe', 'baby', 'poussette', 'stroller', 'siege auto', 'car seat', 'couchette', 'crib', 'enfant'] },
  { id: 'toys_games', fr: 'Jouets et jeux', en: 'Toys & Games', keywords: ['lego', 'jouet', 'toy', 'jeu de societe', 'board game', 'poupee', 'playmobil'] },
  { id: 'electronics', fr: 'Électronique et ordinateurs', en: 'Electronics & Computers', keywords: ['ordinateur', 'computer', 'laptop', 'portable', 'macbook', 'ecran', 'monitor', 'tv', 'television', 'camera', 'appareil photo', 'ipad', 'tablette', 'haut-parleur', 'speaker', 'casque', 'headphones', 'gpu', 'drone'] },
  { id: 'mobile_phones', fr: 'Téléphones mobiles', en: 'Mobile Phones', keywords: ['iphone', 'samsung galaxy', 'pixel', 'cellulaire', 'telephone', 'phone'] },
  { id: 'bicycles', fr: 'Vélos', en: 'Bicycles', keywords: ['velo', 'bike', 'bicycle', 'vtt', 'trek', 'specialized', 'giant', 'ebike'] },
  { id: 'arts_crafts', fr: 'Arts et artisanat', en: 'Arts & Crafts', keywords: ['peinture', 'toile', 'canvas', 'tricot', 'couture', 'machine a coudre', 'cricut'] },
  { id: 'sports_outdoors', fr: 'Sports et activités de plein air', en: 'Sports & Outdoors', keywords: ['ski', 'planche', 'snowboard', 'hockey', 'patin', 'golf', 'kayak', 'canot', 'tente', 'camping', 'peche', 'fishing', 'canne', 'moulinet', 'halteres', 'gym', 'tapis roulant'] },
  { id: 'auto_parts', fr: 'Pièces automobiles', en: 'Auto Parts', keywords: ['pneu', 'tire', 'jante', 'rim', 'mags', 'piece auto', 'batterie auto'] },
  { id: 'musical_instruments', fr: 'Instruments de musique', en: 'Musical Instruments', keywords: ['guitare', 'guitar', 'piano', 'clavier', 'batterie', 'drum', 'ampli', 'amp', 'violon', 'micro'] },
  { id: 'antiques_collectibles', fr: 'Antiquités et objets de collection', en: 'Antiques & Collectibles', keywords: ['antique', 'collection', 'vintage', 'cartes', 'pokemon', 'hockey cards', 'monnaie'] },
  { id: 'garage_sale', fr: 'Vente-débarras', en: 'Garage Sale', keywords: ['lot', 'vente de garage', 'garage sale'] },
  { id: 'misc', fr: 'Divers', en: 'Miscellaneous', keywords: [] },
];

export const CONDITIONS = [
  { id: 'new', fr: 'Neuf', en: 'New' },
  { id: 'used_like_new', fr: 'Usagé – comme neuf', en: 'Used - Like New' },
  { id: 'used_good', fr: 'Usagé – bon état', en: 'Used - Good' },
  { id: 'used_fair', fr: 'Usagé – état passable', en: 'Used - Fair' },
];

export const CATEGORY_IDS = CATEGORIES.map((c) => c.id);
export const CONDITION_IDS = CONDITIONS.map((c) => c.id);

export function getCategory(id) {
  return CATEGORIES.find((c) => c.id === id) || CATEGORIES.find((c) => c.id === 'misc');
}

export function getCondition(id) {
  return CONDITIONS.find((c) => c.id === id) || CONDITIONS[2];
}

const strip = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

/** Keyword fallback when the AI is unavailable. */
export function guessCategory(text) {
  const hay = ` ${strip(text)} `;
  let best = { id: 'misc', score: 0 };
  for (const cat of CATEGORIES) {
    const score = cat.keywords.reduce((s, k) => (hay.includes(` ${k}`) ? s + k.length : s), 0);
    if (score > best.score) best = { id: cat.id, score };
  }
  return best.id;
}
