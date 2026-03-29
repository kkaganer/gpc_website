import { motion } from 'framer-motion'
import SectionHeading from '../ui/SectionHeading'
import Card from '../ui/Card'
import { team } from '../../data/team'

const container = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.12,
    },
  },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
}

export default function Team() {
  return (
    <section className="py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          title="Meet the Team"
          subtitle="The volunteers behind GPC"
        />

        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mt-12"
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
        >
          {team.map((member) => (
            <motion.div key={member.name} variants={item}>
              <Card className="p-6 text-center h-full">
                <img
                  src={member.image}
                  alt={`Photo of ${member.name}, ${member.role}`}
                  className="w-32 h-32 rounded-full mx-auto object-cover border-4 border-pink-200"
                  loading="lazy"
                />
                <h3 className="font-heading font-bold text-lg mt-4">
                  {member.name}
                </h3>
                <p className="text-primary text-sm font-semibold">
                  {member.role}
                </p>
                <p className="text-gray-600 text-sm mt-2">{member.bio}</p>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
