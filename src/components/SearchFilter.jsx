"use client";

export default function SearchFilter({
  propertyType,
  setPropertyType,
  maxRent,
  setMaxRent,
}) {
  return (
    <div className="filter-row">
      <select
        value={propertyType}
        onChange={(event) =>
          setPropertyType(
            event.target.value
          )
        }
      >
        <option value="">
          Property Type
        </option>

        <option value="apartment">
          Apartment
        </option>

        <option value="condo">
          Condo
        </option>

        <option value="room">
          Room
        </option>
      </select>

      <input
        type="number"
        placeholder="Maximum rent"
        value={maxRent}
        onChange={(event) =>
          setMaxRent(
            event.target.value
          )
        }
      />

      <button
        type="button"
        className="filter-button"
      >
        Verified only
      </button>
    </div>
  );
}