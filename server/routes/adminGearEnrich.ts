import { Router, type Request, type Response } from 'express';
import { Type } from '@google/genai';
import { requireAdmin } from '../middleware/adminAuth.js';
import { ai } from '../lib/gemini.js';
import { retryWithBackoff, isRetryableError } from '../utils/retry.js';

const router = Router();

const GEMINI_TIMEOUT_MS = 90_000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Gemini request timed out after ${ms / 1000}s`)), ms)
    ),
  ]);
}

async function handleEnrich(req: Request, res: Response) {
  const { brand, model, category } = req.body;

  if (!brand || typeof brand !== 'string' || !brand.trim()) {
    res.status(400).json({ error: 'Missing or empty brand' });
    return;
  }
  if (!model || typeof model !== 'string' || !model.trim()) {
    res.status(400).json({ error: 'Missing or empty model' });
    return;
  }

  const categoryHint = (category && typeof category === 'string') ? category.trim() : 'unknown';

  const response = await withTimeout(retryWithBackoff(() => ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: {
      parts: [
        {
          text: `You are an expert audio equipment database curator. Return detailed information about this specific piece of audio equipment:

Brand: ${brand.trim()}
Model: ${model.trim()}
Category hint: ${categoryHint}

Return a JSON object with:
- category: one of: turntable, cartridge, phono_preamp, preamp, amplifier, receiver, speakers, headphones, dac, subwoofer, cables_other
- year: release year or approximate era as string e.g. '1978' or 'Late 1970s'
- description: 2-3 sentences about this gear — when it was made, what it's known for, its reputation in the audiophile community
- specs: object with category-appropriate key/value pairs (all values as strings):
  turntable: drive_type, speeds, tonearm, platter_material, motor_type
  amplifier/receiver: power_output, amplifier_type, inputs, outputs, thd
  speakers: type, driver_size, impedance, sensitivity, frequency_response
  headphones: type, driver_size, impedance, sensitivity, frequency_response
  cartridge: type, output_voltage, stylus_type, frequency_response, tracking_force
  dac: inputs, outputs, sample_rate, bit_depth, chip
  phono_preamp/preamp: gain, inputs, outputs, impedance, snr
  subwoofer: driver_size, power, frequency_response, inputs
  Use your judgment for other categories.
- confidence: 0.0 to 1.0

If you don't recognize the equipment, return confidence: 0 and empty/null fields.`,
        },
      ],
    },
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          category: { type: Type.STRING, nullable: true },
          year: { type: Type.STRING, nullable: true },
          description: { type: Type.STRING, nullable: true },
          specs: { type: Type.OBJECT, nullable: true },
          confidence: { type: Type.NUMBER },
        },
        required: ['category', 'year', 'description', 'specs', 'confidence'],
      },
    },
  })), GEMINI_TIMEOUT_MS);

  const raw = response.text || '{}';
  let data: Record<string, unknown>;
  try {
    data = JSON.parse(raw);
  } catch {
    console.error('[admin-gear-enrich] Failed to parse Gemini response:', raw);
    res.status(500).json({ error: 'Failed to parse AI response' });
    return;
  }

  const confidence = typeof data.confidence === 'number' ? data.confidence : 0;

  if (confidence === 0) {
    res.status(422).json({ error: 'Gear not recognized — try different brand/model' });
    return;
  }

  res.json({
    category: data.category || null,
    year: data.year || null,
    description: data.description || null,
    specs: (data.specs && typeof data.specs === 'object') ? data.specs : null,
    confidence,
  });
}

router.post('/api/admin/gear-catalog/enrich', requireAdmin, async (req, res, next) => {
  try {
    await handleEnrich(req, res);
  } catch (error) {
    console.error('[admin-gear-enrich] Error:', error instanceof Error ? error.message : error);
    const msg = error instanceof Error ? error.message : '';
    if (msg.includes('timed out')) {
      res.status(504).json({ error: 'AI enrichment timed out. Please try again.' });
    } else if (isRetryableError(error)) {
      res.status(503).json({ error: 'AI service is temporarily busy. Please try again in a moment.' });
    } else {
      res.status(500).json({ error: 'Enrichment failed' });
    }
  }
});

export default router;
