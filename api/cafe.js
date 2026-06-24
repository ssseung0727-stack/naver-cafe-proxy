const axios = require('axios');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { action, access_token, refresh_token, club_id, menu_id, title, content, client_id, client_secret } = req.body;

  try {
    if (action === 'refresh') {
      const response = await axios.post(
        'https://nid.naver.com/oauth2.0/token',
        null,
        {
          params: {
            grant_type: 'refresh_token',
            client_id,
            client_secret,
            refresh_token
          }
        }
      );
      return res.json({ access_token: response.data.access_token });
    }

    if (action === 'post') {
      const subject = encodeURIComponent(encodeURIComponent(title));
      const body = encodeURIComponent(encodeURIComponent(content));

      const response = await axios.post(
        `https://openapi.naver.com/v1/cafe/${club_id}/menu/${menu_id}/articles`,
        'subject='+subject+'&content='+body+'&openyn=true',
        {
          headers: {
            'Authorization': 'Bearer '+access_token,
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
