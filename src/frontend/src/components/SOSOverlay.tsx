import { Globe, Phone, Wind, X } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";

const RESOURCES = [
  {
    name: "iCall India",
    number: "9152987821",
    url: null as string | null,
    icon: "\uD83D\uDCDE",
    available: "Mon\u2013Sat, 8am\u201310pm",
  },
  {
    name: "Vandrevala Foundation",
    number: "1860-2662-345",
    url: null as string | null,
    icon: "\uD83C\uDFE5",
    available: "24/7",
  },
  {
    name: "Befrienders Worldwide",
    number: null as string | null,
    url: "befrienders.org",
    icon: "\uD83C\uDF10",
    available: "International",
  },
  {
    name: "iCheer Online",
    number: "9820466627",
    url: null as string | null,
    icon: "\uD83D\uDC9C",
    available: "By appointment",
  },
];

interface SOSOverlayProps {
  onClose: () => void;
}

export default function SOSOverlay({ onClose }: SOSOverlayProps) {
  const [breathPhase, setBreathPhase] = useState<"in" | "hold" | "out">("in");
  const [breathText, setBreathText] = useState("Breathe In...");

  useEffect(() => {
    const phases: { phase: "in" | "hold" | "out"; text: string }[] = [
      { phase: "in", text: "Breathe In..." },
      { phase: "hold", text: "Hold..." },
      { phase: "out", text: "Breathe Out..." },
    ];
    let i = 0;
    const cycle = () => {
      const p = phases[i % phases.length];
      setBreathPhase(p.phase);
      setBreathText(p.text);
      i++;
    };
    cycle();
    const interval = setInterval(cycle, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      data-ocid="sos.modal"
      className="absolute inset-0 z-50 flex flex-col"
      style={{ background: "rgba(15, 10, 30, 0.94)" }}
    >
      <div className="flex justify-end p-4 pt-12">
        <button
          type="button"
          data-ocid="sos.close_button"
          onClick={onClose}
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
        >
          <X className="w-5 h-5 text-white" />
        </button>
      </div>

      <div className="flex flex-col items-center px-6 text-center">
        <motion.img
          src="/assets/generated/mochi-mascot-transparent.dim_400x400.png"
          alt="Mochi"
          className="w-24 h-24 object-contain mb-3"
          animate={{ y: [0, -6, 0] }}
          transition={{
            duration: 3,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        />
        <h1 className="text-xl font-black text-white mb-1">
          You're not alone.
        </h1>
        <p className="text-sm text-white/70 font-medium">
          Help is here. We care about you. \uD83D\uDC9C
        </p>
      </div>

      <div className="flex flex-col items-center my-6">
        <div className="relative flex items-center justify-center">
          <div
            className={`absolute rounded-full bg-primary/20 transition-all duration-[4000ms] ease-in-out ${
              breathPhase === "in" || breathPhase === "hold"
                ? "w-32 h-32"
                : "w-16 h-16"
            }`}
          />
          <div
            className={`relative rounded-full flex items-center justify-center transition-all duration-[4000ms] ease-in-out ${
              breathPhase === "in" || breathPhase === "hold"
                ? "w-24 h-24"
                : "w-14 h-14"
            }`}
            style={{
              background:
                "linear-gradient(135deg, oklch(0.72 0.11 355), oklch(0.62 0.10 268))",
            }}
          >
            <Wind className="w-6 h-6 text-white" />
          </div>
        </div>
        <motion.p
          key={breathText}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-white font-bold text-base mt-4"
        >
          {breathText}
        </motion.p>
        <p className="text-white/50 text-xs mt-1">4-4-4 box breathing</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4">
        <h2 className="text-sm font-bold text-white/80 mb-3 uppercase tracking-wider">
          Crisis Resources
        </h2>
        <div className="space-y-2">
          {RESOURCES.map((resource) => (
            <motion.div
              key={resource.name}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              data-ocid="sos.resource.item.1"
              className="flex items-center gap-3 bg-white/10 rounded-2xl p-3"
            >
              <span className="text-xl flex-shrink-0">{resource.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white">{resource.name}</p>
                <p className="text-xs text-white/60">{resource.available}</p>
              </div>
              {resource.number ? (
                <a
                  href={`tel:${resource.number}`}
                  data-ocid="sos.resource.button.1"
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold text-white transition-all active:scale-95"
                  style={{ background: "oklch(0.59 0.19 25)" }}
                >
                  <Phone className="w-3 h-3" />
                  Call
                </a>
              ) : resource.url ? (
                <a
                  href={`https://${resource.url}`}
                  target="_blank"
                  rel="noreferrer"
                  data-ocid="sos.resource.button.1"
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold text-white transition-all active:scale-95"
                  style={{ background: "oklch(0.62 0.10 268)" }}
                >
                  <Globe className="w-3 h-3" />
                  Visit
                </a>
              ) : null}
            </motion.div>
          ))}
        </div>
      </div>

      <div className="p-4 text-center">
        <p className="text-xs text-white/40">
          You matter. Your feelings are valid. \uD83D\uDC9C
        </p>
      </div>
    </motion.div>
  );
}
