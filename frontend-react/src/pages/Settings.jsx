import React, { useState, useEffect } from 'react';
import API from '../services/api';
import OrganizationAutocomplete from '../components/OrganizationAutocomplete.jsx';

const Settings = ({ theme, onThemeChange }) => {
  const [profile, setProfile] = useState({ name: '', email: '' });
  const [selectedOrganization, setSelectedOrganization] = useState('');
  const [editing, setEditing] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [message, setMessage] = useState('');
  const [pwdMsg, setPwdMsg] = useState('');
  const [passwords, setPasswords] = useState({ current_password: '', new_password: '', confirm_password: '' });

  useEffect(() => {
    const load = async () => {
      try {
        const res = await API.get('/api/user/profile/');
        setProfile({ name: res.data.name || '', email: res.data.email || '', username: res.data.username || '' });

        setSelectedOrganization(res.data.organization || '');

        if (res.data.avatar_url) setPreview(res.data.avatar_url);
      } catch (err) {
        // ignore
      }
    };
    load();
  }, []);

  const updateOrganizationState = (org = '') => setSelectedOrganization(org);

  const handleChange = (e) => setProfile({ ...profile, [e.target.name]: e.target.value });
  const handlePwdChange = (e) => setPasswords({ ...passwords, [e.target.name]: e.target.value });
  const selectedOrgValue = selectedOrganization.trim();

  const handleFile = (e) => {
    const f = e.target.files && e.target.files[0];
    setAvatarFile(f);
    if (f) setPreview(URL.createObjectURL(f));
  };

  const saveProfile = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setMessage('');
    try {
      if (avatarFile) {
        const fd = new FormData();
        fd.append('name', profile.name);
        fd.append('organization', selectedOrgValue);
        fd.append('avatar', avatarFile);
        await API.patch('/api/user/profile/', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        await API.patch('/api/user/profile/', { name: profile.name, organization: selectedOrgValue });
      }
      // Fetch the latest profile from server to ensure fresh data
      let latest = null;
      try {
        const r = await API.get('/api/user/profile/');
        latest = r.data;
        setProfile({ name: latest.name || '', organization: latest.organization || '', email: latest.email || '', username: latest.username || '' });
        if (latest.avatar_url) setPreview(latest.avatar_url);
        if (latest.username) localStorage.setItem('username', latest.username);
      } catch (e) {
        // ignore
      }

      setMessage('Profile updated successfully.');
      setEditing(false);
      // Notify app to refresh header; include latest profile as detail when available
      if (latest) window.dispatchEvent(new CustomEvent('profileUpdated', { detail: latest }));
      else window.dispatchEvent(new Event('authChanged'));
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.detail || 'Failed to update profile.');
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    setPwdMsg('');
    if (passwords.new_password !== passwords.confirm_password) {
      setPwdMsg('New password and confirmation do not match.');
      return;
    }
    try {
      // try a common endpoint; backend may need a different path
      await API.post('/api/user/change_password/', passwords);
      setPwdMsg('Password updated successfully.');
      setPasswords({ current_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      setPwdMsg(err.response?.data?.detail || err.response?.data?.error || 'Failed to change password.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="rounded-[24px] border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900 mb-2">Settings</h1>
        <p className="text-sm text-slate-500 mb-6">Manage your account details and password.</p>

        <form onSubmit={saveProfile} className="space-y-4" id="settings-form">
          <div className="flex items-center gap-6">
            <div>
              <div style={{ width: 84, height: 84, borderRadius: 9999, overflow: 'hidden', background: '#eef2ff' }}>
                {preview ? <img src={preview} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4f46e5', fontWeight: 700 }}> { (profile.name||profile.email||'U').slice(0,1).toUpperCase() } </div> }
              </div>
              <input type="file" accept="image/*" onChange={handleFile} className="mt-2" disabled={!editing} />
            </div>

            <div style={{ flex: 1 }}>
              <label className="text-sm text-slate-600">Full name</label>
              <input name="name" value={profile.name} onChange={handleChange} className="block w-full border rounded-md p-2 mt-1" disabled={!editing} />

              <label className="text-sm text-slate-600 mt-3">Organization</label>
              <OrganizationAutocomplete
                value={selectedOrgValue}
                onChange={(value) => {
                  setSelectedOrganization(value);
                }}
                disabled={!editing}
                required
              />

              <label className="text-sm text-slate-600 mt-3">Email (read-only)</label>
              <input name="email" value={profile.email} onChange={handleChange} disabled={!editing} className={editing ? 'block w-full border rounded-md p-2 mt-1' : 'block w-full border rounded-md p-2 mt-1 bg-slate-50'} />
            </div>
          </div>

        </form>

        <div className="mt-4">
          {!editing ? (
            <button type="button" onClick={() => setEditing(true)} className="rounded-2xl bg-indigo-600 px-4 py-2 text-white font-semibold">Edit profile</button>
          ) : (
            <div className="flex gap-3">
              <button type="button" onClick={(e)=>saveProfile(e)} className="rounded-2xl bg-indigo-600 px-4 py-2 text-white font-semibold">Save profile</button>
              <button type="button" onClick={async () => { setEditing(false); setMessage(''); try { const res = await API.get('/api/user/profile/'); setProfile({ name: res.data.name || '', email: res.data.email || '', username: res.data.username || '' }); updateOrganizationState(res.data.organization || ''); setPreview(res.data.avatar_url || null); } catch (err) { } }} className="rounded-2xl bg-slate-100 px-4 py-2">Cancel</button>
            </div>
          )}
        </div>
          {message && <div className="text-sm text-emerald-600">{message}</div>}

        <section className="theme-settings mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Appearance</h2>
            <p className="mt-1 text-sm text-slate-500">Choose how OriginalityGuard looks on this device.</p>
          </div>
          <div className="mt-4 inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm" role="group" aria-label="Color theme">
            {[
              ['light', '☀ Light'],
              ['dark', '☾ Dark'],
              ['system', '◐ System'],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => onThemeChange(value)}
                aria-pressed={theme === value}
                className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${theme === value ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </section>
        <hr className="my-6" />

        <form onSubmit={changePassword} className="space-y-3 max-w-md">
          <h2 className="text-lg font-semibold">Change password</h2>
          <label className="text-sm text-slate-600">Current password</label>
          <input name="current_password" type="password" value={passwords.current_password} onChange={handlePwdChange} className="block w-full border rounded-md p-2 mt-1" />

          <label className="text-sm text-slate-600">New password</label>
          <input name="new_password" type="password" value={passwords.new_password} onChange={handlePwdChange} className="block w-full border rounded-md p-2 mt-1" />

          <label className="text-sm text-slate-600">Confirm new password</label>
          <input name="confirm_password" type="password" value={passwords.confirm_password} onChange={handlePwdChange} className="block w-full border rounded-md p-2 mt-1" />

          <div className="flex gap-3 mt-3">
            <button type="submit" className="rounded-2xl bg-amber-600 px-4 py-2 text-white font-semibold">Change password</button>
          </div>
          {pwdMsg && <div className="text-sm text-red-600">{pwdMsg}</div>}
        </form>
      </div>
    </div>
  );
};

export default Settings;
