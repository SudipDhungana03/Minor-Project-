import React, { useEffect, useState } from 'react';

/**
 * Split auth layout used by Login & Signup.
 *  - Left half: an auto-advancing 3-slide slideshow that showcases the three
 *    product points from the home page (AI & plagiarism detection, actionable
 *    reports, built for classrooms). Each slide is a self-contained "panel"
 *    styled with the brand purple gradient and a lightweight product mockup so
 *    the three slides read like the marketing image.
 *  - Right half: the form card (login / signup).
 *
 * The slideshow uses only CSS + React state (no external image assets) so it
 * works out of the box and stays crisp on every screen size.
 */
// NOTE: gradients are applied via inline `style` (not Tailwind classes) so they
// always render, regardless of the JIT scanner picking up dynamic class names.
const slides = [
  {
    icon: '🔍',
    title: 'AI & plagiarism detection',
    text: 'Instantly flag AI-generated and copied content with direct source links.',
    gradient: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 55%, #3730a3 100%)',
    mockup: 'detection',
  },
  {
    icon: '📊',
    title: 'Actionable reports',
    text: 'Clear originality scores and dashboards your students and teachers can trust.',
    gradient: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 55%, #5b21b6 100%)',
    mockup: 'reports',
  },
  {
    icon: '🎓',
    title: 'Built for classrooms',
    text: 'Assignments, submissions and reviews — all in one connected place.',
    gradient: 'linear-gradient(135deg, #4338ca 0%, #4f46e5 55%, #6d28d9 100%)',
    mockup: 'classroom',
  },
];

const DetectionMockup = () => (
  <div className="rounded-2xl bg-white/95 p-4 shadow-2xl ring-1 ring-black/5">
    <div className="mb-3 flex items-center justify-between">
      <span className="text-xs font-semibold text-slate-500">Essay</span>
      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
        85% confidence
      </span>
    </div>
    <div className="space-y-1.5">
      <div className="h-2 w-full rounded bg-slate-200" />
      <div className="h-2 w-11/12 rounded bg-indigo-200" />
      <div className="h-2 w-full rounded bg-indigo-300" />
      <div className="h-2 w-4/5 rounded bg-slate-200" />
      <div className="h-2 w-10/12 rounded bg-indigo-200" />
    </div>
    <div className="mt-3 space-y-1">
      {['source_site_A.com', 'source_site_B.com', 'source_site_C.com'].map((s) => (
        <div key={s} className="flex items-center gap-2 text-[11px] text-indigo-600">
          <span>🔗</span> {s}
        </div>
      ))}
    </div>
  </div>
);

const ReportsMockup = () => (
  <div className="rounded-2xl bg-white/95 p-4 shadow-2xl ring-1 ring-black/5">
    <div className="mb-3 text-xs font-semibold text-slate-500">
      Originality scores distribution
    </div>
    <div className="flex h-24 items-end gap-1.5">
      {[30, 55, 40, 80, 95, 70, 50, 35].map((h, i) => (
        <div
          key={i}
          className="flex-1 rounded-t"
          style={{
            height: `${h}%`,
            background: 'linear-gradient(to top, #6366f1, #a78bfa)',
          }}
        />
      ))}
    </div>
    <div className="mt-3 flex items-center justify-between">
      <div className="text-[11px] text-slate-500">Avg. class originality</div>
      <div className="text-lg font-extrabold text-slate-900">94%</div>
    </div>
  </div>
);

const ClassroomMockup = () => (
  <div className="rounded-2xl bg-white/95 p-4 shadow-2xl ring-1 ring-black/5">
    <div className="mb-3 flex gap-4 border-b border-slate-100 pb-2 text-[11px] font-semibold">
      <span className="text-indigo-600">Assignments</span>
      <span className="text-slate-400">Submissions</span>
      <span className="text-slate-400">Reviews</span>
    </div>
    <div className="space-y-2">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-3 rounded-xl bg-slate-50 p-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-sm">
            🎓
          </div>
          <div className="flex-1">
            <div className="h-2 w-2/3 rounded bg-slate-300" />
            <div className="mt-1 h-2 w-1/3 rounded bg-slate-200" />
          </div>
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
            ✓
          </span>
        </div>
      ))}
    </div>
  </div>
);

const Mockup = ({ kind }) => {
  if (kind === 'reports') return <ReportsMockup />;
  if (kind === 'classroom') return <ClassroomMockup />;
  return <DetectionMockup />;
};

const AuthLayout = ({ title, subtitle, children }) => {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActive((prev) => (prev + 1) % slides.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-10">
      <div className="grid w-full max-w-6xl overflow-hidden rounded-3xl bg-white shadow-lift md:grid-cols-2">
        {/* Left: slideshow */}
        <div className="relative hidden min-h-[560px] overflow-hidden md:block">
          {slides.map((slide, index) => (
            <div
              key={slide.title}
              style={{ backgroundImage: slide.gradient }}
              className={`absolute inset-0 flex flex-col justify-between p-10 text-white transition-opacity duration-700 ${
                index === active ? 'opacity-100' : 'pointer-events-none opacity-0'
              }`}
            >
              <div className="flex items-center gap-2.5 text-xl font-extrabold">
                <span className="text-2xl">🛡️</span> OriginalityGuard
              </div>

              <div className="space-y-6">
                <div className="mx-auto w-full max-w-xs">
                  <Mockup kind={slide.mockup} />
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/25 text-xl shadow-lg ring-1 ring-white/30">
                    {slide.icon}
                  </div>
                  <div>
                    <div className="text-xl font-extrabold text-white drop-shadow-md">{slide.title}</div>
                    <div className="mt-1 text-sm font-medium leading-relaxed text-white drop-shadow">{slide.text}</div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-white/90 drop-shadow">
                  Trusted by educators to keep learning honest.
                </span>

                <div className="flex gap-2">
                  {slides.map((_, dotIndex) => (
                    <button
                      key={dotIndex}
                      type="button"
                      aria-label={`Go to slide ${dotIndex + 1}`}
                      onClick={() => setActive(dotIndex)}
                      className={`h-2 rounded-full transition-all ${
                        dotIndex === active ? 'w-6 bg-white' : 'w-2 bg-white/50'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Right: form */}
        <div className="flex flex-col justify-center p-8 sm:p-12">
          <div className="mb-6 flex items-center gap-2 text-lg font-extrabold text-ink md:hidden">
            <span>🛡️</span> OriginalityGuard
          </div>
          <div className="mb-8">
            <h1 className="text-2xl font-extrabold text-ink">{title}</h1>
            {subtitle && <p className="mt-1.5 text-ink-soft">{subtitle}</p>}
          </div>
          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
