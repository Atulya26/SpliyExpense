import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Users, Receipt, Calculator, UserPlus, Trash2, Edit3, Check, X } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc, addDoc, setDoc, updateDoc, deleteDoc, onSnapshot, collection, query, where, getDocs } from 'firebase/firestore';

// --- Gemini-generated UI code starts here ---
// (Paste the full code you provided, including all modals and logic)

// ... (rest of the Gemini code as provided by the user) ...
