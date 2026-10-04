import type { CSSProperties, InputHTMLAttributes, TextareaHTMLAttributes } from "react";

export const inputStyle: CSSProperties = {
  width: "100%",
  background: "var(--surface2)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  padding: "10px 12px",
  color: "var(--text)",
  fontFamily: "var(--font-ui)",
  fontSize: 13,
  outline: "none",
};

export function FieldLabel({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-faint)", marginBottom: 5 }}>{children}</div>;
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} style={{ ...inputStyle, ...props.style }} />;
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} style={{ ...inputStyle, resize: "vertical", ...props.style }} />;
}

export function PrimaryButton({
  children,
  onClick,
  style,
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  style?: CSSProperties;
  disabled?: boolean;
}) {
  return (
    <div
      onClick={disabled ? undefined : onClick}
      style={{
        textAlign: "center",
        background: "var(--accent)",
        color: "var(--on-accent)",
        fontWeight: 700,
        fontSize: 12.5,
        padding: 11,
        borderRadius: 9,
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.7 : 1,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function SecondaryButton({ children, onClick, style }: { children: React.ReactNode; onClick?: () => void; style?: CSSProperties }) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: "11px 18px",
        border: "1px solid var(--border)",
        borderRadius: 9,
        fontSize: 12.5,
        fontWeight: 700,
        color: "var(--text-dim)",
        cursor: "pointer",
        textAlign: "center",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/** Full-screen dim overlay + centered card, matching the design's `modalIn` animation. Click the backdrop to close. */
export function ModalOverlay({ onClose, children, width = 440 }: { onClose: () => void; children: React.ReactNode; width?: number }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "oklch(0.12 0.015 230 / 0.55)",
        backdropFilter: "blur(5px)",
        WebkitBackdropFilter: "blur(5px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width,
          maxWidth: "92%",
          maxHeight: "86vh",
          overflowY: "auto",
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 16,
          padding: 24,
          backdropFilter: "blur(28px) saturate(150%)",
          WebkitBackdropFilter: "blur(28px) saturate(150%)",
          boxShadow: "0 30px 60px oklch(0 0 0 / 0.4)",
          animation: "modalIn 0.22s ease both",
        }}
      >
        {children}
      </div>
    </div>
  );
}

/** Pill on/off switch matching the onboarding Connect step's toggle visual. */
export function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  const style: CSSProperties = {
    width: 36,
    height: 20,
    borderRadius: 20,
    background: on ? "var(--accent)" : "var(--surface3)",
    padding: 2,
    display: "flex",
    justifyContent: on ? "flex-end" : "flex-start",
    flex: "none",
    transition: "background 0.15s",
    cursor: "pointer",
  };
  return (
    <div onClick={onClick} style={style}>
      <div style={{ width: 16, height: 16, borderRadius: "50%", background: "white", boxShadow: "0 1px 3px rgba(0,0,0,0.3)" }} />
    </div>
  );
}

export function StatPill({ label, value, color = "var(--text)" }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ flex: 1, background: "var(--surface)", border: "1px solid var(--border-soft)", borderRadius: 11, padding: "12px 16px", display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
      <div style={{ fontSize: 11, color: "var(--text-faint)", fontWeight: 600 }}>{label}</div>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: 19, fontWeight: 600, color }}>{value}</div>
    </div>
  );
}
