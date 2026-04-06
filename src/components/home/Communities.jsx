import { motion } from 'framer-motion';
import { MessageCircle } from 'lucide-react';
import SectionHeading from '../ui/SectionHeading';
import { communities } from '../../data/communities';
import { CONTACT } from '../../utils/constants';

// TODO: replace with dedicated WhatsApp join link once available
const joinUrl = `mailto:${CONTACT.email}?subject=${encodeURIComponent('Join the GPC WhatsApp community')}`;

function Pill({ name, i }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.3, delay: Math.min(i * 0.04, 0.4) }}
      className="flex items-center gap-2 bg-white rounded-full border border-gray-200 shadow-sm px-4 py-2 text-sm text-dark"
    >
      <MessageCircle size={16} className="text-primary shrink-0" />
      <span>{name}</span>
    </motion.div>
  );
}

export default function Communities() {
  return (
    <section className="py-16 md:py-24 px-4 max-w-6xl mx-auto">
      <SectionHeading
        title="Our Communities"
        subtitle="WhatsApp groups where our members chat, share and support each other"
      />

      <div className="mt-12">
        <div className="flex flex-wrap justify-center gap-3">
          {communities.general.map((c, i) => (
            <Pill key={c.name} name={c.name} i={i} />
          ))}
        </div>

        <div className="mt-10">
          <h3 className="text-center font-heading font-semibold text-dark text-lg mb-4">
            Baby groups by school year
          </h3>
          <div className="flex flex-wrap justify-center gap-3">
            {communities.schoolYear.map((c, i) => (
              <Pill key={c.name} name={c.name} i={i} />
            ))}
          </div>
        </div>

        <div className="flex justify-center mt-10">
          <a
            href={joinUrl}
            className="inline-flex items-center justify-center px-6 py-3 text-sm font-bold rounded-full bg-gradient-to-r from-primary to-dark text-white hover:scale-105 transition-transform focus:ring-2 focus:ring-primary focus:outline-none"
          >
            Join our WhatsApp community
          </a>
        </div>
      </div>
    </section>
  );
}
