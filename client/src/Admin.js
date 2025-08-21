import React, { useEffect, useMemo, useRef, useState } from "react";
import styled from "styled-components";

// ===================== Firebase (realtime) =====================
import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getFirestore, collection, onSnapshot,
  query, orderBy, deleteDoc, doc, writeBatch, getDocs
} from "firebase/firestore";

// FYLL INN fra Firebase Console (Project settings → Your apps → Web app)
const firebaseConfig = {
  apiKey: "AIzaSyAksjWsBY1BwAgn5tQOx0rWE_jyvIsCQf0",
  authDomain: "secker-b1631.firebaseapp.com",
  projectId: "secker-b1631",
  storageBucket: "secker-b1631.firebasestorage.app",
  messagingSenderId: "982111941240",
  appId: "1:982111941240:web:80e5e558325718dca3338d",
  measurementId: "G-FMXENEMH1Y"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);
const WISHES_COL = "dj_wishes_live_v1"; // samme collection

// ===================== Admin Config =====================
const ADMIN_PASSWORD = "Secker1408";
const AUTH_KEY = "dj_admin_authed";

// Spotlight (lokal)
const SPOTLIGHT_KEY = "dj_wishes_spotlight_v1"; // {active, message, until, id}
const SPOTLIGHT_SECONDS = 120;
const SPOTLIGHT_MESSAGE = "HAGEN VINBAR";
const CHANNEL_NAME = "dj_wish_events";

// ===================== Utils =====================
function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

let bc;
function getBC() {
  try {
    if ("BroadcastChannel" in window) {
      if (!bc) bc = new BroadcastChannel(CHANNEL_NAME);
      return bc;
    }
  } catch {}
  return null;
}

function saveSpotlight(obj) {
  localStorage.setItem(SPOTLIGHT_KEY, JSON.stringify(obj));
  window.dispatchEvent(new StorageEvent("storage", { key: SPOTLIGHT_KEY }));
}

// ===================== Data hooks/actions =====================
function useWishesRealtime() {
  const [wishes, setWishes] = useState([]);
  useEffect(() => {
    const q = query(collection(db, WISHES_COL), orderBy("createdAtMs", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const arr = snap.docs.map(d => {
        const data = d.data() || {};
        const createdAt =
          data.createdAt?.toDate?.() ||
          (data.createdAtMs ? new Date(data.createdAtMs) : null);
        return {
          id: d.id,
          name: data.name || "",
          wish: data.wish || "",
          createdAt,
        };
      });
      setWishes(arr);
    });
    return () => unsub();
  }, []);
  return wishes;
}

async function deleteWishFromCloud(id) {
  await deleteDoc(doc(db, WISHES_COL, id));
}

async function clearAllWishesCloud() {
  const snap = await getDocs(collection(db, WISHES_COL));
  const batch = writeBatch(db);
  snap.forEach(d => batch.delete(d.ref));
  await batch.commit();
}

// ===================== Styles (isolert for Admin) =====================
const Page = styled.main`
  display: grid; gap: 16px; padding: clamp(12px, 3vw, 24px);
  grid-template-columns: 420px 1fr;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  @media (max-width: 980px) { grid-template-columns: 1fr; }
`;

const Panel = styled.section`
  position: relative; overflow: hidden;
  background: linear-gradient(180deg, rgba(255,255,255,0.10), rgba(255,255,255,0.04));
  border: 1px solid rgba(255,255,255,0.18); border-radius: 20px;
  padding: clamp(14px, 3vw, 20px); backdrop-filter: blur(14px) saturate(140%);
`;
const GradientBar = styled.div`
  position: absolute; inset: -1px; z-index: -1;
  background: linear-gradient(90deg, rgba(139,92,246,0.25), rgba(34,211,238,0.25), rgba(255,43,209,0.25));
  filter: blur(26px); opacity: .35;
`;
const PanelTitle = styled.h2`margin: 0 0 8px 0; font-size: clamp(16px, 2.6vw, 18px); opacity: .9;`;
const Divider = styled.div`
  height: 1px; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent);
  margin: 10px 0 16px 0;
`;
const NavButton = styled.button`
  appearance: none; border: 0; cursor: pointer;
  padding: 10px 14px; border-radius: 12px; color: #fff; font-weight: 700;
  background: linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.06));
  border: 1px solid rgba(255,255,255,0.14); backdrop-filter: blur(8px);
  transition: transform .15s ease, border-color .2s ease;
  &:hover { transform: translateY(-1px); border-color: rgba(255,255,255,0.3); }
  &:active { transform: translateY(0); }
`;

const AdminWrap = styled(Panel)`display: grid; grid-template-rows: auto 1fr; min-height: 0; height: 100%;`;
const TableWrap = styled.div`overflow: auto; height: 100%;`;
const Table = styled.table`
  width: 100%; border-collapse: collapse; font-size: 14px; min-width: 560px;
  th, td { padding: 10px 12px; border-bottom: 1px solid rgba(255,255,255,0.12); vertical-align: top; }
  th { text-align: left; opacity: .8; font-weight: 700; }
`;
const Danger = styled.button`
  appearance: none; cursor: pointer; border: 0; padding: 10px 12px; border-radius: 10px;
  font-weight: 800; background: rgba(255,43,209,0.15); color: #fff; border: 1px solid rgba(255,43,209,0.4);
  &:hover { background: rgba(255,43,209,0.25); }
`;
const EmptyState = styled.div`opacity: .7; text-align: center; padding: 24px; font-size: 14px;`;

const Form = styled.form`display: grid; gap: 12px;`;
const Label = styled.label`font-size: 13px; opacity: .85;`;
const Input = styled.input`
  width: 100%; padding: 14px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.18);
  background: rgba(255,255,255,0.06); color: #fff; outline: none;
  &:focus { border-color: rgba(255,255,255,0.36); box-shadow: 0 0 0 3px rgba(139,92,246,0.25); }
`;
const Submit = styled.button`
  appearance: none; border: 0; cursor: pointer; padding: 14px 16px; border-radius: 14px; font-weight: 900;
  color: #0a0a0f; background: linear-gradient(90deg, #22d3ee, #8b5cf6, #ff2bd1);
  &:hover { transform: translateY(-1px); }
  &:active { transform: translateY(0); }
  @media (max-width: 520px) { width: 100%; }
`;
const Hint = styled.p`margin: 6px 0 0; font-size: 12px; opacity: .75;`;
const AdminGate = styled(Panel)`max-width: 520px; margin: 0 auto; display: grid; gap: 12px;`;

// ===================== Admin Root Component =====================
export default function Admin() {
  const wishes = useWishesRealtime();
  const authed = useAuthed();
  const [attempted, setAttempted] = useState(false);

  if (!authed) return <AdminLogin onAttempt={() => setAttempted(true)} attempted={attempted} />;
  return <AdminPanel wishes={wishes} />;
}

function useAuthed() {
  const [authed, setAuthed] = useState(() => localStorage.getItem(AUTH_KEY) === "1");
  useEffect(() => {
    const onStorage = () => setAuthed(localStorage.getItem(AUTH_KEY) === "1");
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
  return authed;
}

function AdminLogin({ onAttempt, attempted }) {
  const [pwd, setPwd] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef(null);
  useEffect(()=>{ inputRef.current?.focus(); },[]);
  const submit = (e) => {
    e.preventDefault(); onAttempt?.();
    if (pwd === ADMIN_PASSWORD) {
      localStorage.setItem(AUTH_KEY, "1");
      window.dispatchEvent(new StorageEvent("storage", { key: AUTH_KEY }));
    } else setError("Feil passord");
  };
  return (
    <Page style={{gridTemplateColumns: "1fr"}}>
      <AdminGate>
        <GradientBar />
        <PanelTitle>Admin-innlogging</PanelTitle>
        <Divider />
        <Form onSubmit={submit}>
          <div>
            <Label>Passord</Label>
            <Input
              ref={inputRef}
              type="password"
              placeholder="Skriv adminpassord"
              value={pwd}
              onChange={(e)=>setPwd(e.target.value)}
            />
          </div>
          <Submit type="submit">Logg inn</Submit>
          {attempted && error && <Hint>{error} 🔒</Hint>}
          <Hint>Tips: Endre ADMIN_PASSWORD i koden før du deployer.</Hint>
        </Form>
      </AdminGate>
    </Page>
  );
}

function AdminPanel({ wishes }) {
  const [filter, setFilter] = useState("");

  const filtered = wishes.filter(w => {
    const q = filter.trim().toLowerCase();
    if (!q) return true;
    return w.name.toLowerCase().includes(q) || w.wish.toLowerCase().includes(q);
  });

  // Egen "er du sikker?" UI (ingen window.confirm → slipper eslint-feil)
  const [confirmClear, setConfirmClear] = useState(false);

  const exportJson = () => {
    const plain = wishes.map(w => ({
      id: w.id,
      name: w.name,
      wish: w.wish,
      createdAt: w.createdAt ? w.createdAt.toISOString() : null
    }));
    const blob = new Blob([JSON.stringify(plain, null, 2)], { type: "application/json"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `dj_wishes_${new Date().toISOString().replace(/[:.]/g,'-')}.json`;
    a.click(); URL.revokeObjectURL(url);
  };
  const logout = () => {
    localStorage.removeItem(AUTH_KEY);
    window.dispatchEvent(new StorageEvent("storage", { key: AUTH_KEY }));
  };

  // Spotlight-trigger (30s) — instant via BroadcastChannel
  const triggerSpotlight = () => {
    const obj = {
      id: uid(),
      active: true,
      message: SPOTLIGHT_MESSAGE,
      until: Date.now() + SPOTLIGHT_SECONDS * 1000
    };
    saveSpotlight(obj);
    const ch = getBC();
    ch?.postMessage({ type: "spotlight", payload: obj });
  };

  return (
    <Page>
      <Panel>
        <GradientBar />
        <PanelTitle>Adminpanel</PanelTitle>
        <Divider />
        <Form onSubmit={(e)=>e.preventDefault()}>
          <div>
            <Label>Søk i ønsker</Label>
            <Input placeholder="Filtrer på navn eller tekst…" value={filter} onChange={(e)=>setFilter(e.target.value)} />
          </div>
          <div style={{display:'flex', gap:10, flexWrap:'wrap', alignItems:'center'}}>
            <NavButton type="button" onClick={exportJson}>Eksporter JSON</NavButton>
            <NavButton type="button" onClick={logout}>Logg ut</NavButton>

            {!confirmClear ? (
              <Danger type="button" onClick={()=>setConfirmClear(true)}>Tøm alle</Danger>
            ) : (
              <div style={{display:'inline-flex', gap:8, alignItems:'center'}}>
                <span>Bekreft tømming?</span>
                <Danger
                  type="button"
                  onClick={async()=>{
                    await clearAllWishesCloud();
                    setConfirmClear(false);
                  }}
                >
                  Ja, tøm
                </Danger>
                <NavButton type="button" onClick={()=>setConfirmClear(false)}>Avbryt</NavButton>
              </div>
            )}
          </div>

          <Divider />

          <div style={{display:'grid', gap:10}}>
            <Label>Scene-kontroll</Label>
            <NavButton type="button" onClick={triggerSpotlight}>
              Vis HAGEN VINBAR (30s)
            </NavButton>
          </div>
        </Form>
      </Panel>

      <AdminWrap>
        <GradientBar />
        <PanelTitle>Alle ønsker (kun for deg)</PanelTitle>
        <Divider />
        <TableWrap>
          <Table>
            <thead>
              <tr>
                <th style={{width: '18%'}}>Navn</th>
                <th>Ønske</th>
                <th style={{width: '18%'}}>Tid</th>
                <th style={{width: '10%'}}>Handling</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={4}><EmptyState>Ingen treff.</EmptyState></td></tr>
              ) : (
                filtered.map(w => (
                  <tr key={w.id}>
                    <td><strong>{w.name}</strong></td>
                    <td><div style={{whiteSpace:'pre-wrap'}}>{w.wish}</div></td>
                    <td>{w.createdAt ? w.createdAt.toLocaleString() : "—"}</td>
                    <td>
                      <Danger onClick={()=>deleteWishFromCloud(w.id)}>Slett</Danger>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </TableWrap>
      </AdminWrap>
    </Page>
  );
}
