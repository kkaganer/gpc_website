import { motion } from 'framer-motion';
import { Heart, Sparkles, Link } from 'lucide-react';

const values = [
  {
    icon: Heart,
    title: 'Inclusivity',
    description:
      'We welcome all parents, carers, and families, no matter your background, family structure, or circumstances. Everyone belongs here.',
    image: '/images/about-community-1.jpg',
  },
  {
    icon: Sparkles,
    title: 'Kindness',
    description:
      'We lead with warmth and empathy. Our community is a judgement-free zone where parents support each other through the ups and downs.',
    image: '/images/about-community-2.jpg',
  },
  {
    icon: Link,
    title: 'Connection',
    description:
      'We bring people together. From meetups to WhatsApp groups, we create spaces where lasting friendships are formed.',
    image: '/images/about-community-3.jpg',
  },
];

export default function Values() {
  return (
    <section className="bg-warm py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="font-heading text-3xl md:text-4xl font-bold text-dark text-center mb-4">
          What we believe
        </h2>
        <p className="text-gray-600 text-center mb-12">
          Everything we do is guided by three core principles
        </p>

        <div className="space-y-16 md:space-y-24">
          {values.map((value, i) => {
            const Icon = value.icon;
            const imageFirst = i % 2 === 0;

            return (
              <motion.div
                key={value.title}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.5 }}
                className="grid md:grid-cols-5 gap-8 md:gap-12 items-center"
              >
                <div
                  className={`md:col-span-3 ${imageFirst ? '' : 'md:order-2'}`}
                >
                  <img
                    src={value.image}
                    alt={value.title}
                    className="rounded-2xl w-full object-cover aspect-[3/2]"
                    loading="lazy"
                  />
                </div>
                <div
                  className={`md:col-span-2 ${imageFirst ? '' : 'md:order-1'}`}
                >
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-heading text-2xl font-bold text-dark">
                    {value.title}
                  </h3>
                  <p className="text-gray-600 mt-3 leading-relaxed">
                    {value.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
