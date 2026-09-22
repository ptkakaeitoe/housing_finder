import "./globals.css";
import AppShell from "../components/AppShell";

export const metadata = {
  title: "HousingFinder",
  description: "Find housing, compare homes, and request viewings.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@400;600;700&family=Noto+Sans+Myanmar:wght@400;600;700&family=Noto+Sans+SC:wght@400;600;700&display=swap" />
      </head>
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
