"use client";

export default function DashboardCard({
  title,
  value = "—",
  text,
}) {
  return (
    <div className="dashboard-card">
      <div className="dashboard-icon">
        H
      </div>

      <div>
        <p className="dashboard-label">
          {title}
        </p>

        <h3>
          {value}
        </h3>

        {text && (
          <span>
            {text}
          </span>
        )}
      </div>
    </div>
  );
}