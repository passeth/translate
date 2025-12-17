import React, { useState, useEffect, useRef } from 'react';
import { Mic, Settings, FileText, Download } from 'lucide-react';
import { useSpeechRecognition } from './hooks/useSpeechRecognition';
import { initializeGemini, translateText, summarizeLogs } from './services/gemini';
import './index.css';

function App() {
  const [apiKey, setApiKey] = useState(localStorage.getItem('gemini_api_key') || '');
  const [modelName, setModelName] = useState(localStorage.getItem('gemini_model_name') || 'gemini-1.5-flash');

  // Supabase State
  const [supabaseUrl, setSupabaseUrl] = useState(localStorage.getItem('supabase_url') || '');
  const [supabaseKey, setSupabaseKey] = useState(localStorage.getItem('supabase_key') || '');
  const [supabaseClient, setSupabaseClient] = useState(null);

  const [hostLang, setHostLang] = useState('ko-KR');
  const [guestLang, setGuestLang] = useState('ru-RU');
  const [activeSpeaker, setActiveSpeaker] = useState('host'); // 'host' | 'guest'
  const [isMicOn, setIsMicOn] = useState(false);

  // New: Single chat log
  const [logs, setLogs] = useState(() => {
    const saved = localStorage.getItem('meeting_logs');
    return saved ? JSON.parse(saved) : [];
  });
  const [currentTranscription, setCurrentTranscription] = useState('');

  const [showSettings, setShowSettings] = useState(!apiKey);
  const [showSummary, setShowSummary] = useState(false);
  const [summaryText, setSummaryText] = useState('');
  const [lastSummaryIndex, setLastSummaryIndex] = useState(0);
  const [isSummarizing, setIsSummarizing] = useState(false);

  const chatContainerRef = useRef(null);

  // Helper for language names
  const getLangName = (code) => {
    if (code === 'ko-KR') return 'Korean';
    if (code === 'ru-RU') return 'Russian';
    if (code === 'en-US') return 'English';
    return 'Unknown';
  };

  useEffect(() => {
    localStorage.setItem('meeting_logs', JSON.stringify(logs));
  }, [logs]);

  useEffect(() => {
    if (supabaseUrl && supabaseKey) {
      import('@supabase/supabase-js').then(({ createClient }) => {
        const client = createClient(supabaseUrl, supabaseKey);
        setSupabaseClient(client);
      });
    }
  }, [supabaseUrl, supabaseKey]);

  useEffect(() => {
    if (apiKey) initializeGemini(apiKey, modelName);
  }, [apiKey, modelName]);

  const handleSpeechResult = async ({ final, interim }) => {
    if (!final && !interim) return;

    setCurrentTranscription(interim);

    if (final) {
      const newLogId = Date.now();
      const speaker = activeSpeaker; // Captured at moment of finalization

      const targetLangCode = speaker === 'host' ? guestLang : hostLang;
      // Just for display, we don't strictly need target name in log logic unless for Gemini Prompt
      const targetLangName = getLangName(targetLangCode);

      const newLog = {
        id: newLogId,
        speaker: speaker,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        original: final,
        translated: 'Translating...'
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

  // Determine current active language for STT
  const currentLang = activeSpeaker === 'host' ? hostLang : guestLang;
  const { isListening } = useSpeechRecognition(currentLang, isMicOn, handleSpeechResult);

  // Auto-scroll
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [logs, currentTranscription]);

  // Dual Mic Toggle Logic
  const activateMic = (speakerType) => {
    if (activeSpeaker === speakerType && isMicOn) {
      // If already active on this speaker, toggle OFF
      setIsMicOn(false);
    } else {
      // Switch speaker and ensure ON
      // Note: Switching lang will trigger hook to restart with new lang
      setActiveSpeaker(speakerType);
      setIsMicOn(true);
    }
  };


  const handleKeyDown = (e) => {
    // Avoid potentially conflicting with input fields if we had them (except settings)
    if (showSettings) return;

    switch (e.code) {
      case 'ArrowLeft':
      case 'Digit1':
      case 'Numpad1':
        activateMic('host');
        break;
      case 'ArrowRight':
      case 'Digit2':
      case 'Numpad2':
        activateMic('guest');
        break;
      case 'Space':
        e.preventDefault(); // Prevent scrolling
        setIsMicOn(prev => !prev);
        break;
      default:
        break;
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeSpeaker, isMicOn, showSettings]);

  const handleSummarize = async () => {
    setIsSummarizing(true);
    setShowSummary(true);
    const newLogs = logs.slice(lastSummaryIndex);

    if (newLogs.length > 0) {
      const newSummary = await summarizeLogs(newLogs);
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
    localStorage.setItem('gemini_model_name', modelName);
    localStorage.setItem('supabase_url', supabaseUrl);
    localStorage.setItem('supabase_key', supabaseKey);
    setShowSettings(false);
  };

  const saveToSupabase = async () => {
    if (!supabaseClient) { alert("Supabase not configured in settings."); return; }
    try {
      const { error } = await supabaseClient.from('meeting_logs').insert([
        { content: logs, created_at: new Date() }
      ]);
      if (error) throw error;
      alert("Saved to Supabase successfully!");
    } catch (e) {
      alert("Supabase Save Failed: " + e.message + "\nCheck if table 'meeting_logs' exists.");
    }
  };

  const downloadLogs = () => {
    const element = document.createElement("a");
    const file = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
    element.href = URL.createObjectURL(file);
    element.download = `meeting_logs_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>

      {/* Top Left Settings Button */}
      <button className="settings-overlay-btn" onClick={() => setShowSettings(true)} title="Settings">
        <Settings size={24} />
      </button>

      {/* Top Right Action Buttons */}
      <div className="action-overlay-btn">
        <button className="btn" style={{ padding: '0.5rem', background: 'rgba(0,0,0,0.5)' }} onClick={handleSummarize} title="Summarize">
          <FileText size={20} />
        </button>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px', height: 'auto' }}>
            <h2 className="modal-header"><Settings size={28} style={{ marginRight: 10 }} /> Initial Setup</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#ccc' }}>Google Gemini API Key</label>
                <input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="Paste your API key here..." style={{ width: '100%' }} />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#ccc' }}>Gemini Model Name (Optional)</label>
                <input type="text" value={modelName} onChange={(e) => setModelName(e.target.value)} placeholder="gemini-1.5-flash" style={{ width: '100%' }} />
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: '#ccc' }}>My Language (Left Mic)</label>
                  <select value={hostLang} onChange={(e) => setHostLang(e.target.value)} style={{ width: '100%' }}>
                    <option value="ko-KR">Korean (한국어)</option>
                    <option value="en-US">English</option>
                    <option value="ru-RU">Russian</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: '#ccc' }}>Their Language (Right Mic)</label>
                  <select value={guestLang} onChange={(e) => setGuestLang(e.target.value)} style={{ width: '100%' }}>
                    <option value="ru-RU">Russian (러시아어)</option>
                    <option value="en-US">English</option>
                    <option value="ko-KR">Korean</option>
                  </select>
                </div>
              </div>

              <div style={{ borderTop: '1px solid #444', paddingTop: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#888' }}>Supabase Storage</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input type="text" placeholder="URL" value={supabaseUrl} onChange={e => setSupabaseUrl(e.target.value)} style={{ flex: 1 }} />
                  <input type="password" placeholder="Key" value={supabaseKey} onChange={e => setSupabaseKey(e.target.value)} style={{ flex: 1 }} />
                </div>
              </div>

              <button className="btn primary" onClick={handleSaveSettings} style={{ marginTop: '1rem', justifyContent: 'center' }}>
                Save & Start
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
              <div style={{ display: 'flex', gap: '10px' }}>
                {supabaseClient && <button className="btn" onClick={saveToSupabase}>Save to Cloud</button>}
                <button className="btn" onClick={downloadLogs}><Download size={18} /> Logs</button>
                <button className="btn" onClick={() => setShowSummary(false)}>Close</button>
              </div>
            </div>
            <div className="modal-body">
              {isSummarizing && logs.length > lastSummaryIndex ? <div style={{ marginBottom: '1rem', color: '#ff8c00' }}>Wait... Generating new summary...</div> : null}
              {summaryText}
            </div>
          </div>
        </div>
      )}

      {/* Unified Chat Area */}
      <div className="chat-container" ref={chatContainerRef}>
        {logs.map(log => (
          <div key={log.id} className={`chat-bubble ${log.speaker}`}>
            <div className="log-content-main">
              {log.original}
            </div>
            <div className="log-content-sub">
              {log.translated}
            </div>
            <div className="timestamp">
              {log.timestamp}
            </div>
          </div>
        ))}
        {currentTranscription && (
          <div className={`chat-bubble ${activeSpeaker}`} style={{ opacity: 0.7 }}>
            <div className="log-content-main">
              {currentTranscription}...
            </div>
          </div>
        )}
      </div>

      {/* Dual Mic Control Bar */}
      <div className="control-bar-dual">
        {/* Host (Left) Mic */}
        <button
          className={`big-mic-btn host-btn ${activeSpeaker === 'host' && isMicOn ? 'active' : 'inactive'}`}
          onClick={() => activateMic('host')}
        >
          <Mic size={40} />
          <div className="mic-label">{getLangName(hostLang)}</div>
        </button>

        {/* Guest (Right) Mic */}
        <button
          className={`big-mic-btn guest-btn ${activeSpeaker === 'guest' && isMicOn ? 'active' : 'inactive'}`}
          onClick={() => activateMic('guest')}
        >
          <Mic size={40} />
          <div className="mic-label">{getLangName(guestLang)}</div>
        </button>
      </div>
    </div>
  );
}

export default App;
