"use client";

import Link from "next/link";
import StatusBadge from "./StatusBadge";

export default function ListingCard({
  listing,
}) {
  if (!listing) {
    return null;
  }

  return (
    <div className="listing-card">
      <div className="listing-image">
        {listing.imageUrl ? (
          <img
            src={listing.imageUrl}
            alt={
              listing.name ||
              "Property"
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
      </div>

      <div className="listing-content">
        <div className="listing-header">
          <div>
            <h3>
              {listing.name ||
                "Property"}
            </h3>

            <p>
              {listing.location ||
                "Location"}
            </p>
          </div>

          <StatusBadge
            status={listing.status}
          />
        </div>

        {listing.id && (
          <Link
            href={`/listings/${listing.id}/edit`}
            className="btn btn-outline"
          >
            Edit Listing
          </Link>
        )}
      </div>
    </div>
  );
}