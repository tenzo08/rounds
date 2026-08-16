interface LogoProps {
  size?: number;
}

// A closed chart binder with three color-coded divider tabs — the same
// "vertical color-coded tab rail" motif that's the app's visual signature
// (see docs/DESIGN.md).
export function Logo({ size = 40 }: LogoProps) {
  return (
    <svg
      width={size}
      height={size * 1.2}
      viewBox="0 0 40 48"
      fill="none"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="26" height="42" rx="3" fill="#F3F1E7" />
      <circle cx="9" cy="12" r="1.6" fill="#1B222A" />
      <circle cx="9" cy="24" r="1.6" fill="#1B222A" />
      <circle cx="9" cy="36" r="1.6" fill="#1B222A" />
      <rect x="15" y="10.4" width="10" height="1.6" rx="0.8" fill="#D8D3C2" />
      <rect x="15" y="16.4" width="10" height="1.6" rx="0.8" fill="#D8D3C2" />
      <rect x="15" y="22.4" width="7" height="1.6" rx="0.8" fill="#D8D3C2" />
      <rect x="27" y="7" width="10" height="7" rx="1.5" fill="#4A7C59" />
      <rect x="27" y="19" width="10" height="7" rx="1.5" fill="#6B5B95" />
      <rect x="27" y="31" width="10" height="7" rx="1.5" fill="#3B6E8F" />
    </svg>
  );
}
