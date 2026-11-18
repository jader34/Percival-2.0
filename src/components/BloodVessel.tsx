import { useId } from "react";

export function BloodVessel({
  ratio = 1,
  small = false,
}: {
  ratio?: number;
  small?: boolean;
}) {
  const id = useId().replace(/:/g, "");
  const y = 190 - Math.max(0, Math.min(1, ratio)) * 145;
  return (
    <svg
      className={small ? "blood-vessel small" : "blood-vessel"}
      viewBox="0 0 200 230"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`${id}-blood`} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#d2525c" />
          <stop offset=".45" stopColor="#9c2138" />
          <stop offset="1" stopColor="#390f22" />
        </linearGradient>
        <linearGradient id={`${id}-metal`}>
          <stop stopColor="#604c4a" />
          <stop offset=".5" stopColor="#dac3a2" />
          <stop offset="1" stopColor="#64423f" />
        </linearGradient>
        <clipPath id={`${id}-shape`}>
          <path d="M100 27C89 59 46 95 46 139a54 54 0 0 0 108 0C154 95 111 59 100 27Z" />
        </clipPath>
      </defs>
      <path
        d="M100 8 177 65v102l-77 54-77-54V65Z"
        stroke="#a78a72"
        strokeOpacity=".18"
        fill="none"
      />
      <path
        d="M100 18 166 69v93l-66 47-66-47V69Z"
        stroke="#a78a72"
        strokeOpacity=".25"
        fill="none"
      />
      <path
        d="M100 27C89 59 46 95 46 139a54 54 0 0 0 108 0C154 95 111 59 100 27Z"
        fill="#1b1018"
        stroke={`url(#${id}-metal)`}
        strokeWidth="1.5"
      />
      <g clipPath={`url(#${id}-shape)`}>
        <g className="blood-liquid" style={{ transform: `translateY(${y}px)` }}>
          <path
            d="M30 4Q65 -6 100 4T170 4V220H30Z"
            fill={`url(#${id}-blood)`}
          />
          <path
            d="M30 4Q65 -6 100 4T170 4"
            fill="none"
            stroke="#e99b94"
            strokeOpacity=".65"
          />
          <path
            d="M65 24c-19 58 3 97 32 115"
            fill="none"
            stroke="#ec7b7f"
            strokeOpacity=".2"
            strokeWidth="13"
          />
        </g>
      </g>
      <path
        d="M100 50v139m-6-3 6 11 6-11M100 50l-8 20 8-6 8 6-8-20Zm-21 47h42M100 69c25 0 31 17 31 28-9-8-20-10-31-9M97 69c-12 3-19 9-20 20"
        stroke={`url(#${id}-metal)`}
        strokeWidth="2"
        fill="none"
      />
      <path
        d="m99 7-3-3 4-4 4 4-3 3M17 112h11m144 0h11M94 220h12"
        stroke="#be9b7e"
        strokeWidth="1"
      />
    </svg>
  );
}
