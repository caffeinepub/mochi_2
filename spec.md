# Mochi

## Current State
8 games in Mood tab (Breathe, Bubble Pop, Memory Match, Word Scramble, Zen Tap, Squeeze Ball, Number Rush, Color Flood). Games are accessible via a horizontal-scroll card row. Each game opens as a fixed inset-0 fullscreen overlay.

## Requested Changes (Diff)

### Add
- Nothing new

### Modify
- MoodTab game card tapping: replace complex pointer tracking (pointerStart ref + 3 handlers, 15-20px threshold) with simple onClick + touchAction manipulation. onClick is safe here because pan-x scroll containers do not fire onClick on children during scroll.
- ZenTapGame: remove onClick from shape tap targets, keep only onPointerDown to avoid double-firing on mobile
- All game containers root div: add style={{ height: '100dvh' }} for iOS Safari dynamic viewport height so URL bar doesn't clip games
- All game back buttons and restart buttons: use onPointerDown instead of onClick for instant mobile response
- BreathingGame: change circle onClick to onPointerDown
- All in-game interactive elements: ensure onPointerDown is used, not onClick
- MemoryGame: ensure card flip uses onPointerDown

### Remove
- pointerStart ref and 3-handler pointer event tracking from MoodTab game cards
- onClick from ZenTap shape motion.button targets

## Implementation Plan
1. MoodTab.tsx: delete pointerStart useRef, remove onPointerDown/onPointerMove/onPointerUp from game motion.button cards, add onClick={() => setActiveGame(game.id)}
2. Each game file (BubblePopGame, ZenTapGame, BreathingGame, MemoryGame, WordScrambleGame, SqueezeBallGame, NumberOrderGame, ColorFloodGame): update root container height style, convert back/restart onClick to onPointerDown, convert in-game tap targets to onPointerDown
3. ZenTapGame specifically: remove onClick prop from shape motion.button
4. Validate build
