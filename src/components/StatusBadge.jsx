"use client";

export default function StatusBadge({ status }) {
  if (!status) {
    return null;
  }

  const statusClass =
    status.toLowerCase().replaceAll(" ", "-");

  return (
    <span
      className={`status-badge status-${statusClass}`}
    >
      {status}
    </span>
  );
}