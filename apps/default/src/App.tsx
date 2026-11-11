import { lazy, useEffect } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { FloatingAgentChat } from '@/components/blocks';
import { useAuth } from 'react-oidc-context';
import { GenesisAuth } from '@/lib/genesis-auth';
import { GenesisNotFound, GenesisSection } from '@/lib/genesis';

const HomePage = lazy(() => import('@/pages/HomePage'));
const StaffPage = lazy(() => import('@/pages/StaffPage'));
const AGENT_ID = '01M76BGCF8T8NQEDR129T15YDQ';

const chatLabels = {
  openChat: 'Chat öffnen',
  closeChat: 'Chat schließen',
  warmingUp: 'Der Assistent startet gerade. Bitte versuchen Sie es erneut.',
  tryAgain: 'Erneut versuchen',
  openHostedChat: 'Chat auf Taskade öffnen',
  connecting: 'Verbindung wird hergestellt …',
  working: 'Einen Moment bitte …',
  needsApproval: 'Ihre Freigabe ist erforderlich',
  failed: 'Das hat nicht geklappt',
  skipped: 'Übersprungen',
  thinking: 'Der Assistent denkt nach …',
  dismissNotice: 'Hinweis schließen',
  approve: 'Freigeben',
  deny: 'Ablehnen',
  retry: 'Erneut versuchen',
};

function StaffContent() {
  const auth = useAuth();
  return (
    <>
      <StaffPage />
      {auth.isAuthenticated && (
        <FloatingAgentChat
          agentId={AGENT_ID}
          title="Vitate Bewerbungshelfer"
          launcherText="Hilfe"
          placeholder="Fragen Sie zu Angeboten oder Lebensläufen …"
          emptyDescription="Fragen Sie nach unseren Leistungen oder teilen Sie einen Lebenslauftext zur ersten Prüfung."
          footerText="Bitte keine sensiblen persönlichen Angaben teilen."
          labels={chatLabels}
        />
      )}
    </>
  );
}

function StaffRoute() {
  return (
    <GenesisAuth>
      <StaffContent />
    </GenesisAuth>
  );
}

function Title() {
  useEffect(() => {
    document.title = 'Enviar seu Curriculo Vitate';
    document.documentElement.lang = 'de';
    document.documentElement.dir = 'ltr';
  }, []);
  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <Title />
      <Routes>
        <Route
          path="/"
          element={
            <GenesisSection name="Kundenanfrage">
              <HomePage />
            </GenesisSection>
          }
        />
        <Route
          path="/staff"
          element={
            <GenesisSection name="Mitarbeiterbereich">
              <StaffRoute />
            </GenesisSection>
          }
        />
        <Route path="*" element={<GenesisNotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
