import { motion } from 'framer-motion'
import SectionHeading from '../ui/SectionHeading'

const milestones = [
  {
    year: 'July 2021',
    title: 'GPC Founded',
    description:
      'Aster starts Greenwich Parents & Carers during COVID, bringing isolated parents together through coffee meetups at Davy\'s in Greenwich.',
  },
  {
    year: 'July 2024',
    title: 'First Summer Fair',
    description:
      'Our inaugural Summer Fair brings hundreds of families together with stalls, activities, and live entertainment.',
  },
  {
    year: 'Nov 2024',
    title: 'Weekly What\'s On Guide',
    description:
      'Free weekly newsletter launched, now reaching 500+ subscribers with local events and family-friendly recommendations.',
  },
  {
    year: 'Feb 2025',
    title: 'Mums in Business Launched',
    description:
      'Monthly networking meetups for local working mums, led by Andrea. Building connections between parents balancing business and family.',
  },
  {
    year: 'Apr 2025',
    title: 'Became a CIC',
    description:
      'GPC officially registered as a Community Interest Company (No. 16387545), formalising our commitment to the community.',
  },
  {
    year: 'Dec 2025',
    title: 'First Christmas Fair',
    description:
      'Our sold-out Christmas Fair at Greenwich West Community & Arts Centre welcomes 300+ families for a festive celebration.',
  },
  {
    year: '2026',
    title: '1,800+ Members',
    description:
      'Our community continues to grow, with 20 volunteer admins and plans for even bigger things ahead.',
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
          <div className="absolute left-6 md:left-1/2 md:-translate-x-px top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary to-dark" />

          <div className="space-y-12">
            {milestones.map((milestone, index) => {
              const isLeft = index % 2 === 0

              return (
                <motion.div
                  key={`${milestone.year}-${milestone.title}`}
                  className="relative"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
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
                    <span className="inline-block rounded-full bg-primary/10 text-primary px-4 py-1 font-bold text-sm">
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
