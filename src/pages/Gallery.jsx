import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Instagram } from 'lucide-react';
import Button from '../components/ui/Button';
import { useInstagramFeed } from '../hooks/useInstagramFeed';
import { galleryPosts } from '../data/galleryPosts';
import { CONTACT } from '../utils/constants';

const fallbackPosts = galleryPosts.map((p) => ({
  id: `fallback-${p.id}`,
  imageUrl: p.image,
  permalink: CONTACT.instagramUrl,
  caption: p.caption,
}));

const mosaicImages = [
  '/images/about-community-2.jpg',
  '/images/easter-egg-hunt.jpg',
  '/images/community-iwd.jpg',
  '/images/summerfair.jpg',
  '/images/about-community-3.jpg',
];

function Skeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
      {Array.from({ length: 9 }).map((_, i) => (
        <div
          key={i}
          className="aspect-square rounded-xl bg-gray-200 animate-pulse"
        />
      ))}
    </div>
  );
}

export default function Gallery() {
  useEffect(() => {
    document.title = 'Gallery | Greenwich Parents & Carers';
  }, []);

  const { posts, loading, error } = useInstagramFeed();
  const displayPosts = posts.length > 0 ? posts : (error || !loading ? fallbackPosts : []);

  return (
    <>
      {/* Mosaic Hero */}
      <section className="relative h-[50vh] md:h-[60vh]">
        <div className="grid grid-cols-4 grid-rows-2 gap-2 h-full">
          <div className="col-span-2 row-span-2 overflow-hidden">
            <img
              src={mosaicImages[0]}
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
          <div className="col-span-1 row-span-1 overflow-hidden">
            <img
              src={mosaicImages[1]}
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
          <div className="col-span-1 row-span-1 overflow-hidden">
            <img
              src={mosaicImages[2]}
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
          <div className="col-span-2 row-span-1 overflow-hidden">
            <img
              src={mosaicImages[3]}
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-dark/70 to-transparent pt-20 pb-6 px-4">
          <div className="max-w-6xl mx-auto">
            <h1 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold text-white">
              Our community in action
            </h1>
          </div>
        </div>
      </section>

      {/* Instagram Grid */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        {loading && posts.length === 0 && !error ? (
          <Skeleton />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {displayPosts.map((post, i) => {
              const isWide = (i + 1) % 5 === 0;
              return (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true, margin: '-30px' }}
                  transition={{ duration: 0.3, delay: Math.min(i * 0.04, 0.3) }}
                  className={isWide ? 'md:col-span-2' : ''}
                >
                  <a
                    href={post.permalink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group block aspect-square overflow-hidden rounded-xl shadow-md hover:shadow-lg transition-shadow focus:ring-2 focus:ring-primary focus:outline-none relative"
                  >
                    <img
                      src={post.imageUrl}
                      alt={post.caption || 'Instagram post'}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {post.caption && (
                      <div className="absolute inset-0 bg-dark/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                        <p className="text-white text-sm line-clamp-3">{post.caption}</p>
                      </div>
                    )}
                  </a>
                </motion.div>
              );
            })}
          </div>
        )}
      </section>

      {/* Be Part of It CTA */}
      <section className="bg-warm py-16 px-4">
        <div className="max-w-3xl mx-auto flex flex-col md:flex-row items-center gap-8">
          <div className="text-center md:text-left flex-1">
            <h2 className="font-heading text-2xl md:text-3xl font-bold text-dark">
              Want to be part of these moments?
            </h2>
            <div className="flex flex-wrap gap-3 mt-6 justify-center md:justify-start">
              <Button variant="secondary" href={CONTACT.instagramUrl}>
                <Instagram className="w-5 h-5 mr-2" />
                Follow on Instagram
              </Button>
              <Button href="mailto:gpc.communitynews@gmail.com?subject=Join%20the%20GPC%20WhatsApp%20community">
                Join the Community
              </Button>
            </div>
          </div>
          <img
            src="/images/about-community-1.jpg"
            alt=""
            className="w-48 h-48 rounded-2xl object-cover shadow-lg hidden md:block"
            loading="lazy"
          />
        </div>
      </section>
    </>
  );
}
