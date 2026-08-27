import React, { useEffect, useMemo, useState } from 'react';
import API from '../services/api';

export default function OrganizationAutocomplete({ value, onChange, disabled = false, required = false }) {
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const search = value.trim();
    let active = true;
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setLoadFailed(false);
      try {
        const response = await API.get('/api/organizations/', {
          params: search.length >= 2 ? { search } : {},
        });
        if (active) setOrganizations(response.data?.organizations || []);
      } catch {
        if (active) { setOrganizations([]); setLoadFailed(true); }
      } finally {
        if (active) setLoading(false);
      }
    }, 250);

    return () => { active = false; window.clearTimeout(timer); };
  }, [value]);

  const matches = useMemo(() => organizations.slice(0, 50), [organizations]);
  const chooseOrganization = (organization) => { onChange(organization); setOpen(false); };

  return (
    <div className="relative mt-1">
      <input id="organization" name="organization" type="search" value={value}
        onFocus={() => setOpen(true)} onChange={(event) => { onChange(event.target.value); setOpen(true); }}
        onBlur={() => window.setTimeout(() => setOpen(false), 150)} placeholder="Search universities worldwide"
        autoComplete="organization" disabled={disabled} required={required} className="block w-full border rounded-md p-2 pr-10"
        aria-autocomplete="list" aria-expanded={open} aria-controls="organization-options" />
      <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => setOpen((isOpen) => !isOpen)}
        disabled={disabled} aria-label="Show organizations" className="absolute right-2 top-1/2 -translate-y-1/2 px-2 text-slate-500 disabled:cursor-not-allowed">▾</button>
      {open && !disabled && (
        <div id="organization-options" role="listbox" className="absolute z-30 mt-1 max-h-56 w-full overflow-y-auto rounded-md border border-slate-200 bg-white py-1 shadow-lg">
          {loading ? <p className="px-3 py-2 text-sm text-slate-500">Searching universities…</p>
            : matches.length ? matches.map((organization) => (
              <button key={organization} type="button" role="option" aria-selected={organization === value}
                onMouseDown={(event) => event.preventDefault()} onClick={() => chooseOrganization(organization)}
                className="block w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-indigo-50">{organization}</button>
            )) : <p className="px-3 py-2 text-sm text-slate-500">{value.trim().length < 2 ? 'Type at least 2 characters to search universities worldwide.' : 'No university found. You can use the typed name.'}</p>}
        </div>
      )}
      <p className="mt-1 text-xs text-slate-500">{loadFailed ? 'Directory unavailable; you can type your institution manually.' : 'Type at least 2 characters to search a global university directory.'}</p>
    </div>
  );
}