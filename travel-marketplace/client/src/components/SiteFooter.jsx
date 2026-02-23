import React, { useState } from 'react';
import { Link } from 'react-router-dom';

/* ── Who We Are + Disclaimer ── */
function WhoWeAreSection() {
  const [aboutOpen, setAboutOpen] = useState(false);
  const [disclaimerOpen, setDisclaimerOpen] = useState(false);

  return (
    <section className="bg-white py-14">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h3 className="mb-3 text-xl font-bold text-slate-900">Who We Are?</h3>
          <p className={`text-sm leading-relaxed text-slate-600 ${!aboutOpen ? 'line-clamp-3' : ''}`}>
            Obsessed with the idea of empowering travelers with the best vacation deals, <strong>Travely</strong> is your trusted online travel marketplace that connects travelers to multiple verified local travel agencies. With the help of our growing network of travel experts, Travely has been able to cater to the needs of thousands of travelers on international tour holidays as well as domestic India tours.
            {aboutOpen && (
              <>
                {' '}We believe every journey should be extraordinary. Travely provides a seamless booking experience with transparent pricing, real-time availability, and personalized travel recommendations. Whether you're looking for a relaxing beach holiday, an adventurous trek, or a cultural exploration — our partner agencies have you covered. Our platform features verified reviews from real travelers, secure payment options, and 24/7 customer support to ensure your trip goes smoothly from start to finish.
              </>
            )}
          </p>
          <button onClick={() => setAboutOpen(!aboutOpen)} className="mt-2 flex items-center gap-1 text-sm font-semibold text-cyan-600 hover:text-cyan-700 transition">
            Read {aboutOpen ? 'Less' : 'More'}
            <svg className={`h-4 w-4 transition ${aboutOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
          </button>
        </div>
        <div>
          <h3 className="mb-3 text-xl font-bold text-slate-900">Disclaimer</h3>
          <p className={`text-sm leading-relaxed text-slate-600 ${!disclaimerOpen ? 'line-clamp-3' : ''}`}>
            Travely Travel Pvt. Ltd. ("Travely" or "We") functions solely as an intermediary, facilitating connections between travelers and travel agents. Our role is restricted to providing information about travel options and facilitating the booking process. While we strive to ensure a seamless travel experience, we cannot be held accountable for any deficiencies in the services rendered by travel agents. We neither bear any responsibility nor incur any liability toward owning, operating, or controlling the services offered by travel agents.
            {disclaimerOpen && (
              <>
                {' '}All package details, pricing, itineraries, and photographs are provided by the respective travel agencies and are subject to change without prior notice. Travely does not guarantee the accuracy, completeness, or reliability of any information provided by travel agents. By using our platform, you agree to our Terms and Conditions and Privacy Policy.
              </>
            )}
          </p>
          <button onClick={() => setDisclaimerOpen(!disclaimerOpen)} className="mt-2 flex items-center gap-1 text-sm font-semibold text-cyan-600 hover:text-cyan-700 transition">
            Read {disclaimerOpen ? 'Less' : 'More'}
            <svg className={`h-4 w-4 transition ${disclaimerOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
          </button>
        </div>
      </div>
    </section>
  );
}

/* ── Popular Travel Searches ── */
function PopularSearches() {
  const [open, setOpen] = useState(false);
  const searches = [
    'Goa Packages', 'Kerala Honeymoon', 'Ladakh Road Trip', 'Manali Packages',
    'Andaman Tour', 'Kashmir Packages', 'Rajasthan Heritage', 'Sikkim Gangtok Tour',
    'Ooty Packages', 'Thailand Tour', 'Maldives Honeymoon', 'Bali Packages',
    'Singapore Malaysia', 'Europe Trip', 'Nepal Tour', 'Dubai Packages',
    'Himachal Tour', 'Rishikesh Adventure', 'Udaipur Packages', 'Varanasi Tour',
  ];
  return (
    <section className="bg-[#3a3a3a]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <button onClick={() => setOpen(!open)} className="flex w-full items-center justify-center gap-2 py-4 text-sm font-semibold text-white transition hover:text-cyan-300">
          Popular Travel Searches
          <svg className={`h-4 w-4 transition ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
        </button>
        {open && (
          <div className="flex flex-wrap justify-center gap-2 pb-5">
            {searches.map((s) => (
              <Link key={s} to={`/app/packages?search=${encodeURIComponent(s.split(' ')[0])}`} className="rounded-full border border-white/15 px-3 py-1.5 text-xs text-slate-300 transition hover:border-cyan-400 hover:text-white">{s}</Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/* ── Main Footer ── */
export default function SiteFooter() {
  return (
    <>
      <WhoWeAreSection />
      <PopularSearches />

      <footer className="bg-[#2d2d2d] text-slate-300">
        {/* Top links + contact */}
        <div className="border-b border-white/10">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs sm:text-sm">
                <Link to="/" className="hover:text-white transition">About Us</Link>
                <Link to="/" className="hover:text-white transition">Testimonials</Link>
                <Link to="/" className="hover:text-white transition">Terms and Conditions</Link>
                <Link to="/" className="hover:text-white transition">Privacy Policy</Link>
                <Link to="/agency/register" className="hover:text-white transition">Travel Agent? Join Us</Link>
                <Link to="/" className="hover:text-white transition">FAQ</Link>
                <Link to="/" className="hover:text-white transition">Contact Us</Link>
              </div>
              <div className="flex flex-col gap-1 text-xs sm:text-sm whitespace-nowrap">
                <span className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                  1800 123 5555
                </span>
                <span className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  support@travely.com
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Destination links */}
        <div className="border-b border-white/10">
          <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8 space-y-3">
            <div className="flex flex-wrap items-baseline gap-x-1 gap-y-1 text-xs sm:text-sm">
              <span className="mr-2 font-bold text-white">International</span>
              {['Thailand', 'Singapore', 'Malaysia', 'Nepal', 'Sri Lanka', 'Europe', 'Mauritius', 'Maldives', 'Egypt', 'Africa', 'Australia'].map((d, i, arr) => (
                <React.Fragment key={d}>
                  <Link to={`/app/packages?search=${d}`} className="hover:text-white transition">{d}</Link>
                  {i < arr.length - 1 && <span className="text-slate-500">|</span>}
                </React.Fragment>
              ))}
            </div>
            <div className="flex flex-wrap items-baseline gap-x-1 gap-y-1 text-xs sm:text-sm">
              <span className="mr-2 font-bold text-white">Domestic</span>
              {['Kerala', 'Ladakh', 'Goa', 'Rajasthan', 'Kashmir', 'Andaman', 'Andhra Pradesh', 'Bihar', 'Gujarat', 'Himachal', 'Karnataka', 'Uttarakhand', 'Sikkim'].map((d, i, arr) => (
                <React.Fragment key={d}>
                  <Link to={`/app/packages?search=${d}`} className="hover:text-white transition">{d}</Link>
                  {i < arr.length - 1 && <span className="text-slate-500">|</span>}
                </React.Fragment>
              ))}
            </div>
            <div className="flex flex-wrap items-baseline gap-x-1 gap-y-1 text-xs sm:text-sm">
              <span className="mr-2 font-bold text-white">Packages</span>
              {['1 to 3 Days Packages', '4 to 6 Days Packages', '7 to 9 Days Packages', '10 to 12 Days Packages', '13+ Days Packages'].map((d, i, arr) => (
                <React.Fragment key={d}>
                  <Link to="/app/packages" className="hover:text-white transition">{d}</Link>
                  {i < arr.length - 1 && <span className="text-slate-500">|</span>}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom: office + social + payments */}
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div>
              <h4 className="mb-3 text-sm font-bold text-white">Corporate Office:</h4>
              <div className="text-xs leading-relaxed text-slate-400">
                <p className="font-semibold text-slate-300">Travely Travel Pvt. Ltd.</p>
                <p>123, Innovation Hub, 4th Floor,</p>
                <p>Koramangala, Bengaluru,</p>
                <p>Karnataka - 560034, India</p>
                <p className="mt-1">Landline: 1800 123 5555</p>
              </div>
            </div>
            <div>
              <h4 className="mb-3 text-sm font-bold text-white">Connect with us on :</h4>
              <div className="flex gap-3">
                <a href="#" className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-slate-300 transition hover:bg-blue-600 hover:text-white">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                </a>
                <a href="#" className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-slate-300 transition hover:bg-slate-800 hover:text-white">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                </a>
                <a href="#" className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-slate-300 transition hover:bg-gradient-to-br hover:from-purple-600 hover:to-pink-500 hover:text-white">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" /></svg>
                </a>
                <a href="#" className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-slate-300 transition hover:bg-red-600 hover:text-white">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 01.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12.017 24c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641 0 12.017 0z" /></svg>
                </a>
              </div>
            </div>
            <div>
              <h4 className="mb-3 text-sm font-bold text-white">We Accept:</h4>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex h-8 items-center rounded bg-white px-2.5"><span className="text-sm font-extrabold italic text-[#1a1f71]">VISA</span></div>
                <div className="flex h-8 items-center rounded bg-white px-2.5"><span className="text-sm font-bold text-[#eb001b]">Master</span><span className="text-sm font-bold text-[#f79e1b]">Card</span></div>
                <div className="flex h-8 items-center rounded bg-white px-2.5"><span className="text-sm font-bold text-[#4b286d]">UPI</span></div>
                <div className="flex h-8 items-center rounded bg-white px-2.5"><span className="text-sm font-bold text-[#072654]">Razorpay</span></div>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright bar */}
        <div className="border-t border-white/10 bg-[#252525]">
          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600">
                  <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
                  </svg>
                </div>
                <span className="font-display text-sm font-bold text-white">Travely</span>
              </div>
              <p className="flex items-center gap-1 text-xs text-slate-400">Made with <span className="text-red-500">❤️</span> in India</p>
              <p className="text-xs text-slate-400">All rights reserved &copy; {new Date().getFullYear()}</p>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
