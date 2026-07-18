import React from "react";
import { Reveal } from "./Reveal";
import { TestimonialsColumn, type Testimonial } from "./TestimonialsColumn";

// Compositores reais da plataforma Compuse. Textos abaixo são placeholders —
// substitua por depoimentos reais coletados antes de publicar.
const testimonials: Testimonial[] = [
  {
    text: "Em menos de 10 minutos minha música estava registrada com certificado digital. Mandei pra um produtor no dia seguinte sem medo nenhum.",
    image: "https://hnencfkdsyiwtvktdvzy.supabase.co/storage/v1/object/public/avatars/ab7729c4-167a-4100-9625-beb6919f469e/ab7729c4-167a-4100-9625-beb6919f469e-0.5884319993820103.jpg",
    name: "Ed Fausto",
    role: "Compositor · Água Branca/AL",
  },
  {
    text: "Nunca tinha registrado nenhuma música antes. Tinha medo de errar alguma coisa, mas o suporte no WhatsApp me guiou em tudo.",
    image: "https://hnencfkdsyiwtvktdvzy.supabase.co/storage/v1/object/public/avatars/d1264b90-2889-4d09-ba4c-96ddd8491611/d1264b90-2889-4d09-ba4c-96ddd8491611-0.9513545135097035.jpg",
    name: "Juarez Maciel Rabelo",
    role: "Compositor · Serra/ES",
  },
  {
    text: "Comprei o pacote de 10+2 e protegi todo o meu repertório de uma vez só. Vale demais o investimento.",
    image: "https://hnencfkdsyiwtvktdvzy.supabase.co/storage/v1/object/public/avatars/b30a05af-6b34-47f5-9914-e925f1e5b268/b30a05af-6b34-47f5-9914-e925f1e5b268-0.6213068476746759.jpg",
    name: "Milton Rosa dos Santos",
    role: "Compositor · Maringá/PR",
  },
  {
    text: "Tirei minha dúvida no WhatsApp em poucos minutos, com pessoa de verdade. Isso fez toda diferença pra eu confiar no processo.",
    image: "https://hnencfkdsyiwtvktdvzy.supabase.co/storage/v1/object/public/avatars/eea80b20-e28e-417e-99d0-1a471e7f2e35/eea80b20-e28e-417e-99d0-1a471e7f2e35-0.2058287531147529.jpeg",
    name: "José da Silva Ramos",
    role: "Compositor · Campinas/SP",
  },
  {
    text: "Tinha música em caderno, em áudio de WhatsApp, em bloco de notas. Hoje meu catálogo inteiro está protegido e organizado.",
    image: "https://hnencfkdsyiwtvktdvzy.supabase.co/storage/v1/object/public/avatars/11999e6c-1a52-4344-8637-83e7f027fe9b/11999e6c-1a52-4344-8637-83e7f027fe9b-0.8545880352218698.jpg",
    name: "Joel Roque da Silva",
    role: "Compositor · São Paulo/SP",
  },
  {
    text: "Eu achava que registrar música era caro e demorado. Paguei R$ 29,90 e recebi o certificado em minutos. Surreal.",
    image: "https://hnencfkdsyiwtvktdvzy.supabase.co/storage/v1/object/public/avatars/f5fbc9bf-25c1-4757-b672-b4264f36cfa4/f5fbc9bf-25c1-4757-b672-b4264f36cfa4-0.9431225640274293.jpg",
    name: "Jefferson Lima",
    role: "Compositor · Campinas/SP",
  },
  {
    text: "Registrei uma parceria com outro compositor e o certificado já saiu com o nome dos dois. Resolvido sem complicação.",
    image: "https://hnencfkdsyiwtvktdvzy.supabase.co/storage/v1/object/public/avatars/e250830f-f12e-43b0-a32c-104ebcde8c00/e250830f-f12e-43b0-a32c-104ebcde8c00-0.0006559717593208614.jpg",
    name: "Kacio Morais",
    role: "Compositor · Fortaleza/CE",
  },
  {
    text: "O processo é tão simples que parece bom demais. Mas funciona — recebi o PDF assinado com hash e tudo em poucos minutos.",
    image: "https://hnencfkdsyiwtvktdvzy.supabase.co/storage/v1/object/public/avatars/b4a52e69-2806-4afe-b0f2-c6a433de902e/b4a52e69-2806-4afe-b0f2-c6a433de902e-0.8531108704050755.jpeg",
    name: "Micheli Martins",
    role: "Compositora · Milagres/CE",
  },
  {
    text: "Já indiquei pra vários amigos compositores. Quem vive de música precisa proteger o que cria — e a Compuse facilita isso.",
    image: "https://hnencfkdsyiwtvktdvzy.supabase.co/storage/v1/object/public/avatars/7a0ca180-972f-47b4-8f0e-df383442ffe7/7a0ca180-972f-47b4-8f0e-df383442ffe7-0.6172164889055233.jpg",
    name: "Márcia Consolação",
    role: "Compositora · Minas Gerais/MG",
  },
];

const firstColumn = testimonials.slice(0, 3);
const secondColumn = testimonials.slice(3, 6);
const thirdColumn = testimonials.slice(6, 9);

export const Testimonials: React.FC = () => {
  return (
    <section className="pt-12 pb-24 relative overflow-hidden" style={{ background: "var(--c-bg-deep)" }}>
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
