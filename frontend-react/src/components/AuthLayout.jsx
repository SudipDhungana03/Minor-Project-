import React from 'react';

/**
 * Grammarly-style split auth layout:
 *  - Left: branded gradient panel with value props (hidden on small screens)
 *  - Right: the form card
 */
const features = [
  {
    icon: '🔍',
    title: 'AI & plagiarism detection',
    text: 'Instantly flag AI-generated and copied content with source links.',
  },
  {
    icon: '📊',
    title: 'Actionable reports',
    text: 'Clear originality scores your students and teachers can trust.',
  },
  {
    icon: '🎓',
    title: 'Built for classrooms',
    text: 'Assignments, submissions and reviews — all in one place.',
  },
];

const AuthLayout = ({ title, subtitle, children }) => (
  <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-10">
    <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-lift md:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden flex-col justify-between bg-linear-to-br from-brand-700 via-brand-600 to-brand-800 bg-brand-700 p-10 text-white md:flex">
        <div className="flex items-center gap-2.5 text-xl font-extrabold">
          <span className="text-2xl">🛡️</span> OriginalityGuard
        </div>

        <div className="space-y-6">
          <h2 className="text-3xl font-extrabold leading-tight">
            Academic integrity, made effortless.
          </h2>
          <div className="space-y-5">
            {features.map((f) => (
              <div key={f.title} className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15 text-lg">
                  {f.icon}
                </div>
                <div>
                  <div className="font-semibold">{f.title}</div>
                  <div className="text-sm text-brand-100/80">{f.text}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-sm text-brand-100/70">
          Trusted by educators to keep learning honest.
        </div>
      </div>

      {/* Form panel */}
      <div className="flex flex-col justify-center p-8 sm:p-12">
        {/* Mobile brand */}
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

export default AuthLayout;
