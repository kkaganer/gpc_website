import { motion } from 'framer-motion';
import { Heart, Sparkles, Users } from 'lucide-react';
import { ORG } from '../../utils/constants';

const icons = {
  Inclusivity: Heart,
  Kindness: Sparkles,
  Connection: Users,
};

export default function Values() {
  return (
    <section className="bg-warm py-8 md:py-10 px-4">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-12">
        {ORG.values.map((value, i) => {
          const Icon = icons[value] || Heart;
          return (
            <motion.div
              key={value}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="flex items-center gap-3"
            >
              <Icon size={22} className="text-primary" />
              <span className="font-heading font-semibold text-dark text-base md:text-lg">
                {value}
              </span>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
