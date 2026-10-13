import { useState } from 'react';
import type { ViewName } from '@/types/rescue';
import { Dashboard } from '@/pages/Dashboard';
import { IncidentPage } from '@/pages/IncidentPage';
import { OperationsPage } from '@/pages/OperationsPage';

function App() {
  const [view, setView] = useState<ViewName>('dashboard');

  return (
    <>
      {view === 'dashboard' && <Dashboard onNavigate={setView} />}
      {view === 'incident' && <IncidentPage onNavigate={setView} />}
      {view === 'operations' && <OperationsPage onNavigate={setView} />}
    </>
  );
}

export default App;
