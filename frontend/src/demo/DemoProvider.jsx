import { createContext, useContext, useState } from 'react';
import * as mock from './mockData';

const DemoContext = createContext(null);

export function useDemoAuth() {
  return {
    account: { name: 'Giorgio Demo', username: 'giorgio@studiogds.it' },
    getToken: async () => 'demo-token',
    login: () => {},
    logout: () => {},
    isAuthenticated: true,
  };
}

export function DemoProvider({ children }) {
  const [clienti, setClienti] = useState(mock.CLIENTI);
  const [tasks, setTasks] = useState(mock.TASKS);
  const [checklist, setChecklist] = useState(mock.CHECKLIST);
  const [attivita, setAttivita] = useState(mock.ATTIVITA);
  const [emailTemplates, setEmailTemplates] = useState(mock.EMAIL_TEMPLATES);
  const [workflows] = useState(mock.WORKFLOW_TEMPLATES);
  const [eventi, setEventi] = useState(mock.EVENTI);

  return (
    <DemoContext.Provider value={{
      clienti, setClienti,
      tasks, setTasks,
      checklist, setChecklist,
      attivita, setAttivita,
      emailTemplates, setEmailTemplates,
      workflows,
      eventi, setEventi,
    }}>
      {children}
    </DemoContext.Provider>
  );
}

export function useDemoData() {
  return useContext(DemoContext);
}
