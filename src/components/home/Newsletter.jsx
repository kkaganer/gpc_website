import { motion } from 'framer-motion';
import { Instagram } from 'lucide-react';
import Button from '../ui/Button';
import NewsletterForm from '../ui/NewsletterForm';
import { CONTACT } from '../../utils/constants';

export default function Newsletter() {
  return (
    <section id="newsletter" className="bg-amber-50 py-16 px-4">
      <motion.div
        className="max-w-xl mx-auto text-center"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="font-heading text-2xl md:text-3xl font-bold text-dark">
          Stay in the loop
        </h2>
        <p className="text-gray-600 mt-2">
          Our free weekly What's On guide lands every Thursday
        </p>

        <div className="mt-8">
          <NewsletterForm />
          <p className="text-xs text-gray-500 mt-3">
            We respect your privacy and will never share your details.
          </p>
        </div>

        <a
          href={CONTACT.instagramUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-primary font-bold text-sm hover:underline mt-6"
        >
          <Instagram size={18} />
          Follow us on Instagram {CONTACT.instagram}
        </a>
      </motion.div>
    </section>
  );
}
