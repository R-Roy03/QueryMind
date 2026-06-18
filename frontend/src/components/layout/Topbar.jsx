import { Zap } from "lucide-react";

/**
 * Topbar — page title + Mistral AI connection indicator.
 * Cogrion enterprise style: clean glass header with Sora display font.
 */
export default function Topbar({ title, subtitle }) {
  return (
    <div
      className="h-14 flex items-center justify-between px-6 flex-shrink-0 border-b backdrop-blur-sm"
      style={{
        background: "var(--glass-bg)",
        borderColor: "var(--border-default)",
      }}
    >
      {/* Title */}
      <div>
        <h1
          className="text-[15px] font-semibold tracking-tight"
          style={{ fontFamily: "'Sora', sans-serif", color: "var(--text-primary)" }}
        >
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            {subtitle}
          </p>
        )}
      </div>

      {/* AI Status — subtle */}
      <div
        className="flex items-center gap-1.5 text-[10px] transition-all duration-300"
        style={{ color: "var(--text-muted)", opacity: 0.6 }}
      >
        <div
          className="w-1.5 h-1.5 rounded-full"
          style={{ background: "var(--color-success)" }}
        />
        <Zap size={10} />
        Mistral AI · Connected
      </div>
    </div>
  );
}
