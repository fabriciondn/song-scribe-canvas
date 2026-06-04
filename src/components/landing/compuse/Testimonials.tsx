import React from "react";
import { Reveal } from "./Reveal";
import { TestimonialsColumn, type Testimonial } from "./TestimonialsColumn";

// ⚠ Substitua por depoimentos reais antes de publicar.
const testimonials: Testimonial[] = [
  {
    text: "Em menos de 10 minutos minha música estava registrada com certificado digital. Mandei pra um produtor no dia seguinte sem medo nenhum.",
    image: "https://i.pravatar.cc/80?img=12",
    name: "Lucas Andrade",
    role: "Compositor · São Paulo/SP",
  },
  {
    text: "Nunca tinha registrado nenhuma música antes. Tinha medo de errar alguma coisa, mas o suporte no WhatsApp me guiou em tudo.",
    image: "https://i.pravatar.cc/80?img=32",
    name: "Mariana Costa",
    role: "Cantora independente · Belo Horizonte/MG",
  },
  {
    text: "Comprei o pacote de 10+2 e protegi todo o repertório do nosso ministério de uma vez só. Vale demais o investimento.",
    image: "https://i.pravatar.cc/80?img=15",
    name: "Pastor Diego Moraes",
    role: "Ministério de Louvor · Curitiba/PR",
  },
  {
    text: "Tirei minha dúvida no WhatsApp em poucos minutos, com pessoa de verdade. Isso fez toda diferença pra eu confiar no processo.",
    image: "https://i.pravatar.cc/80?img=47",
    name: "Camila Ribeiro",
    role: "Compositora · Salvador/BA",
  },
  {
    text: "Tinha música em caderno, em áudio de WhatsApp, em bloco de notas. Hoje meu catálogo inteiro está protegido e organizado.",
    image: "https://i.pravatar.cc/80?img=68",
    name: "Rafael Mendes",
    role: "Compositor · Goiânia/GO",
  },
  {
    text: "Eu achava que registrar música era caro e demorado. Paguei R$ 19,99 e recebi o certificado em minutos. Surreal.",
    image: "https://i.pravatar.cc/80?img=23",
    name: "Juliana Faria",
    role: "Cantora e compositora · Recife/PE",
  },
  {
    text: "Registrei uma parceria com outro compositor e o certificado já saiu com o nome dos dois. Resolvido sem complicação.",
    image: "https://i.pravatar.cc/80?img=52",
    name: "Eduardo Lima",
    role: "Produtor musical · Porto Alegre/RS",
  },
  {
    text: "O processo é tão simples que parece bom demais. Mas funciona — recebi o PDF assinado com hash e tudo em poucos minutos.",
    image: "https://i.pravatar.cc/80?img=5",
    name: "Beatriz Souza",
    role: "Compositora · Florianópolis/SC",
  },
  {
    text: "Já indiquei pra três amigos compositores. Quem vive de música precisa proteger o que cria — e a Compuse facilita isso.",
    image: "https://i.pravatar.cc/80?img=60",
    name: "Thiago Nogueira",
    role: "Compositor · Fortaleza/CE",
  },
];

const firstColumn = testimonials.slice(0, 3);
const secondColumn = testimonials.slice(3, 6);
const thirdColumn = testimonials.slice(6, 9);

export const Testimonials: React.FC = () => {
  return (
    <section className="py-24 relative overflow-hidden" style={{ background: "var(--c-bg-deep)" }}>
      <div className="c-container z-10 mx-auto">
        <Reveal>
          <div className="flex flex-col items-center justify-center max-w-2xl mx-auto text-center">
            <div
              className="px-4 py-1.5 rounded-full text-xs font-medium border"
              style={{
                borderColor: "var(--c-border)",
                color: "var(--c-primary)",
                background: "var(--c-surface-soft)",
              }}
            >
              Depoimentos
            </div>
            <h2
              className="font-display font-bold leading-[1.1] mt-5"
              style={{ fontSize: "clamp(1.8rem, 4vw, 3rem)" }}
            >
              Compositores que <span style={{ color: "var(--c-primary)" }}>já protegeram suas obras.</span>
            </h2>
            <p className="mt-5 text-base md:text-lg" style={{ color: "var(--c-text-muted)" }}>
              O que dizem quem já registrou músicas com a Compuse.
            </p>
          </div>
        </Reveal>

        <div
          className="flex justify-center gap-6 mt-12 overflow-hidden"
          style={{
            maskImage:
              "linear-gradient(to bottom, transparent, black 18%, black 82%, transparent)",
            WebkitMaskImage:
              "linear-gradient(to bottom, transparent, black 18%, black 82%, transparent)",
            maxHeight: 640,
          }}
        >
          <TestimonialsColumn testimonials={firstColumn} duration={18} />
          <TestimonialsColumn testimonials={secondColumn} className="hidden md:block" duration={22} />
          <TestimonialsColumn testimonials={thirdColumn} className="hidden lg:block" duration={20} />
        </div>
      </div>
    </section>
  );
};
