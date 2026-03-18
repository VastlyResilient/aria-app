import { useState } from 'react';
import { useProjectStore } from './store/projectStore';
import Landing from './pages/Landing';
import Tutorial from './components/wizard/Tutorial';
import Wizard from './pages/Wizard';

export default function App() {
  const { tutorialDone, completeTutorial } = useProjectStore();
  const [page, setPage] = useState('landing');

  if (page === 'landing') {
    return <Landing onStart={() => setPage('tutorial')} />;
  }

  if (page === 'tutorial' && !tutorialDone) {
    return <Tutorial onComplete={() => { completeTutorial(); setPage('wizard'); }} />;
  }

  return <Wizard />;
}
