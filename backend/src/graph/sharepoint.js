const { createGraphClient } = require('./graphClient');

const SITE_ID = process.env.SHAREPOINT_SITE_ID;

async function getListItems(accessToken, listName, filter = '') {
  const client = createGraphClient(accessToken);
  const url = `/sites/${SITE_ID}/lists/${listName}/items?expand=fields${filter ? `&$filter=${filter}` : ''}`;
  const res = await client.api(url).get();
  return res.value.map((item) => ({ id: item.id, ...item.fields }));
}

async function createListItem(accessToken, listName, fields) {
  const client = createGraphClient(accessToken);
  const res = await client
    .api(`/sites/${SITE_ID}/lists/${listName}/items`)
    .post({ fields });
  return { id: res.id, ...res.fields };
}

async function updateListItem(accessToken, listName, itemId, fields) {
  const client = createGraphClient(accessToken);
  await client
    .api(`/sites/${SITE_ID}/lists/${listName}/items/${itemId}/fields`)
    .patch(fields);
}

async function deleteListItem(accessToken, listName, itemId) {
  const client = createGraphClient(accessToken);
  await client
    .api(`/sites/${SITE_ID}/lists/${listName}/items/${itemId}`)
    .delete();
}

module.exports = { getListItems, createListItem, updateListItem, deleteListItem };
