// App.js
import React, { useEffect, useState } from "react";
import { HashRouter, Routes, Route, NavLink, useLocation } from "react-router-dom";
import styled, { createGlobalStyle } from "styled-components";

// Sider
import Main from "./Main";
import Admin from "./Admin";
import StageScreen from "./StageScreen";

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

// ===================== App + Router =====================
export default function App() {
  return (
    <HashRouter>
      <Global />
      <Shell />
    </HashRouter>
  );
}

function Shell() {
  const { pathname } = useLocation();

  // Skjul chrome (header/footer) på forsiden og storskjerm
  const chromeless = pathname === "/" || pathname === "/screen";

  // Stars state (kun relevant når header vises)
  const [stars, setStars] = useLocalStars();
  const [voted, setVoted] = useState(getVoted());

  useEffect(() => {
    const onStorage = (e) => {
      if (!e || e.key === STAR_KEY || e.key === STAR_VOTED_KEY) {
        setStars(loadStars());
        setVoted(getVoted());
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [setStars]);

  const toggleStar = () => {
    const el = document.getElementById("star-cta");
    if (el) { el.classList.remove("pop"); void el.offsetWidth; el.classList.add("pop"); }
    if (voted) {
      saveStars(Math.max(0, stars - 1));
      setVotedLocal(false);
      setStars(loadStars());
      setVoted(false);
    } else {
      saveStars(stars + 1);
      setVotedLocal(true);
      setStars(loadStars());
      setVoted(true);
    }
  };

  return (
    <AppWrap>
      {!chromeless && (
        <TopBar>
          <Brand><Vinyl width={64} height={64} /></Brand>
          <TitleWrap>
            <Title>DJ Wish Wall</Title>
            <SubTitle>Send inn låtønsker — navnet ditt vises på veggen ✨</SubTitle>
            <EventTag>Event: Vollen Vinbar</EventTag>
          </TitleWrap>

          <StarBlock>
            <StarCaption>Trykk om du liker DJ-en!</StarCaption>
            <StarButton id="star-cta" onClick={toggleStar} title="Trykk om du liker DJ-en!">
              <StarIcon active={voted} /><StarCount>{stars}</StarCount>
            </StarButton>
          </StarBlock>

          <Nav>
            <NavLinkBtn to="/" end className={({isActive})=>isActive ? "active" : ""}>
              Publikumsvegg
            </NavLinkBtn>
            <NavLinkBtn to="/screen" className={({isActive})=>isActive ? "active" : ""}>
              Storskjerm
            </NavLinkBtn>
            <NavLinkBtn to="/admin" className={({isActive})=>isActive ? "active" : ""}>
              Admin
            </NavLinkBtn>
            <a href="https://vintrastudio.com" target="_blank" rel="noreferrer">
              <NavButton as="span">Laget av Vintra Studio</NavButton>
            </a>
          </Nav>
        </TopBar>
      )}

      <MainArea>
        <Routes>
          <Route path="/" element={<Main />} />
          <Route path="/screen" element={<StageScreen />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<Main />} />
        </Routes>
      </MainArea>

      {!chromeless && (
        <Footer>© {new Date().getFullYear()} DJ Wish Wall — Laget av Vintra Studio.</Footer>
      )}
    </AppWrap>
  );
}

// ===================== Stars (localStorage) =====================
const STAR_KEY = "dj_wishes_stars_v1";
const STAR_VOTED_KEY = "dj_wishes_star_vote_v1";

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
function getVoted() { return localStorage.getItem(STAR_VOTED_KEY) === "1"; }
function setVotedLocal(v) {
  if (v) localStorage.setItem(STAR_VOTED_KEY, "1");
  else localStorage.removeItem(STAR_VOTED_KEY);
  window.dispatchEvent(new StorageEvent("storage", { key: STAR_VOTED_KEY }));
}
function useLocalStars() {
  const [val, setVal] = useState(loadStars());
  useEffect(() => {
    const onStorage = (e) => { if (!e || e.key === STAR_KEY) setVal(loadStars()); };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
  return [val, setVal];
}

// ===================== Layout / UI =====================
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

// ⭐ Star block
const StarBlock = styled.div`
  display: flex; align-items: center; gap: 10px;
  margin-left: auto; margin-right: 12px; flex-wrap: wrap;
`;
const StarCaption = styled.span`font-size: 12px; opacity: .9; white-space: nowrap;`;
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
const StarCount = styled.span`font-size: 14px; opacity: .9;`;

// Nav
const Nav = styled.nav`
  display: flex; gap: 8px; flex-wrap: wrap; justify-content: flex-end;
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
const NavLinkBtn = styled(NavLink)`
  text-decoration: none;
  padding: 10px 14px; border-radius: 12px; font-weight: 700;
  color: #fff; display: inline-block;
  background: linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.06));
  border: 1px solid rgba(255,255,255,0.14);
  backdrop-filter: blur(8px);
  transition: transform .15s ease, border-color .2s ease, box-shadow .2s ease;
  &:hover { transform: translateY(-1px); border-color: rgba(255,255,255,0.3); }
  &:active { transform: translateY(0); }
  &.active { border-color: rgba(255,255,255,0.45); box-shadow: 0 0 0 3px rgba(139,92,246,0.25) inset; }
`;

const MainArea = styled.div`
  min-height: 0;
  overflow: hidden;
`;

const Footer = styled.footer`
  padding: 10px 16px; text-align: center; opacity: .75; font-size: 12px;
`;

// ===================== Vinyl + Star Icon (for header) =====================
function Vinyl({ width = 64, height = 64 }) {
  return (
    <svg id="vinyl-svg" viewBox="0 0 256 256" width={width} height={height}
         role="img" aria-label="Spinning vinyl" xmlns="http://www.w3.org/2000/svg"
         style={{ display: 'block' }}>
      <defs>
        <radialGradient id="discGrad" cx="50%" cy="50%" r="55%">
          <stop offset="0%"  stopColor="#0e0e16"/>
          <stop offset="70%" stopColor="#0a0a12"/>
          <stop offset="100%" stopColor="#07070c"/>
        </radialGradient>
      </defs>
      <g id="discGroup">
        <circle cx="128" cy="128" r="110" fill="url(#discGrad)"/>
        <circle cx="128" cy="128" r="110" fill="none" stroke="#1b1b25" strokeWidth="2"/>
        <circle cx="128" cy="128" r="22" fill="#111625" stroke="#cbd5e155" strokeWidth="2"/>
        <circle cx="128" cy="128" r="14" fill="#0c101a" stroke="#cbd5e12e" strokeWidth="1.5"/>
        <circle cx="128" cy="128" r="3"  fill="#0a0a0f"/>
      </g>
    </svg>
  );
}

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
