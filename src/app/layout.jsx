import "./globals.css";
import AppShell from "../components/AppShell";

export const metadata = {
  title: "HousingFinder",
  description: "Find housing, compare homes, and request viewings.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
