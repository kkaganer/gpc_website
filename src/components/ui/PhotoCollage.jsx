import { motion } from 'framer-motion';

const layouts = [
  { top: '0%', left: '5%', rotate: -3, width: '65%', zIndex: 1 },
  { top: '15%', left: '35%', rotate: 2, width: '60%', zIndex: 2 },
  { top: '45%', left: '10%', rotate: -1.5, width: '55%', zIndex: 3 },
];

export default function PhotoCollage({ images = [], className = '' }) {
  const visible = images.slice(0, 3);

  return (
    <div className={`relative aspect-square ${className}`}>
      {visible.map((src, i) => {
        const pos = layouts[i];
        return (
          <motion.img
            key={src}
            src={src}
            alt=""
            initial={{ opacity: 0, rotate: pos.rotate - 4 }}
            whileInView={{ opacity: 1, rotate: pos.rotate }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.5, delay: i * 0.15 }}
            className="absolute rounded-2xl shadow-lg object-cover aspect-[4/3]"
            style={{
              top: pos.top,
              left: pos.left,
              width: pos.width,
              zIndex: pos.zIndex,
            }}
            loading="lazy"
          />
        );
      })}
    </div>
  );
}
