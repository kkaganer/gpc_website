import { motion } from 'framer-motion'
import SectionHeading from '../ui/SectionHeading'

export default function Story() {
  return (
    <section className="py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="text-left">
              <h2 className="font-heading text-3xl md:text-4xl font-bold text-dark">
                Our Story
              </h2>
              <div className="w-16 h-1 bg-primary mt-4 rounded-full" />
            </div>

            <p className="text-gray-700 leading-relaxed mt-6">
              Greenwich Parents &amp; Carers was born in 2021, during the COVID-19
              pandemic. Founder Aster Thackery, a new parent in Greenwich, saw how
              isolated many local families had become and decided to do something
              about it.
            </p>

            <p className="text-gray-700 leading-relaxed mt-4">
              What started as small, informal meetups in local parks quickly grew
              into something much bigger. Parents were hungry for connection,
              friendship, and a sense of community.
            </p>

            <p className="text-gray-700 leading-relaxed mt-4">
              Today, GPC has grown to over 1,800 members and became a Community
              Interest Company in 2024. We run seasonal fairs, regular meetups, a
              weekly newsletter, and an active WhatsApp community — all powered by
              volunteers who believe in making Greenwich a better place for
              families.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <img
              src="/images/about-community-2.jpg"
              alt="Greenwich Parents and Carers community gathering celebrating International Women's Day"
              className="rounded-2xl w-full"
              loading="lazy"
            />
          </motion.div>
        </div>
      </div>
    </section>
  )
}
