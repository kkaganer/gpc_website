import { motion } from 'framer-motion'
import { Heart, Sparkles, Link } from 'lucide-react'
import SectionHeading from '../ui/SectionHeading'
import Card from '../ui/Card'

const values = [
  {
    icon: Heart,
    title: 'Inclusivity',
    description:
      'We welcome all parents, carers, and families — no matter your background, family structure, or circumstances. Everyone belongs here.',
  },
  {
    icon: Sparkles,
    title: 'Kindness',
    description:
      'We lead with warmth and empathy. Our community is a judgement-free zone where parents support each other through the ups and downs.',
  },
  {
    icon: Link,
    title: 'Connection',
    description:
      'We bring people together. From meetups to WhatsApp groups, we create spaces where lasting friendships are formed.',
  },
]

const container = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.15,
    },
  },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
}

export default function Values() {
  return (
    <section className="py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          title="Our Values"
          subtitle="Everything we do is guided by three core principles"
        />

        <motion.div
          className="grid md:grid-cols-3 gap-8 mt-12"
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
        >
          {values.map((value) => (
            <motion.div key={value.title} variants={item}>
              <Card className="p-8 text-center h-full">
                <div className="w-16 h-16 rounded-full bg-pink-100 flex items-center justify-center mx-auto">
                  <value.icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-heading text-xl font-bold mt-4">
                  {value.title}
                </h3>
                <p className="text-gray-600 mt-2">{value.description}</p>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
