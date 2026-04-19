import { useState, useEffect } from 'react';
import './App.css'; 
import { onAuthStateChanged, User } from "firebase/auth";
import LoginForm from "./loginForm"; 
import { auth, logout } from "./authService";
import { getOrGenerateCodename } from "./codenameService";

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [codename, setCodename] = useState<string>('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        const name = getOrGenerateCodename(currentUser.uid);
        setCodename(name);
        
       
        document.body.classList.add('dark-mode');
      } else {
        
        document.body.classList.remove('dark-mode');
        setCodename('');
      }
    });

  
    return () => unsubscribe();
  }, []);

  return (
    <div className="app-container">
      {!user ? (
      
        <div className="login-view">
          <h1>Tervetuloa...</h1>
          <p>Kirjaudu sisään nähdäksesi koodinimesi.</p>
          <LoginForm />
        </div>
      ) : (
        
        <div className="codename-view">
          <h1>Tervetuloa</h1>
          <p>Olet kirjautunut tunnuksella: <strong>{user.email}</strong></p>
          
          <div className="codename-card">
            <span>Salainen koodinimesi on:</span>
            <h2>{codename}</h2>
          </div>

          <button onClick={logout} className="logout-button">
            Kirjaudu ulos
          </button>
        </div>
      )}
    </div>
  );
}

export default App;