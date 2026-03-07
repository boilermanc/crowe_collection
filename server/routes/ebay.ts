import { Router, Request, Response } from 'express';
import crypto from 'crypto';

const router = Router();

const ENDPOINT_URL = 'https://rekkrd.com/api/ebay/account-deletion';

// GET — eBay challenge verification handshake
router.get('/account-deletion', (req: Request, res: Response) => {
  const challengeCode = req.query.challenge_code as string;
  const verificationToken = process.env.EBAY_VERIFICATION_TOKEN;

  if (!challengeCode || !verificationToken) {
    res.status(400).json({ error: 'Missing challenge_code or verification token' });
    return;
  }

  const hash = crypto
    .createHash('sha256')
    .update(challengeCode + verificationToken + ENDPOINT_URL)
    .digest('hex');

  res.status(200).json({ challengeResponse: hash });
});

// POST — eBay account deletion notification
router.post('/account-deletion', (req: Request, res: Response) => {
  console.log('eBay account deletion notification:', JSON.stringify(req.body));
  res.status(200).end();
});

// All other methods
router.all('/account-deletion', (_req: Request, res: Response) => {
  res.status(405).json({ error: 'Method not allowed' });
});

export default router;
