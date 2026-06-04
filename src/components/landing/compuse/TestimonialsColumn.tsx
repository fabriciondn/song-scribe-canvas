"use client";

import React from "react";
import { motion } from "framer-motion";

export interface Testimonial {
  text: string;
  image: string;
  name: string;
  role: string;
}

export const TestimonialsColumn: React.FC<{
  className?: string;
  testimonials: Testimonial[];
  duration?: number;
}> = (props) => {
  return (
    <div className={props.className}>
      <motion.div
        animate={{ translateY: "-50%" }}
        transition={{
          duration: props.duration || 10,
          repeat: Infinity,
          ease: "linear",
          repeatType: "loop",
        }}
        className="flex flex-col gap-6 pb-6"
      >
        {[...new Array(2)].map((_, index) => (
          <React.Fragment key={index}>
            {props.testimonials.map(({ text, image, name, role }, i) => (
              <div
                className="p-8 rounded-3xl max-w-xs w-full"
                key={i}
                style={{
                  border: "1px solid var(--c-border)",
                  background: "var(--c-surface-soft)",
                  boxShadow: "0 12px 40px rgba(0,0,0,0.35), 0 0 0 1px rgba(0,177,140,0.06)",
                }}
              >
                <div className="text-sm leading-relaxed" style={{ color: "var(--c-text)" }}>
                  {text}
                </div>
                <div className="flex items-center gap-3 mt-5">
                  <img
                    width={40}
                    height={40}
                    src={image}
                    alt={name}
                    className="h-10 w-10 rounded-full object-cover"
                    style={{ border: "1px solid var(--c-border)" }}
                  />
                  <div className="flex flex-col">
                    <div className="font-medium tracking-tight leading-5" style={{ color: "var(--c-text)" }}>
                      {name}
                    </div>
                    <div className="leading-5 tracking-tight text-xs" style={{ color: "var(--c-text-muted)" }}>
                      {role}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </React.Fragment>
        ))}
      </motion.div>
    </div>
  );
};
