import { Reveal } from "./reveal";
import { Countdown } from "./countdown";

export function LaunchingSoon() {
  return (
    <section className="relative overflow-hidden bg-[#060f1f] py-32">
      <div className="blob left-1/4 top-1/2 h-[420px] w-[420px] -translate-y-1/2 bg-[#FF6B00]" />
      <div className="blob right-1/4 top-1/2 h-[420px] w-[420px] -translate-y-1/2 bg-[#1a4bd6]" />
      <div className="relative mx-auto max-w-4xl px-6 text-center">
        <Reveal>
          <span className="text-xs font-semibold uppercase tracking-[0.25em] text-[#FF6B00]">
            Website Launching Soon
          </span>
          <h2 className="font-display mt-4 text-4xl font-extrabold text-white sm:text-5xl">
            Our New Digital Experience Is Almost Ready.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-[#B9C2D0]">
            We're building something extraordinary that will transform the way businesses access creative and
            digital solutions.
          </p>
        </Reveal>

        <Reveal delay={0.15} className="mt-12">
          <Countdown />
        </Reveal>
      </div>
    </section>
  );
}
