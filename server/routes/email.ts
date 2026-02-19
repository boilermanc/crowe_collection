import { Router, type Request, type Response } from 'express';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { Resend } from 'resend';
import { requireAdmin } from '../middleware/adminAuth.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const router = Router();

const VALID_TEMPLATE_IDS = ['light', 'orange', 'dark-blue'] as const;
type TemplateId = (typeof VALID_TEMPLATE_IDS)[number];

const TEMPLATE_FILE_MAP: Record<TemplateId, string> = {
  light: 'email-template-light.html',
  orange: 'email-template-orange.html',
  'dark-blue': 'email-template-dark-blue.html',
};

function isValidTemplateId(id: string): id is TemplateId {
  return VALID_TEMPLATE_IDS.includes(id as TemplateId);
}

function readTemplate(templateId: TemplateId): string {
  const filePath = join(__dirname, '..', 'templates', 'email', TEMPLATE_FILE_MAP[templateId]);
  return readFileSync(filePath, 'utf-8');
}

function processTemplate(html: string, variables: Record<string, string>): string {
  let result = html;
  // Replace {{year}} with current year
  result = result.replace(/\{\{year\}\}/g, new Date().getFullYear().toString());
  // Replace all other {{variable}} placeholders
  for (const [key, value] of Object.entries(variables)) {
    const pattern = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    result = result.replace(pattern, value);
  }
  return result;
}

// ── GET /api/email/templates/:templateId ─────────────────────────────
// Returns raw HTML template file — no auth required
router.get('/api/email/templates/:templateId', (req: Request, res: Response) => {
  const templateId = req.params.templateId as string;

  if (!isValidTemplateId(templateId)) {
    res.status(404).json({ error: 'Template not found. Valid IDs: light, orange, dark-blue' });
    return;
  }

  try {
    const html = readTemplate(templateId);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (err) {
    console.error(`[email] Failed to read template "${templateId}":`, err);
    res.status(500).json({ error: 'Failed to read template file' });
  }
});

// ── POST /api/email/send-test ────────────────────────────────────────
// Processes template with variables, sends via Resend — requires admin auth
router.post('/api/email/send-test', requireAdmin, async (req: Request, res: Response) => {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    res.status(500).json({ error: 'RESEND_API_KEY not configured' });
    return;
  }

  const { templateId, variables, to, subject } = req.body;

  if (!templateId || !isValidTemplateId(templateId)) {
    res.status(400).json({ error: 'Valid templateId required (light, orange, dark-blue)' });
    return;
  }

  if (!variables || typeof variables !== 'object') {
    res.status(400).json({ error: 'variables object required' });
    return;
  }

  if (!to || typeof to !== 'string') {
    res.status(400).json({ error: 'to (email address) is required' });
    return;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    res.status(400).json({ error: 'Invalid email address' });
    return;
  }

  if (!subject || typeof subject !== 'string') {
    res.status(400).json({ error: 'subject is required' });
    return;
  }

  try {
    const rawHtml = readTemplate(templateId);
    const processedHtml = processTemplate(rawHtml, variables);

    const resend = new Resend(resendKey);
    const result = await resend.emails.send({
      from: 'Rekkrd <onboarding@resend.dev>',
      to: [to],
      subject,
      html: processedHtml,
    });

    if (result.error) {
      res.status(400).json({ error: result.error.message, details: result.error });
      return;
    }

    res.status(200).json({
      success: true,
      id: result.data?.id,
      from: 'Rekkrd <onboarding@resend.dev>',
      to: [to],
      subject,
      created_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error(`[email] Failed to send test email:`, err);
    res.status(500).json({ error: 'Failed to send test email' });
  }
});

export default router;
