import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [codename, setCodename] = useState('')

  const generateCodename = () => {
    const adjectives = ["Sneaky", "Electric", "Silent", "Hyper", "Cosmic"];
    const animals = ["Fox", "Panda", "Lizard", "Dragon", "Hawk"];
    const number = Math.floor(Math.random() * 3000);
    return `${adjectives[Math.floor(Math.random() * adjectives.length)]}${animals[Math.floor(Math.random() * animals.length)]}${number}`;
  }

  useEffect(() => {
    const cachedName = localStorage.getItem("codename");
    if (cachedName) {
      setCodename(cachedName);
    } else {
      const newName = generateCodename();
      localStorage.setItem("codename", newName);
      setCodename(newName);
    }
  }, []);

  return (
    <div className="agent-card">
      <h1>Agentti: {codename}</h1>
      <p>Koodinimesi on haettu turvallisesta tallennustilasta.</p>
    </div>
  )
}

export default App
