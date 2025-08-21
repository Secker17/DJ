// Spotlight.js (full-screen, 2 min, med QR)
import React, { useEffect, useMemo, useState, useRef } from "react";
import styled, { keyframes, css } from "styled-components";

/**
 * Props:
 * - active: boolean
 * - message: string
 * - until: number (epoch ms når spotlighten er ferdig)
 * - durationSec?: number (default 120) — for progress
 * - onDone?: () => void
 */

// ==== QR: konfigurer her ====
// Sett URL-en som QR-koden skal peke til (full URL eller path)
const QR_TARGET_URL = "/main"; // f.eks. "/main" eller "https://dittdomene.no/main"
// Hvis du har et generert QR-bilde i /public, legg inn stien her.
// Hvis tom, brukes en lett ekstern generator.
const QR_IMG_URL = ""; // f.eks. "/qr-main.png"

export default function Spotlight({
  active,
  message = "Velkommen til",
  until = 0,
  durationSec = 120, // 2 minutter standard
  onDone,
}) {
  const [now, setNow] = useState(Date.now());
  const [exiting, setExiting] = useState(false);
  const exitTimer = useRef(null);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (active) {
      setExiting(false);
      clearTimeout(exitTimer.current);
    }
    return () => clearTimeout(exitTimer.current);
  }, [active, until]);

  const remainMs = Math.max(0, (until || 0) - now);

  // Progress (0 → 1) basert på varighet
  const totalMs = Math.max(1, durationSec * 1000);
  const progress = Math.max(0, Math.min(1, 1 - remainMs / totalMs));

  // mm:ss nedtelling
  const countdown = useMemo(() => {
    const s = Math.max(0, Math.floor(remainMs / 1000));
    const mm = String(Math.floor(s / 60)).padStart(2, "0");
    const ss = String(s % 60).padStart(2, "0");
    return `${mm}:${ss}`;
  }, [remainMs]);

  // Ferdig kl HH:MM
  const doneStr = useMemo(() => {
    if (!until) return "";
    const d = new Date(until);
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
  }, [until]);

  // QR: lag lenke og bilde
  const qrHref = useMemo(() => {
    try {
      const absolute = QR_TARGET_URL.startsWith("http")
        ? QR_TARGET_URL
        : (typeof window !== "undefined"
            ? new URL(QR_TARGET_URL, window.location.origin).toString()
            : QR_TARGET_URL);
      return absolute;
    } catch {
      return QR_TARGET_URL;
    }
  }, []);

  const qrSrc = useMemo(() => {
    if (QR_IMG_URL) return QR_IMG_URL;
    const size = 260;
    return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(qrHref)}`;
  }, [qrHref]);

  // Exit når ferdig
  useEffect(() => {
    if (!active) return;
    if (remainMs <= 0 && !exiting) {
      setExiting(true);
      exitTimer.current = setTimeout(() => {
        setExiting(false);
        onDone?.();
      }, 480);
    }
  }, [active, remainMs, exiting, onDone]);

  if (!active && !exiting) return null;

  return (
    <Overlay role="dialog" aria-live="polite" $exiting={exiting}>
      <FxA /><FxB /><FxC />

      <FullStage>
        <Ring aria-hidden>
          <RingSVG viewBox="0 0 160 160">
            <defs>
              <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#22d3ee" />
                <stop offset="50%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#ff2bd1" />
              </linearGradient>
            </defs>
            <circle cx="80" cy="80" r="68" className="track" />
            <circle
              cx="80"
              cy="80"
              r="68"
              className="bar"
              style={{
                strokeDasharray: `${Math.PI * 2 * 68}`,
                strokeDashoffset: `${Math.PI * 2 * 68 * (1 - progress)}`,
              }}
            />
          </RingSVG>
        </Ring>

        <Inner>
          <Kicker>Velkommen til</Kicker>
          <Title>{message}</Title>
          <MetaRow>
            <Pill>⏱ {countdown}</Pill>
            {!!doneStr && <Pill>🏁 Tilbake kl {doneStr}</Pill>}
          </MetaRow>
        </Inner>
      </FullStage>

      {/* QR-kort i spotlight */}
      <QRWrap>
        <QRCard title={`Skann for å sende inn ønske: ${qrHref}`}>
          <QRCaption>Skann for å sende inn 🎶</QRCaption>
          <a href={qrHref} target="_blank" rel="noreferrer" style={{ justifySelf: "center" }}>
            <QRImg src={qrSrc} alt="QR-kode til ønske-siden" />
          </a>
          <QRSub>{qrHref}</QRSub>
        </QRCard>
      </QRWrap>
    </Overlay>
  );
}

/* ===================== Styles ===================== */

const fadeIn = keyframes`
  from { opacity: 0; transform: scale(.985) translateY(6px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
`;
const fadeOut = keyframes`
  from { opacity: 1; transform: scale(1) translateY(0); }
  to   { opacity: 0; transform: scale(.985) translateY(6px); }
`;
const pulse = keyframes`
  0% { opacity: .5; transform: translate(-50%, -50%) scale(1); }
  50% { opacity: .95; transform: translate(-50%, -50%) scale(1.06); }
  100% { opacity: .5; transform: translate(-50%, -50%) scale(1); }
`;
const shimmer = keyframes`
  0% { background-position: -200% 50%; }
  100% { background-position: 200% 50%; }
`;

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100dvh;
  z-index: 2147483647;
  display: grid; place-items: center;
  background:
    radial-gradient(1200px 800px at 20% 10%, #4812ff66, transparent 60%),
    radial-gradient(1000px 700px at 90% 20%, #ff2bd166, transparent 60%),
    radial-gradient(900px 1000px at 50% 120%, #00ffcc55, transparent 60%),
    rgba(6,6,10,0.96);
  animation: ${props => props.$exiting ? fadeOut : fadeIn} 420ms ease both;
  pointer-events: ${props => props.$exiting ? "none" : "auto"};
  user-select: none;
  padding:
    max(16px, env(safe-area-inset-top))
    max(16px, env(safe-area-inset-right))
    max(16px, env(safe-area-inset-bottom))
    max(16px, env(safe-area-inset-left));
`;

const FullStage = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  overflow: hidden;
`;

const Inner = styled.div`
  position: relative;
  z-index: 1;
  text-align: center;
  max-width: min(92vw, 1600px);
`;

const Kicker = styled.div`
  font-weight: 900; letter-spacing: 2px; text-transform: uppercase;
  font-size: clamp(14px, 2.2vw, 24px);
  opacity: .95; margin-bottom: 8px;
  background: linear-gradient(90deg, #22d3ee, #8b5cf6, #ff2bd1, #22d3ee);
  background-size: 300% 100%;
  -webkit-background-clip: text; background-clip: text; color: transparent;
  animation: ${shimmer} 8s linear infinite;
`;

const Title = styled.h1`
  margin: 0 0 12px 0;
  font-family: Montserrat, Inter, sans-serif;
  font-size: clamp(42px, 10vw, 180px);
  font-weight: 900; letter-spacing: 2px; line-height: 1.05;
  background: linear-gradient(90deg, #ffffff, #f4f4ff, #ffffff);
  -webkit-background-clip: text; background-clip: text; color: transparent;
  text-shadow: 0 0 26px rgba(139,92,246,.25);
`;

const MetaRow = styled.div`
  display: inline-flex; gap: 12px; flex-wrap: wrap; justify-content: center;
`;

const Pill = styled.span`
  display: inline-flex; align-items: center; gap: 8px;
  padding: 10px 14px; border-radius: 999px;
  border: 1px solid rgba(255,255,255,0.18);
  background: linear-gradient(135deg, rgba(255,255,255,0.16), rgba(255,255,255,0.08));
  backdrop-filter: blur(10px);
  font-weight: 800; letter-spacing: .3px;
  font-size: clamp(14px, 2.4vw, 20px);
  margin-top: 6px;
`;

const Ring = styled.div`
  position: absolute;
  top: 50%; left: 50%; transform: translate(-50%, -50%);
  width: min(70vw, 720px); height: min(70vw, 720px);
  pointer-events: none;
  filter: drop-shadow(0 0 18px rgba(255,255,255,0.22));
  animation: ${pulse} 6s ease-in-out infinite;
  z-index: 0;
`;

const RingSVG = styled.svg`
  width: 100%; height: 100%; transform: rotate(-90deg);
  .track {
    fill: none; stroke: rgba(255,255,255,0.12); stroke-width: 14;
  }
  .bar {
    fill: none; stroke: url(#ringGrad); stroke-width: 14; stroke-linecap: round;
    transition: stroke-dashoffset .2s linear;
  }
`;

/* Bokeh / lys bakgrunner */
const FxBase = css`
  position: absolute; inset: -10%; pointer-events: none; z-index: 0;
  filter: blur(64px);
`;
const FxA = styled.div`
  ${FxBase};
  background: radial-gradient(800px 500px at 10% 20%, rgba(34,211,238,.28), transparent 60%);
`;
const FxB = styled.div`
  ${FxBase};
  background: radial-gradient(900px 600px at 85% 15%, rgba(255,43,209,.24), transparent 60%);
`;
const FxC = styled.div`
  ${FxBase};
  background: radial-gradient(1100px 800px at 50% 120%, rgba(139,92,246,.26), transparent 60%);
`;

/* ==== QR-styles ==== */
const QRWrap = styled.div`
  position: absolute;
  left: clamp(16px, 2.5vw, 28px);
  bottom: calc(clamp(16px, 2.5vw, 28px) + env(safe-area-inset-bottom));
  z-index: 3;
  pointer-events: auto;
`;

const QRCard = styled.div`
  display: grid;
  grid-template-rows: auto 1fr auto;
  align-items: center;
  gap: 8px;
  padding: 12px;
  border-radius: 18px;
  border: 1px solid rgba(255,255,255,0.18);
  background: linear-gradient(135deg, rgba(255,255,255,0.12), rgba(255,255,255,0.06));
  backdrop-filter: blur(10px);
  box-shadow: 0 10px 30px rgba(0,0,0,0.25);
`;

const QRCaption = styled.div`
  font-weight: 900; letter-spacing: .5px;
  font-size: clamp(12px, 1.6vw, 16px);
  opacity: .95;
`;

const QRSub = styled.div`
  font-size: clamp(11px, 1.4vw, 13px);
  opacity: .8;
  max-width: 48ch;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const QRImg = styled.img`
  width: clamp(140px, 18vw, 260px);
  height: auto;
  border-radius: 12px;
  background: #fff; /* bedre kontrast for skannere */
`;
