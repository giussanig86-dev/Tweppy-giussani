function riempiTemplate(testo, cliente) {
  const oggi = new Date().toLocaleDateString('it-IT');
  return testo
    .replace(/\{\{dataOggi\}\}/g, oggi)
    .replace(/\{\{(\w+)\}\}/g, (_, key) => cliente[key] ?? `{{${key}}}`);
}

module.exports = { riempiTemplate };
