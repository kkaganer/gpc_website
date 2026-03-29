import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail } from 'lucide-react';
import { ORG } from '../../utils/constants';

export default function NewsletterBanner() {
  const [email, setEmail] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: Replace with Brevo form integration
    setEmail('');
  };

  return (
    <motion.section
      id="newsletter-banner"
      className="bg-dark py-3 px-4"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
        <p className="text-white text-sm flex items-center gap-2">
          <Mail size={16} className="text-primary shrink-0" />
          Stay in the loop — join {ORG.memberCount} Greenwich parents
        </p>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Your email"
            required
            className="rounded-full py-2 px-4 text-sm bg-white/10 text-white placeholder-white/50 border border-white/20 focus:border-primary focus:outline-none w-48"
          />
          <button
            type="submit"
            className="bg-primary text-white rounded-full py-2 px-5 text-sm font-bold hover:bg-primary/90 transition-colors focus:ring-2 focus:ring-primary focus:outline-none"
          >
            Subscribe
          </button>
        </form>
      </div>
    </motion.section>
  );
}
