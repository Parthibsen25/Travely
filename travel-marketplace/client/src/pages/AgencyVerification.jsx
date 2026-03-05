import React, { useEffect, useState, useRef } from 'react';
import { apiFetch } from '../utils/api';

const DOC_FIELDS = [
  { key: 'gstCertificate', label: 'GST Certificate', desc: 'Upload your GST registration certificate' },
  { key: 'businessLicense', label: 'Business License', desc: 'Trade license or business registration' },
  { key: 'panCard', label: 'PAN Card', desc: 'Agency PAN card copy' },
  { key: 'addressProof', label: 'Address Proof', desc: 'Office address proof document' }
];

const STATUS_COLORS = {
  not_submitted: 'bg-slate-100 text-slate-500',
  pending: 'bg-amber-100 text-amber-700',
  verified: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-red-100 text-red-700'
};

const STATUS_LABELS = {
  not_submitted: 'Not Submitted',
  pending: 'Under Review',
  verified: 'Verified',
  rejected: 'Rejected'
};

export default function AgencyVerification() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [docs, setDocs] = useState({});
  const [details, setDetails] = useState({ description: '', phone: '', website: '', address: '' });
  const fileRefs = useRef({});

  useEffect(() => {
    apiFetch('/api/agency-verification/status')
      .then((json) => {
        const d = json.data || json;
        setStatus(d);
        if (d.details) {
          setDetails({
            description: d.details.description || '',
            phone: d.details.phone || '',
            website: d.details.website || '',
            address: d.details.address || ''
          });
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleFileChange = (key, file) => {
    setDocs((prev) => ({ ...prev, [key]: file }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    try {
      const formData = new FormData();
      Object.entries(docs).forEach(([key, file]) => {
        if (file) formData.append(key, file);
      });
      Object.entries(details).forEach(([key, val]) => {
        if (val) formData.append(key, val);
      });

      const json = await apiFetch('/api/agency-verification/submit', {
        method: 'POST',
        body: formData
      });
      if (json.error) throw new Error(json.message || 'Submission failed');
      setMessage({ type: 'success', text: 'Verification documents submitted successfully! We will review them shortly.' });
      // Refresh status
      const statusJson = await apiFetch('/api/agency-verification/status');
      setStatus(statusJson.data || statusJson);
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-cyan-200 border-t-cyan-600" />
    </div>
  );

  const verificationStatus = status?.verificationStatus || 'not_submitted';
  const trustScore = status?.trustScore ?? 0;
  const badge = status?.badge;

  return (
    <div className="mx-auto max-w-3xl animate-page-enter space-y-8 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Agency Verification</h1>
        <p className="mt-1 text-slate-500">Get verified to earn trust badges and boost your visibility</p>
      </div>

      {/* Status & Trust Score */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card">
          <p className="text-sm text-slate-500">Verification Status</p>
          <span className={`mt-2 inline-block rounded-full px-3 py-1 text-sm font-semibold ${STATUS_COLORS[verificationStatus]}`}>
            {STATUS_LABELS[verificationStatus]}
          </span>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card">
          <p className="text-sm text-slate-500">Trust Score</p>
          <div className="mt-2 flex items-end gap-1">
            <span className="text-3xl font-bold text-slate-800">{trustScore}</span>
            <span className="mb-1 text-sm text-slate-400">/100</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all" style={{ width: `${trustScore}%` }} />
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card">
          <p className="text-sm text-slate-500">Badge Tier</p>
          {badge ? (
            <div className="mt-2 flex items-center gap-2">
              <span className="text-3xl">{badge.tier === 'gold' ? '🥇' : badge.tier === 'silver' ? '🥈' : '🥉'}</span>
              <span className="text-lg font-bold capitalize text-slate-700">{badge.tier}</span>
            </div>
          ) : (
            <p className="mt-2 text-sm text-slate-400">Not earned yet</p>
          )}
        </div>
      </div>

      {/* Rejection notes */}
      {verificationStatus === 'rejected' && status?.verificationNotes && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
          <p className="font-semibold text-red-700">Review Notes</p>
          <p className="mt-1 text-sm text-red-600">{status.verificationNotes}</p>
        </div>
      )}

      {/* Message */}
      {message && (
        <div className={`rounded-2xl p-4 text-sm font-medium ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
          {message.text}
        </div>
      )}

      {/* Submission Form */}
      {verificationStatus !== 'verified' && (
        <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-card">
          <h2 className="text-lg font-semibold text-slate-800">
            {verificationStatus === 'pending' ? 'Update Documents' : 'Submit Verification Documents'}
          </h2>

          {/* Agency Details */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Description</label>
              <textarea rows={3} value={details.description} onChange={(e) => setDetails({ ...details, description: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-100"
                placeholder="Brief description of your agency" />
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Phone</label>
                <input type="tel" value={details.phone} onChange={(e) => setDetails({ ...details, phone: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-100"
                  placeholder="+91 98765 43210" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Website</label>
                <input type="url" value={details.website} onChange={(e) => setDetails({ ...details, website: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-100"
                  placeholder="https://youragency.com" />
              </div>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Office Address</label>
            <input type="text" value={details.address} onChange={(e) => setDetails({ ...details, address: e.target.value })}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-100"
              placeholder="Full office address" />
          </div>

          {/* Document uploads */}
          <div className="grid gap-4 sm:grid-cols-2">
            {DOC_FIELDS.map((doc) => {
              const existing = status?.documents?.[doc.key];
              return (
                <div key={doc.key} className="rounded-xl border border-dashed border-slate-300 p-4">
                  <p className="font-medium text-slate-700">{doc.label}</p>
                  <p className="text-xs text-slate-400">{doc.desc}</p>
                  {existing && !docs[doc.key] && (
                    <p className="mt-2 text-xs text-emerald-600">✓ Previously uploaded</p>
                  )}
                  <input
                    ref={(el) => (fileRefs.current[doc.key] = el)}
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => handleFileChange(doc.key, e.target.files[0])}
                    className="mt-2 w-full text-sm text-slate-500 file:mr-2 file:rounded-lg file:border-0 file:bg-cyan-50 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-cyan-700 hover:file:bg-cyan-100"
                  />
                  {docs[doc.key] && (
                    <p className="mt-1 text-xs text-cyan-600">New: {docs[doc.key].name}</p>
                  )}
                </div>
              );
            })}
          </div>

          <button type="submit" disabled={submitting}
            className="w-full rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-xl disabled:opacity-50">
            {submitting ? 'Submitting...' : verificationStatus === 'pending' ? 'Update Submission' : 'Submit for Verification'}
          </button>
        </form>
      )}

      {/* Verified state */}
      {verificationStatus === 'verified' && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center">
          <span className="text-5xl">✅</span>
          <p className="mt-4 text-xl font-bold text-emerald-700">Your agency is verified!</p>
          <p className="mt-1 text-sm text-emerald-600">Your verification badge is visible on all your package listings.</p>
        </div>
      )}

      {/* How trust score works */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-card">
        <h2 className="mb-3 text-lg font-semibold text-slate-800">How Trust Score Works</h2>
        <div className="grid gap-3 text-sm sm:grid-cols-2">
          {[
            { label: 'Verified Status', points: '30 pts', desc: 'Complete verification process' },
            { label: 'Documents Uploaded', points: '10 pts', desc: 'Upload all required documents' },
            { label: 'GST & PAN', points: '10 pts', desc: 'Provide GST and PAN details' },
            { label: 'Booking Completion', points: '20 pts', desc: 'High completion rate on bookings' },
            { label: 'Customer Reviews', points: '15 pts', desc: '4+ star average rating' },
            { label: 'Account Age', points: '10 pts', desc: 'Active for 6+ months' },
            { label: 'Active Packages', points: '5 pts', desc: 'Maintain active listings' }
          ].map((item) => (
            <div key={item.label} className="flex items-start gap-3 rounded-lg bg-slate-50 p-3">
              <span className="mt-0.5 rounded bg-cyan-100 px-2 py-0.5 text-xs font-bold text-cyan-700">{item.points}</span>
              <div>
                <p className="font-medium text-slate-700">{item.label}</p>
                <p className="text-xs text-slate-400">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
