// Claude-powered steps: identify the item from photos, write the ad in
// Marketplace style, judge which comparables are the same item, and draft
// replies to buyers.

import Anthropic from '@anthropic-ai/sdk';
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';
import { z } from 'zod';
import { CATEGORIES, CONDITIONS, CATEGORY_IDS, CONDITION_IDS, guessCategory } from './categories.js';

export class AIRefusalError extends Error {}

const ItemAnalysis = z.object({
  itemName: z.string().describe('Nom court et précis de l’article, comme un acheteur le chercherait'),
  brand: z.string().nullable(),
  model: z.string().nullable(),
  categoryId: z.string().describe(`Un de : ${CATEGORY_IDS.join(', ')}`),
  conditionId: z.string().describe(`Un de : ${CONDITION_IDS.join(', ')}`),
  conditionNotes: z.string().describe('Défauts visibles ou signes d’usure, vide si aucun'),
  keyAttributes: z.array(z.object({ name: z.string(), value: z.string() })),
  searchQueries: z.array(z.string()).describe('2 à 4 recherches Marketplace pour trouver des articles identiques, du plus précis au plus large'),
  estimatedRetailPrice: z.number().nullable().describe('Prix neuf approximatif en CAD, null si inconnu'),
  coverPhotoIndex: z.number().int().describe('Index (0-based) de la meilleure photo pour la couverture'),
  photoTips: z.array(z.string()).describe('Conseils concrets pour améliorer les photos, max 3'),
  policyWarnings: z.array(z.string()).describe('Problèmes potentiels avec les règles de commerce de Facebook (contrefaçon, article interdit, rappel), vide sinon'),
});

const ListingCopy = z.object({
  title: z.string().describe('Titre Marketplace, 65 caractères max'),
  description: z.string(),
  alternateTitles: z.array(z.string()).describe('3 variantes de titre pour republier l’annonce plus tard'),
});

const ComparableMatches = z.object({
  matches: z.array(z.object({
    index: z.number().int(),
    match: z.enum(['identical', 'similar', 'different']),
  })),
});

const BuyerReply = z.object({
  reply: z.string(),
  intent: z.enum(['availability', 'negotiation', 'lowball', 'logistics', 'question', 'scam_risk', 'other']),
  scamSignals: z.array(z.string()),
});

const MARKETPLACE_STYLE = `Tu rédiges des annonces Facebook Marketplace pour un vendeur particulier au Québec.
Style des annonces qui vendent sur Marketplace :
- Titre : marque + modèle + caractéristique clé (taille, capacité, couleur). Pas de majuscules criardes, pas d'emoji, pas de "À VENDRE".
- Description courte et directe, comme écrite par une vraie personne : 1 phrase d'accroche, puis les détails utiles en lignes courtes (état honnête, dimensions/specs, ce qui est inclus, raison de la vente si naturelle).
- Termine par la logistique : secteur de ramassage, livraison si offerte, mode de paiement (comptant ou virement Interac), "Premier arrivé, premier servi" si pertinent.
- En français québécois naturel (ex. "Ramassage à", "comme neuf", "fonctionne parfaitement", "pas sérieux s'abstenir" seulement si le ton est ferme). Pas de phrases marketing ni de superlatifs vides.
- N'invente jamais de caractéristiques : si une info n'est pas fournie ni visible, ne la mentionne pas.
- N'inclus jamais de numéro de téléphone, courriel, adresse exacte ni lien externe (Facebook retire ces annonces).`;

const categoryList = CATEGORIES.map((c) => `${c.id} = ${c.fr}`).join('\n');
const conditionList = CONDITIONS.map((c) => `${c.id} = ${c.fr}`).join('\n');

export class ListingAI {
  /** @param {{client?: Anthropic, model?: string}} opts */
  constructor({ client, model = 'claude-opus-5-5' } = {}) {
    this.client = client || new Anthropic();
    this.model = model;
  }

  async #parse({ system, content, format, effort = 'medium', maxTokens = 16000 }) {
    const response = await this.client.beta.messages.parse({
      model: this.model,
      max_tokens: maxTokens,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort, format },
      system,
      messages: [{ role: 'user', content }],
    });
    if (response.stop_reason === 'refusal') {
      throw new AIRefusalError(response.stop_details?.explanation || 'La demande a été refusée par le modèle.');
    }
    if (!response.parsed_output) {
      throw new Error(`Réponse IA invalide (stop_reason=${response.stop_reason}).`);
    }
    return response.parsed_output;
  }

  /**
   * @param {{images: Array<{mediaType: string, data: string}>, notes?: string}} input
   */
  async analyzeItem({ images, notes = '' }) {
    const content = [
      ...images.map((img) => ({ type: 'image', source: { type: 'base64', media_type: img.mediaType, data: img.data } })),
      {
        type: 'text',
        text: `Identifie l'article à vendre sur ces photos (index 0 à ${images.length - 1}).
Notes du vendeur (prioritaires sur ce que tu déduis) : ${notes || '(aucune)'}

Catégories possibles :
${categoryList}

États possibles :
${conditionList}`,
      },
    ];
    const item = await this.#parse({
      system: 'Tu es un expert en revente d’articles usagés au Canada. Tu identifies précisément les articles (marque, modèle, génération) à partir de photos, sans inventer ce qui n’est pas visible.',
      content,
      format: betaZodOutputFormat(ItemAnalysis),
    });
    if (!CATEGORY_IDS.includes(item.categoryId)) item.categoryId = guessCategory(`${item.itemName} ${item.brand || ''}`);
    if (!CONDITION_IDS.includes(item.conditionId)) item.conditionId = 'used_good';
    if (!(item.coverPhotoIndex >= 0 && item.coverPhotoIndex < images.length)) item.coverPhotoIndex = 0;
    return item;
  }

  /**
   * @param {{item: object, price: number, negotiable?: boolean, pickupArea?: string,
   *          delivery?: boolean, extraNotes?: string, tone?: 'friendly'|'firm'|'short', lang?: 'fr'|'en',
   *          avoidTitles?: string[]}} input
   */
  async writeListing(input) {
    const { item, price, negotiable = true, pickupArea = '', delivery = false, extraNotes = '', tone = 'friendly', lang = 'fr', avoidTitles = [] } = input;
    const text = `Rédige l'annonce.
Langue : ${lang === 'en' ? 'anglais (Canada)' : 'français québécois'}
Ton : ${{ friendly: 'amical et chaleureux', firm: 'direct et ferme', short: 'très court, style liste' }[tone] || tone}
Prix : ${price} $ ${negotiable ? '(négociable — ne pas l’écrire en gros, juste "prix discutable" à la fin)' : '(prix ferme)'}
Secteur de ramassage : ${pickupArea || '(non précisé — ne pas en inventer)'}
Livraison possible : ${delivery ? 'oui, selon la distance' : 'non'}
Notes du vendeur : ${extraNotes || '(aucune)'}
${avoidTitles.length ? `Titres déjà utilisés (en proposer un différent) : ${avoidTitles.join(' | ')}` : ''}

Article analysé :
${JSON.stringify(item, null, 2)}`;
    return this.#parse({ system: MARKETPLACE_STYLE, content: [{ type: 'text', text }], format: betaZodOutputFormat(ListingCopy) });
  }

  /**
   * @param {{item: object, comparables: Array<{title: string, price: number}>}} input
   */
  async matchComparables({ item, comparables }) {
    if (!comparables.length) return { matches: [] };
    const lines = comparables.map((c, i) => `${i}. ${c.title} — ${c.price} $`).join('\n');
    const text = `Article vendu : ${item.itemName}${item.brand ? ` (marque ${item.brand})` : ''}${item.model ? ` modèle ${item.model}` : ''}.
Pour chaque annonce ci-dessous, indique :
- identical : même article (même modèle/génération/capacité)
- similar : même type d'article, comparable pour le prix (modèle voisin, autre marque équivalente)
- different : autre chose (accessoire seul, pièce, lot, article différent, annonce de recherche)

${lines}`;
    return this.#parse({
      system: 'Tu compares des annonces Marketplace pour établir un prix de revente juste.',
      content: [{ type: 'text', text }],
      format: betaZodOutputFormat(ComparableMatches),
      effort: 'low',
    });
  }

  /**
   * @param {{listing: object, buyerMessage: string, floorPrice?: number, lang?: string}} input
   */
  async draftReply({ listing, buyerMessage, floorPrice, lang = 'fr' }) {
    const text = `Annonce : ${listing.title} — ${listing.price} $ (plancher confidentiel : ${floorPrice ?? 'non défini'} $ — ne jamais le révéler, ne jamais accepter en dessous).
Secteur : ${listing.pickupArea || 'non précisé'}
Message de l'acheteur : """${buyerMessage}"""

Rédige une réponse courte (1 à 3 phrases), ${lang === 'en' ? 'en anglais' : 'en français québécois'}, naturelle, qui fait avancer la vente (proposer un moment de ramassage).
Si c'est une offre sous le plancher, fais une contre-offre polie au-dessus du plancher.
Signale les signaux d'arnaque (paiement hors plateforme étrange, code de vérification, livreur, chèque, lien externe).`;
    return this.#parse({
      system: 'Tu aides un vendeur Marketplace à répondre vite et poliment aux acheteurs, en protégeant son prix et sa sécurité.',
      content: [{ type: 'text', text }],
      format: betaZodOutputFormat(BuyerReply),
      effort: 'low',
      maxTokens: 4000,
    });
  }
}
