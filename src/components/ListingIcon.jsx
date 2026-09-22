export default function ListingIcon({ name, className = "size-5" }) {
  const paths = {
    deposit: <><path d="M12 3 4 6v6c0 5 8 9 8 9s8-4 8-9V6l-8-3Z" /><path d="m8 12 3 3 5-6" /></>,
    electricity: <path d="m13 2-9 12h7l-1 8 10-13h-8l1-7Z" />,
    water: <><path d="M12 3S5 11 5 15a7 7 0 0 0 14 0c0-4-7-12-7-12Z" /><path d="M9 16a3 3 0 0 0 3 3" /></>,
    internet: <><path d="M2 8a16 16 0 0 1 20 0M5 12a11 11 0 0 1 14 0M8 16a6 6 0 0 1 8 0" /><circle cx="12" cy="20" r=".7" /></>,
    van: <><path d="M3 17V6h12l6 6v5H3ZM15 6v6h6M3 12h12M8 6v6" /><circle cx="7" cy="18" r="2" /><circle cx="17" cy="18" r="2" /></>,
    home: <><path d="m3 10 9-7 9 7v11H3V10Z" /><path d="M9 21v-8h6v8" /></>,
  };
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>{paths[name] || paths.home}</svg>;
}
