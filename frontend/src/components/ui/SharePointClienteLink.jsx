const SHAREPOINT_BASE = import.meta.env.VITE_SHAREPOINT_SITE_URL || '';

function buildUrl(nome) {
  if (!nome) return null;
  const safe = nome.replace(/[/\\?%*:|"<>]/g, '-').trim();
  return SHAREPOINT_BASE
    ? `${SHAREPOINT_BASE}/Documenti condivisi/01 - Clienti/Cliente - ${safe}`
    : null;
}

function IconLink() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      width="13" height="13">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
    </svg>
  );
}

export default function SharePointClienteLink({ nome, className = '' }) {
  const url = buildUrl(nome);

  if (url) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        title="Apri cartella SharePoint"
        className={`text-gray-400 hover:text-blue-600 transition-colors flex-shrink-0 ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        <IconLink />
      </a>
    );
  }

  return (
    <span
      className={`text-gray-300 flex-shrink-0 cursor-default ${className}`}
      title="Configura VITE_SHAREPOINT_SITE_URL per abilitare il collegamento"
    >
      <IconLink />
    </span>
  );
}
