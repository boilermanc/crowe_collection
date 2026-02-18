import { Router } from 'express';
import { Type } from '@google/genai';
import { requireAuthWithUser, type AuthResult } from '../middleware/auth.js';
import { createRateLimit } from '../middleware/rateLimit.js';
import { sanitizePromptInput } from '../middleware/sanitize.js';
import { ai } from '../lib/gemini.js';
import { requirePlan } from '../lib/subscription.js';

const router = Router();

function buildSearchUrl(brand: string, model: string): string {
  const q = encodeURIComponent(`${brand} ${model} owner manual PDF`);
  return `https://www.google.com/search?q=${q}`;
}

router.post(
  '/api/find-manual',
  requireAuthWithUser,
  createRateLimit(10, 60),
  async (req, res) => {
    const { userId } = (req as typeof req & { auth: AuthResult }).auth;

    // Curator+ only
    const sub = await requirePlan(userId, 'curator', res);
    if (!sub) return;

    try {
      const { brand, model, category, manual_search_query } = req.body;

      if (!brand || typeof brand !== 'string' || !brand.trim()) {
        res.status(400).json({ error: 'Missing or empty brand' });
        return;
      }
      if (!model || typeof model !== 'string' || !model.trim()) {
        res.status(400).json({ error: 'Missing or empty model' });
        return;
      }

      const safeBrand = sanitizePromptInput(brand.trim(), 100);
      const safeModel = sanitizePromptInput(model.trim(), 200);
      const safeCategory = category ? sanitizePromptInput(String(category).trim(), 50) : '';
      const safeQuery = manual_search_query ? sanitizePromptInput(String(manual_search_query).trim(), 300) : '';

      const searchFallback = buildSearchUrl(brand.trim(), model.trim());

      const categoryHint = safeCategory ? `\nCategory: ${safeCategory}` : '';
      const queryHint = safeQuery ? `\nAdditional search hint: ${safeQuery}` : '';

      const prompt = `Find the most likely URL for the official owner's manual or user guide PDF for this audio equipment:

Brand: ${safeBrand}
Model: ${safeModel}${categoryHint}${queryHint}

Prioritize sources in this order:
1. Manufacturer's official support/downloads page
2. Well-known manual archive sites: manualslib.com, hifi-engine.com, vinylengine.com
3. Other reputable sources with direct PDF links

Return JSON with:
- manual_url: the single best URL for the manual (string, or null if you're not confident one exists)
- source: a short label for where the URL comes from, e.g. "Manufacturer website", "ManualsLib", "HiFi Engine", "VinylEngine" (string)
- confidence: your confidence that the URL is correct and leads to the actual manual — "high", "medium", or "low" (string)
- alternative_urls: up to 3 other possible source URLs (array of strings, can be empty)
- search_url: a Google search URL as fallback: "${searchFallback}"

Important: Only return URLs you are confident actually exist. If unsure, set manual_url to null and provide the search_url fallback.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              manual_url: { type: Type.STRING, nullable: true },
              source: { type: Type.STRING },
              confidence: { type: Type.STRING },
              alternative_urls: { type: Type.ARRAY, items: { type: Type.STRING } },
              search_url: { type: Type.STRING },
            },
            required: ['manual_url', 'source', 'confidence', 'alternative_urls', 'search_url'],
          },
        },
      });

      const raw = response.text || '{}';
      let data: Record<string, unknown>;
      try {
        data = JSON.parse(raw);
      } catch {
        console.error('Failed to parse Gemini find-manual response:', raw);
        // Return fallback so user isn't stuck
        res.status(200).json({
          manual_url: null,
          source: '',
          confidence: 'low',
          alternative_urls: [],
          search_url: searchFallback,
        });
        return;
      }

      // Validate & normalize
      const manualUrl = typeof data.manual_url === 'string' && data.manual_url.trim()
        ? data.manual_url.trim()
        : null;
      const source = typeof data.source === 'string' ? data.source : '';
      const confidence = ['high', 'medium', 'low'].includes(data.confidence as string)
        ? data.confidence as string
        : 'low';
      const alternativeUrls = Array.isArray(data.alternative_urls)
        ? (data.alternative_urls as unknown[])
            .filter((u): u is string => typeof u === 'string' && u.trim().length > 0)
            .slice(0, 3)
        : [];
      const searchUrl = typeof data.search_url === 'string' && data.search_url.trim()
        ? data.search_url.trim()
        : searchFallback;

      res.status(200).json({
        manual_url: manualUrl,
        source,
        confidence,
        alternative_urls: alternativeUrls,
        search_url: searchUrl,
      });
    } catch (error) {
      console.error('Find Manual Error:', error);
      res.status(500).json({ error: 'Failed to find manual' });
    }
  }
);

export default router;
