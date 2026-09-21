"use client";

import StatusBadge from "./StatusBadge";

export default function AppointmentCard({
  appointment,
}) {
  if (!appointment) {
    return null;
  }

  return (
    <div className="appointment-card">
      <div className="appointment-header">
        <div>
          <h3>
            {appointment.propertyName ||
              "Property"}
          </h3>

          <p>
            {appointment.location ||
              "Location"}
          </p>
        </div>

        <StatusBadge
          status={appointment.status}
        />
      </div>

      <div className="appointment-details">
        <div>
          <span>Date</span>

          <strong>
            {appointment.date || "—"}
          </strong>
        </div>

        <div>
          <span>Time</span>

          <strong>
            {appointment.time || "—"}
          </strong>
        </div>
      </div>
    </div>
  );
}