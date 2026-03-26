import { useEffect } from 'react';
import { useSessionStore } from './stores/sessionStore';
import { API_URL } from './constants';
import TagSelectionScreen from './components/tags/TagSelectionScreen';

export default function App() {
  const { setSession, sessionId } = useSessionStore();

  useEffect(() => {
    console.log('Creating session from:', API_URL);
    fetch(`${API_URL}/session`, { method: 'POST' })
      .then(r => r.json())
      .then(data => {
        console.log('Session response:', JSON.stringify(data));
        if (data.sessionId) setSession(data.sessionId);
      })
      .catch(e => console.error('Session error:', e));
  }, []);

  return (
    <TagSelectionScreen
      onEnterPool={() => console.log('✅ entering pool')}
      onCrisis={() => console.log('🚨 crisis routing')}
    />
  );
}
