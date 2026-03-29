import { motion } from 'framer-motion'

export default function GalleryCard({ post }) {
  return (
    <motion.a
      href={post.instagramUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-2xl overflow-hidden cursor-pointer relative group focus:ring-2 focus:ring-primary focus:outline-none"
      whileHover="hover"
      initial="rest"
      animate="rest"
    >
      <img
        src={post.image}
        alt={post.caption}
        className="w-full h-full object-cover"
        loading="lazy"
      />
      <motion.div
        className="absolute inset-0 bg-dark/60 flex items-center justify-center p-4"
        variants={{
          rest: { opacity: 0 },
          hover: { opacity: 1 },
        }}
        transition={{ duration: 0.3 }}
      >
        <p className="text-white text-center font-semibold text-sm md:text-base">
          {post.caption}
        </p>
      </motion.div>
    </motion.a>
  )
}
