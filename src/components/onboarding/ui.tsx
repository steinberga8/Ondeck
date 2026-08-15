import type { CSSProperties, InputHTMLAttributes } from "react";

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
  return (
    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-faint)", marginBottom: 5 }}>{children}</div>
  );
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} style={{ ...inputStyle, ...props.style }} />;
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

export function Checkbox({ checked, onClick, label }: { checked: boolean; onClick: () => void; label: React.ReactNode }) {
  return (
    <div onClick={onClick} style={{ display: "flex", alignItems: "center", gap: 9, cursor: "pointer" }}>
      <div
        style={{
          width: 17,
          height: 17,
          borderRadius: 5,
          flex: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: checked ? "var(--accent)" : "var(--surface2)",
          border: checked ? "1px solid var(--accent)" : "1px solid var(--border)",
        }}
      >
        {checked && (
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
            <path d="M4 12L10 18L20 6" stroke="var(--on-accent)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
      <span style={{ fontSize: 11.5, color: "var(--text-dim)" }}>{label}</span>
    </div>
  );
}

export function StepTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <>
      <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 12.5, color: "var(--text-dim)", marginBottom: 20 }}>{subtitle}</div>
    </>
  );
}
