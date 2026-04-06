import { motion } from 'framer-motion';
import { MessageCircle, Users, Heart, ArrowRight } from 'lucide-react';
import { communities } from '../../data/communities';
import { CONTACT } from '../../utils/constants';
import { useInstagramFeed } from '../../hooks/useInstagramFeed';
import { galleryPosts } from '../../data/galleryPosts';

const joinUrl = `mailto:${CONTACT.email}?subject=${encodeURIComponent('Join the GPC WhatsApp community')}`;

const categoryIcons = {
  general: MessageCircle,
  schoolYear: Users,
};

function CommunityCard({ community, index, type }) {
  const Icon = categoryIcons[type] || MessageCircle;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.05, 0.5) }}
      className="group relative"
    >
      {/* Compact pill on mobile, full card on sm+ */}
      <div className="relative bg-white/10 sm:bg-white rounded-full sm:rounded-2xl px-4 py-2.5 sm:p-4 border border-white/20 sm:border-dark/[0.04] sm:shadow-[0_1px_3px_rgba(45,27,78,0.06)] sm:hover:shadow-[0_8px_30px_rgba(252,22,160,0.12)] transition-all duration-300 sm:hover:-translate-y-0.5">
        <div className="flex items-center sm:items-start gap-2 sm:gap-3">
          <Icon size={14} className="text-primary shrink-0 sm:hidden" />
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/15 to-dark/10 hidden sm:flex items-center justify-center shrink-0 group-hover:from-primary/25 group-hover:to-dark/15 transition-colors duration-300">
            <Icon size={16} className="text-primary" />
          </div>
          <div className="min-w-0">
            <h3 className="font-heading font-semibold text-white sm:text-dark text-sm leading-snug">
              {community.name}
            </h3>
            {community.description && (
              <p className="hidden sm:block text-gray-400 text-xs mt-0.5 leading-relaxed">
                {community.description}
              </p>
            )}
            {community.year && (
              <span className="hidden sm:inline-block mt-1 text-[10px] font-bold tracking-wide uppercase text-primary/70 bg-primary/[0.06] px-2 py-0.5 rounded-full">
                {community.year}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function PhotoMosaic({ images }) {
  if (images.length < 3) return null;

  return (
    <div className="grid grid-cols-3 gap-3">
      {images.map((img, i) => (
        <motion.a
          key={i}
          href={img.link}
          target="_blank"
          rel="noopener noreferrer"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: i * 0.08 }}
          className="relative overflow-hidden rounded-2xl group aspect-square"
        >
          <img
            src={img.url}
            alt=""
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-dark/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </motion.a>
      ))}
    </div>
  );
}

export default function FindYourPeople() {
  const { posts } = useInstagramFeed({ limit: 3 });
  const images = posts.length > 0
    ? posts.map(p => ({ url: p.imageUrl, link: p.permalink }))
    : galleryPosts.filter(p => p.featured).slice(0, 3).map(p => ({ url: p.image, link: p.instagramUrl }));

  return (
    <section className="relative bg-dark overflow-hidden">
      {/* Textured background layer */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_50%,rgba(252,22,160,0.08),transparent_60%),radial-gradient(ellipse_at_80%_20%,rgba(252,22,160,0.05),transparent_50%)]" />
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'40\' height=\'40\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M0 0h1v1H0z\' fill=\'%23fff\' fill-opacity=\'.4\'/%3E%3C/svg%3E")', backgroundSize: '40px 40px' }} />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-28">
        {/* Header */}
        <div className="max-w-2xl mb-8 md:mb-14">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center gap-2 text-primary text-xs font-bold tracking-widest uppercase mb-4">
              <Heart size={14} className="fill-primary" />
              WhatsApp Communities
            </span>
            <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-[1.1]">
              Find your people
            </h2>
            <p className="mt-4 text-white/60 text-base sm:text-lg leading-relaxed max-w-lg">
              Real conversations, real support. Our WhatsApp groups are where the community comes alive — join the ones that fit your family.
            </p>
          </motion.div>
        </div>

        {/* Community cards grid — wrapping pills on mobile, cards on sm+ */}
        <div className="mb-6 md:mb-10">
          <div className="flex flex-wrap gap-2 sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:gap-3">
            {communities.general.map((c, i) => (
              <CommunityCard key={c.key} community={c} index={i} type="general" />
            ))}
          </div>
        </div>

        {/* School year groups */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-10 md:mb-14"
        >
          <h3 className="font-heading font-semibold text-white/80 text-sm tracking-wide uppercase mb-3 md:mb-4">
            Baby groups by school year
          </h3>
          <div className="flex flex-wrap gap-2 sm:grid sm:grid-cols-3 lg:grid-cols-5 sm:gap-3">
            {communities.schoolYear.map((c, i) => (
              <CommunityCard key={c.key} community={c} index={i} type="schoolYear" />
            ))}
          </div>
        </motion.div>

        {/* Photo mosaic */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <PhotoMosaic images={images} />
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex flex-col sm:flex-row items-start sm:items-center gap-4"
        >
          <a
            href={joinUrl}
            className="group inline-flex items-center gap-3 bg-primary hover:bg-primary/90 text-white font-bold text-sm px-7 py-3.5 rounded-full transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_8px_30px_rgba(252,22,160,0.3)]"
          >
            <MessageCircle size={18} />
            Join our WhatsApp community
            <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
          </a>
          <span className="text-white/40 text-sm">
            Free to join · Friendly & inclusive
          </span>
        </motion.div>
      </div>
    </section>
  );
}
