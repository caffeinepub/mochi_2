export interface Notification {
  id: string;
  type:
    | "like"
    | "comment"
    | "friend_request"
    | "friend_accepted"
    | "monthly_review";
  text: string;
  time: string;
  read: boolean;
}

const STORAGE_KEY = "mochi_notifications";

export function loadNotifications(): Notification[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Notification[];
  } catch {
    /* ignore */
  }
  return [];
}

export function saveNotifications(notifications: Notification[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
  } catch {
    /* ignore */
  }
}

export function addNotification(
  n: Omit<Notification, "id" | "read" | "time">,
): void {
  const notifications = loadNotifications();
  const newN: Notification = {
    ...n,
    id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    read: false,
    time: new Date().toISOString(),
  };
  const updated = [newN, ...notifications].slice(0, 50);
  saveNotifications(updated);
  // Dispatch custom event so NotificationsPanel can react
  window.dispatchEvent(new CustomEvent("mochi-notification", { detail: newN }));
}

export function seedSampleNotifications(): void {
  const existing = loadNotifications();
  if (existing.length > 0) return; // already seeded
  const samples: Notification[] = [
    {
      id: "seed-1",
      type: "like",
      text: "Someone liked your post ❤️",
      time: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      read: false,
    },
    {
      id: "seed-2",
      type: "friend_request",
      text: "New friend request from @QuietMoon23 💜",
      time: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      read: false,
    },
    {
      id: "seed-3",
      type: "comment",
      text: "@stardust_vibes commented on your post 💬",
      time: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      read: true,
    },
  ];
  saveNotifications(samples);
}
