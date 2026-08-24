import React, { useEffect, useState } from 'react';
import image1 from '../../image 1.png';
import image2 from '../../image 2.png';
import image3 from '../../image 3 .png';

const slides = [
  { src: image1, alt: 'OriginalityGuard feature preview 1' },
  { src: image2, alt: 'OriginalityGuard feature preview 2' },
  { src: image3, alt: 'OriginalityGuard feature preview 3' },
];

const AuthLayout = ({ title, subtitle, children }) => {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActive((previous) => (previous + 1) % slides.length);
    }, 4500);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-10">
      <div className="grid w-full max-w-6xl overflow-hidden rounded-3xl bg-white shadow-lift md:grid-cols-2">
        <div className="relative hidden aspect-[3/2] w-full self-center overflow-hidden bg-slate-950 md:block">
          {slides.map((slide, index) => (
            <div
              key={slide.src}
              className={`absolute inset-0 transition-opacity duration-700 ${
                index === active ? 'opacity-100' : 'pointer-events-none opacity-0'
              }`}
            >
              <img src={slide.src} alt={slide.alt} className="h-full w-full object-contain" />
            </div>
          ))}

          <div className="absolute inset-x-0 bottom-0 flex justify-end bg-gradient-to-t from-black/35 to-transparent px-10 pb-8 pt-16">
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

        <div className="flex flex-col justify-center p-8 sm:p-12">
          <div className="mb-6 flex items-center gap-2 text-lg font-extrabold text-ink md:hidden">
            <span>OriginalityGuard</span>
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