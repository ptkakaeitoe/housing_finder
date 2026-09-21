"use client";

export default function SearchBar({
  value,
  onChange,
}) {
  return (
    <div className="search-bar">
      <span className="search-icon">
        ⌕
      </span>

      <input
        type="text"
        placeholder="Search accommodation or area..."
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
      />

      <button
        type="button"
        className="btn btn-primary"
      >
        Search
      </button>
    </div>
  );
}