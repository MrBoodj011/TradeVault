import { clsx } from "clsx";

export function TradeVaultLogo({
  compact = false,
  className,
}: {
  compact?: boolean;
  className?: string;
}) {
  return (
    <div
      className={clsx("flex items-center gap-3", className)}
      aria-label="TradeVault"
    >
      <svg
        viewBox="0 0 48 48"
        className="h-10 w-10 shrink-0"
        role="img"
        aria-hidden="true"
      >
        <defs>
          <linearGradient
            id="vault-gradient"
            x1="5"
            y1="4"
            x2="42"
            y2="44"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#5EEAD4" />
            <stop offset="1" stopColor="#10B981" />
          </linearGradient>
        </defs>
        <rect
          x="2"
          y="2"
          width="44"
          height="44"
          rx="13"
          fill="#07130F"
          stroke="#174B3C"
        />
        <path
          d="M13 13h22v22H13z"
          fill="none"
          stroke="url(#vault-gradient)"
          strokeWidth="2.6"
        />
        <circle
          cx="24"
          cy="24"
          r="6.3"
          fill="none"
          stroke="url(#vault-gradient)"
          strokeWidth="2.4"
        />
        <path
          d="M24 17.7v12.6M17.7 24h12.6M19.6 19.6l8.8 8.8M28.4 19.6l-8.8 8.8"
          stroke="url(#vault-gradient)"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
        <circle cx="24" cy="24" r="2.2" fill="#D1FAE5" />
      </svg>
      {!compact && (
        <div>
          <div className="text-[15px] font-black tracking-[-0.03em] text-white">
            TradeVault
          </div>
          <div className="text-[9px] font-semibold uppercase tracking-[0.22em] text-emerald-300/60">
            Execution intelligence
          </div>
        </div>
      )}
    </div>
  );
}
