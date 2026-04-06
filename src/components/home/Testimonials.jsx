import { motion } from 'framer-motion';
import { Quote } from 'lucide-react';
import Card from '../ui/Card';
import SectionHeading from '../ui/SectionHeading';
import { testimonials } from '../../data/testimonials';

export default function Testimonials() {
  return (
    <section className="py-16 md:py-24 px-4 max-w-6xl mx-auto">
      <SectionHeading
        title="What Our Members Say"
        subtitle="Real words from our GPC community"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
        {testimonials.map((t, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.4, delay: i * 0.1 }}
          >
            <Card className="h-full">
              <div className="p-6 flex flex-col h-full">
                <Quote size={28} className="text-primary mb-3" />
                <p className="text-gray-700 text-sm leading-relaxed flex-grow">
                  {t.quote}
                </p>
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="font-heading font-semibold text-dark text-sm">
                    {t.name}
                  </p>
                  {t.role && (
                    <p className="text-gray-500 text-xs">{t.role}</p>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
