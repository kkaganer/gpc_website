import { motion } from 'framer-motion';
import { MessageCircle } from 'lucide-react';
import Button from '../ui/Button';
import { communities } from '../../data/communities';
import { CONTACT } from '../../utils/constants';
import { useInstagramFeed } from '../../hooks/useInstagramFeed';
import { galleryPosts } from '../../data/galleryPosts';

const joinUrl = `mailto:${CONTACT.email}?subject=${encodeURIComponent('Join the GPC WhatsApp community')}`;

function Pill({ name, i }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: '-30px' }}
      transition={{ duration: 0.3, delay: Math.min(i * 0.04, 0.4) }}
      className="flex items-center gap-2 bg-white/10 rounded-full border border-white/20 px-4 py-2 text-sm text-white"
    >
      <MessageCircle size={16} className="text-primary shrink-0" />
      <span>{name}</span>
    </motion.div>
  );
}

export default function FindYourPeople() {
  const { posts } = useInstagramFeed({ limit: 4 });
  const images = posts.length > 0
    ? posts.map(p => ({ url: p.imageUrl, link: p.permalink }))
    : galleryPosts.filter(p => p.featured).slice(0, 4).map(p => ({ url: p.image, link: p.instagramUrl }));

  return (
    <section className="bg-dark py-20 text-white">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="font-heading text-3xl md:text-4xl font-bold text-center mb-4">
          Find your people
        </h2>
        <p className="text-white/70 text-center mb-10 max-w-xl mx-auto">
          WhatsApp groups where our members chat, share, and support each other
        </p>

        <div className="flex flex-wrap justify-center gap-3">
          {communities.general.map((c, i) => (
            <Pill key={c.name} name={c.name} i={i} />
          ))}
        </div>

        <div className="mt-8">
          <h3 className="text-center font-heading font-semibold text-white/90 text-lg mb-4">
            Baby groups by school year
          </h3>
          <div className="flex flex-wrap justify-center gap-3">
            {communities.schoolYear.map((c, i) => (
              <Pill key={c.name} name={c.name} i={i} />
            ))}
          </div>
        </div>
      </div>

      {/* Photo strip */}
      <div className="mt-12 overflow-x-auto flex gap-4 px-4 snap-x snap-mandatory md:max-w-6xl md:mx-auto md:grid md:grid-cols-4 scrollbar-hide">
        {images.map((img, i) => (
          <motion.a
            key={i}
            href={img.link}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.1 }}
            className="w-64 h-64 rounded-2xl snap-center shrink-0 md:w-auto md:h-auto md:aspect-square overflow-hidden"
          >
            <img
              src={img.url}
              alt=""
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          </motion.a>
        ))}
      </div>

      <div className="flex justify-center mt-10 px-4">
        <Button variant="outline" href={joinUrl}>
          Join our WhatsApp community
        </Button>
      </div>
    </section>
  );
}
