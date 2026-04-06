import { motion } from 'framer-motion';
import { Instagram } from 'lucide-react';
import SectionHeading from '../ui/SectionHeading';
import { useInstagramFeed } from '../../hooks/useInstagramFeed';
import { galleryPosts } from '../../data/galleryPosts';
import { CONTACT } from '../../utils/constants';

const fallbackFeatured = galleryPosts
  .filter((p) => p.featured)
  .slice(0, 4)
  .map((p) => ({
    id: `fallback-${p.id}`,
    imageUrl: p.image,
    permalink: CONTACT.instagramUrl,
    caption: p.caption,
  }));

function Skeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="aspect-square rounded-xl bg-gray-200 animate-pulse"
        />
      ))}
    </div>
  );
}

export default function GalleryPreview() {
  const { posts, loading, error } = useInstagramFeed({ limit: 4 });

  const displayPosts = posts.length > 0 ? posts : (error || !loading ? fallbackFeatured : []);

  return (
    <section className="py-16 md:py-24 px-4 max-w-6xl mx-auto">
      <SectionHeading
        title="From Our Community"
        subtitle="Moments from recent meetups and events"
      />

      {loading && posts.length === 0 && !error ? (
        <Skeleton />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12">
          {displayPosts.map((post, i) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
            >
              <a
                href={post.permalink}
                target="_blank"
                rel="noopener noreferrer"
                className="block aspect-square overflow-hidden rounded-xl shadow-md hover:shadow-lg transition-shadow focus:ring-2 focus:ring-primary focus:outline-none"
              >
                <img
                  src={post.imageUrl}
                  alt={post.caption || 'Instagram post'}
                  loading="lazy"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
              </a>
            </motion.div>
          ))}
        </div>
      )}

      <div className="flex justify-center mt-8">
        <a
          href={CONTACT.instagramUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-primary font-bold hover:underline focus:ring-2 focus:ring-primary focus:outline-none rounded"
        >
          <Instagram size={18} />
          See more on Instagram
        </a>
      </div>
    </section>
  );
}
