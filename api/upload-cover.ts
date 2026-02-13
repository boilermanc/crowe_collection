import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export const config = {
  maxDuration: 30,
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: 'Supabase not configured' });
  }

  try {
    const { imageUrl, albumId } = req.body;
    if (!imageUrl || !albumId || typeof imageUrl !== 'string' || typeof albumId !== 'string') {
      return res.status(400).json({ error: 'Missing imageUrl or albumId' });
    }

    // Download the image from the external URL
    const imageResp = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'CroweCollection/1.0',
        'Accept': 'image/*',
      },
      redirect: 'follow',
    });

    if (!imageResp.ok) {
      return res.status(502).json({ error: 'Failed to fetch image from source' });
    }

    const contentType = imageResp.headers.get('content-type') || 'image/jpeg';
    const buffer = Buffer.from(await imageResp.arrayBuffer());
    const ext = contentType.includes('png') ? 'png' : 'jpg';
    const fileName = `covers/${albumId}-${Date.now()}.${ext}`;

    // Upload to Supabase Storage
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { error: uploadError } = await supabase.storage
      .from('album-photos')
      .upload(fileName, buffer, { contentType, upsert: false });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return res.status(500).json({ error: 'Failed to upload to storage' });
    }

    const { data: { publicUrl } } = supabase.storage
      .from('album-photos')
      .getPublicUrl(fileName);

    // Update the album's cover_url in the database
    const { error: dbError } = await supabase
      .from('albums')
      .update({ cover_url: publicUrl })
      .eq('id', albumId);

    if (dbError) {
      console.error('DB update error:', dbError);
      return res.status(500).json({ error: 'Failed to update album' });
    }

    return res.status(200).json({ publicUrl });
  } catch (error) {
    console.error('Upload cover error:', error);
    return res.status(500).json({ error: 'Failed to upload cover' });
  }
}
