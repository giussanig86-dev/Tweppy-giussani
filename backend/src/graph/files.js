const { createGraphClient } = require('./graphClient');
const { buildClientFolderPath, sanitizeFileName, SCHEMA_CARTELLE } = require('../utils/fileUtils');

const SITE_ID = process.env.SHAREPOINT_SITE_ID;

let cachedDriveId = null;

async function getDriveId(client) {
  if (cachedDriveId) return cachedDriveId;
  const drives = await client.api(`/sites/${SITE_ID}/drives`).get();
  const doc = drives.value.find((d) => d.name === 'Documenti') || drives.value[0];
  cachedDriveId = doc.id;
  return cachedDriveId;
}

async function saveClientDocument(accessToken, { buffer, originalname, tipoDocumento, ragioneSociale }) {
  const client = createGraphClient(accessToken);
  const driveId = await getDriveId(client);

  const folder = buildClientFolderPath(ragioneSociale, tipoDocumento);
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const safeName = sanitizeFileName(originalname);
  const fileName = `${date}_${tipoDocumento}_${safeName}`;

  await client
    .api(`/sites/${SITE_ID}/drives/${driveId}/root:/${folder}/${fileName}:/content`)
    .put(buffer);

  return { folder, fileName };
}

async function createClientFolders(accessToken, ragioneSociale) {
  const client = createGraphClient(accessToken);
  const driveId = await getDriveId(client);
  const safe = sanitizeFileName(ragioneSociale.replace(/[/\\?%*:|"<>]/g, '-').trim());
  const rootPath = `01 - Clienti/Cliente - ${safe}`;
  const risultati = { creato: [], esistente: [], errore: [] };

  // Crea prima la cartella radice cliente
  try {
    await client
      .api(`/sites/${SITE_ID}/drives/${driveId}/root:/01 - Clienti:/children`)
      .post({ name: `Cliente - ${safe}`, folder: {}, '@microsoft.graph.conflictBehavior': 'fail' });
    risultati.creato.push(`Cliente - ${safe}`);
  } catch (e) {
    if (e.statusCode === 409 || (e.message || '').includes('nameAlreadyExists')) {
      risultati.esistente.push(`Cliente - ${safe}`);
    } else if (e.statusCode !== 404) {
      // 404 means "01 - Clienti" doesn't exist yet — ignore silently and continue
    }
  }

  // Crea le 8 sottocartelle
  for (const cartella of SCHEMA_CARTELLE) {
    try {
      await client
        .api(`/sites/${SITE_ID}/drives/${driveId}/root:/${rootPath}:/children`)
        .post({ name: cartella, folder: {}, '@microsoft.graph.conflictBehavior': 'fail' });
      risultati.creato.push(cartella);
    } catch (e) {
      if (e.statusCode === 409 || (e.message || '').includes('nameAlreadyExists')) {
        risultati.esistente.push(cartella);
      } else {
        risultati.errore.push({ cartella, errore: e.message });
      }
    }
  }
  return risultati;
}

module.exports = { saveClientDocument, createClientFolders };
