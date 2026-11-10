export default function Avatar({ className = "size-11" }) {
  return <img src="/avatars/default-avatar.webp" alt="" width="256" height="256" className={`shrink-0 rounded-full bg-surface-muted object-cover ${className}`} />;
}
