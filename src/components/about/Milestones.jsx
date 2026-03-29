import { motion } from 'framer-motion'
import SectionHeading from '../ui/SectionHeading'

const milestones = [
  {
    year: '2021',
    title: 'GPC Founded',
    description:
      'Aster Thackery starts Greenwich Parents & Carers during COVID, bringing isolated parents together through park meetups.',
  },
  {
    year: '2024',
    title: 'Became a CIC',
    description:
      'GPC officially registered as a Community Interest Company (No. 16387545), formalising our commitment to the community.',
  },
  {
    year: '2024',
    title: 'First Summer Fair',
    description:
      'Our inaugural Summer Fair brought hundreds of families together with stalls, activities, and live entertainment.',
  },
  {
    year: '2025',
    title: '1,800+ Members',
    description:
      'Our community continues to grow, with a sold-out Christmas Fair and plans for even bigger events ahead.',
  },
]

export default function Milestones() {
  return (
    <section className="py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          title="Our Journey"
          subtitle="Key milestones along the way"
        />

        <div className="relative mt-12">
          {/* Vertical line */}
          <div className="absolute left-6 md:left-1/2 md:-translate-x-px top-0 bottom-0 w-0.5 bg-pink-200" />

          <div className="space-y-12">
            {milestones.map((milestone, index) => {
              const isLeft = index % 2 === 0

              return (
                <motion.div
                  key={`${milestone.year}-${milestone.title}`}
                  className="relative"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  {/* Dot on the line */}
                  <div className="absolute left-6 md:left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-primary border-4 border-pink-100 z-10 top-1" />

                  {/* Content */}
                  <div
                    className={`ml-14 md:ml-0 md:w-[calc(50%-2rem)] ${
                      isLeft
                        ? 'md:mr-auto md:pr-8'
                        : 'md:ml-auto md:pl-8'
                    }`}
                  >
                    <span className="inline-block rounded-full bg-primary text-white px-4 py-1 font-bold text-sm">
                      {milestone.year}
                    </span>
                    <h3 className="font-heading font-bold text-lg mt-2">
                      {milestone.title}
                    </h3>
                    <p className="text-gray-600 mt-1">
                      {milestone.description}
                    </p>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
