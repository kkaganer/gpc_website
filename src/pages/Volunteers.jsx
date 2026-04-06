import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import Button from '../components/ui/Button';

export default function Volunteers() {
  useEffect(() => {
    document.title = 'Meet the Volunteers | Greenwich Parents & Carers';
  }, []);

  return (
    <section className="bg-warm min-h-[70vh] flex items-center">
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          <motion.div
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="inline-block mb-6"
          >
            <Heart className="w-12 h-12 text-primary" />
          </motion.div>

          <h1 className="font-heading text-3xl md:text-4xl font-bold text-dark">
            Meet the Volunteers
          </h1>

          <p className="text-gray-600 mt-4 text-lg leading-relaxed">
            We're putting together something special. Our community is powered by
            20+ amazing volunteers and we can't wait to introduce them all to you.
          </p>

          <p className="text-gray-500 mt-2">
            This page is coming soon.
          </p>

          <div className="mt-8">
            <Button href="/about">
              Read our story
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
