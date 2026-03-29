import { useState, useEffect } from 'react'
import { Instagram } from 'lucide-react'
import Button from '../components/ui/Button'
import GalleryFilter from '../components/gallery/GalleryFilter'
import GalleryGrid from '../components/gallery/GalleryGrid'
import { galleryPosts } from '../data/galleryPosts'
import { CONTACT } from '../utils/constants'

const categories = ['All', 'Events', 'Meetups', 'Community']

export default function Gallery() {
  useEffect(() => {
    document.title = 'Gallery | Greenwich Parents & Carers';
  }, []);

  const [activeCategory, setActiveCategory] = useState('All')

  const filteredPosts =
    activeCategory === 'All'
      ? galleryPosts
      : galleryPosts.filter((post) => post.category === activeCategory)

  return (
    <>
      {/* Hero Banner */}
      <section className="bg-gradient-to-r from-primary to-dark py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="font-heading text-4xl md:text-5xl font-bold text-white mb-4">
            Our Community in Action
          </h1>
          <p className="text-white/80 text-lg mb-8">
            Moments captured from our events, meetups, and community gatherings
          </p>
          <Button variant="outline" href={CONTACT.instagramUrl}>
            <Instagram className="w-5 h-5 mr-2" />
            Follow {CONTACT.instagram}
          </Button>
        </div>
      </section>

      {/* Filter & Grid */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="mb-10">
          <GalleryFilter
            categories={categories}
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
          />
        </div>

        <GalleryGrid posts={filteredPosts} />
      </section>

      {/* Newsletter CTA */}
      <section className="bg-gradient-to-r from-primary to-dark py-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-white mb-4">
            Want to be part of these moments?
          </h2>
          <Button variant="outline" href="/#newsletter">
            Join Our Community
          </Button>
        </div>
      </section>
    </>
  )
}
