import { useState, useEffect, useRef, useCallback } from 'react';
import './App.css';
import LoginForm from './loginForm';
import { auth, logout } from './authService';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { getOrGenerateCodename } from './codenameService';
import { QuizForm } from './Components/QuizForm';
import { RoundResult } from './Components/RoundResult';
import ConsentBanner, { getConsent } from './Components/ConsentBanner';
import { createSession, submitGuess, joinSession, startGame, nextRound, closeSession } from './Game';
import { onSnapshot, doc, collection, query, where } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Session } from './types/Session';

// --- ANALYTIIKKA-HOOKKI (6.2.3) ---
function useCloudflareAnalytics() {
  const trackEvent = useCallback(
    (eventName: string, data?: Record<string, any>) => {
      if (!getConsent()) return; // Tarkistetaan 6.1 kohdan suostumus
      if (!window._cfq) {
        window._cfq = [];
      }

      window._cfq.push([
        "trackEvent",
        {
          name: eventName,
          ...data,
          timestamp: new Date().toISOString(),
        },
      ]);
    },
    []
  );

  return { trackEvent };
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [codename, setCodename] = useState<string>("");
  const [session, setSession] = useState<Session | null>(null);
  const [availableSessions, setAvailableSessions] = useState<Session[]>([]);

  // --- ANALYTIIKAN ALUSTUS (6.2.2) ---
  const { trackEvent } = useCloudflareAnalytics();  
  const initialReferrer = useRef<string>(
    document.referrer || "direct"
  );

  useEffect(() => {
    trackEvent("page_view", {
      referrer: initialReferrer.current,
      landingPath: window.location.pathname,
    });
  }, [trackEvent]);

  // 1. Käyttäjän kirjautumistilan seuranta
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) setCodename(getOrGenerateCodename(firebaseUser.uid));
    });
    return () => unsubscribeAuth();
  }, []);

  // 2. Avoimien pelien haku (Lobby)
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "sessions"), where("status", "==", "waiting"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setAvailableSessions(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Session)));
    });
    return () => unsubscribe();
  }, [user]);

  // 3. Valitun pelisession reaaliaikainen seuranta
  useEffect(() => {
    if (!session?.id) return;
    const unsubscribeSession = onSnapshot(doc(db, "sessions", session.id), (docSnap) => {
      if (docSnap.exists()) {
        setSession({ id: docSnap.id, ...docSnap.data() } as Session);
      }
    });
    return () => unsubscribeSession();
  }, [session?.id]);

  // --- Toiminnot ---

  const handleCreateGame = async () => {
    if (user) {
      const id = await createSession(`${codename}n peli`, user.uid, codename);
      setSession({ id } as Session);
      trackEvent("game_created", { creator: codename }); // Analytiikka-tapahtuma
    }
  };

  const handleJoinGame = async (sessionId: string) => {
    if (user) {
      await joinSession(sessionId, user.uid, codename);
      setSession({ id: sessionId } as Session);
      trackEvent("game_joined", { player: codename }); // Analytiikka-tapahtuma
    }
  };

  const handleExitGame = async () => {
    if (session?.id && session.createdBy === user?.uid) {
      await closeSession(session.id);
    }
    setSession(null);
  };

  const handleLogout = async () => {
    if (session?.id && session.createdBy === user?.uid) {
      await closeSession(session.id);
    }
    logout();
    setSession(null);
  };

  const allPlayersGuessed = () => {
    if (!session || !session.players) return false;
    const playersArr = Object.values(session.players);
    return playersArr.length >= 1 && playersArr.every((p: any) => p.guess !== undefined && p.guess !== null);
  };

  return (
    <div className="main-wrapper">
      {/* ANALYTIIKAN SUOSTUMUSBANNERI (6.1) */}
      <ConsentBanner />

      <header className="game-header">
        <h1>Hintavisa 💰</h1>
        {user && (
          <div className="user-info">
            <span>Pelaaja: <strong>{codename}</strong></span>
            <button className="logout-btn" onClick={handleLogout}>Kirjaudu ulos</button>
          </div>
        )}
      </header>

      {!user ? (
        <LoginForm />
      ) : !session?.id ? (
        /* --- AULA / LOBBY --- */
        <div className="lobby-selection card">
          <button onClick={handleCreateGame} className="create-btn">Luo uusi peli</button>
          
          <div className="available-list">
            <h3>Avoimet pelit:</h3>
            {availableSessions.length === 0 ? <p>Ei avoimia pelejä. Luo uusi!</p> : 
              availableSessions.map(s => (
                <div key={s.id} className="session-item">
                  <span>{s.name}</span>
                  <button onClick={() => handleJoinGame(s.id)}>Liity</button>
                </div>
              ))
            }
          </div>
        </div>
      ) : (
        /* --- PELIALUE --- */
        <div className="game-area">
          <div className="status-bar">Erä {session.currentRound || 1} / 5 | {session.name}</div>
          
          {session.status === "waiting" && (
            <div className="card waiting-room">
              <p>Odotetaan pelaajia... ({Object.keys(session.players || {}).length})</p>
              {session.createdBy === user.uid ? (
                <button className="start-btn" onClick={() => startGame(session.id)}>Aloita peli 🚀</button>
              ) : (
                <p>Odotetaan, että pelin luoja aloittaa...</p>
              )}
            </div>
          )}

          {session.status === "playing" && (
            <div className="play-section">
              {!allPlayersGuessed() ? (
                /* Arvausvaihe */
                session.players[user.uid]?.guess !== undefined && session.players[user.uid]?.guess !== null ? (
                  <div className="card"><h3>Arvaus lähetetty! Odotetaan muita... ⏳</h3></div>
                ) : (
                  <QuizForm 
                    productName={session.productName}
                    productImage={session.productImage}
                    currentUserId={codename}
                    onSubmitGuess={(guess) => submitGuess(session.id, user.uid, guess)}
                  />
                )
              ) : (
                /* Kierroksen tulokset */
                <div className="card result-card">
                  <RoundResult 
                    players={Object.values(session.players)} 
                    correctPrice={session.correctPrice!} 
                  />
                  
                  <div className="round-controls" style={{ marginTop: '20px' }}>
                    {(session.currentRound || 1) < 5 ? (
                      /* Jos peli on kesken */
                      session.createdBy === user.uid ? (
                        <button className="next-btn" onClick={() => nextRound(session.id, session.players)}>
                          Seuraava kierros ➡️
                        </button>
                      ) : (
                        <p>Luoja aloittaa pian uuden kierroksen...</p>
                      )
                    ) : (
                      /* Jos 5 erää täynnä */
                      <div className="final-screen">
                        <h2 style={{color: 'var(--secondary)'}}>Peli ohi! 🎉</h2>
                        <button className="create-btn" onClick={handleExitGame}>
                          Palaa aulaan
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;