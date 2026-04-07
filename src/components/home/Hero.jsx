import { motion } from 'framer-motion';
import { Instagram, Mail } from 'lucide-react';
import Button from '../ui/Button';
import { ORG, CONTACT } from '../../utils/constants';

export default function Hero() {
  return (
    <section className="bg-warm py-16 md:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 gap-8 md:gap-12 items-center">
        {/* Mobile: two photos side by side */}
        <div className="md:hidden flex gap-3">
          <img
            src="/images/about-community-2.jpg"
            alt="GPC community gathering"
            className="w-1/2 rounded-2xl object-cover aspect-[3/4]"
          />
          <img
            src="/images/about-community-3.jpg"
            alt="GPC families at an event"
            className="w-1/2 rounded-2xl object-cover aspect-[3/4]"
          />
        </div>

        {/* Text */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="font-heading font-bold text-dark text-3xl sm:text-4xl md:text-5xl leading-tight">
            Welcome to your village in Greenwich
          </h1>
          <p className="mt-4 text-gray-700 text-base sm:text-lg leading-relaxed max-w-lg">
            {ORG.memberCount} parents and carers running events and activities for local families. Come as you are.
          </p>

          <div className="flex flex-wrap gap-3 mt-6">
            <Button href="/events">
              See Our Events
            </Button>
            <Button variant="secondary" href="/whats-on">
              See What's On
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-4 mt-6 text-sm text-gray-600">
            <a
              href={`mailto:${CONTACT.email}`}
              className="flex items-center gap-1.5 hover:text-primary transition-colors"
            >
              <Mail size={16} />
              {CONTACT.email}
            </a>
            <a
              href={CONTACT.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 hover:text-primary transition-colors"
            >
              <Instagram size={16} />
              {CONTACT.instagram}
            </a>
          </div>
        </motion.div>

        {/* Desktop: two smaller photos side by side */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="hidden md:grid grid-cols-2 gap-4"
        >
          <img
            src="/images/about-community-2.jpg"
            alt="GPC community gathering"
            className="rounded-2xl object-cover aspect-[3/4] w-full"
          />
          <img
            src="/images/about-community-3.jpg"
            alt="GPC families at a community event"
            className="rounded-2xl object-cover aspect-[3/4] w-full"
          />
        </motion.div>
      </div>
    </section>
  );
}
