const { createGraphClient } = require('./graphClient');
const { buildClientFolderPath, sanitizeFileName } = require('../utils/fileUtils');

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

module.exports = { saveClientDocument };
