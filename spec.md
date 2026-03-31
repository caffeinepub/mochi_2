# Mochi — Sound + Games Fix + Install Button

## Current State
- FloatingMochi: tap-to-grow-and-burst animation exists but no sound
- Games: most use onClick which has 300ms delay on mobile causing unresponsive feel; MemoryGame card flips use onClick
- ProfileTab: no app install option
- No PWA manifest.json exists

## Requested Changes (Diff)

### Add
- Sound effects in FloatingMochi: small 'pip' tone on each tap, loud BOOM sound on burst (Web Audio API)
- Install App button in ProfileTab below the Language section (PWA beforeinstallprompt)
- manifest.json in public/ for PWA support

### Modify
- MemoryGame: switch card flip handler from onClick to onPointerDown to eliminate 300ms tap delay on mobile; add touchAction: 'manipulation' to all buttons
- ZenTapGame: already uses onPointerDown but ensure shapes have touchAction: 'none'
- All game back/restart/action buttons: ensure onPointerDown or touchAction: manipulation is used consistently
- BubblePopGame: already working, verify no regressions

### Remove
- Nothing

## Implementation Plan
1. FloatingMochi.tsx: add playTapSound() (short sine pip) and playBurstSound() (loud BOOM) using Web Audio API; call playTapSound on each tap, playBurstSound in triggerBurst()
2. MemoryGame.tsx: change handleFlip trigger from onClick to onPointerDown; add touchAction: 'manipulation' style to all buttons
3. ProfileTab.tsx: add usePWAInstall hook (listens for beforeinstallprompt), show Install App card/button below Language section only when prompt is available
4. Create src/frontend/public/manifest.json with app name, icons, theme_color, display: standalone
5. Add <link rel="manifest"> in index.html if not present
