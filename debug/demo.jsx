import { useState, useEffect } from "react";

const HUD = () => {
  const [health, setHealth] = useState(3);
  const [maxHealth] = useState(5);
  const [score, setScore] = useState(12450);
  const [level, setLevel] = useState(3);
  const [progress, setProgress] = useState(0.42);
  const [coins, setCoins] = useState(27);

  // Animate progress for demo
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(p => {
        const next = p + 0.003;
        return next > 1 ? 0 : next;
      });
      setScore(s => s + 10);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  const P = {
    outline: '#3a2a1a',
    dark: '#6b4e2a',
    mid: '#9b7b4a',
    light: '#c4a055',
    highlight: '#d4b872',
    shine: '#e8d5a0',
    steel_dark: '#484e5c',
    steel_mid: '#6c7484',
    steel_light: '#949eac',
    red: '#c83728',
    red_light: '#e14b37',
    red_dark: '#8c2319',
    cyan: '#4ae0e0',
    cyan_dark: '#2a8888',
    gold: '#dca520',
    gold_light: '#f0c850',
    bg: '#2c2a1e',
  };

  const px = (size) => `${size}px`;

  // Pixel border helper via box-shadow
  const pixelBorder = (color, width = 2) => ({
    boxShadow: `
      ${width}px 0 0 0 ${color},
      -${width}px 0 0 0 ${color},
      0 ${width}px 0 0 ${color},
      0 -${width}px 0 0 ${color}
    `,
  });

  const bevelBox = (bg, light, dark, borderColor = P.outline) => ({
    backgroundColor: bg,
    border: `2px solid ${borderColor}`,
    boxShadow: `
      inset 2px 2px 0 0 ${light},
      inset -2px -2px 0 0 ${dark}
    `,
    imageRendering: 'pixelated',
  });

  const invertedBevel = (bg, light, dark, borderColor = P.outline) => ({
    backgroundColor: bg,
    border: `2px solid ${borderColor}`,
    boxShadow: `
      inset 2px 2px 0 0 ${dark},
      inset -2px -2px 0 0 ${light}
    `,
    imageRendering: 'pixelated',
  });

  // Heart SVG (pixel art style)
  const Heart = ({ filled, half }) => (
    <svg width="28" height="26" viewBox="0 0 14 13" style={{ imageRendering: 'pixelated' }}>
      {filled ? (
        <>
          {/* Filled heart */}
          <rect x="1" y="0" width="3" height="1" fill={P.red_light} />
          <rect x="6" y="0" width="3" height="1" fill={P.red_light} />
          <rect x="0" y="1" width="5" height="1" fill={P.red_light} />
          <rect x="5" y="1" width="1" height="1" fill={P.red} />
          <rect x="6" y="1" width="5" height="1" fill={P.red_light} />
          {/* Outline top */}
          <rect x="1" y="0" width="1" height="1" fill={P.outline} />
          <rect x="4" y="0" width="2" height="1" fill={P.outline} />
          <rect x="9" y="0" width="1" height="1" fill={P.outline} />
          {/* Body */}
          <rect x="0" y="2" width="11" height="4" fill={P.red} />
          <rect x="1" y="6" width="9" height="1" fill={P.red} />
          <rect x="2" y="7" width="7" height="1" fill={P.red} />
          <rect x="3" y="8" width="5" height="1" fill={P.red} />
          <rect x="4" y="9" width="3" height="1" fill={P.red} />
          <rect x="5" y="10" width="1" height="1" fill={P.red} />
          {/* Shine */}
          <rect x="2" y="1" width="2" height="1" fill="#f07860" />
          <rect x="1" y="2" width="2" height="2" fill="#f07860" />
        </>
      ) : (
        <>
          {/* Empty heart outline */}
          <rect x="1" y="0" width="3" height="1" fill={P.steel_mid} />
          <rect x="6" y="0" width="3" height="1" fill={P.steel_mid} />
          <rect x="0" y="1" width="1" height="2" fill={P.steel_mid} />
          <rect x="4" y="0" width="2" height="2" fill={P.steel_mid} />
          <rect x="10" y="1" width="1" height="2" fill={P.steel_mid} />
          <rect x="0" y="3" width="1" height="3" fill={P.steel_mid} />
          <rect x="10" y="3" width="1" height="3" fill={P.steel_mid} />
          <rect x="1" y="6" width="1" height="1" fill={P.steel_mid} />
          <rect x="9" y="6" width="1" height="1" fill={P.steel_mid} />
          <rect x="2" y="7" width="1" height="1" fill={P.steel_mid} />
          <rect x="8" y="7" width="1" height="1" fill={P.steel_mid} />
          <rect x="3" y="8" width="1" height="1" fill={P.steel_mid} />
          <rect x="7" y="8" width="1" height="1" fill={P.steel_mid} />
          <rect x="4" y="9" width="1" height="1" fill={P.steel_mid} />
          <rect x="6" y="9" width="1" height="1" fill={P.steel_mid} />
          <rect x="5" y="10" width="1" height="1" fill={P.steel_mid} />
          {/* Inner dark */}
          <rect x="1" y="1" width="3" height="1" fill={P.steel_dark} />
          <rect x="6" y="1" width="4" height="1" fill={P.steel_dark} />
          <rect x="1" y="2" width="9" height="4" fill={P.steel_dark} />
          <rect x="2" y="6" width="7" height="1" fill={P.steel_dark} />
          <rect x="3" y="7" width="5" height="1" fill={P.steel_dark} />
          <rect x="4" y="8" width="3" height="1" fill={P.steel_dark} />
          <rect x="5" y="9" width="1" height="1" fill={P.steel_dark} />
        </>
      )}
    </svg>
  );

  // Coin icon
  const CoinIcon = () => (
    <svg width="20" height="20" viewBox="0 0 10 10" style={{ imageRendering: 'pixelated' }}>
      <rect x="3" y="1" width="4" height="1" fill={P.gold} />
      <rect x="2" y="2" width="6" height="6" fill={P.gold_light} />
      <rect x="3" y="8" width="4" height="1" fill={P.gold} />
      <rect x="1" y="2" width="1" height="6" fill={P.gold} />
      <rect x="8" y="2" width="1" height="6" fill={P.gold} />
      <rect x="4" y="3" width="2" height="1" fill={P.outline} />
      <rect x="4" y="5" width="2" height="1" fill={P.outline} />
      <rect x="3" y="4" width="1" height="1" fill={P.outline} />
      <rect x="6" y="4" width="1" height="1" fill={P.outline} />
    </svg>
  );

  // Gear decoration
  const GearIcon = ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 8 8" style={{ imageRendering: 'pixelated' }}>
      <rect x="3" y="0" width="2" height="1" fill={P.mid} />
      <rect x="3" y="7" width="2" height="1" fill={P.mid} />
      <rect x="0" y="3" width="1" height="2" fill={P.mid} />
      <rect x="7" y="3" width="1" height="2" fill={P.mid} />
      <rect x="2" y="1" width="4" height="1" fill={P.light} />
      <rect x="1" y="2" width="6" height="4" fill={P.light} />
      <rect x="2" y="6" width="4" height="1" fill={P.light} />
      <rect x="3" y="3" width="2" height="2" fill={P.dark} />
    </svg>
  );

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      fontFamily: "'Press Start 2P', monospace",
      imageRendering: 'pixelated',
      pointerEvents: 'none',
      zIndex: 1000,
    }}>
      {/* Health hearts - floating above left side of notch */}
      <div style={{
        position: 'absolute',
        bottom: 68,
        left: 24,
        display: 'flex',
        gap: 4,
        alignItems: 'center',
        pointerEvents: 'auto',
      }}>
        {Array.from({ length: maxHealth }).map((_, i) => (
          <div
            key={i}
            onClick={() => setHealth(i + 1)}
            style={{ cursor: 'pointer', filter: 'drop-shadow(0 2px 0 rgba(0,0,0,0.5))' }}
          >
            <Heart filled={i < health} />
          </div>
        ))}
      </div>

      {/* Main notch bar */}
      <div style={{
        width: '100%',
        maxWidth: 800,
        position: 'relative',
        pointerEvents: 'auto',
      }}>
        {/* Notch shape - raised center bump */}
        <div style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          width: '100%',
        }}>
          {/* Left bar */}
          <div style={{
            flex: 1,
            height: 48,
            ...bevelBox(P.mid, P.highlight, P.dark),
            borderRight: 'none',
            display: 'flex',
            alignItems: 'center',
            padding: '0 12px',
            gap: 6,
          }}>
            {/* Coins */}
            <CoinIcon />
            <span style={{
              fontSize: 11,
              color: P.shine,
              letterSpacing: 1,
              textShadow: `1px 1px 0 ${P.outline}`,
            }}>
              {coins}
            </span>

            <div style={{ flex: 1 }} />

            {/* Score */}
            <GearIcon size={14} />
            <span style={{
              fontSize: 10,
              color: P.highlight,
              letterSpacing: 1,
              textShadow: `1px 1px 0 ${P.outline}`,
            }}>
              {score.toLocaleString()}
            </span>
          </div>

          {/* Center notch bump */}
          <div style={{
            width: 160,
            height: 64,
            ...bevelBox(P.light, P.shine, P.dark),
            borderBottom: `2px solid ${P.outline}`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            zIndex: 2,
          }}>
            {/* Level label */}
            <span style={{
              fontSize: 8,
              color: P.dark,
              letterSpacing: 2,
              marginBottom: 2,
            }}>
              LEVEL
            </span>
            {/* Level number */}
            <span style={{
              fontSize: 28,
              fontWeight: 'bold',
              color: P.outline,
              textShadow: `2px 2px 0 ${P.highlight}`,
              lineHeight: 1,
            }}>
              {level}
            </span>

            {/* Decorative rivets */}
            {[{ left: 8, top: 6 }, { right: 8, top: 6 }, { left: 8, bottom: 8 }, { right: 8, bottom: 8 }].map((pos, i) => (
              <div key={i} style={{
                position: 'absolute',
                ...pos,
                width: 6,
                height: 6,
                backgroundColor: P.rv || P.mid,
                border: `1px solid ${P.dark}`,
              }} />
            ))}
          </div>

          {/* Right bar */}
          <div style={{
            flex: 1,
            height: 48,
            ...bevelBox(P.mid, P.highlight, P.dark),
            borderLeft: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            padding: '0 12px',
            gap: 8,
          }}>
            {/* Progress label */}
            <span style={{
              fontSize: 8,
              color: P.dark,
              letterSpacing: 1,
            }}>
              {Math.round(progress * 100)}%
            </span>
          </div>
        </div>

        {/* Progress bar - runs full width along bottom of the notch */}
        <div style={{
          width: '100%',
          height: 12,
          ...invertedBevel(P.dark, P.mid, P.outline),
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Progress fill */}
          <div style={{
            position: 'absolute',
            left: 2,
            top: 2,
            bottom: 2,
            width: `${progress * 100}%`,
            maxWidth: 'calc(100% - 4px)',
            backgroundColor: P.cyan,
            boxShadow: `inset 0 2px 0 0 ${P.cyan_dark}`,
            transition: 'width 0.1s linear',
          }}>
            {/* Shine on progress bar */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 3,
              backgroundColor: 'rgba(200, 255, 255, 0.3)',
            }} />
          </div>

          {/* Tick marks */}
          {[0.25, 0.5, 0.75].map(tick => (
            <div key={tick} style={{
              position: 'absolute',
              left: `${tick * 100}%`,
              top: 0,
              bottom: 0,
              width: 2,
              backgroundColor: P.outline,
              opacity: 0.4,
            }} />
          ))}
        </div>
      </div>

      {/* Demo controls */}
      <div style={{
        position: 'fixed',
        top: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: 12,
        pointerEvents: 'auto',
        flexWrap: 'wrap',
        justifyContent: 'center',
      }}>
        <button onClick={() => setHealth(h => Math.max(0, h - 1))} style={demoBtnStyle}>
          - HP
        </button>
        <button onClick={() => setHealth(h => Math.min(maxHealth, h + 1))} style={demoBtnStyle}>
          + HP
        </button>
        <button onClick={() => setLevel(l => l + 1)} style={demoBtnStyle}>
          + LVL
        </button>
        <button onClick={() => setCoins(c => c + 5)} style={demoBtnStyle}>
          + Coin
        </button>
      </div>

      {/* Google font */}
      <link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap" rel="stylesheet" />
    </div>
  );
};

const demoBtnStyle = {
  fontFamily: "'Press Start 2P', monospace",
  fontSize: 8,
  padding: '8px 14px',
  backgroundColor: '#9b7b4a',
  color: '#e8d5a0',
  border: '2px solid #3a2a1a',
  cursor: 'pointer',
  imageRendering: 'pixelated',
  boxShadow: 'inset 2px 2px 0 0 #c4a055, inset -2px -2px 0 0 #6b4e2a',
};

export default HUD;
