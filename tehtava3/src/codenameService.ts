// src/codenameService.ts

const adjectives = ["Sneaky", "Electric", "Silent", "Hyper", "Cosmic", "Golden"];
const animals = ["Fox", "Panda", "Lizard", "Dragon", "Hawk", "Wolf"];


export const getOrGenerateCodename = (uid: string): string => {
  const storageKey = `codename_${uid}`;
  const saved = localStorage.getItem(storageKey);

  if (saved) return saved;

 
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const animal = animals[Math.floor(Math.random() * animals.length)];
  const num = Math.floor(Math.random() * 1000);
  
  const newCodename = `${adj} ${animal} ${num}`;
  
  
  localStorage.setItem(storageKey, newCodename);
  
  return newCodename;
};