import { motion } from 'framer-motion';
import { Instagram } from 'lucide-react';
import SectionHeading from '../ui/SectionHeading';
import NewsletterForm from '../ui/NewsletterForm';
import { CONTACT } from '../../utils/constants';

export default function Newsletter() {
  return (
    <section id="newsletter" className="bg-amber-50 py-16 md:py-24 px-4">
      <motion.div
        className="max-w-2xl mx-auto"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <SectionHeading
          title="Stay Connected"
          subtitle="Join our newsletter for weekly updates"
        />

        <div className="mt-10">
          <NewsletterForm />
        </div>

        <div className="mt-8 text-center">
          <a
            href={CONTACT.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-primary font-bold hover:underline"
          >
            <Instagram size={20} />
            Follow us on Instagram {CONTACT.instagram}
          </a>
        </div>
      </motion.div>
    </section>
  );
}
