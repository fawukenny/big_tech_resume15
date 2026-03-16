"use client";

const YOUTUBE_PLAYLIST = "https://www.youtube.com/playlist?list=PLIJQNP_KafiJ6z9mHH74TMCogoiWU3lhz";

export function CTABlock() {
  return (
    <section className="card p-8 sm:p-10 text-center">
      <h2 className="section-heading text-xl sm:text-2xl">
        Break into Big Tech
      </h2>
      <p className="section-subheading max-w-lg mx-auto mt-2 mb-8">
        Learn the proven insider’s guide to landing elite roles (and skyrocketing salaries).
      </p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
        <a
          href={YOUTUBE_PLAYLIST}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary inline-flex items-center gap-2"
        >
          <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
          </svg>
          Watch free on YouTube
        </a>
        <a
          href="#"
          className="btn-secondary inline-flex items-center gap-2"
        >
          Explore the full course
        </a>
      </div>
    </section>
  );
}
