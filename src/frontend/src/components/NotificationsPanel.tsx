import { Bell, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  type Notification,
  loadNotifications,
  saveNotifications,
  seedSampleNotifications,
} from "../lib/notifications";

interface NotificationsPanelProps {
  open: boolean;
  onClose: () => void;
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const TYPE_ICONS: Record<Notification["type"], string> = {
  like: "❤️",
  comment: "💬",
  friend_request: "👥",
  friend_accepted: "✅",
};

export default function NotificationsPanel({
  open,
  onClose,
}: NotificationsPanelProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: open is intentional to reload on show
  useEffect(() => {
    seedSampleNotifications();
    setNotifications(loadNotifications());
  }, [open]);

  // Listen for new notifications pushed while panel is mounted
  useEffect(() => {
    const handler = () => {
      setNotifications(loadNotifications());
    };
    window.addEventListener("mochi-notification", handler);
    return () => window.removeEventListener("mochi-notification", handler);
  }, []);

  function markAllRead() {
    const updated = notifications.map((n) => ({ ...n, read: true }));
    setNotifications(updated);
    saveNotifications(updated);
  }

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9998]"
            style={{
              background: "rgba(0,0,0,0.3)",
              backdropFilter: "blur(2px)",
            }}
            onClick={onClose}
          />
          {/* Panel slides in from top */}
          <motion.div
            data-ocid="notifications.panel"
            initial={{ opacity: 0, y: -24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -24 }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-[9999] rounded-b-3xl overflow-hidden"
            style={{
              background: "oklch(var(--card))",
              boxShadow: "0 8px 32px oklch(0 0 0 / 0.18)",
              maxHeight: "70vh",
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-5 pt-12 pb-3 sticky top-0"
              style={{ background: "oklch(var(--card))" }}
            >
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-primary" />
                <h2 className="font-black text-base text-foreground">
                  Notifications
                </h2>
                {notifications.filter((n) => !n.read).length > 0 && (
                  <span
                    className="text-xs font-bold text-white rounded-full px-2 py-0.5"
                    style={{ background: "oklch(0.59 0.19 25)" }}
                  >
                    {notifications.filter((n) => !n.read).length}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {notifications.some((n) => !n.read) && (
                  <button
                    type="button"
                    data-ocid="notifications.secondary_button"
                    onClick={markAllRead}
                    className="text-xs font-bold text-primary hover:opacity-80 transition-opacity"
                  >
                    Mark all read
                  </button>
                )}
                <button
                  type="button"
                  data-ocid="notifications.close_button"
                  onClick={onClose}
                  className="p-1.5 rounded-full bg-muted hover:bg-muted/80 transition-colors"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            </div>

            {/* List */}
            <div
              className="overflow-y-auto pb-6"
              style={{ maxHeight: "calc(70vh - 80px)" }}
            >
              {notifications.length === 0 ? (
                <div
                  data-ocid="notifications.empty_state"
                  className="flex flex-col items-center justify-center py-12 text-center px-6"
                >
                  <Bell className="w-12 h-12 text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground">
                    No notifications yet 🌸
                  </p>
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    When someone likes your post or sends a request, you'll see
                    it here.
                  </p>
                </div>
              ) : (
                <div className="px-4 space-y-1">
                  {notifications.map((n, i) => (
                    <motion.div
                      key={n.id}
                      data-ocid={`notifications.item.${i + 1}`}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className={`flex items-start gap-3 p-3 rounded-2xl transition-colors ${
                        n.read ? "opacity-60" : ""
                      }`}
                      style={{
                        background: n.read
                          ? "transparent"
                          : "oklch(var(--muted) / 0.5)",
                      }}
                    >
                      <span className="text-xl flex-shrink-0 mt-0.5">
                        {TYPE_ICONS[n.type]}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground font-medium leading-snug">
                          {n.text}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {relativeTime(n.time)}
                        </p>
                      </div>
                      {!n.read && (
                        <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}
