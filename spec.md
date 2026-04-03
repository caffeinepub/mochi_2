# Mochi — Stability & Feature Polish Pass

## Current State
- App is version 55 with full feature set: chat rooms, mentors, AI companions, friend DMs, stories, games, mascot, mood tracker, theories, profile.
- FloatingMochi exists in App.tsx and is rendered at the bottom, but may not appear on all screens due to z-index/render issues.
- ChatTab uses Pollinations.ai via callGemini for mentor responses; chat rooms have basic polling.
- FriendsTab has real DM system using backend `useGetPrivateMessages` + optimistic UI.
- AIChat and AIChatView use callGemini with fallback responses.
- ProfileTab has an Install button but only shows when `canInstall` (PWA prompt) is true — meaning it won't appear on iOS or when already installed.
- Update banner auto-dismisses after 8s and is keyed to APP_VERSION "55".
- gemini.ts uses Pollinations.ai with 20s timeout, tries openai-large then openai fallback.

## Requested Changes (Diff)

### Add
- Profile page: Always-visible Install / Add to Home Screen button (not gated by PWA prompt availability — show instructions for all platforms).
- Update notification: Bump APP_VERSION to trigger banner for all existing users. Banner should be persistent (no auto-dismiss) until user explicitly refreshes or dismisses.
- FloatingMochi: Ensure it renders above ALL content including chat views and overlays.

### Modify
- Chat system (ChatTab + FriendsTab RealDMChat):
  - Add auto-polling for chat rooms (poll every 4s when room is open).
  - Fix message sending UX: disable send button while sending, show sending indicator.
  - Improve chat room scroll: always scroll to bottom on new messages.
  - Add loading skeleton while messages load.
  - Fix sync: chat rooms should refetch on focus.
  - Improve error handling: show retry option on failed messages.
- AI responses (gemini.ts + AIChat + AIChatView):
  - Increase timeout to 25s for better reliability.
  - Add retry logic: if both models fail, retry once more after 2s.
  - Better fallback messages that feel natural (not generic).
  - Show proper loading state (typing indicator must appear immediately, not after delay).
  - Fix: ensure callGemini never returns empty string (trim + length check).
- FloatingMochi: Fix z-index to 9999 to appear above all overlays, chat screens, and game panels.
- ProfileTab Install button: Always show install section regardless of PWA prompt state. Show platform-specific instructions (Android: Add to Home Screen in Chrome menu, iOS: Share > Add to Home Screen). Keep PWA prompt button when available.
- APP_VERSION: Bump to "58" to trigger update notification for all users.
- Update banner: Remove auto-dismiss timer. Banner stays until user acts.

### Remove
- Nothing removed.

## Implementation Plan
1. Bump APP_VERSION in App.tsx from "55" to "58".
2. Remove the 8s auto-dismiss timer from UpdateBanner component.
3. Fix FloatingMochi z-index to 9999 in FloatingMochi.tsx.
4. Update gemini.ts: increase timeout to 25s, add retry logic, better validation.
5. Fix ChatTab: add polling interval for room messages, fix scroll-to-bottom, improve loading states.
6. Fix FriendsTab RealDMChat: ensure messages refetch every 5s while chat is open, fix scroll.
7. Update ProfileTab Install section: always visible, show platform instructions, keep PWA prompt when available.
8. Validate and deploy.
