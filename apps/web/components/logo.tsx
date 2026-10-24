import Link from "next/link";

export function Logo() {
  return (
    <Link
      href="/"
      className="inline-flex items-center gap-2"
      aria-label="ViajerosHub, inicio"
    >
      <span className="grid size-9 place-items-center rounded-xl bg-[#0B6EFD] text-white shadow-[0_6px_18px_rgba(11,110,253,.25)]">
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M3 15.5 21 5l-7.2 15-2.5-6-6-2.5L3 15.5Z"
            fill="currentColor"
          />
          <path
            d="m11.3 13.9 4.3-4.3"
            stroke="#0B6EFD"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      </span>
      <span className="text-[19px] font-bold tracking-[-.035em]">
        Viajeros<span className="text-[#0B6EFD]">Hub</span>
      </span>
    </Link>
  );
}
