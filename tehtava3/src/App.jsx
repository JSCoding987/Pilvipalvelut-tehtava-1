import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [codename, setCodename] = useState('');

  // Tehtävän 3.3 mukainen generointifunktio
  const generateCodename = () => {
    const adjectives = ["Sneaky", "Electric", "Silent", "Hyper", "Cosmic"];
    const animals = ["Fox", "Panda", "Lizard", "Dragon", "Hawk"];
    const number = Math.floor(Math.random() * 3000);

    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const animal = animals[Math.floor(Math.random() * animals.length)];

    return `${adj}${animal}${number}`;
  };

  // Tehtävän 3.2 & 3.4 mukainen logiikka (suoritetaan latauksessa)
  useEffect(() => {
    // 1. Haetaan nimi Local Storagesta
    const cachedName = localStorage.getItem("codename");

    if (cachedName) {
      // 2. Jos nimi löytyy, käytetään sitä
      setCodename(cachedName);
    } else {
      // 3. Jos nimeä ei ole, generoidaan uusi ja tallennetaan se
      const newName = generateCodename();
      setCodename(newName);
      localStorage.setItem("codename", newName);
    }
  }, []); // Tyhjä taulukko varmistaa, että tämä ajetaan vain kerran "kirjautuessa"

  return (
    <div className="container">
      <h1>Koodinimi-sovellus</h1>
      
      <div className="display-card">
        <p>Tervetuloa! Koodinimesi on:</p>
        <h2 className="codename">{codename}</h2>
      </div>

      <p className="info-text">
        Koodinimesi on tallennettu selaimen muistiin (Local Storage). 
        Se säilyy samana, vaikka lataisit sivun uudelleen.
      </p>
    </div>
  )
}

export default App