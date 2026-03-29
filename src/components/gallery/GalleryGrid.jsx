import { motion } from 'framer-motion'
import GalleryCard from './GalleryCard'

const container = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

export default function GalleryGrid({ posts }) {
  return (
    <motion.div
      className="columns-1 md:columns-2 lg:columns-3 gap-4"
      variants={container}
      initial="hidden"
      animate="show"
      key={posts.map((p) => p.id).join(',')}
    >
      {posts.map((post, index) => (
        <motion.div
          key={post.id}
          className={`break-inside-avoid mb-4 ${
            index % 3 === 0 ? 'aspect-square' : 'aspect-video'
          }`}
          variants={item}
        >
          <GalleryCard post={post} />
        </motion.div>
      ))}
    </motion.div>
  )
}
