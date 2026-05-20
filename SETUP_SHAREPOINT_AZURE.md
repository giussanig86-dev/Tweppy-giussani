# Setup SharePoint & Azure — Tweppy Giussani

Checklist completa di tutto ciò che va configurato prima del go-live.

---

## 1. Azure AD — Registrazione applicazione

### 1.1 Creare la registrazione app

1. Accedere al portale Azure → **Azure Active Directory** → **Registrazioni app** → **Nuova registrazione**
2. Nome: `Tweppy-Giussani` (o equivalente)
3. Tipo account: **Solo account in questa directory organizzativa**
4. URI di reindirizzamento: tipo **SPA**, valore `https://<dominio>.azurestaticapps.net`
   - Aggiungere anche `http://localhost:5173` per lo sviluppo locale
5. Fare clic su **Registra**
6. Salvare:
   - **ID applicazione (client)** → `AZURE_CLIENT_ID` / `VITE_AZURE_CLIENT_ID`
   - **ID directory (tenant)** → `AZURE_TENANT_ID` / `VITE_AZURE_TENANT_ID`

### 1.2 Creare il client secret (solo backend)

1. Nella registrazione app → **Certificati e segreti** → **Nuovo segreto client**
2. Descrizione: `backend-secret`, scadenza: 24 mesi
3. Copiare immediatamente il valore → `AZURE_CLIENT_SECRET`
   > Il valore non è più visibile dopo aver navigato via dalla pagina.

### 1.3 Permessi API

1. Nella registrazione app → **Autorizzazioni API** → **Aggiungi autorizzazione** → **Microsoft Graph** → **Autorizzazioni delegate**
2. Aggiungere le seguenti:

| Permesso | Tipo | Motivo |
|---|---|---|
| `User.Read` | Delegato | Lettura profilo utente corrente |
| `Mail.ReadWrite` | Delegato | Lettura e invio email (caselle configurate) |
| `Calendars.ReadWrite` | Delegato | Accesso calendario Outlook |
| `Sites.ReadWrite.All` | Delegato | Lettura/scrittura liste SharePoint |
| `Files.ReadWrite.All` | Delegato | Upload documenti su OneDrive/SharePoint |

3. Fare clic su **Fornisci consenso amministratore per [tenant]** e confermare.

### 1.4 Configurare il flusso On-Behalf-Of (OBO) per il backend

1. Nella registrazione app → **Esporre un'API** → **Imposta URI ID applicazione** (lasciare il valore suggerito)
2. Nella registrazione app → **Manifesto** → impostare `"accessTokenAcceptedVersion": 2`

---

## 2. SharePoint — Configurazione sito

### 2.1 Recuperare l'ID sito SharePoint

Aprire nel browser (autenticato come admin):
```
https://graph.microsoft.com/v1.0/sites/<tenant>.sharepoint.com:/sites/<nomesito>
```
Oppure usare Graph Explorer → copiare il campo `id` dalla risposta.

Salvare il valore → `SHAREPOINT_SITE_ID`

### 2.2 URL sito SharePoint

Copiare l'URL base del sito SharePoint (es. `https://<tenant>.sharepoint.com/sites/<nomesito>`) → `SHAREPOINT_SITE_URL`

---

## 3. SharePoint — Liste da creare

Per ogni lista: accedere al sito SharePoint → **Contenuto del sito** → **Nuovo** → **Elenco** → **Elenco vuoto**.

> Tutti i campi hanno tipo **Riga di testo** se non diversamente indicato.

---

### Lista: `Anagrafica_GDS`

| Nome campo | Tipo SharePoint | Note |
|---|---|---|
| `id` | Riga di testo | UUID generato dal backend |
| `ragioneSociale` | Riga di testo | |
| `codiceFiscale` | Riga di testo | |
| `partitaIva` | Riga di testo | |
| `email` | Riga di testo | |
| `pec` | Riga di testo | |
| `telefono` | Riga di testo | |
| `indirizzo` | Riga di testo | |
| `cap` | Riga di testo | |
| `comune` | Riga di testo | |
| `provincia` | Riga di testo | |
| `tipologia` | Riga di testo | es. `persona_fisica`, `societa` |
| `stato` | Riga di testo | `attivo` o `eliminato` |
| `createdAt` | Riga di testo | ISO datetime string |
| `updatedAt` | Riga di testo | ISO datetime string |

---

### Lista: `Task_Log`

| Nome campo | Tipo SharePoint | Note |
|---|---|---|
| `id` | Riga di testo | UUID generato dal backend |
| `titolo` | Riga di testo | |
| `descrizione` | Più righe di testo | |
| `clienteId` | Riga di testo | |
| `clienteNome` | Riga di testo | |
| `assegnato` | Riga di testo | Nome membro del team |
| `priorita` | Riga di testo | `bassa`, `media`, `alta` |
| `stato` | Riga di testo | `da_fare`, `in_lavorazione`, `completato` |
| `scadenza` | Riga di testo | Data in formato `YYYY-MM-DD` |
| `note` | Più righe di testo | |
| `createdAt` | Riga di testo | ISO datetime string |
| `updatedAt` | Riga di testo | ISO datetime string |

---

### Lista: `Task_Messaggi`

| Nome campo | Tipo SharePoint | Note |
|---|---|---|
| `taskId` | Riga di testo | ID del task padre (da `Task_Log`) |
| `testo` | Più righe di testo | Corpo del messaggio |
| `autore` | Riga di testo | Nome utente Azure AD |
| `createdAt` | Riga di testo | ISO datetime string |

---

### Lista: `Checklist_Adempimenti`

| Nome campo | Tipo SharePoint | Note |
|---|---|---|
| `id` | Riga di testo | UUID generato dal backend |
| `adempimento` | Riga di testo | Descrizione adempimento fiscale |
| `categoria` | Riga di testo | es. `IVA`, `IRPEF`, `Altro` |
| `scadenza` | Riga di testo | Data in formato `YYYY-MM-DD` |
| `note` | Più righe di testo | |
| `stato` | Riga di testo | `da_fare`, `completato` |
| `anno` | Numero | Anno di riferimento |
| `clienteId` | Riga di testo | Vuoto se scadenzario generale |
| `clienteNome` | Riga di testo | Vuoto se scadenzario generale |
| `createdAt` | Riga di testo | ISO datetime string |
| `updatedAt` | Riga di testo | ISO datetime string |

---

### Lista: `Documenti_Log`

| Nome campo | Tipo SharePoint | Note |
|---|---|---|
| `id` | Riga di testo | UUID generato dal backend |
| `clienteId` | Riga di testo | |
| `clienteNome` | Riga di testo | |
| `templateId` | Riga di testo | |
| `templateNome` | Riga di testo | |
| `generatoAt` | Riga di testo | ISO datetime string |
| `salvatoSharePoint` | Riga di testo | `true` o `false` |

---

### Lista: `Email_Templates`

| Nome campo | Tipo SharePoint | Note |
|---|---|---|
| `id` | Riga di testo | UUID generato dal backend |
| `nome` | Riga di testo | |
| `oggetto` | Riga di testo | Oggetto email |
| `corpo` | Più righe di testo | Corpo HTML/testo |
| `categoria` | Riga di testo | |
| `createdAt` | Riga di testo | ISO datetime string |
| `updatedAt` | Riga di testo | ISO datetime string |

---

### Lista: `Invii_Log`

| Nome campo | Tipo SharePoint | Note |
|---|---|---|
| `id` | Riga di testo | UUID generato dal backend |
| `templateId` | Riga di testo | |
| `templateNome` | Riga di testo | |
| `clienteId` | Riga di testo | |
| `clienteNome` | Riga di testo | |
| `email` | Riga di testo | Indirizzo destinatario |
| `oggetto` | Riga di testo | |
| `corpo` | Più righe di testo | |
| `stato` | Riga di testo | `inviato`, `ok` |
| `casella` | Riga di testo | Mailbox mittente (es. `me`) |
| `esito` | Riga di testo | `ok` |
| `inviatoAt` | Riga di testo | ISO datetime string |

---

### Lista: `Email_Sconosciute_Log`

| Nome campo | Tipo SharePoint | Note |
|---|---|---|
| `id` | Riga di testo | UUID generato dal backend |
| `casella` | Riga di testo | Mailbox che ha ricevuto |
| `mittente` | Riga di testo | Indirizzo email mittente |
| `oggetto` | Riga di testo | |
| `preview` | Più righe di testo | bodyPreview dell'email |
| `messageId` | Riga di testo | ID Graph API del messaggio |
| `data` | Riga di testo | receivedDateTime |
| `createdAt` | Riga di testo | ISO datetime string |

---

### Lista: `Attivita_Log`

| Nome campo | Tipo SharePoint | Note |
|---|---|---|
| `id` | Riga di testo | UUID generato dal backend |
| `clienteId` | Riga di testo | |
| `clienteNome` | Riga di testo | |
| `data` | Riga di testo | Data in formato `YYYY-MM-DD` |
| `collaboratore` | Riga di testo | |
| `voceId` | Riga di testo | ID voce tariffario |
| `voceDescrizione` | Riga di testo | |
| `importoUnitario` | Numero | |
| `quantita` | Numero | Default 1 |
| `importoNetto` | Numero | Calcolato dal backend |
| `contributoIntegrativo` | Numero | Calcolato dal backend |
| `iva` | Numero | Calcolato dal backend |
| `importoTotale` | Numero | Calcolato dal backend |
| `note` | Più righe di testo | |
| `taskId` | Riga di testo | Opzionale, riferimento task |
| `fatturato` | Riga di testo | `true` o `false` |
| `fatturatoAt` | Riga di testo | ISO datetime string, opzionale |
| `createdAt` | Riga di testo | ISO datetime string |
| `updatedAt` | Riga di testo | ISO datetime string |

---

### Lista: `Workflow_Templates`

| Nome campo | Tipo SharePoint | Note |
|---|---|---|
| `id` | Riga di testo | UUID generato dal backend |
| `nome` | Riga di testo | |
| `descrizione` | Più righe di testo | |
| `steps` | Più righe di testo | Array JSON stringificato |
| `predefinito` | Riga di testo | `true` o `false` |
| `createdAt` | Riga di testo | ISO datetime string |
| `updatedAt` | Riga di testo | ISO datetime string |

---

## 4. Variabili d'ambiente

### Backend (`.env` in produzione: Container App settings)

```env
AZURE_CLIENT_ID=<id-applicazione-azure-ad>
AZURE_TENANT_ID=<id-tenant-azure-ad>
AZURE_CLIENT_SECRET=<segreto-client>
SHAREPOINT_SITE_ID=<id-sito-sharepoint>
SHAREPOINT_SITE_URL=https://<tenant>.sharepoint.com/sites/<nomesito>
ANTHROPIC_API_KEY=<chiave-api-anthropic>
REDIRECT_URI=https://<dominio>.azurestaticapps.net
PORT=3001
NODE_ENV=production
MAILBOXES=me,info@studio.it
```

> `MAILBOXES`: lista di caselle email separate da virgola da cui leggere la posta in arrivo. `me` corrisponde alla casella dell'utente autenticato.

### Frontend (variabili d'ambiente Azure Static Web Apps)

```env
VITE_AZURE_CLIENT_ID=<id-applicazione-azure-ad>
VITE_AZURE_TENANT_ID=<id-tenant-azure-ad>
VITE_REDIRECT_URI=https://<dominio>.azurestaticapps.net
VITE_API_URL=https://<url-backend-container-app>
VITE_DEMO_MODE=false
```

---

## 5. Azure Static Web Apps — Frontend

1. Accedere al portale Azure → **Crea risorsa** → **Static Web App**
2. Collegare il repository GitHub, branch: `main`
3. Cartella app: `frontend`, cartella output build: `dist`
4. Aggiungere le variabili d'ambiente VITE_* nella sezione **Configurazione** della Static Web App
5. Copiare il dominio assegnato (es. `https://xyz.azurestaticapps.net`) e aggiungerlo come URI di reindirizzamento nell'app registration Azure AD (vedi sezione 1.1)

---

## 6. Azure Container Apps — Backend

1. Creare un **Azure Container Registry** (ACR) per l'immagine Docker
2. Creare una **Container App** con:
   - Immagine: quella builddata da `/backend/Dockerfile`
   - Porta in ingresso: `3001`
   - Ingress: abilitato, esterno, HTTPS
3. Aggiungere tutte le variabili d'ambiente del backend nella sezione **Secrets** / **Environment variables** della Container App
4. Copiare l'URL della Container App → usare come `VITE_API_URL` nel frontend

---

## 7. Anthropic API

1. Accedere a [console.anthropic.com](https://console.anthropic.com)
2. Creare una nuova API Key
3. Salvare il valore → `ANTHROPIC_API_KEY`

---

## Checklist di verifica finale

- [ ] App registration Azure AD creata e client secret salvato
- [ ] Tutti i permessi delegati aggiunti e consenso amministratore concesso
- [ ] `SHAREPOINT_SITE_ID` recuperato e salvato
- [ ] Lista `Anagrafica_GDS` creata con tutti i campi
- [ ] Lista `Task_Log` creata con tutti i campi
- [ ] Lista `Task_Messaggi` creata con tutti i campi
- [ ] Lista `Checklist_Adempimenti` creata con tutti i campi
- [ ] Lista `Documenti_Log` creata con tutti i campi
- [ ] Lista `Email_Templates` creata con tutti i campi
- [ ] Lista `Invii_Log` creata con tutti i campi
- [ ] Lista `Email_Sconosciute_Log` creata con tutti i campi
- [ ] Lista `Attivita_Log` creata con tutti i campi
- [ ] Lista `Workflow_Templates` creata con tutti i campi
- [ ] Variabili d'ambiente backend configurate
- [ ] Variabili d'ambiente frontend configurate
- [ ] Azure Static Web App creata e collegata al repository
- [ ] Azure Container App creata e immagine backend deployata
- [ ] URI di reindirizzamento aggiunto nella registrazione app Azure AD
- [ ] API Key Anthropic configurata

---

## 8. Microsoft Teams — Integrazione app

### 8.1 Configurare Azure AD per Teams SSO

1. Nella registrazione app → **Esporre un'API**
2. Impostare **URI ID applicazione**: `api://<DOMINIO>.azurestaticapps.net/<AZURE_CLIENT_ID>`
3. Aggiungere un **ambito (scope)**:
   - Nome: `access_as_user`
   - Consenso: Amministratori e utenti
   - Nome visualizzato: `Accedi come utente`
4. In **Applicazioni client autorizzate**, aggiungere i seguenti ID (client Teams ufficiali):

| Applicazione | Client ID |
|---|---|
| Teams web | `1fec8e78-bce4-4aaf-ab1b-5451cc387264` |
| Teams desktop/mobile | `5e3ce6c0-2b1f-4285-8d4b-75ee78787346` |
| Teams iOS | `d3590ed6-52b3-4102-aeff-aad2292ab01c` |
| Teams Android | `cf53fce8-def6-4aeb-8d30-b158e7b1cf83` |

   Per ognuno: selezionare lo scope `access_as_user` creato al punto 3.

### 8.2 Creare le icone

Creare due immagini PNG e salvarle in `teams-app/`:

| File | Dimensioni | Descrizione |
|---|---|---|
| `color.png` | 192 × 192 px | Icona a colori su sfondo trasparente o colorato |
| `outline.png` | 32 × 32 px | Icona outline bianca su sfondo trasparente |

### 8.3 Compilare il manifest

Aprire `teams-app/manifest.json` e sostituire tutti i placeholder:

| Placeholder | Valore |
|---|---|
| `<AZURE_CLIENT_ID>` | ID applicazione Azure AD |
| `<DOMINIO>` | Dominio Static Web App (es. `xyz.azurestaticapps.net`) |

### 8.4 Pacchettizzare e caricare l'app in Teams

```bash
cd teams-app
zip -j tweppy-teams.zip manifest.json color.png outline.png
```

1. Aprire Microsoft Teams → **App** → **Gestisci le tue app** → **Carica un'app**
2. Selezionare `tweppy-teams.zip`
3. Oppure caricarla nell'**App Catalog aziendale** per renderla disponibile a tutto il tenant: Teams Admin Center → **App di Teams** → **Gestisci app** → **Carica**

### Checklist Teams

- [ ] URI ID applicazione `api://...` configurato in Azure AD
- [ ] Scope `access_as_user` creato
- [ ] Client Teams autorizzati aggiunti (4 voci)
- [ ] `color.png` (192×192) creata e salvata in `teams-app/`
- [ ] `outline.png` (32×32) creata e salvata in `teams-app/`
- [ ] Placeholder in `manifest.json` sostituiti
- [ ] App pacchettizzata in `.zip` e caricata in Teams
