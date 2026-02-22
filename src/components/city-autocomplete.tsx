"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type { CitySuggestion } from "@/app/api/places/cities/route";

const DEBOUNCE_MS = 300;

type CityAutocompleteProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
};

export function CityAutocomplete({
  id = "city",
  value,
  onChange,
  placeholder,
  disabled,
  className,
  "aria-label": ariaLabel,
}: CityAutocompleteProps) {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<CitySuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  const fetchCities = useCallback(async (q: string) => {
    if (q.length < 2) {
      setSuggestions([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `/api/places/cities?q=${encodeURIComponent(q)}&limit=8`
      );
      const data = await res.json().catch(() => ({ cities: [] }));
      setSuggestions(data.cities ?? []);
      setOpen(true);
    } catch {
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    debounceRef.current = setTimeout(() => fetchCities(query), DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, fetchCities]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (s: CitySuggestion) => {
    onChange(s.displayName);
    setQuery(s.displayName);
    setOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setQuery(v);
    onChange(v);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") setOpen(false);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <input
        id={id}
        type="text"
        value={query}
        onChange={handleInputChange}
        onFocus={() => query.length >= 2 && suggestions.length > 0 && setOpen(true)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder={placeholder}
        autoComplete="off"
        role="combobox"
        aria-expanded={open && suggestions.length > 0}
        aria-autocomplete="list"
        aria-controls={open ? `${id}-listbox` : undefined}
        aria-label={ariaLabel}
        className={className}
      />
      {loading && (
        <span
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
          aria-hidden
        >
          …
        </span>
      )}
      {open && suggestions.length > 0 && (
        <ul
          id={`${id}-listbox`}
          role="listbox"
          className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-600 dark:bg-slate-800"
        >
          {suggestions.map((s, i) => (
            <li
              key={`${s.name}-${s.country}-${i}`}
              role="option"
              tabIndex={-1}
              onClick={() => handleSelect(s)}
              onMouseDown={(e) => e.preventDefault()}
              className="cursor-pointer px-3 py-2 text-sm text-slate-800 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              {s.displayName}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
