import fetch from 'node-fetch';

interface TokenCache {
  token: string;
  expiresAt: number;
}

let cache: TokenCache | null = null;

const SANDBOX_URL = 'https://api.sandbox.ebay.com/identity/v1/oauth2/token';
const PRODUCTION_URL = 'https://api.ebay.com/identity/v1/oauth2/token';

export async function getEbayToken(appId: string, certId: string, sandbox: boolean): Promise<string> {
  if (cache && cache.expiresAt > Date.now() + 60_000) {
    return cache.token;
  }

  const url = sandbox ? SANDBOX_URL : PRODUCTION_URL;
  const credentials = Buffer.from(`${appId}:${certId}`).toString('base64');

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials&scope=https%3A%2F%2Fapi.ebay.com%2Foauth%2Fapi_scope',
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`eBay OAuth failed (${res.status}): ${text}`);
  }

  const data = (await res.json()) as { access_token: string; expires_in: number };

  cache = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };

  return cache.token;
}

export function clearEbayTokenCache(): void {
  cache = null;
}
