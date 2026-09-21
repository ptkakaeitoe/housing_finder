"use client";

import Link from "next/link";

export default function PropertyCard({
  property,
}) {
  if (!property) {
    return null;
  }

  return (
    <article className="property-card">
      <div className="property-image">
        {property.imageUrl ? (
          <img
            src={property.imageUrl}
            alt={
              property.name ||
              "Accommodation"
            }
          />
        ) : (
          <div className="property-image-placeholder">
            <span>⌂</span>

            <p>
              Property Photo
            </p>
          </div>
        )}

        {property.verified && (
          <div className="verified-badge">
            ✓ Verified
          </div>
        )}
      </div>

      <div className="property-body">
        <h3>
          {property.name ||
            "Property"}
        </h3>

        <p className="property-location">
          {property.location ||
            "Location information"}
        </p>

        <div className="property-meta">
          <div>
            <span>Rent</span>

            <strong>
              {property.rent
                ? `฿${property.rent}`
                : "—"}
            </strong>
          </div>

          <div>
            <span>Distance</span>

            <strong>
              {property.distance
                ? `${property.distance} km`
                : "—"}
            </strong>
          </div>

          <div>
            <span>Type</span>

            <strong>
              {property.type ||
                "—"}
            </strong>
          </div>
        </div>

        {property.id && (
          <Link
            href={`/rooms/${property.id}`}
            className="btn btn-outline property-button"
          >
            View Details
          </Link>
        )}
      </div>
    </article>
  );
}