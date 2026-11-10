// Shared controls for management screens and listing workflows.
const buttonBase = "inline-flex min-h-11 min-w-0 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-[color,background-color,opacity] duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:cursor-not-allowed disabled:opacity-40 motion-reduce:transition-none";

export const primaryButtonClassName = `${buttonBase} bg-ink text-canvas hover:opacity-80 disabled:hover:opacity-40`;
export const secondaryButtonClassName = `${buttonBase} bg-surface-muted text-ink hover:bg-line disabled:hover:bg-surface-muted`;
export const quietButtonClassName = `${buttonBase} text-muted hover:bg-surface-muted hover:text-ink`;
export const inputClassName = "min-h-12 w-full min-w-0 rounded-md border border-line bg-transparent px-3 py-2.5 text-base text-ink transition-colors outline-none placeholder:text-muted hover:border-muted focus:border-ink focus:ring-1 focus:ring-ink disabled:opacity-50";
export const fieldLabelClassName = "block min-w-0 text-xs font-medium leading-5 text-muted";
export const statusBadgeClassName = "inline-flex max-w-full items-center rounded-md bg-surface-muted px-2.5 py-1 text-xs font-medium leading-5 text-muted";
