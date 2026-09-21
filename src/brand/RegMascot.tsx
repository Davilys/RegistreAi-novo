type RegMascotProps = {
  size?: number;
  className?: string;
};

export default function RegMascot({ size = 210, className = "" }: RegMascotProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      width={size}
      height={size}
      viewBox="0 0 240 260"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
        <path d="M119 18c-35 0-64 27-64 61 0 28 18 50 43 58" strokeWidth="17" />
        <path d="M121 18c36 0 65 27 65 61 0 29-18 51-44 59" strokeWidth="17" />
        <ellipse cx="120" cy="82" rx="47" ry="38" fill="white" strokeWidth="0" />
        <circle cx="99" cy="83" r="8" fill="currentColor" strokeWidth="0" />
        <path d="M138 84c7-8 18-7 23 1" strokeWidth="7" />
        <path d="M98 137c-22 11-34 31-33 52 1 25 20 43 49 43h18c32 0 54-17 55-44 0-23-13-43-36-52" strokeWidth="17" />
        <path d="M73 162c-17 7-27 18-28 31-1 13 7 24 19 27" strokeWidth="15" />
        <path d="M177 160c18-3 30-14 35-32" strokeWidth="15" />
        <path d="M202 123l11-7" strokeWidth="8" />
        <path d="M205 139l14 1" strokeWidth="8" />
        <path d="M191 116l4-14" strokeWidth="8" />
        <path d="M105 229l-7 17" strokeWidth="16" />
        <path d="M148 229l8 17" strokeWidth="16" />
      </g>
    </svg>
  );
}
