// StageScreen.js
import React, { useEffect, useMemo, useRef, useState } from "react";
import styled, { keyframes, css } from "styled-components";
import Spotlight from "./Spotlight";

// ===================== Firebase =====================
import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getFirestore, collection, onSnapshot, query, orderBy
} from "firebase/firestore";

// === FYLL INN hvis du endrer prosjekt ===
const firebaseConfig = {
  apiKey: "AIzaSyAksjWsBY1BwAgn5tQOx0rWE_jyvIsCQf0",
  authDomain: "secker-b1631.firebaseapp.com",
  projectId: "secker-b1631",
  storageBucket: "secker-b1631.firebasestorage.app",
  messagingSenderId: "982111941240",
  appId: "1:982111941240:web:80e5e558325718dca3338d",
  measurementId: "G-FMXENEMH1Y",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);

const WISHES_COL = "dj_wishes_live_v1";

// Konfig
const WALL_WATERMARK_URL = "/vinbar.png";
const WATERMARK_OPACITY = 0.22;
const SPOTLIGHT_KEY = "dj_wishes_spotlight_v1";
const CHANNEL_NAME = "dj_wish_events";

const ROTATE_MS = 9000;         // hvor ofte hero byttes
const SIDE_MAX = 14;            // antall i sidelista
const HERO_MAX_LEN = 160;       // trim av svært lange hero-tekster
const SPOTLIGHT_DURATION = 120;  // sekunder — bør matche Admin-trigger

// ===================== Utils =====================
function useWishesRealtime() {
  const [wishes, setWishes] = useState([]);
  useEffect(() => {
    const q = query(collection(db, WISHES_COL), orderBy("createdAtMs", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const arr = snap.docs.map((d) => {
        const data = d.data() || {};
        const createdAt =
          data.createdAt?.toDate?.() ||
          (data.createdAtMs ? new Date(data.createdAtMs) : null);
        return {
          id: d.id,
          name: data.name || "",
          wish: data.wish || "",
          createdAt,
          createdAtMs: data.createdAtMs || 0,
        };
      });
      setWishes(arr);
    });
    return () => unsub();
  }, []);
  return wishes;
}

function timeAgo(date) {
  if (!date) return "nå";
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return `${diff}s siden`;
  const m = Math.floor(diff / 60);
  if (m < 60) return `${m}m siden`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}t siden`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d siden`;
  return date.toLocaleDateString();
}

function formatClock(d = new Date()) {
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

function loadSpotlight() {
  try {
    const raw = localStorage.getItem(SPOTLIGHT_KEY);
    if (!raw) return null;
    const obj = JSON.parse(raw);
    return obj && typeof obj === "object" ? obj : null;
  } catch {
    return null;
  }
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

function trimOneLine(txt = "", max = 80) {
  const one = txt.replace(/\s+/g, " ").trim();
  return one.length > max ? one.slice(0, max - 1) + "…" : one;
}

// ===================== Animations =====================
const bgPulse = keyframes`
  0% { opacity: .8; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.02); }
  100% { opacity: .8; transform: scale(1); }
`;
const shimmer = keyframes`
  0% { background-position: -200% 50%; }
  100% { background-position: 200% 50%; }
`;
const glow = keyframes`
  0% { box-shadow: 0 0 0px rgba(255,255,255,0.05), 0 0 24px rgba(139,92,246,0.15); }
  100% { box-shadow: 0 0 0px rgba(255,255,255,0.15), 0 0 36px rgba(34,211,238,0.28); }
`;
const slideUp = keyframes`
  from { opacity: 0; transform: translateY(18px) scale(.992); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
`;
const fadeSwapIn = keyframes`
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
`;
const eq = keyframes`
  0% { transform: scaleY(0.2); }
  25% { transform: scaleY(0.8); }
  50% { transform: scaleY(0.4); }
  75% { transform: scaleY(1); }
  100% { transform: scaleY(0.2); }
`;

// ===================== Layout =====================
const Wrap = styled.div`
  position: relative;
  height: 100svh; /* bedre enn 100vh på desktop/mobil */
  width: 100%;
  overflow: hidden;
  padding: clamp(16px, 2.5vw, 28px);
  color: #fff;
  background:
    radial-gradient(1200px 800px at 20% 10%, #4812ff33, transparent 60%),
    radial-gradient(1000px 700px at 90% 20%, #ff2bd133, transparent 60%),
    radial-gradient(900px 1000px at 50% 120%, #00ffcc22, transparent 60%),
    #0a0a0f;
  ${({ $hideCursor }) => $hideCursor && css`cursor: none;`}
`;

const Watermark = styled.div`
  position: absolute; inset: 0; pointer-events: none; display: grid; place-items: center;
  opacity: ${WATERMARK_OPACITY};
  img {
    max-width: 60%;
    max-height: 60%;
    object-fit: contain;
    filter: drop-shadow(0 0 24px rgba(255,255,255,0.08));
    mix-blend-mode: screen;
    animation: ${bgPulse} 10s ease-in-out infinite;
  }
`;

const Grid = styled.div`
  position: relative;
  z-index: 1;
  height: 100%;
  display: grid;
  grid-template-rows: auto 1fr auto;
  gap: clamp(12px, 2vw, 18px);
`;

const TopRow = styled.div`
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: end;
  gap: 12px;
`;

const Title = styled.h1`
  margin: 0;
  font-family: Montserrat, Inter, sans-serif;
  font-size: clamp(28px, 5vw, 56px);
  letter-spacing: 2px;
  line-height: 1.05;
  background: linear-gradient(90deg, #22d3ee, #8b5cf6, #ff2bd1, #22d3ee);
  background-size: 300% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  animation: ${shimmer} 10s linear infinite;
`;

const RightHUD = styled.div`
  display: grid; gap: 8px; justify-items: end;
`;

const LivePill = styled.div`
  display: inline-flex; align-items: center; gap: 10px;
  padding: 10px 14px;
  border-radius: 999px;
  border: 1px solid rgba(255,255,255,0.18);
  background: linear-gradient(135deg, rgba(255,255,255,0.12), rgba(255,255,255,0.06));
  backdrop-filter: blur(10px);
  font-weight: 800;
  letter-spacing: .3px;
  &::before {
    content: "";
    width: 10px; height: 10px; border-radius: 999px;
    background: #22d3ee;
    box-shadow: 0 0 10px #22d3ee, 0 0 20px #22d3ee;
  }
`;

const Clock = styled.div`
  font-weight: 900;
  letter-spacing: 1px;
  font-size: clamp(16px, 2.6vw, 28px);
  opacity: .95;
`;

const Main = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 2.2fr) minmax(0, 1fr);
  gap: clamp(12px, 2vw, 18px);
  height: 100%;
  min-height: 0;
`;

const Hero = styled.div`
  position: relative;
  border-radius: 28px;
  border: 1px solid rgba(255,255,255,0.18);
  background: linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03));
  padding: clamp(16px, 2.2vw, 28px);
  display: grid;
  grid-template-rows: auto 1fr auto;
  gap: clamp(8px, 1.5vw, 14px);
  animation: ${glow} 2.8s ease-in-out infinite alternate, ${slideUp} 400ms ease both;
  overflow: hidden;
`;

const Accent = styled.div`
  position: absolute; inset: -2px;
  background: conic-gradient(from 180deg at 50% 50%, rgba(34,211,238,0.22), rgba(139,92,246,0.22), rgba(255,43,209,0.22), rgba(34,211,238,0.22));
  filter: blur(28px);
  opacity: .35;
  pointer-events: none;
`;

const HeroKicker = styled.div`
  font-weight: 900; letter-spacing: 2px; text-transform: uppercase;
  font-size: clamp(12px, 1.8vw, 16px);
  opacity: .9;
`;

const HeroSwap = styled.div`
  display: grid; gap: 12px; align-content: start;
  animation: ${fadeSwapIn} 300ms ease both;
`;

const HeroTitle = styled.div`
  font-family: Montserrat, Inter, sans-serif;
  font-size: clamp(28px, 4vw, 64px);
  font-weight: 900;
  line-height: 1.12;
  margin-top: 8px;
`;

const HeroNote = styled.div`
  font-size: clamp(16px, 2vw, 22px);
  opacity: .9;
  white-space: pre-wrap;
`;

const HeroMeta = styled.div`
  display: flex; gap: 16px; flex-wrap: wrap;
  font-size: clamp(12px, 1.6vw, 14px);
  opacity: .85;
`;

const Pill = styled.span`
  display: inline-flex; align-items: center; gap: 8px;
  padding: 8px 12px; border-radius: 999px;
  border: 1px solid rgba(255,255,255,0.18);
  background: linear-gradient(135deg, rgba(255,255,255,0.12), rgba(255,255,255,0.06));
  backdrop-filter: blur(8px);
`;

// Equalizer overlay
const EQWrap = styled.div`
  position: absolute;
  right: clamp(10px, 1.2vw, 16px);
  bottom: clamp(10px, 1.2vw, 16px);
  display: inline-flex; align-items: flex-end; gap: 6px;
  opacity: .85;
`;
const EQBar = styled.div`
  width: clamp(6px, 1vw, 9px);
  height: 28px;
  transform-origin: bottom;
  background: linear-gradient(180deg, rgba(34,211,238,0.85), rgba(139,92,246,0.85), rgba(255,43,209,0.85));
  border-radius: 6px;
  animation: ${eq} 1.6s ease-in-out infinite;
  ${({ $delay }) => css`animation-delay: ${$delay}s;`}
`;

const SideList = styled.div`
  position: relative;
  border-radius: 24px;
  border: 1px solid rgba(255,255,255,0.18);
  background: linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03));
  padding: clamp(12px, 1.8vw, 18px);
  display: grid; grid-template-rows: auto 1fr;
  min-height: 0;
`;

const SideTitle = styled.div`
  font-weight: 800; letter-spacing: .5px;
  font-size: clamp(14px, 1.8vw, 18px);
  opacity: .9; margin-bottom: 8px;
`;

const ListScroller = styled.div`
  overflow: auto; min-height: 0;
`;

const Item = styled.div`
  border-radius: 16px;
  padding: 12px 14px;
  border: 1px solid rgba(255,255,255,0.12);
  background: linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.04));
  backdrop-filter: blur(8px);
  margin-bottom: 10px;
  animation: ${slideUp} 280ms ease both;
`;
const ItemName = styled.div`
  font-weight: 900; font-size: clamp(14px, 1.8vw, 18px);
`;
const ItemWish = styled.div`
  opacity: .9; font-size: clamp(12px, 1.6vw, 14px);
  white-space: pre-wrap;
`;
const ItemTime = styled.div`
  opacity: .65; font-size: clamp(11px, 1.4vw, 12px); margin-top: 6px;
`;

// Ticker
const marquee = keyframes`
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
`;
const TickerWrap = styled.div`
  position: relative;
  border: 1px solid rgba(255,255,255,0.18);
  background: linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03));
  border-radius: 16px;
  overflow: hidden;
  height: clamp(42px, 6vh, 64px);
  &::before, &::after {
    content: ""; position: absolute; top:0; bottom:0; width: 90px; z-index: 2;
    pointer-events: none;
  }
  &::before {
    left: 0; background: linear-gradient(90deg, #0a0a0f, transparent);
  }
  &::after {
    right: 0; background: linear-gradient(270deg, #0a0a0f, transparent);
  }
`;
const TickerInner = styled.div`
  display: flex; gap: 40px; align-items: center;
  padding: 0 20px;
  height: 100%;
  white-space: nowrap;
  animation: ${marquee} 40s linear infinite;
  will-change: transform;
`;
const Tick = styled.div`
  font-weight: 800;
  font-size: clamp(14px, 2.4vh, 20px);
  opacity: .95;
`;

// ===================== Component =====================
export default function StageScreen() {
  const wishes = useWishesRealtime();

  // Spotlight (fra Admin → BroadcastChannel eller localStorage fallback)
  const [spotlight, setSpotlight] = useState(() => loadSpotlight());
  const [nowTick, setNowTick] = useState(Date.now());
  const [clock, setClock] = useState(formatClock());
  const [hideCursor, setHideCursor] = useState(false);
  const hideTimer = useRef(null);

  // Idle cursor hide
  const onMove = () => {
    setHideCursor(false);
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setHideCursor(true), 2500);
  };

  useEffect(() => {
    const t = setInterval(() => {
      setNowTick(Date.now());
      setClock(formatClock(new Date()));
    }, 1000);
    return () => clearInterval(t);
  }, []);

  // Spotlight lytter
  useEffect(() => {
    const ch = getBC();
    if (!ch) return;
    const onMsg = (e) => {
      const data = e?.data;
      if (data?.type === "spotlight" && data.payload) {
        setSpotlight(data.payload);
        try { localStorage.setItem(SPOTLIGHT_KEY, JSON.stringify(data.payload)); } catch {}
      }
    };
    ch.addEventListener ? ch.addEventListener("message", onMsg) : (ch.onmessage = onMsg);
    return () => {
      ch.removeEventListener ? ch.removeEventListener("message", onMsg) : (ch.onmessage = null);
    };
  }, []);

  const spotlightActive = useMemo(() => {
    if (!spotlight?.active) return false;
    const until = spotlight?.until || 0;
    const remain = until - nowTick;
    return remain > 0;
  }, [spotlight, nowTick]);

  // Hero-rotasjon
  const ordered = wishes; // allerede desc (nyeste først)
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (ordered.length === 0) return;
    const timer = setInterval(() => {
      setIdx((i) => (i + 1) % Math.max(1, Math.min(10, ordered.length))); // topp ~10
    }, ROTATE_MS);
    return () => clearInterval(timer);
  }, [ordered.length]);

  useEffect(() => { setIdx(0); }, [ordered.length]);

  // Tastatur: ←/→ bytt, F = fullskjerm
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowRight") setIdx(i => (i + 1) % Math.max(1, ordered.length || 1));
      else if (e.key === "ArrowLeft") setIdx(i => (i - 1 + Math.max(1, ordered.length || 1)) % Math.max(1, ordered.length || 1));
      else if (e.key.toLowerCase() === "f") toggleFullscreen();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [ordered.length]);

  const hero = ordered[idx] || null;
  const side = ordered.filter((_, i) => i !== idx).slice(0, SIDE_MAX);

  // Ticker content (dupliser for sømløs loop)
  const tickerItems = useMemo(() => {
    const base = ordered.slice(0, 30).map(w =>
      `${w.name}${w.wish ? " — " + trimOneLine(w.wish) : ""}`
    );
    return base.length ? [...base, ...base] : base;
  }, [ordered]);

  const heroWish = hero?.wish ? trimOneLine(hero.wish, HERO_MAX_LEN) : "";

  return (
    <Wrap onMouseMove={onMove} $hideCursor={hideCursor}>
      {WALL_WATERMARK_URL && (
        <Watermark><img src={WALL_WATERMARK_URL} alt="Vannmerke" /></Watermark>
      )}

      <Grid>
        <TopRow>
          <Title>Publikumets Sangønsker</Title>
          <RightHUD>
            <LivePill>LIVE</LivePill>
            <Clock aria-label="Klokke">{clock}</Clock>
          </RightHUD>
        </TopRow>

        <Main>
          <Hero key={hero?.id || "empty"}>
            <Accent />
            <HeroKicker>Fremhevet ønske</HeroKicker>

            <HeroSwap>
              <HeroTitle>
                {hero ? (heroWish || "—") : "Ingen ønsker enda"}
              </HeroTitle>
              <HeroNote>
                {hero ? `Fra: ${hero.name}` : "Be publikum sende inn via QR / nettside"}
              </HeroNote>
            </HeroSwap>

            <HeroMeta>
              <Pill>{hero?.createdAt ? timeAgo(hero.createdAt) : "nå"}</Pill>
              {hero?.createdAt && <Pill>{hero.createdAt.toLocaleString()}</Pill>}
              <Pill>Totalt: {wishes.length}</Pill>
              {ordered.length > 1 && <Pill>Neste: {ordered[(idx + 1) % ordered.length]?.name || "—"}</Pill>}
            </HeroMeta>

            {/* Equalizer overlay */}
            <EQWrap aria-hidden>
              {[0,0.1,0.2,0.05,0.18,0.12,0.26,0.33].map((d,i)=>(
                <EQBar key={i} $delay={d} />
              ))}
            </EQWrap>
          </Hero>

          <SideList>
            <SideTitle>Nyeste innsendelser</SideTitle>
            <ListScroller>
              {side.length === 0 ? (
                <Item><ItemName>—</ItemName><ItemWish>Ingen flere ønsker.</ItemWish></Item>
              ) : side.map((w) => (
                <Item key={w.id} title={w.createdAt ? w.createdAt.toLocaleString() : ""}>
                  <ItemName>{w.name}</ItemName>
                  {w.wish && <ItemWish>{w.wish}</ItemWish>}
                  <ItemTime>{w.createdAt ? timeAgo(w.createdAt) : "nå"}</ItemTime>
                </Item>
              ))}
            </ListScroller>
          </SideList>
        </Main>

        <TickerWrap aria-hidden={tickerItems.length === 0}>
          <TickerInner>
            {tickerItems.length === 0 ? (
              <Tick>Send inn ditt ønske nå ✨</Tick>
            ) : tickerItems.map((t, i) => <Tick key={i}>🎵 {t}</Tick>)}
          </TickerInner>
        </TickerWrap>
      </Grid>

      {/* Spotlight-overlay via egen komponent */}
      <Spotlight
        active={spotlightActive}
        message={spotlight?.message || "HAGEN VINBAR"}
        until={spotlight?.until || 0}
        durationSec={SPOTLIGHT_DURATION}
        onDone={() => {
          try { localStorage.removeItem(SPOTLIGHT_KEY); } catch {}
          setSpotlight(null);
        }}
      />
    </Wrap>
  );
}

// ===================== helpers =====================
function toggleFullscreen() {
  const el = document.documentElement;
  const anyDoc = /** @type {any} */ (document);
  if (!document.fullscreenElement &&
      !anyDoc.webkitFullscreenElement &&
      !anyDoc.mozFullScreenElement &&
      !anyDoc.msFullscreenElement) {
    (el.requestFullscreen || el.webkitRequestFullscreen || el.mozRequestFullScreen || el.msRequestFullscreen)?.call(el);
  } else {
    (document.exitFullscreen || anyDoc.webkitExitFullscreen || anyDoc.mozCancelFullScreen || anyDoc.msExitFullscreen)?.call(document);
  }
}
