export function Logo({ className = "", size = 64 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size * 0.45}
      viewBox="0 0 120 54"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Left wing */}
      <path
        d="M0 42C0 42 8 38 16 28C24 18 32 4 48 4C42 12 38 22 38 32C38 38 40 44 44 48L24 52C12 54 0 50 0 42Z"
        fill="url(#gradient1)"
      />
      {/* Right wing */}
      <path
        d="M120 42C120 42 112 38 104 28C96 18 88 4 72 4C78 12 82 22 82 32C82 38 80 44 76 48L96 52C108 54 120 50 120 42Z"
        fill="url(#gradient2)"
      />
      {/* Center connector */}
      <path
        d="M44 48C48 52 56 54 60 54C64 54 72 52 76 48C72 44 66 42 60 42C54 42 48 44 44 48Z"
        fill="url(#gradient3)"
      />
      {/* Gradient definitions */}
      <defs>
        <linearGradient id="gradient1" x1="0" y1="28" x2="48" y2="28" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F97316" />
          <stop offset="1" stopColor="#EA580C" />
        </linearGradient>
        <linearGradient id="gradient2" x1="120" y1="28" x2="72" y2="28" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F97316" />
          <stop offset="1" stopColor="#EA580C" />
        </linearGradient>
        <linearGradient id="gradient3" x1="44" y1="48" x2="76" y2="48" gradientUnits="userSpaceOnUse">
          <stop stopColor="#EA580C" />
          <stop offset="0.5" stopColor="#F97316" />
          <stop offset="1" stopColor="#EA580C" />
        </linearGradient>
      </defs>
    </svg>
  )
}
