import { motion } from 'framer-motion';

export default function PullQuote({ quote, name, role }) {
  return (
    <section className="bg-warm py-20 relative overflow-hidden">
      <div className="max-w-3xl mx-auto px-4 text-center relative">
        <span
          aria-hidden="true"
          className="absolute -top-6 left-1/2 -translate-x-1/2 text-[120px] leading-none font-heading font-bold text-primary/15 select-none pointer-events-none"
        >
          &ldquo;
        </span>
        <motion.blockquote
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.6 }}
          className="relative z-10"
        >
          <p className="text-xl md:text-2xl font-body leading-relaxed text-dark italic">
            &ldquo;{quote}&rdquo;
          </p>
          <footer className="mt-6">
            <p className="font-heading font-semibold text-dark">{name}</p>
            {role && <p className="text-gray-500 text-sm">{role}</p>}
          </footer>
        </motion.blockquote>
      </div>
    </section>
  );
}
