import { motion } from 'framer-motion';
import { team } from '../../data/team';

export default function Team() {
  return (
    <section className="py-16 md:py-24">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="font-heading text-3xl md:text-4xl font-bold text-dark text-center mb-4">
          The humans behind GPC
        </h2>
        <p className="text-gray-600 text-center mb-12">
          Meet some of the volunteers who keep things running
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {team.map((member, i) => (
            <motion.div
              key={member.name}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="text-center"
            >
              <img
                src={member.photo}
                alt={member.name}
                className="w-28 h-28 md:w-32 md:h-32 rounded-full mx-auto object-cover shadow-md"
                loading="lazy"
              />
              <h3 className="font-heading font-semibold text-dark mt-4">
                {member.name}
              </h3>
              <p className="text-gray-500 text-sm">{member.role}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
