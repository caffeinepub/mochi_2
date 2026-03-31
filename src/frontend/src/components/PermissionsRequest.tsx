import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

interface Props {
  onDone: () => void;
}

const PERMISSIONS = [
  {
    icon: "📍",
    label: "Location",
    desc: "Tere nearby friends aur events dhundne ke liye",
  },
  {
    icon: "🔔",
    label: "Notifications",
    desc: "Mood reminders aur friend updates ke liye",
  },
  {
    icon: "📷",
    label: "Camera",
    desc: "Photos aur stories share karne ke liye",
  },
  {
    icon: "🎤",
    label: "Microphone",
    desc: "Voice messages bhejne ke liye",
  },
];

export default function PermissionsRequest({ onDone }: Props) {
  const [loading, setLoading] = useState(false);

  const requestAll = async () => {
    setLoading(true);
    try {
      navigator.geolocation.getCurrentPosition(
        () => {},
        () => {},
      );
    } catch {}
    try {
      await Notification.requestPermission();
    } catch {}
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      for (const track of stream.getTracks()) {
        track.stop();
      }
    } catch {}
    setLoading(false);
    finish();
  };

  const finish = () => {
    localStorage.setItem("mochi_permissions_asked", "true");
    onDone();
  };

  return (
    <AnimatePresence>
      <motion.div
        data-ocid="permissions.modal"
        className="fixed inset-0 z-[200] flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

        {/* Card */}
        <motion.div
          className="relative w-full max-w-sm rounded-3xl p-6 flex flex-col items-center gap-4 shadow-2xl border border-white/20"
          style={{
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.18) 0%, rgba(200,180,255,0.22) 100%)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
          }}
          initial={{ scale: 0.85, y: 40, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Mascot */}
          <div className="text-6xl select-none" role="img" aria-label="mochi">
            🍡
          </div>

          <div className="text-center">
            <h2 className="text-xl font-bold text-foreground mb-1">
              Mochi ko thoda access do 🙏
            </h2>
            <p className="text-sm text-muted-foreground">
              Taaki hum tumhara experience personalize kar sakein
            </p>
          </div>

          {/* Permission list */}
          <div className="w-full flex flex-col gap-2 mt-1">
            {PERMISSIONS.map((p) => (
              <div
                key={p.label}
                className="flex items-center gap-3 rounded-2xl px-4 py-3 border border-white/15"
                style={{ background: "rgba(255,255,255,0.1)" }}
              >
                <span className="text-2xl">{p.icon}</span>
                <div>
                  <div className="text-sm font-semibold text-foreground">
                    {p.label}
                  </div>
                  <div className="text-xs text-muted-foreground">{p.desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Buttons */}
          <button
            type="button"
            data-ocid="permissions.primary_button"
            onClick={requestAll}
            disabled={loading}
            className="mt-2 w-full py-3 rounded-2xl text-white font-bold text-base transition-all active:scale-95 disabled:opacity-60"
            style={{
              background: "linear-gradient(135deg, #a78bfa 0%, #f472b6 100%)",
              boxShadow: "0 4px 20px rgba(167,139,250,0.4)",
            }}
          >
            {loading ? "Ek second..." : "Allow All ✨"}
          </button>

          <button
            type="button"
            data-ocid="permissions.cancel_button"
            onClick={finish}
            className="text-sm text-muted-foreground underline underline-offset-2 pb-1"
          >
            Baad mein
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
