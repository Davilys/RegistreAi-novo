import RegMascot from "./RegMascot";

type RegMarkProps = { size?: number; className?: string; };

/** Compatibility wrapper: all existing pages use the approved Reg mascot. */
export default function RegMark({ size = 44, className = "" }: RegMarkProps) {
  return <RegMascot size={size} className={className} />;
}
