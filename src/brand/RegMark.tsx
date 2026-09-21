type RegMarkProps = {
  size?: number;
  className?: string;
};

export default function RegMark({ size = 44, className = "" }: RegMarkProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M13 39V21.5C13 12.94 18.82 7 27 7C35.18 7 41 12.94 41 21.5C41 27.7 37.08 32.52 31.28 34.32L40 42"
        stroke="currentColor"
        strokeWidth="4.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="27" cy="20.5" r="3.2" fill="currentColor" />
      <path
        d="M13 31.2H23.6"
        stroke="currentColor"
        strokeWidth="4.2"
        strokeLinecap="round"
      />
    </svg>
  );
}
