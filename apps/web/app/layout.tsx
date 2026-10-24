import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "ViajerosHub · Encuentra gente para tu próximo viaje",
  description:
    "Descubre viajes reales, conecta con otros viajeros y organiza tu próxima aventura en grupo.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
