"use client";
import { motion } from "motion/react";
import TestimonialCard from "./testimonial-card";

export type TestimonialProps = {
  logo?: string;
  quote: string;
  author: string;
  role: string;
  avatarSrc: string;
  className?: string;
};

export default function Testimonial() {
  return (
    <div className="pt-30 pb-12 lg:pt-54 px-4 max-w-6xl mx-auto flex flex-col gap-12">
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="space-y-4 text-center"
      >
        <h2 className="text-2xl font-normal tracking-tight text-foreground md:text-4xl">
          Loved by people who run on meetings
        </h2>
      </motion.section>

      <section className="grid grid-cols-1 md:grid-cols-6 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
          className="md:col-span-3 h-full"
        >
          <TestimonialCard
            quote="Minutz saved me 2 hours a day on post-call CRM updates. I just review the summary, approve the action items, and move on."
            author="Rahul S."
            role="Sales AE"
            avatarSrc="/illustrations/avatar-1.svg"
            className="h-full justify-between md:max-h-127"
          />
        </motion.div>

        <div className="md:col-span-3 flex flex-col gap-6">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
          >
            <TestimonialCard
              quote="Finally, my standup notes write themselves."
              author="Priya M."
              role="Product Manager"
              avatarSrc="/illustrations/avatar-2.svg"
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
          >
            <TestimonialCard
              quote="The compliance flag feature alone is worth it."
              author="Vikram D."
              role="Financial Advisor"
              avatarSrc="/illustrations/avatar-3.svg"
            />
          </motion.div>
        </div>
      </section>
    </div>
  );
}
