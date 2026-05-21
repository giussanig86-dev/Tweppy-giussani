const express = require('express');
const { createGraphClient } = require('../graph/graphClient');
const { getListItems } = require('../graph/sharepoint');

const router = express.Router();
const LIST = 'Ruoli_Utenti';

router.get('/me', async (req, res) => {
  try {
    const client = createGraphClient(req.graphToken);
    const me = await client.api('/me').select('mail,displayName,userPrincipalName').get();
    const email = (me.mail || me.userPrincipalName || '').toLowerCase();

    const items = await getListItems(req.graphToken, LIST).catch(() => []);
    const utente = items.find(u => u.email?.toLowerCase() === email);

    res.json({
      email,
      nome: me.displayName || email,
      ruolo: utente?.ruolo || 'admin', // primo utente è sempre admin
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
