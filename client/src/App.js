import React, { useEffect, useMemo, useRef, useState } from "react";
import styled, { createGlobalStyle, keyframes } from "styled-components";

/**
 * DJ Wish Wall — single-file React app with styled-components
 * - Public Wall (#): submit wishes; wall shows ONLY the sender's name (not the wish text)
 * - Admin Panel (#/admin): password-gated; shows full wish list with names & management tools
 * - Data persistence via localStorage; realtime sync across tabs
 * - Fancy visuals: neon gradients, glassmorphism, animated highlights
 *
 * Place as App.jsx and render from main.jsx/index.jsx.
 * MOBILE-FIRST + responsive tweaks for phones.
 */

// ===================== Config =====================
const ADMIN_PASSWORD = "djmaster"; // Change this before deploying
const STORAGE_KEY = "dj_wishes_v1";
const AUTH_KEY = "dj_admin_authed";

// ===================== Global Styles =====================
const glow = keyframes`
  0% { filter: drop-shadow(0 0 0px rgba(255,255,255,0.5)); }
  100% { filter: drop-shadow(0 0 14px rgba(255,255,255,0.9)); }
`;

const float = keyframes`
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-6px); }
`;

const shimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

const Global = createGlobalStyle`
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800&family=Montserrat:wght@700;900&display=swap');
  * { box-sizing: border-box; }
  html, body, #root { height: 100%; }
  html { -webkit-text-size-adjust: 100%; }
  body {
    margin: 0;
    color: #fff;
    background: radial-gradient(1200px 800px at 20% 10%, #4812ff33, transparent 60%),
                radial-gradient(1000px 700px at 90% 20%, #ff2bd133, transparent 60%),
                radial-gradient(900px 1000px at 50% 120%, #00ffcc22, transparent 60%),
                #0a0a0f;
    font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji";
    /* Allow page scroll on small screens */
    overflow: auto;
    -webkit-font-smoothing: antialiased; text-rendering: optimizeLegibility;
  }
`;

// ===================== Utilities =====================
function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function loadWishes() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveWishes(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY }));
}

function useLocalStorageSync(key, parser) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const onStorage = (e) => {
      if (!e || e.key === key) setTick((x) => x + 1);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [key]);
  const data = useMemo(() => parser(), [parser, tick]);
  return data;
}

// ===================== Layout Components =====================
const AppWrap = styled.div`
  min-height: 100%;
  display: grid;
  grid-template-rows: auto 1fr auto;
`;

const TopBar = styled.header`
  position: sticky; top: 0; z-index: 50;
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  padding: 14px clamp(14px, 4vw, 28px);
  background: rgba(10,10,15,0.7);
  backdrop-filter: blur(10px) saturate(120%);
  border-bottom: 1px solid rgba(255,255,255,0.07);
`;

const Brand = styled.div`
  display: flex; align-items: center; gap: 12px; min-width: 0;
`;

const Logo = styled.div`
  width: 40px; height: 40px; border-radius: 12px;
  background: conic-gradient(from 210deg, #8b5cf6, #22d3ee, #ff2bd1, #8b5cf6);
  filter: saturate(120%); animation: ${glow} 2.8s ease-in-out infinite alternate;
`;

const TitleWrap = styled.div`
  display: grid; line-height: 1.1; min-width: 0;
`;

const Title = styled.h1`
  margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  font-family: Montserrat, Inter, sans-serif; font-size: clamp(18px, 4vw, 28px); letter-spacing: .6px;
`;

const SubTitle = styled.small`
  opacity: .75; font-size: clamp(11px, 2.6vw, 13px);
`;

const EventTag = styled.span`
  display: inline-block; margin-top: 4px; font-size: clamp(11px, 2.8vw, 12px);
  padding: 4px 8px; border-radius: 999px;
  background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15);
`;

const Nav = styled.nav`
  display: flex; gap: 8px; flex-wrap: wrap; justify-content: flex-end;
`;

const NavButton = styled.button`
  appearance: none; border: 0; cursor: pointer;
  padding: 10px 14px; border-radius: 12px; color: #fff; font-weight: 700;
  background: linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.06));
  border: 1px solid rgba(255,255,255,0.14); backdrop-filter: blur(8px);
  transition: transform .15s ease, border-color .2s ease;
  &:hover { transform: translateY(-1px); border-color: rgba(255,255,255,0.3); }
  &:active { transform: translateY(0); }
  @media (max-width: 520px) { width: 100%; }
`;

const Footer = styled.footer`
  padding: 12px 16px; text-align: center; opacity: .75; font-size: 12px;
`;

const Page = styled.main`
  display: grid; gap: 16px; padding: clamp(12px, 3vw, 24px);
  grid-template-columns: 1fr;
  @media (min-width: 980px) { grid-template-columns: 420px 1fr; }
`;

// ===================== Fancy Panels =====================
const Panel = styled.section`
  position: relative; overflow: hidden;
  background: linear-gradient(180deg, rgba(255,255,255,0.10), rgba(255,255,255,0.04));
  border: 1px solid rgba(255,255,255,0.18); border-radius: 20px;
  padding: clamp(14px, 3vw, 20px); backdrop-filter: blur(14px) saturate(140%);
`;

const PanelTitle = styled.h2`
  margin: 0 0 8px 0; font-size: clamp(16px, 2.6vw, 18px); opacity: .9; letter-spacing: .3px;
`;

const Divider = styled.div`
  height: 1px; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent);
  margin: 10px 0 16px 0;
`;

const GradientBar = styled.div`
  position: absolute; inset: -1px; z-index: -1;
  background: linear-gradient(90deg, rgba(139,92,246,0.25), rgba(34,211,238,0.25), rgba(255,43,209,0.25));
  filter: blur(26px); opacity: .35;
`;

// ===================== Form =====================
const Form = styled.form`
  display: grid; gap: 12px;
`;

const Label = styled.label`
  font-size: 13px; opacity: .85;
`;

const Input = styled.input`
  width: 100%; padding: 14px 14px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.18);
  background: rgba(255,255,255,0.06); color: #fff; outline: none;
  &:focus { border-color: rgba(255,255,255,0.36); box-shadow: 0 0 0 3px rgba(139,92,246,0.25); }
`;

const TextArea = styled.textarea`
  width: 100%; min-height: 120px; padding: 14px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.18);
  background: rgba(255,255,255,0.06); color: #fff; outline: none; resize: vertical;
  &:focus { border-color: rgba(255,255,255,0.36); box-shadow: 0 0 0 3px rgba(34,211,238,0.22); }
`;

const Submit = styled.button`
  appearance: none; border: 0; cursor: pointer; padding: 14px 16px; border-radius: 14px; font-weight: 900; letter-spacing: .3px;
  color: #0a0a0f; background: linear-gradient(90deg, #22d3ee, #8b5cf6, #ff2bd1); background-size: 200% 100%;
  animation: ${shimmer} 3.5s linear infinite;
  &:hover { transform: translateY(-1px); }
  &:active { transform: translateY(0); }
  @media (max-width: 520px) { width: 100%; }
`;

const Hint = styled.p`
  margin: 6px 0 0; font-size: 12px; opacity: .75;
`;

// ===================== Wall =====================
const WallWrap = styled(Panel)`
  display: grid; grid-template-rows: auto 1fr; min-height: 260px; max-height: none;
`;

const NamesGrid = styled.div`
  overflow: auto;
  padding: 8px 6px 8px 0;
  display: grid;
  grid-auto-rows: minmax(56px, auto);
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 12px;
  height: clamp(260px, 60vh, 720px); /* fast høyde gir stabil scroll og riktig justering */
  align-content: start;    /* start øverst */
  justify-content: center; /* midtstilt horisontalt */
  @media (max-width: 480px) { grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); }
  @media (min-width: 980px) { height: calc(100vh - 220px); }
`;

const NameCard = styled.div`
  position: relative; padding: clamp(12px, 2.5vw, 16px); border-radius: 16px;
  border: 1px solid rgba(255,255,255,0.16);
  background: linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.04));
  display: grid; gap: 6px; place-content: center; text-align: center;
  animation: ${float} 5s ease-in-out infinite;
`;

const Name = styled.div`
  font-weight: 800; font-size: clamp(16px, 4vw, 18px); letter-spacing: .5px;
`;

const Time = styled.div`
  font-size: 11px; opacity: .6;
`;

const EmptyState = styled.div`
  opacity: .7; text-align: center; padding: 24px; font-size: 14px;
`;

// ===================== Admin =====================
const AdminWrap = styled(Panel)`
  display: grid; grid-template-rows: auto 1fr; min-height: 260px; max-height: none;
`;

const TableWrap = styled.div`
  overflow: auto; max-height: 60vh; @media (min-width: 980px) { max-height: calc(100vh - 220px); }
`;

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

const Badge = styled.span`
  display: inline-block; padding: 4px 8px; border-radius: 999px; border: 1px solid rgba(255,255,255,0.2);
  background: rgba(255,255,255,0.05); font-size: 11px; opacity: .85;
`;

const AdminGate = styled(Panel)`
  max-width: 520px; margin: 0 auto; display: grid; gap: 12px;
`;

// ===================== Widgets =====================
const StatsWidget = styled(Panel)`
  display: grid; grid-template-columns: 1fr; gap: 12px; align-items: stretch;
  @media (min-width: 640px) { grid-template-columns: repeat(3, 1fr); }
`;

const StatItem = styled.div`
  padding: 16px; border: 1px solid rgba(255,255,255,0.14); border-radius: 16px;
  background: linear-gradient(180deg, rgba(255,255,255,0.07), rgba(255,255,255,0.03));
  display: grid; gap: 4px;
`;

const StatLabel = styled.div`
  font-size: 12px; opacity: .75;
`;

const StatValue = styled.div`
  font-size: 22px; font-weight: 900; letter-spacing: .3px;
`;

// ===================== App =====================
export default function App() {
  const route = useHashRoute();
  const wishes = useLocalStorageSync(STORAGE_KEY, loadWishes);

  // Stats
  const total = wishes.length;
  const uniqueNames = new Set(wishes.map(w => w.name.trim().toLowerCase())).size;
  const latestAt = wishes[0]?.createdAt ? new Date(wishes[0].createdAt) : null;

  const go = (path) => () => { window.location.hash = path; };

  return (
    <AppWrap>
      <Global />
      <TopBar>
        <Brand>
          <Logo />
          <TitleWrap>
            <Title>DJ Wish Wall</Title>
            <SubTitle>Send inn låtønsker — navnet ditt vises på veggen ✨</SubTitle>
            <EventTag>Event: Vollen Vinbar</EventTag>
          </TitleWrap>
        </Brand>
        <Nav>
          <NavButton onClick={go("")}>Publikumsvegg</NavButton>
          <NavButton onClick={go("/admin")}>Admin</NavButton>
          <a href="https://vintrastudio.com" target="_blank" rel="noreferrer">
            <NavButton>Laget av Vintra Studio</NavButton>
          </a>
        </Nav>
      </TopBar>

      {route === "/admin" ? (
        <AdminPage />
      ) : (
        <WallPage total={total} uniqueNames={uniqueNames} latestAt={latestAt} />
      )}

      <Footer>
        © {new Date().getFullYear()} DJ Wish Wall — Laget av Vintra Studio. Neon vibes & love.
      </Footer>
    </AppWrap>
  );
}

function useHashRoute() {
  const [route, setRoute] = useState(() => cleanHash());
  useEffect(() => {
    const onHash = () => setRoute(cleanHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  return route;
}

function cleanHash() {
  const h = window.location.hash.replace(/^#/, "");
  return h || "/";
}

// ===================== Pages =====================
function WallPage({ total, uniqueNames, latestAt }) {
  const wishes = useLocalStorageSync(STORAGE_KEY, loadWishes);
  const [name, setName] = useState("");
  const [wish, setWish] = useState("");
  const [toast, setToast] = useState("");
  const nameRef = useRef(null);
  const gridRef = useRef(null);

  useEffect(() => { nameRef.current?.focus(); }, []);
  // Sørg for at listen starter øverst når nye ønsker kommer inn
  useEffect(() => { if (gridRef.current) gridRef.current.scrollTop = 0; }, [wishes.length]);

  const onSubmit = (e) => {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedWish = wish.trim();
    if (!trimmedName || !trimmedWish) {
      setToast("Skriv inn navn og ønske ✍️");
      return;
    }
    const entry = { id: uid(), name: trimmedName, wish: trimmedWish, createdAt: Date.now() };
    const list = [entry, ...loadWishes()].slice(0, 5000);
    saveWishes(list);
    setName(""); setWish("");
    setToast("Takk! Navnet ditt vises på veggen. 🎶");
    nameRef.current?.focus();
  };

  return (
    <Page>
      <Panel>
        <GradientBar />
        <PanelTitle>Send inn ditt låtønske</PanelTitle>
        <Divider />
        <Form onSubmit={onSubmit}>
          <div>
            <Label>Navn</Label>
            <Input ref={nameRef} placeholder="F.eks. Martin" value={name} onChange={(e)=>setName(e.target.value)} inputMode="text" autoComplete="name" />
          </div>
          <div>
            <Label>Ønske (artist / låt / melding til DJ)</Label>
            <TextArea placeholder="Skriv ønsket ditt her…" value={wish} onChange={(e)=>setWish(e.target.value)} />
            <Hint>På publikumsveggen vises kun navnet ditt. Selve ønsket er kun synlig for DJ (admin).</Hint>
          </div>
          <Submit type="submit">Send ønske</Submit>
          {toast && <Hint>{toast}</Hint>}
        </Form>

        <Divider />
        <StatsWidget>
          <StatItem>
            <StatLabel>Totalt innsendt</StatLabel>
            <StatValue>{total}</StatValue>
          </StatItem>
          <StatItem>
            <StatLabel>Unike navn</StatLabel>
            <StatValue>{uniqueNames}</StatValue>
          </StatItem>
          <StatItem>
            <StatLabel>Siste innsendelse</StatLabel>
            <StatValue>{latestAt ? timeAgo(latestAt) : "—"}</StatValue>
          </StatItem>
        </StatsWidget>
      </Panel>

      <WallWrap>
        <GradientBar />
        <PanelTitle>Publikumsveggen (viser bare navn)</PanelTitle>
        <Divider />
        <NamesGrid ref={gridRef}>
          {wishes.length === 0 ? (
            <EmptyState>Ingen innsendelser enda. Vær den første! ✨</EmptyState>
          ) : (
            wishes.map(w => (
              <NameCard key={w.id} title={new Date(w.createdAt).toLocaleString()}>
                <Name>{w.name}</Name>
                <Time>{timeAgo(new Date(w.createdAt))}</Time>
              </NameCard>
            ))
          )}
        </NamesGrid>
      </WallWrap>
    </Page>
  );
}

function AdminPage() {
  const authed = useAuthed();
  const [attempted, setAttempted] = useState(false);

  if (!authed) {
    return <AdminLogin onAttempt={() => setAttempted(true)} attempted={attempted} />;
  }

  return <AdminPanel />;
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
    e.preventDefault();
    onAttempt?.();
    if (pwd === ADMIN_PASSWORD) {
      localStorage.setItem(AUTH_KEY, "1");
      window.dispatchEvent(new StorageEvent("storage", { key: AUTH_KEY }));
    } else {
      setError("Feil passord");
    }
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
            <Input ref={inputRef} type="password" placeholder="Skriv adminpassord" value={pwd} onChange={(e)=>setPwd(e.target.value)} />
          </div>
          <Submit type="submit">Logg inn</Submit>
          {attempted && error && <Hint>{error} 🔒</Hint>}
          <Hint>Tips: Endre ADMIN_PASSWORD i koden før du deployer.</Hint>
        </Form>
      </AdminGate>
    </Page>
  );
}

function AdminPanel() {
  const wishes = useLocalStorageSync(STORAGE_KEY, loadWishes);
  const [filter, setFilter] = useState("");

  const filtered = wishes.filter(w => {
    const q = filter.trim().toLowerCase();
    if (!q) return true;
    return w.name.toLowerCase().includes(q) || w.wish.toLowerCase().includes(q);
  });

  const clearAll = () => {
    if (!window.confirm("Slette alle ønsker?")) return;
    saveWishes([]);
  };

  const remove = (id) => {
    const next = loadWishes().filter(w => w.id !== id);
    saveWishes(next);
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(wishes, null, 2)], { type: "application/json"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `dj_wishes_${new Date().toISOString().replace(/[:.]/g,'-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const logout = () => {
    localStorage.removeItem(AUTH_KEY);
    window.dispatchEvent(new StorageEvent("storage", { key: AUTH_KEY }));
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
          <div style={{display:'flex', gap:10, flexWrap:'wrap'}}>
            <NavButton type="button" onClick={exportJson}>Eksporter JSON</NavButton>
            <NavButton type="button" onClick={logout}>Logg ut</NavButton>
            <Danger type="button" onClick={clearAll}>Tøm alle</Danger>
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
                    <td>
                      <div style={{whiteSpace:'pre-wrap'}}>{w.wish}</div>
                      <div style={{marginTop:6}}><Badge>ID: {w.id.slice(-6)}</Badge></div>
                    </td>
                    <td>{new Date(w.createdAt).toLocaleString()}</td>
                    <td><Danger onClick={()=>remove(w.id)}>Slett</Danger></td>
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

// ===================== Helpers =====================
function timeAgo(date) {
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return `${diff}s siden`;
  const m = Math.floor(diff/60);
  if (m < 60) return `${m}m siden`;
  const h = Math.floor(m/60);
  if (h < 24) return `${h}t siden`;
  const d = Math.floor(h/24);
  if (d < 7) return `${d}d siden`;
  return date.toLocaleDateString();
}
