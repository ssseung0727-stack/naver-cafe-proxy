const axios = require('axios');

let cachedToken = null;
let tokenExpiresAt = 0;

async function getAccessToken() {
  if (cachedToken && Date.now() < tokenExpiresAt) {
    return cachedToken;
  }
  
  const response = await axios.post(
    'https://nid.naver.com/oauth2.0/token',
    null,
    {
      params: {
        grant_type: 'refresh_token',
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET,
        refresh_token: process.env.REFRESH_TOKEN
      }
    }
  );
  
  cachedToken = response.data.access_token;
  tokenExpiresAt = Date.now() + (3600 * 1000);
  return cachedToken;
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { action, menu_id, title, content, refresh_token } = req.body;

  try {
    // 1달 후 토큰 갱신 시 새 refresh_token 업데이트
    if (action === 'update_token') {
      process.env.REFRESH_TOKEN = refresh_token;
      cachedToken = null;
      return res.json({ success: true, message: '토큰 업데이트 완료!' });
    }

    if (action === 'post') {
      const accessToken = await getAccessToken();
      const club_id = process.env.CLUB_ID;
      const subject = encodeURIComponent(encodeURIComponent(title));
      const body = encodeURIComponent(encodeURIComponent(content));

      const response = await axios.post(
        `https://openapi.naver.com/v1/cafe/${club_id}/menu/${menu_id}/articles`,
        'subject='+subject+'&content='+body+'&openyn=true',
        {
          headers: {
            'Authorization': 'Bearer '+accessToken,
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );
      return res.json({ success: true, result: response.data.message.result });
    }

    res.status(400).json({ error: 'Invalid action' });

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
