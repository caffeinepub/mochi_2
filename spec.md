# Mochi - Version 23

## Current State
- Stories open via `openStory()` setting `viewingIdx`, but they use AnimatePresence/motion.div sliding up from bottom — may have animation delay
- Comment modal slides up from bottom but works similarly
- Profile photos exist but are not shown consistently across posts/comments (just emoji avatar or initials)
- AI uses Gemini 2.0 Flash with retry mechanism
- 3 games in MoodTab: Breathing, BubblePopGame, MemoryGame
- No levels or progression in games

## Requested Changes (Diff)

### Add
- 2+ new games in MoodTab with levels: a "Word Scramble" game with increasing difficulty levels, and a "Zen Tap" (tap the right shape) game with levels
- Level progression system in existing games (Memory Match gets difficulty levels: 4 cards, 8 cards, 12 cards)
- Profile photos displayed on all posts and comments (like Instagram) — use the stored profile photo if available, fallback to gradient avatar with initials
- Switch AI from Gemini to OpenRouter API using `meta-llama/llama-3.3-70b-instruct:free` model for better understanding (free, smarter)

### Modify
- Story viewer: open instantly with no slide-up delay — use scale+fade animation (0.15s) instead of y-slide
- Comment modal: open instantly on click with a quick scale animation from center-bottom — reduce spring animation stiffness for near-instant feel
- Profile photos: show actual photo (from localStorage `mochi_profile_photo`) in story bubbles, post cards, and comments instead of emoji/initials only
- AI callout: replace Gemini API key usage with OpenRouter API for all AI companions and Mochi chat (use model `meta-llama/llama-3.3-70b-instruct:free`, endpoint `https://openrouter.ai/api/v1/chat/completions`)

### Remove
- Slow slide-up animation delay on story and comment modal opening

## Implementation Plan
1. Update `StoriesBar.tsx`: change story viewer animation from y:"100%" slide to instant scale+fade (initial scale:0.95 opacity:0, animate scale:1 opacity:1, duration 0.15s)
2. Update `HomeTab.tsx` CommentModal: change animation to instant (initial opacity:0 y:20, animate opacity:1 y:0, duration 0.15s ease-out)
3. Update `HomeTab.tsx` post cards and comment display: read `localStorage.getItem('mochi_profile_photo')` for the current user's avatar, show it in posts and story bubbles
4. Update AI service (`AIChat.tsx`, `FriendsTab.tsx`, any AI call): replace Gemini fetch with OpenRouter fetch using `meta-llama/llama-3.3-70b-instruct:free`
5. Add `WordScrambleGame.tsx` with 5 levels of increasing word difficulty/scramble length
6. Add `ZenTapGame.tsx` — tap the matching shape/color, with 5 speed levels  
7. Update `MemoryGame.tsx` to support 3 difficulty levels (easy=4 pairs, medium=8 pairs, hard=12 pairs) with a level select screen
8. Update `MoodTab.tsx` to include the 2 new games in the GAMES list
