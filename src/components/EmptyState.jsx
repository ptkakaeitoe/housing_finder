"use client";

export default function EmptyState({
  title,
  message,
  action,
}) {
  return (
    <div className="empty-state">
      <div className="empty-icon">
        H
      </div>

      <h3>
        {title}
      </h3>

      <p>
        {message}
      </p>

      {action}
    </div>
  );
}