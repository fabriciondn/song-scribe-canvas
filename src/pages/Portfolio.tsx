import React, { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Play, Pause, MessageCircle, Sparkles } from "lucide-react";

type Work = {
  id: string;
  composer_name: string;
  composer_photo_url: string | null;
  style: string | null;
  audio_before_url: string | null;
  audio_after_url: string | null;
};
type Testimonial = {
  id: string;
  name: string;
  photo_url: string | null;
  audio_url: string;
};

const sb = supabase as any;

const AudioPlayer: React.FC<{ src: string; accent?: "neutral" | "primary"; label?: string }> = ({
  src,
  accent = "neutral",
  label,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onTime = () =>
      setProgress(a.duration ? (a.currentTime / a.duration) * 100 : 0);
    const onEnd = () => {
      setPlaying(false);
      setProgress(0);
    };
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("ended", onEnd);
    return () => {
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("ended", onEnd);
    };
  }, []);

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) {
      a.pause();
      setPlaying(false);
    } else {
      // Pause others
      document.querySelectorAll("audio").forEach((el) => {
        if (el !== a) (el as HTMLAudioElement).pause();
      });
      a.play();
      setPlaying(true);
    }
  };

  const isPrimary = accent === "primary";

  return (
    <div
      className={`flex items-center gap-3 rounded-2xl border p-3 transition ${
        isPrimary
          ? "border-primary/40 bg-primary/5"
          : "border-white/10 bg-white/5"
      }`}
    >
      <button
        onClick={toggle}
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition active:scale-95 ${
          isPrimary
            ? "bg-primary text-primary-foreground hover:opacity-90"
            : "bg-white text-black hover:opacity-90"
        }`}
        aria-label={playing ? "Pausar" : "Tocar"}
      >
        {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 translate-x-[1px]" />}
      </button>
      <div className="flex-1 min-w-0">
        {label && (
          <div
            className={`text-[10px] font-semibold uppercase tracking-widest mb-1.5 ${
              isPrimary ? "text-primary" : "text-white/60"
            }`}
          >
            {label}
          </div>
        )}
        <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
          <div
            className={`h-full transition-all ${isPrimary ? "bg-primary" : "bg-white/70"}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      <audio ref={audioRef} src={src} preload="none" />
    </div>
  );
};

const Reveal: React.FC<{ children: React.ReactNode; delay?: number }> = ({ children, delay = 0 }) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.12 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ease-out ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
      }`}
    >
      {children}
    </div>
  );
};

const Portfolio: React.FC = () => {
  const [works, setWorks] = useState<Work[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [settings, setSettings] = useState<Record<string, string>>({});

  useEffect(() => {
    document.title = "Portfólio — Compuse Produção Musical";
    (async () => {
      const [w, t, s] = await Promise.all([
        sb.from("portfolio_works").select("*").eq("is_active", true).order("display_order"),
        sb.from("portfolio_testimonials").select("*").eq("is_active", true).order("display_order"),
        sb.from("portfolio_settings").select("key,value"),
      ]);
      setWorks(w.data || []);
      setTestimonials(t.data || []);
      const map: Record<string, string> = {};
      (s.data || []).forEach((r: any) => (map[r.key] = r.value ?? ""));
      setSettings(map);
    })();
  }, []);

  const whatsappHref = `https://wa.me/${(settings.whatsapp_number || "").replace(/\D/g, "")}?text=${encodeURIComponent(
    settings.whatsapp_message || "Olá! Vim do portfólio."
  )}`;

  return (
    <div className="min-h-screen bg-black text-white font-['Plus_Jakarta_Sans',sans-serif]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
        .font-display { font-family: 'Syne', sans-serif; letter-spacing: -0.02em; }
      `}</style>

      {/* Top bar */}
      <header className="absolute top-0 left-0 right-0 z-20 px-6 py-5 flex items-center justify-between">
        <div className="font-display text-xl font-bold">Compuse<span className="text-primary">.</span></div>
        <a
          href={whatsappHref}
          target="_blank"
          rel="noreferrer"
          className="hidden sm:inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm hover:bg-white/5"
        >
          <MessageCircle className="h-4 w-4" /> WhatsApp
        </a>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden pt-32 pb-16 md:pt-44 md:pb-24">
        {/* Grid background */}
        <div
          className="absolute inset-0 -z-10 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)",
            backgroundSize: "48px 48px",
            maskImage:
              "radial-gradient(ellipse at center, black 40%, transparent 80%)",
            WebkitMaskImage:
              "radial-gradient(ellipse at center, black 40%, transparent 80%)",
          }}
        />
        <div className="absolute inset-0 -z-10">
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[600px] w-[600px] rounded-full bg-primary/15 blur-3xl" />
        </div>

        <div className="mx-auto max-w-5xl px-6 text-center">
          <Reveal>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs text-primary mb-6">
              <Sparkles className="h-3.5 w-3.5" />
              Portfólio
            </div>
          </Reveal>
          <Reveal delay={80}>
            <h1 className="font-display text-4xl md:text-7xl font-bold leading-[1.05] mb-6">
              {settings.hero_title || "Sua música merece soar profissional."}
            </h1>
          </Reveal>
          <Reveal delay={160}>
            <p className="mx-auto max-w-2xl text-base md:text-lg text-white/70 mb-8">
              {settings.hero_subtitle || "Ouça o antes e o depois. Decida com os ouvidos."}
            </p>
          </Reveal>
          <Reveal delay={240}>
            <a
              href={whatsappHref}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-base font-semibold text-primary-foreground hover:opacity-90 transition"
            >
              <MessageCircle className="h-5 w-5" /> Falar no WhatsApp
            </a>
          </Reveal>
        </div>

        {/* Carousel de compositores */}
        {works.length > 0 && (
          <div className="relative mt-16 md:mt-24">
            {(() => {
              const photos = works.map((w) => ({
                src: w.composer_photo_url,
                name: w.composer_name,
              }));
              const row1 = Array.from({ length: 4 }).flatMap(() => photos);
              const row2 = Array.from({ length: 4 }).flatMap(() => [...photos].reverse());
              const Avatar = ({ src, name }: { src: string | null; name: string }) => (
                <div className="shrink-0 mx-3 md:mx-4">
                  <div className="h-16 w-16 md:h-20 md:w-20 rounded-full overflow-hidden ring-2 ring-primary/40 bg-white/5">
                    {src ? (
                      <img src={src} alt={name} className="h-full w-full object-cover" loading="lazy" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center font-display text-xl font-bold text-white/80">
                        {name.slice(0, 1)}
                      </div>
                    )}
                  </div>
                </div>
              );
              return (
                <>
                  <div className="flex overflow-hidden mb-4">
                    <div className="flex animate-scroll-left">
                      {row1.map((p, i) => (
                        <Avatar key={`r1-${i}`} src={p.src} name={p.name} />
                      ))}
                    </div>
                  </div>
                  <div className="flex overflow-hidden">
                    <div className="flex animate-scroll-right">
                      {row2.map((p, i) => (
                        <Avatar key={`r2-${i}`} src={p.src} name={p.name} />
                      ))}
                    </div>
                  </div>
                </>
              );
            })()}
            {/* Fade overlays */}
            <div className="pointer-events-none absolute inset-y-0 left-0 w-24 md:w-40 bg-gradient-to-r from-black to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-24 md:w-40 bg-gradient-to-l from-black to-transparent" />
          </div>
        )}
      </section>


      {/* Stats */}
      <section className="border-y border-white/5 bg-white/[0.02]">
        <div className="mx-auto max-w-5xl grid grid-cols-3 gap-4 px-6 py-10">
          {[1, 2, 3].map((i) => (
            <Reveal key={i} delay={i * 80}>
              <div className="text-center">
                <div className="font-display text-3xl md:text-5xl font-bold text-primary">
                  {settings[`stat_${i}_value`] || "—"}
                </div>
                <div className="mt-1 text-xs md:text-sm text-white/60">
                  {settings[`stat_${i}_label`] || ""}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Works */}
      <section className="py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-6">
          <Reveal>
            <div className="mb-12 text-center">
              <div className="text-xs uppercase tracking-[0.3em] text-primary mb-3">Trabalhos</div>
              <h2 className="font-display text-3xl md:text-5xl font-bold">Resultados reais. Sem retoque.</h2>
            </div>
          </Reveal>

          {works.length === 0 ? (
            <p className="text-center text-white/40">Nenhum trabalho publicado ainda.</p>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {works.map((w, i) => (
                <Reveal key={w.id} delay={i * 60}>
                  <article className="group rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent p-6 md:p-8 hover:border-primary/30 transition">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="relative">
                        <div className="absolute inset-0 rounded-full bg-primary/30 blur-md group-hover:bg-primary/50 transition" />
                        <div className="relative h-16 w-16 rounded-full overflow-hidden ring-2 ring-primary/60">
                          {w.composer_photo_url ? (
                            <img src={w.composer_photo_url} alt={w.composer_name} className="h-full w-full object-cover" />
                          ) : (
                            <div className="h-full w-full bg-white/10 flex items-center justify-center text-lg font-bold">
                              {w.composer_name.slice(0, 1)}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="min-w-0">
                        <div className="font-display text-xl font-bold truncate">{w.composer_name}</div>
                        {w.style && <div className="text-xs text-white/50 mt-0.5">{w.style}</div>}
                      </div>
                    </div>
                    <div className="space-y-3">
                      {w.audio_before_url && <AudioPlayer src={w.audio_before_url} label="Antes" />}
                      {w.audio_after_url && <AudioPlayer src={w.audio_after_url} label="Depois" accent="primary" />}
                    </div>
                  </article>
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Testimonials */}
      {testimonials.length > 0 && (
        <section className="py-20 md:py-28 border-t border-white/5 bg-white/[0.02]">
          <div className="mx-auto max-w-5xl px-6">
            <Reveal>
              <div className="mb-12 text-center">
                <div className="text-xs uppercase tracking-[0.3em] text-primary mb-3">Depoimentos</div>
                <h2 className="font-display text-3xl md:text-5xl font-bold">Quem produziu com a gente.</h2>
              </div>
            </Reveal>
            <div className="grid gap-5 md:grid-cols-2">
              {testimonials.map((t, i) => (
                <Reveal key={t.id} delay={i * 60}>
                  <div className="rounded-2xl border border-white/10 bg-black/40 p-5 flex items-center gap-4">
                    <div className="h-14 w-14 shrink-0 rounded-full overflow-hidden ring-2 ring-primary/40">
                      {t.photo_url ? (
                        <img src={t.photo_url} alt={t.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full bg-white/10 flex items-center justify-center font-bold">
                          {t.name.slice(0, 1)}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-display font-bold mb-2 truncate">{t.name}</div>
                      <AudioPlayer src={t.audio_url} accent="primary" />
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-24 md:py-32">
        <div className="mx-auto max-w-3xl px-6">
          <Reveal>
            <div className="relative overflow-hidden rounded-3xl bg-primary p-10 md:p-16 text-center text-primary-foreground">
              <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
              <h2 className="font-display text-3xl md:text-5xl font-bold mb-4">Vamos produzir a sua agora?</h2>
              <p className="mb-8 text-primary-foreground/80 max-w-xl mx-auto">
                Conte sua ideia pelo WhatsApp. Em minutos a gente alinha estilo, prazo e investimento.
              </p>
              <a
                href={whatsappHref}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-black px-8 py-4 text-base font-semibold text-white hover:opacity-90 transition"
              >
                <MessageCircle className="h-5 w-5" /> Falar no WhatsApp
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      <footer className="border-t border-white/5 py-8 text-center text-xs text-white/40">
        © {new Date().getFullYear()} Compuse — Produção musical profissional.
      </footer>
    </div>
  );
};

export default Portfolio;
