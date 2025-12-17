import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Settings, FileText, User } from 'lucide-react';
import { useSpeechRecognition } from './hooks/useSpeechRecognition';
import { initializeGemini, translateText, summarizeLogs } from './services/gemini';
import './index.css';

function App() {
  const [apiKey, setApiKey] = useState(localStorage.getItem('gemini_api_key') || '');
  const [hostLang, setHostLang] = useState('ko-KR');
  const [guestLang, setGuestLang] = useState('ru-RU');
  const [activeSpeaker, setActiveSpeaker] = useState('host'); // 'host' | 'guest'
  const [isMicOn, setIsMicOn] = useState(false);
  const [logs, setLogs] = useState([]); // {id, speaker, timestamp, original, translated}
  const [currentTranscription, setCurrentTranscription] = useState('');

  const [showSettings, setShowSettings] = useState(!apiKey);
  const [showSummary, setShowSummary] = useState(false);
  const [summaryText, setSummaryText] = useState('');
  const [lastSummaryIndex, setLastSummaryIndex] = useState(0);
  const [isSummarizing, setIsSummarizing] = useState(false);

  const guestPanelRef = useRef(null);
  const hostPanelRef = useRef(null);

  useEffect(() => {
    if (apiKey) initializeGemini(apiKey);
  }, [apiKey]);

  const handleSpeechResult = async ({ final, interim }) => {
    // Only update if we have content
    if (!final && !interim) return;

    setCurrentTranscription(interim);

    if (final) {
      const newLogId = Date.now();
      const speaker = activeSpeaker;
      const targetLangName = speaker === 'host' ? 'Russian' : 'Korean';

      const newLog = {
        id: newLogId,
        speaker: speaker,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        original: final,
        translated: '...' // Placeholder
      };

      setLogs(prev => [...prev, newLog]);
      setCurrentTranscription('');

      // API Call
      const translation = await translateText(final, targetLangName);

      setLogs(prev => prev.map(log =>
        log.id === newLogId ? { ...log, translated: translation } : log
      ));
    }
  };

  const currentLang = activeSpeaker === 'host' ? hostLang : guestLang;
  const { isListening } = useSpeechRecognition(currentLang, isMicOn, handleSpeechResult);

  // Auto-scroll
  useEffect(() => {
    if (guestPanelRef.current) guestPanelRef.current.scrollTop = guestPanelRef.current.scrollHeight;
    if (hostPanelRef.current) hostPanelRef.current.scrollTop = hostPanelRef.current.scrollHeight;
  }, [logs, currentTranscription]);

  const handleSummarize = async () => {
    setIsSummarizing(true);
    setShowSummary(true);
    const newLogs = logs.slice(lastSummaryIndex);

    if (newLogs.length > 0) {
      const newSummary = await summarizeLogs(newLogs);
      // Append with a separator
      const separator = lastSummaryIndex > 0 ? "\n\n--- Next Section ---\n\n" : "";
      setSummaryText(prev => (prev || "") + separator + newSummary);
      setLastSummaryIndex(logs.length);
    } else if (!summaryText) {
      setSummaryText("No conversation data to summarize yet.");
    }

    setIsSummarizing(false);
  };

  const handleSaveSettings = () => {
    localStorage.setItem('gemini_api_key', apiKey);
    setShowSettings(false);
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Settings Modal */}
      {showSettings && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px', height: 'auto' }}>
            <h2 className="modal-header"><Settings size={28} style={{ marginRight: 10 }} /> Initial Setup</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#ccc' }}>Google Gemini API Key</label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Paste your API key here..."
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: '#ccc' }}>My Language (Host)</label>
                  <select value={hostLang} onChange={(e) => setHostLang(e.target.value)} style={{ width: '100%' }}>
                    <option value="ko-KR">Korean</option>
                    <option value="en-US">English</option>
                    <option value="ru-RU">Russian</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: '#ccc' }}>Other Language (Guest)</label>
                  <select value={guestLang} onChange={(e) => setGuestLang(e.target.value)} style={{ width: '100%' }}>
                    <option value="ru-RU">Russian</option>
                    <option value="en-US">English</option>
                    <option value="ko-KR">Korean</option>
                  </select>
                </div>
              </div>
              <button className="btn primary" onClick={handleSaveSettings} style={{ marginTop: '1rem', justifyContent: 'center' }}>
                Start Meeting
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Summary Modal */}
      {showSummary && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><FileText /> Live Meeting Minutes</span>
              <button className="btn" onClick={() => setShowSummary(false)}>Close</button>
            </div>
            <div className="modal-body">
              {isSummarizing && logs.length > lastSummaryIndex ? <div style={{ marginBottom: '1rem', color: '#ff8c00' }}>Wait... Generating new summary...</div> : null}
              {summaryText}
            </div>
          </div>
        </div>
      )}

      {/* Main Split View */}
      <div className="split-view">

        {/* Top: Guest Panel */}
        <div className="panel guest-panel" ref={guestPanelRef}>
          <div style={{
            position: 'sticky', top: -20, background: 'linear-gradient(180deg, #1a1a1a 80%, transparent)',
            zIndex: 5, paddingBottom: '1rem', color: '#666', fontWeight: 'bold'
          }}>
            GUEST VIEW (Russian)
          </div>
          {logs.map(log => (
            <div key={log.id} className="log-item" style={{
              alignSelf: log.speaker === 'guest' ? 'flex-end' : 'flex-start',
              textAlign: log.speaker === 'guest' ? 'right' : 'left',
              background: log.speaker === 'guest' ? 'rgba(255, 140, 0, 0.1)' : 'rgba(255,255,255,0.05)'
            }}>
              <div style={{ fontSize: '1.6rem' }}>
                {/* Guest sees: If Guest(Spoke) -> Orig. If Host(Spoke) -> Trans */}
                {log.speaker === 'guest' ? log.original : log.translated}
              </div>
              <div style={{ fontSize: '0.8rem', opacity: 0.5, marginTop: '4px' }}>{log.timestamp}</div>
            </div>
          ))}
        </div>

        {/* Bottom: Host Panel */}
        <div className="panel host-panel" ref={hostPanelRef}>
          <div style={{
            position: 'sticky', top: -20, background: 'linear-gradient(180deg, #1a1a1a 80%, transparent)',
            zIndex: 5, paddingBottom: '1rem', color: '#666', fontWeight: 'bold'
          }}>
            HOST VIEW (Korean)
          </div>
          {logs.map(log => (
            <div key={log.id} className="log-item" style={{
              alignSelf: log.speaker === 'host' ? 'flex-end' : 'flex-start',
              textAlign: log.speaker === 'host' ? 'right' : 'left',
              background: log.speaker === 'host' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.05)'
            }}>
              <div style={{ fontSize: '1.6rem' }}>
                {/* Host sees: If Host -> Orig. If Guest -> Trans */}
                {log.speaker === 'host' ? log.original : log.translated}
              </div>
              {/* Small original text for host if guest spoke */}
              {log.speaker === 'guest' && (
                <div style={{ fontSize: '1rem', color: '#888', fontStyle: 'italic', marginTop: '4px' }}>
                  "{log.original}"
                </div>
              )}
              <div style={{ fontSize: '0.8rem', opacity: 0.5, marginTop: '4px' }}>{log.timestamp}</div>
            </div>
          ))}

          {/* Interim Display for Host */}
          {currentTranscription && (
            <div className="log-item interim" style={{ alignSelf: activeSpeaker === 'host' ? 'flex-end' : 'flex-start', textAlign: activeSpeaker === 'host' ? 'right' : 'left' }}>
              <div style={{ fontSize: '1.4rem' }}>{currentTranscription}...</div>
            </div>
          )}
        </div>
      </div>

      {/* Control Bar */}
      <div className="control-bar">
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          <button className="btn" onClick={() => setShowSettings(true)} title="Settings">
            <Settings size={24} />
          </button>

          {/* Speaker Toggle */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '0.7rem', color: '#888', textTransform: 'uppercase' }}>Active Speaker</span>
            <div style={{ background: '#333', padding: '4px', borderRadius: '8px', display: 'flex' }}>
              <button
                className={`btn ${activeSpeaker === 'host' ? 'active' : ''}`}
                onClick={() => setActiveSpeaker('host')}
                style={{ borderRadius: '6px', fontSize: '1rem', padding: '0.5rem 1rem' }}
              >
                <User size={18} style={{ marginRight: 6 }} /> Me (Host)
              </button>
              <button
                className={`btn ${activeSpeaker === 'guest' ? 'active' : ''}`}
                onClick={() => setActiveSpeaker('guest')}
                style={{ borderRadius: '6px', fontSize: '1rem', padding: '0.5rem 1rem' }}
              >
                <User size={18} style={{ marginRight: 6 }} /> Guest
              </button>
            </div>
          </div>
        </div>

        {/* Main Mic Button */}
        <div style={{ position: 'relative' }}>
          <button
            className={`btn ${isMicOn ? 'recording' : ''}`}
            style={{ borderRadius: '50%', width: '72px', height: '72px', padding: 0, justifyContent: 'center', background: isMicOn ? '#ef4444' : '#4b5563' }}
            onClick={() => setIsMicOn(!isMicOn)}
          >
            {isMicOn ? <MicOff size={32} /> : <Mic size={32} />}
          </button>
          {isListening && isMicOn && (
            <div style={{ position: 'absolute', top: -30, left: '50%', transform: 'translateX(-50%)', color: '#ef4444', fontWeight: 'bold', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
              LISTENING ({activeSpeaker === 'host' ? 'Host' : 'Guest'})
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button className="btn" style={{ padding: '0.8rem 1.5rem', fontSize: '1.1rem' }} onClick={handleSummarize}>
            <FileText size={22} style={{ marginRight: 8 }} /> Summarize
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
