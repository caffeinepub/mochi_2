# Mochi — Real Social Chat System

## Current State
FriendsTab and ChatTab are using dummy/hardcoded AI placeholder users. There is no real user-to-user interaction. The backend has basic profile save/get and sendPrivateMessage, but no friend request system, no username search, and no persistent friend connections between real users.

## Requested Changes (Diff)

### Add
- Unique username system per user (auto-generated on first login, editable)
- Search users by username or profile ID
- Friend request: send, accept, reject
- Friends list showing confirmed friends only
- One-to-one chat between friends (messages saved in backend)
- Online/offline status tracking (last-seen timestamp based)
- Notifications for friend requests and acceptances

### Modify
- FriendsTab: replace dummy users with real search + friend request flow + friends list
- ChatTab: replace dummy AI chat rooms with real DMs between confirmed friends
- Profile: show own unique username/ID that others can search with
- Backend: extend to support friend requests, friend list queries, username index

### Remove
- Fake/placeholder friend entries and dummy chat rooms in Friends and Chat tabs

## Implementation Plan
1. Backend: Add username registry (username → Principal map), friend request storage (pending/accepted), update Profile to include username field
2. Backend: Add APIs: searchUserByUsername, sendFriendRequest, acceptFriendRequest, rejectFriendRequest, getFriendRequests (incoming), getFriends, updateLastSeen, getOnlineStatus
3. Frontend FriendsTab: Search bar to find users by username → show profile card → send friend request button. Incoming requests section with accept/reject. Friends list.
4. Frontend ChatTab: Show list of confirmed friends. Tap to open DM. Messages load from backend via getPrivateMessages. Send message saves to backend via sendPrivateMessage.
5. Frontend Profile: Display own username prominently with copy button so user can share it.
