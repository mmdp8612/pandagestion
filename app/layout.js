import "./globals.css";
import AppShell from "@/components/AppShell";

export const metadata = {
  title: "PandaGestion | Gastos mensuales",
  description: "Control simple y claro de tus gastos mensuales.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
