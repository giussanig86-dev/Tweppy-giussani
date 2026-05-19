# GDS Studio Management System

Sistema gestionale per studi commercialisti basato su Microsoft 365 + Claude AI.  
Sostituisce Tweppy (~1.000 €/anno) con un'applicazione completamente personalizzata.

---

## Architettura

```
┌─────────────────────┐     MSAL OAuth2      ┌──────────────────────┐
│  Frontend           │ ──────────────────── │  Azure Active        │
│  React + Tailwind   │                       │  Directory (M365)    │
│  Azure Static Web   │ ──── REST API ──────► │  Backend             │
│  Apps               │                       │  Node.js + Express   │
└─────────────────────┘                       │  Azure Container App │
                                              └──────────┬───────────┘
                                                         │ Graph API
                                              ┌──────────▼───────────┐
                                              │  Microsoft 365       │
                                              │  SharePoint Lists    │
                                              │  OneDrive            │
                                              │  Outlook / Calendar  │
                                              └──────────────────────┘
```

---

## Prerequisiti

- Tenant Microsoft 365 Business (o superiore)
- Azure AD app registration (inclusa in M365)
- Account Azure (per Static Web Apps + Container Apps, ~5 €/mese)
- API Key Anthropic (claude.ai)

---

## Setup Azure AD (una-tantum)

1. Vai su **portal.azure.com → Azure Active Directory → Registrazioni app → Nuova registrazione**
2. Nome: `GDS Studio`, Tipo account: solo questo tenant
3. URI di reindirizzamento: `https://<tuo-dominio>.azurestaticapps.net` (SPA)
4. Nella scheda **Certificati e segreti** crea un segreto client → copia il valore
5. Nella scheda **Autorizzazioni API** aggiungi le seguenti **autorizzazioni delegate**:
   - `User.Read`
   - `Mail.ReadWrite`
   - `Calendars.ReadWrite`
   - `Sites.ReadWrite.All`
   - `Files.ReadWrite.All`
6. Clicca **Concedi consenso amministratore**
7. Copia **ID applicazione (client)** e **ID tenant**

---

## Setup SharePoint Lists

Crea le seguenti liste su SharePoint (lo stesso sito il cui ID sarà in `SHAREPOINT_SITE_ID`):

| Nome lista            | Colonne principali                                                                 |
|-----------------------|------------------------------------------------------------------------------------|
| `Anagrafica_GDS`      | id, ragioneSociale, codiceFiscale, partitaIva, email, telefono, stato, tipologia…  |
| `Task_Log`            | id, titolo, clienteId, clienteNome, assegnato, priorita, stato, note               |
| `Documenti_Log`       | id, clienteId, nome, percorso, tipoDocumento, uploadedAt                           |
| `Invii_Log`           | id, clienteId, oggetto, destinatari, inviataAt, esito                              |
| `Checklist_Adempimenti` | id, clienteId, anno, categoria, descrizione, scadenza, stato                    |
| `Accessi_Log`         | id, utente, azione, timestamp                                                      |
| `Workflow_Templates`  | id, nome, descrizione, steps (Testo multiriga), predefinito                        |
| `Attivita_Log`        | id, clienteId, clienteNome, data, voceId, voceDescrizione, importoUnitario,        |
|                       | quantita, importoNetto, contributoIntegrativo, iva, importoTotale,                 |
|                       | collaboratore, note, fatturato, fatturatoAt, taskId, createdAt, updatedAt          |
| `Email_Templates`     | id, nome, oggetto, corpo, categoria                                                |

Per ottenere `SHAREPOINT_SITE_ID`:
```
GET https://graph.microsoft.com/v1.0/sites/{hostname}:/sites/{siteName}
```
oppure con Graph Explorer: `https://developer.microsoft.com/graph/graph-explorer`

---

## Variabili d'ambiente

### Backend (`backend/.env`)
```env
AZURE_CLIENT_ID=<ID applicazione dal portale Azure>
AZURE_TENANT_ID=<ID tenant>
AZURE_CLIENT_SECRET=<segreto client>
SHAREPOINT_SITE_ID=<ID sito SharePoint>
ANTHROPIC_API_KEY=<chiave API Anthropic>
REDIRECT_URI=https://<tuo-dominio>.azurestaticapps.net
PORT=3001
NODE_ENV=production
```

### Frontend (`frontend/.env`)
```env
VITE_CLIENT_ID=<stesso AZURE_CLIENT_ID>
VITE_TENANT_ID=<stesso AZURE_TENANT_ID>
VITE_API_URL=https://<url-backend-container-app>
```

---

## Sviluppo locale

```bash
# 1. Installa dipendenze
cd backend && npm install
cd ../frontend && npm install

# 2. Copia e compila i file .env
cp backend/.env.example backend/.env
# → compila le variabili reali o imposta NODE_ENV=development per bypass auth

# 3. Avvia backend (porta 3001)
cd backend && npm run dev

# 4. Avvia frontend (porta 5173)
cd frontend && npm run dev
```

In modalità `NODE_ENV=development` il middleware di autenticazione è bypassato e il `graphToken` è impostato a `'dev-token'`.  
Per testare le chiamate Graph reali, usa un token valido ottenuto con MSAL nel browser.

---

## Deploy in produzione

### GitHub Secrets da configurare

| Secret | Descrizione |
|--------|-------------|
| `AZURE_STATIC_WEB_APPS_API_TOKEN` | Token deploy Azure Static Web Apps |
| `VITE_API_URL` | URL pubblico del backend Container App |
| `ACR_LOGIN_SERVER` | `<nome>.azurecr.io` |
| `ACR_USERNAME` | Username ACR |
| `ACR_PASSWORD` | Password ACR |
| `AZURE_CLIENT_ID_DEPLOY` | Service principal per deploy Container App |
| `AZURE_TENANT_ID` | ID tenant |
| `AZURE_SUBSCRIPTION_ID` | ID subscription Azure |
| `AZURE_RESOURCE_GROUP` | Nome resource group |

### Passi deploy

1. Crea Azure Container Registry (ACR)
2. Crea Azure Container Apps environment + Container App `gds-backend`
   - Porta: 3001
   - Aggiungi le variabili d'ambiente del backend nelle impostazioni Container App
3. Crea Azure Static Web Apps collegata a questo repository (branch `main`, cartella `frontend`)
4. Configura i GitHub Secrets sopra elencati
5. Push su `main` → GitHub Actions esegue build e deploy automaticamente

---

## Dismissione Tweppy

Lista di controllo per la migrazione da Tweppy a GDS Studio:

- [ ] **Esporta dati da Tweppy**: anagrafica clienti (CSV/Excel)
- [ ] **Importa clienti in Anagrafica_GDS**: usa il modulo Anagrafica oppure carica via Graph API
- [ ] **Esporta scadenze aperte**: verifica che tutte le scadenze fiscali attive siano replicate in Checklist_Adempimenti
- [ ] **Migra template documenti**: ricrea in Template Manager i template email usati in Tweppy
- [ ] **Verifica workflow operativi**: esegui un workflow di test su un cliente reale
- [ ] **Forma il team**: sessione dimostrativa di 1 ora su tutti i moduli
- [ ] **Periodo parallelo (2 settimane)**: usa entrambi i sistemi in parallelo per validare la correttezza dei dati
- [ ] **Data go-live**: spegni accesso a Tweppy e cancella l'abbonamento
- [ ] **Backup finale Tweppy**: scarica tutti i dati prima della cancellazione

---

## Struttura del progetto

```
Tweppy-giussani/
├── frontend/                  # React + Vite + Tailwind CSS
│   └── src/
│       ├── api/               # Client REST per ogni modulo
│       ├── auth/              # MSAL config + useAuth hook
│       ├── components/        # UI condivisa (Button, Modal, Sidebar…)
│       └── modules/           # 10 moduli applicativi
│           ├── anagrafica/
│           ├── tasks/
│           ├── ocr/
│           ├── checklist/
│           ├── documenti/
│           ├── templates/
│           ├── calendario/
│           ├── comunicazioni/
│           ├── workflow/
│           └── parcellazione/
├── backend/                   # Node.js + Express
│   ├── Dockerfile
│   └── src/
│       ├── app.js
│       ├── auth/              # Middleware MSAL OBO
│       ├── claude/            # claudeClient.js (solo backend)
│       ├── engines/           # checklistEngine, workflowEngine, lapet.json, documentiTemplates
│       ├── graph/             # sharepoint, files, mail, calendar, messages
│       ├── routes/            # 10 route Express
│       └── utils/             # validators, fileUtils, templateUtils, docxUtils
├── .github/workflows/         # CI/CD GitHub Actions
├── staticwebapp.config.json   # Routing Azure Static Web Apps
└── README.md
```

---

## Moduli

| # | Modulo | Route | Lista SharePoint |
|---|--------|-------|-----------------|
| 1 | Anagrafica Clienti | `/anagrafica` | Anagrafica_GDS |
| 2 | Task & Kanban | `/tasks` | Task_Log |
| 3 | Scadenze Fiscali | `/checklist` | Checklist_Adempimenti |
| 4 | Documenti | `/documenti` | Documenti_Log |
| 5 | Template & Invio Massivo | `/templates` | Email_Templates, Invii_Log |
| 6 | Calendario | `/calendario` | Graph Calendar API |
| 7 | Comunicazioni | `/comunicazioni` | Outlook API |
| 8 | OCR Documenti | `/ocr` | OneDrive |
| 9 | Workflow Engine | `/workflow` | Workflow_Templates |
| 10 | Parcellazione LAPET | `/parcellazione` | Attivita_Log |

---

## Costo stimato

| Componente | Costo mensile |
|------------|--------------|
| Microsoft 365 Business Basic (già in uso) | incluso |
| Azure Static Web Apps (Free tier) | € 0 |
| Azure Container Apps (1 replica, 0.5 vCPU) | ~€ 5 |
| Azure Container Registry (Basic) | ~€ 5 |
| Anthropic API (uso moderato) | ~€ 5-15 |
| **Totale** | **~€ 15-25/mese** vs € 83/mese Tweppy |
