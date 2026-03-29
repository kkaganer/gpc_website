import { motion } from 'framer-motion';
import { ORG } from '../../utils/constants';

const stats = [
  { value: ORG.memberCount, label: 'Community Members' },
  { value: String(ORG.foundedYear), label: 'Founded' },
  { value: '100%', label: 'Volunteer Run' },
];

export default function Stats() {
  return (
    <section className="bg-gradient-to-r from-primary to-dark py-16 md:py-20">
      <div className="max-w-5xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-10 text-center text-white">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.15 }}
          >
            <p className="text-4xl md:text-5xl font-bold mb-2">{stat.value}</p>
            <p className="text-lg opacity-90">{stat.label}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
