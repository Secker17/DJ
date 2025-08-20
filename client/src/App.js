import React, { useEffect, useMemo, useRef, useState } from "react";
import styled, { createGlobalStyle } from "styled-components";

/**
 * DJ Wish Wall — React + styled-components
 * - Venstre: Skjema (request) | Høyre: Publikumsvegg (output)
 * - Veggen viser KUN navnet, starter ØVERST og er midtstilt horisontalt
 * - Admin på #/admin (endre passord under)
 * - localStorage + live sync
 * - 100vh layout; paneler scroller inni seg ved behov
 * - Vinyl-ikon spinner sakte + får rask "boost" ved innsending
 * - Event: Vollen Vinbar | Laget av Vintra Studio
 * - Vannmerke-logo bak publikumsveggen (svakt synlig)
 * - Mobiltilpasset, skjuler topp-knapper på mobil
 * - ⭐ Stjerne-knapp med teller + tekst: "Trykk om du liker DJ-en!"
 */

// ===================== Config =====================
const ADMIN_PASSWORD = "Secker1408";      // endre før deploy
const STORAGE_KEY = "dj_wishes_v5";       // bump for å nullstille
const AUTH_KEY = "dj_admin_authed";

// Stjerner (likes)
const STAR_KEY = "dj_wishes_stars_v1";       // teller
const STAR_VOTED_KEY = "dj_wishes_star_vote_v1"; // om denne nettleseren allerede har likt

// Bytt til din egen logo (PNG/SVG). Tom streng = ingen logo.
const WALL_WATERMARK_URL = "/vinbar.png";

// Styrke/størrelse på vannmerket
const WATERMARK_OPACITY = 0.30;
const WATERMARK_MAX_W = "70%";
const WATERMARK_MAX_H = "70%";

// ===================== Global Styles =====================
const Global = createGlobalStyle`
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800&family=Montserrat:wght@700;900&display=swap');
  * { box-sizing: border-box; }
  html, body, #root { height: 100%; }
  body {
    margin: 0;
    color: #fff;
    background: radial-gradient(1200px 800px at 20% 10%, #4812ff33, transparent 60%),
                radial-gradient(1000px 700px at 90% 20%, #ff2bd133, transparent 60%),
                radial-gradient(900px 1000px at 50% 120%, #00ffcc22, transparent 60%),
                #0a0a0f;
    font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji";
    overflow: hidden;
    -webkit-font-smoothing: antialiased; text-rendering: optimizeLegibility;
  }
`;

// ===================== Utils =====================
function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
function loadWishes() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}
function saveWishes(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY }));
}
function useLocalStorageSync(key, parser) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const onStorage = (e) => { if (!e || e.key === key) setTick(x => x + 1); };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [key]);
  return useMemo(() => parser(), [parser, tick]);
}

// Stars (likes)
function loadStars() {
  try {
    const raw = localStorage.getItem(STAR_KEY);
    return raw ? Math.max(0, parseInt(raw, 10) || 0) : 0;
  } catch { return 0; }
}
function saveStars(n) {
  localStorage.setItem(STAR_KEY, String(Math.max(0, n)));
  window.dispatchEvent(new StorageEvent("storage", { key: STAR_KEY }));
}
function getVoted() {
  return localStorage.getItem(STAR_VOTED_KEY) === "1";
}
function setVotedLocal(v) {
  if (v) localStorage.setItem(STAR_VOTED_KEY, "1");
  else localStorage.removeItem(STAR_VOTED_KEY);
  window.dispatchEvent(new StorageEvent("storage", { key: STAR_VOTED_KEY }));
}

// ===================== Vinyl SVG =====================
function Vinyl({ width = 64, height = 64 }) {
  return (
    <svg id="vinyl-svg" viewBox="0 0 256 256" width={width} height={height}
         role="img" aria-label="Spinning vinyl" xmlns="http://www.w3.org/2000/svg"
         style={{ display: 'block' }}>
      <defs>
        <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"  stopColor="#22d3ee"/>
          <stop offset="50%" stopColor="#8b5cf6"/>
          <stop offset="100%" stopColor="#ff2bd1"/>
        </linearGradient>
        <radialGradient id="discGrad" cx="50%" cy="50%" r="55%">
          <stop offset="0%"  stopColor="#0e0e16"/>
          <stop offset="70%" stopColor="#0a0a12"/>
          <stop offset="100%" stopColor="#07070c"/>
        </radialGradient>
        <style>{`
          #discGroup { transform-origin: 128px 128px; animation: spin var(--spin-dur, 16s) linear infinite; }
          svg { --spin-dur: 16s; }
          svg.boost { --spin-dur: 0.7s; }
          @keyframes spin { to { transform: rotate(360deg); } }
          @media (prefers-reduced-motion: reduce) { #discGroup { animation: none; } }
        `}</style>
      </defs>
      <g id="discGroup">
        <circle cx="128" cy="128" r="110" fill="url(#discGrad)"/>
        <circle cx="128" cy="128" r="110" fill="none" stroke="#1b1b25" strokeWidth="2"/>
        <circle cx="128" cy="128" r="22" fill="#111625" stroke="#cbd5e155" strokeWidth="2"/>
        <circle cx="128" cy="128" r="14" fill="#0c101a" stroke="#cbd5e12e" strokeWidth="1.5"/>
        <circle cx="128" cy="128" r="3"  fill="#0a0a0f"/>
        <g transform="rotate(-20 128 128)">
          <circle cx="128" cy="128" r="78" fill="none" stroke="url(#accentGrad)" strokeWidth="6" strokeLinecap="round" strokeDasharray="150 420" />
          <circle cx="128" cy="128" r="66" fill="none" stroke="url(#accentGrad)" strokeWidth="6" strokeLinecap="round" strokeDasharray="145 400" strokeDashoffset="40"/>
          <circle cx="128" cy="128" r="54" fill="none" stroke="url(#accentGrad)" strokeWidth="6" strokeLinecap="round" strokeDasharray="140 370" strokeDashoffset="80"/>
        </g>
        <g transform="rotate(160 128 128)">
          <circle cx="128" cy="128" r="78" fill="none" stroke="url(#accentGrad)" strokeWidth="6" strokeLinecap="round" strokeDasharray="150 420" />
          <circle cx="128" cy="128" r="66" fill="none" stroke="url(#accentGrad)" strokeWidth="6" strokeLinecap="round" strokeDasharray="145 400" strokeDashoffset="40"/>
          <circle cx="128" cy="128" r="54" fill="none" stroke="url(#accentGrad)" strokeWidth="6" strokeLinecap="round" strokeDasharray="140 370" strokeDashoffset="80"/>
        </g>
      </g>
    </svg>
  );
}

// ===================== Star Icon =====================
function StarIcon({ active, size = 28 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      <defs>
        <linearGradient id="starGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#22d3ee"/><stop offset="50%" stopColor="#8b5cf6"/><stop offset="100%" stopColor="#ff2bd1"/>
        </linearGradient>
      </defs>
      <path
        d="M12 2.5l2.9 5.88 6.5.95-4.7 4.58 1.11 6.47L12 17.9l-5.81 3.48 1.11-6.47-4.7-4.58 6.5-.95L12 2.5z"
        fill={active ? "url(#starGrad)" : "none"}
        stroke={active ? "url(#starGrad)" : "#cbd5e1"}
        strokeWidth="1.5"
      />
    </svg>
  );
}

// ===================== Layout =====================
const AppWrap = styled.div`
  height: 100vh;
  display: grid;
  grid-template-rows: auto 1fr auto;
`;

const TopBar = styled.header`
  position: sticky; top: 0; z-index: 10;
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  padding: 14px clamp(14px, 4vw, 28px);
  background: rgba(10,10,15,0.7);
  backdrop-filter: blur(10px) saturate(120%);
  border-bottom: 1px solid rgba(255,255,255,0.07);
`;

const Brand = styled.div`display: flex; align-items: center; gap: 12px; min-width: 0;`;
const TitleWrap = styled.div`display: grid; line-height: 1.1; min-width: 0;`;
const Title = styled.h1`
  margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  font-family: Montserrat, Inter, sans-serif; font-size: clamp(18px, 4vw, 28px);
`;
const SubTitle = styled.small`opacity: .75; font-size: clamp(11px, 2.6vw, 13px);`;
const EventTag = styled.span`
  display: inline-block; margin-top: 4px; font-size: clamp(11px, 2.8vw, 12px);
  padding: 4px 8px; border-radius: 999px;
  background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15);
`;

// ⭐ Star block (synlig også på mobil)
const StarBlock = styled.div`
  display: flex; align-items: center; gap: 10px;
  margin-left: auto; margin-right: 12px;
  flex-wrap: wrap;
`;

const StarCaption = styled.span`
  font-size: 12px; opacity: .9; white-space: nowrap;
`;

const StarButton = styled.button`
  appearance: none; border: 1px solid rgba(255,255,255,0.14);
  background: linear-gradient(135deg, rgba(255,255,255,0.10), rgba(255,255,255,0.06));
  backdrop-filter: blur(8px);
  color: #fff; font-weight: 800; letter-spacing: .2px;
  padding: 8px 12px; border-radius: 14px; cursor: pointer;
  display: inline-flex; align-items: center; gap: 8px;
  transition: transform .12s ease, border-color .2s ease, box-shadow .2s ease;
  &:hover { transform: translateY(-1px); border-color: rgba(255,255,255,0.3); }
  &:active { transform: translateY(0); }
  &.pop { animation: starPop .3s ease; }
  @keyframes starPop { 0%{transform:scale(1)} 50%{transform:scale(1.08)} 100%{transform:scale(1)} }
`;

const StarCount = styled.span`
  font-size: 14px; opacity: .9;
`;

const Nav = styled.nav`
  display: flex; gap: 8px; flex-wrap: wrap; justify-content: flex-end;
  /* Skjul alle topp-knapper på mobil */
  @media (max-width: 640px) { display: none; }
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

const Footer = styled.footer`padding: 10px 16px; text-align: center; opacity: .75; font-size: 12px;`;

const Page = styled.main`
  display: grid; gap: 16px; padding: clamp(12px, 3vw, 24px);
  grid-template-columns: 420px 1fr;  /* Venstre = skjema | Høyre = vegg */
  height: 100%;
  min-height: 0;
  overflow: hidden;
  @media (max-width: 980px) { grid-template-columns: 1fr; }
`;

// Panels
const Panel = styled.section`
  position: relative; overflow: hidden;
  background: linear-gradient(180deg, rgba(255,255,255,0.10), rgba(255,255,255,0.04));
  border: 1px solid rgba(255,255,255,0.18); border-radius: 20px;
  padding: clamp(14px, 3vw, 20px); backdrop-filter: blur(14px) saturate(140%);
`;
const PanelTitle = styled.h2`margin: 0 0 8px 0; font-size: clamp(16px, 2.6vw, 18px); opacity: .9;`;
const Divider = styled.div`
  height: 1px; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent);
  margin: 10px 0 16px 0;
`;
const GradientBar = styled.div`
  position: absolute; inset: -1px; z-index: -1;
  background: linear-gradient(90deg, rgba(139,92,246,0.25), rgba(34,211,238,0.25), rgba(255,43,209,0.25));
  filter: blur(26px); opacity: .35;
`;

// Form
const Form = styled.form`display: grid; gap: 12px;`;
const Label = styled.label`font-size: 13px; opacity: .85;`;
const Input = styled.input`
  width: 100%; padding: 14px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.18);
  background: rgba(255,255,255,0.06); color: #fff; outline: none;
  &:focus { border-color: rgba(255,255,255,0.36); box-shadow: 0 0 0 3px rgba(139,92,246,0.25); }
`;
const TextArea = styled.textarea`
  width: 100%; min-height: 120px; padding: 14px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.18);
  background: rgba(255,255,255,0.06); color: #fff; outline: none; resize: vertical;
  &:focus { border-color: rgba(255,255,255,0.36); box-shadow: 0 0 0 3px rgba(34,211,238,0.22); }
`;
const Submit = styled.button`
  appearance: none; border: 0; cursor: pointer; padding: 14px 16px; border-radius: 14px; font-weight: 900;
  color: #0a0a0f; background: linear-gradient(90deg, #22d3ee, #8b5cf6, #ff2bd1);
  &:hover { transform: translateY(-1px); }
  &:active { transform: translateY(0); }
  @media (max-width: 520px) { width: 100%; }
`;
const Hint = styled.p`margin: 6px 0 0; font-size: 12px; opacity: .75;`;

// Wall (øverst + horisontalt midtstilt)
const WallWrap = styled(Panel)`
  display: grid; grid-template-rows: auto 1fr; min-height: 0; height: 100%;
`;

const ContentLayer = styled.div`position: relative; z-index: 1;`;

// Vannmerke-logo (bak alt innhold i WallWrap)
const Watermark = styled.div`
  position: absolute; inset: 0; z-index: 0;
  display: flex; align-items: center; justify-content: center; pointer-events: none;
  opacity: ${WATERMARK_OPACITY};
  img {
    max-width: ${WATERMARK_MAX_W};
    max-height: ${WATERMARK_MAX_H};
    object-fit: contain;
    filter: drop-shadow(0 0 24px rgba(255,255,255,0.08));
    mix-blend-mode: screen;
  }
  @media (max-width: 640px) {
    opacity: 0.18;
    img { max-width: 80%; max-height: 60%; }
  }
`;

// Scrollbeholder for veggen
const NamesViewport = styled.div`
  position: relative; z-index: 1; height: 100%; overflow: auto;
`;

// Grid inni — øverst + horisontalt midtstilt
const NamesGrid = styled.div`
  padding: 8px 6px 8px 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  grid-auto-rows: minmax(56px, auto);
  gap: 12px;
  height: max-content;
  align-content: start;      /* legg rader helt øverst */
  justify-content: center;   /* midtstill kolonnene horisontalt */

  @media (max-width: 640px) {
    grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
    gap: 10px;
    padding-right: 4px;
  }
`;

const NameCard = styled.div`
  background: rgba(255,255,255,0.08);
  border-radius: 12px;
  padding: 16px;
  text-align: center;
  font-weight: 800;
  backdrop-filter: blur(8px);
  @media (max-width: 640px) { padding: 12px; }
`;
const Time = styled.div`font-size: 11px; opacity: .6; margin-top: 4px;`;
const EmptyState = styled.div`opacity: .7; text-align: center; padding: 24px; font-size: 14px;`;

// Stats
const StatsRow = styled.div`
  display: grid; gap: 12px; grid-template-columns: repeat(3, minmax(0,1fr));
  @media (max-width: 640px) { grid-template-columns: 1fr 1fr; }
`;

// Admin
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
const AdminGate = styled(Panel)`max-width: 520px; margin: 0 auto; display: grid; gap: 12px;`;

// ===================== App =====================
export default function App() {
  const route = useHashRoute();
  const wishes = useLocalStorageSync(STORAGE_KEY, loadWishes);
  const stars = useLocalStorageSync(STAR_KEY, loadStars);
  const [voted, setVotedState] = useState(() => getVoted());

  // hold voted i sync mellom faner
  useEffect(() => {
    const onStorage = (e) => {
      if (!e || e.key === STAR_VOTED_KEY) setVotedState(getVoted());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const total = wishes.length;
  const uniqueNames = new Set(wishes.map(w => w.name.trim().toLowerCase())).size;
  const latestAt = wishes[0]?.createdAt ? new Date(wishes[0].createdAt) : null;

  const go = (path) => () => { window.location.hash = path; };

  const toggleStar = () => {
    const el = document.getElementById("star-cta");
    if (el) { el.classList.remove("pop"); void el.offsetWidth; el.classList.add("pop"); }
    if (voted) {
      saveStars(Math.max(0, stars - 1));
      setVotedState(false);
      setVotedLocal(false);
    } else {
      saveStars(stars + 1);
      setVotedState(true);
      setVotedLocal(true);
    }
  };

  return (
    <AppWrap>
      <Global />
      <TopBar>
        <Brand>
          <Vinyl width={64} height={64} />
          <TitleWrap>
            <Title>DJ Wish Wall</Title>
            <SubTitle>Send inn låtønsker — navnet ditt vises på veggen ✨</SubTitle>
            <EventTag>Event: Vollen Vinbar</EventTag>
          </TitleWrap>
        </Brand>

        {/* ⭐ Like-knapp + tekst, synlig også på mobil */}
        <StarBlock>
          <StarCaption>Trykk om du liker DJ-en!</StarCaption>
          <StarButton id="star-cta" onClick={toggleStar} aria-label={voted ? "Fjern stjerne" : "Gi en stjerne"} title="Trykk om du liker DJ-en!">
            <StarIcon active={voted} />
            <StarCount>{stars}</StarCount>
          </StarButton>
        </StarBlock>

        {/* Skjules på mobil av media query i <Nav> */}
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

      <Footer>© {new Date().getFullYear()} DJ Wish Wall — Laget av Vintra Studio.</Footer>
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
  const viewportRef = useRef(null);

  useEffect(() => { nameRef.current?.focus(); }, []);
  useEffect(() => {
    const vp = viewportRef.current;
    if (vp) vp.scrollTop = 0; // alltid topp
  }, [wishes.length]);

  const onSubmit = (e) => {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedWish = wish.trim();
    if (!trimmedName || !trimmedWish) { setToast("Skriv inn navn og ønske ✍️"); return; }
    const entry = { id: uid(), name: trimmedName, wish: trimmedWish, createdAt: Date.now() };
    const list = [entry, ...loadWishes()].slice(0, 5000);
    saveWishes(list);

    const vinyl = document.getElementById('vinyl-svg');
    if (vinyl) { vinyl.classList.add('boost'); setTimeout(() => vinyl.classList.remove('boost'), 1200); }

    setName(""); setWish(""); setToast("Takk! Navnet ditt vises på veggen. 🎶");
    nameRef.current?.focus();
  };

  return (
    <Page>
      {/* VENSTRE: Skjema */}
      <Panel>
        <GradientBar />
        <PanelTitle>Send inn ditt låtønske</PanelTitle>
        <Divider />
        <Form onSubmit={onSubmit}>
          <div>
            <Label>Navn</Label>
            <Input ref={nameRef} placeholder="F.eks. Martin" value={name}
                   onChange={(e)=>setName(e.target.value)} inputMode="text" autoComplete="name" />
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
        <PanelTitle>Statistikk</PanelTitle>
        <StatsRow>
          <StatBox label="Totalt innsendt" value={total} />
          <StatBox label="Unike navn" value={uniqueNames} />
          <StatBox label="Siste innsendelse" value={latestAt ? timeAgo(latestAt) : "—"} />
        </StatsRow>
      </Panel>

      {/* HØYRE: Publikumsvegg + vannmerke */}
      <WallWrap>
        <GradientBar />
        {WALL_WATERMARK_URL && (
          <Watermark>
            <img src={WALL_WATERMARK_URL} alt="Vannmerke logo" />
          </Watermark>
        )}

        <ContentLayer>
          <PanelTitle>Publikumsveggen (viser bare navn)</PanelTitle>
          <Divider />
        </ContentLayer>

        <NamesViewport ref={viewportRef}>
          {wishes.length === 0 ? (
            <EmptyState>Ingen innsendelser enda. Vær den første! ✨</EmptyState>
          ) : (
            <NamesGrid>
              {wishes.map(w => (
                <NameCard key={w.id} title={new Date(w.createdAt).toLocaleString()}>
                  <div>{w.name}</div>
                  <Time>{timeAgo(new Date(w.createdAt))}</Time>
                </NameCard>
              ))}
            </NamesGrid>
          )}
        </NamesViewport>
      </WallWrap>
    </Page>
  );
}

function StatBox({ label, value }) {
  return (
    <div style={{
      padding: 16,
      border: '1px solid rgba(255,255,255,0.14)',
      borderRadius: 16,
      background: 'linear-gradient(180deg, rgba(255,255,255,0.07), rgba(255,255,255,0.03))'
    }}>
      <div style={{fontSize:12, opacity:.75}}>{label}</div>
      <div style={{fontSize:22, fontWeight:900, letterSpacing:'.3px'}}>{value}</div>
    </div>
  );
}

function AdminPage() {
  const authed = useAuthed();
  const [attempted, setAttempted] = useState(false);
  if (!authed) return <AdminLogin onAttempt={() => setAttempted(true)} attempted={attempted} />;
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
            <Input ref={inputRef} type="password" placeholder="Skriv adminpassord"
                   value={pwd} onChange={(e)=>setPwd(e.target.value)} />
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

  const clearAll = () => { if (!window.confirm("Slette alle ønsker?")) return; saveWishes([]); };
  const remove = (id) => { saveWishes(loadWishes().filter(w => w.id !== id)); };
  const exportJson = () => {
    const blob = new Blob([JSON.stringify(wishes, null, 2)], { type: "application/json"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `dj_wishes_${new Date().toISOString().replace(/[:.]/g,'-')}.json`;
    a.click(); URL.revokeObjectURL(url);
  };
  const logout = () => { localStorage.removeItem(AUTH_KEY); window.dispatchEvent(new StorageEvent("storage", { key: AUTH_KEY })); };

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
                    <td><div style={{whiteSpace:'pre-wrap'}}>{w.wish}</div></td>
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
