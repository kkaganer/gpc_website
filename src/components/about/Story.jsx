import { motion } from 'framer-motion';

export default function Story() {
  return (
    <section className="relative min-h-[60vh] flex items-center">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: 'url(/images/about-community-1.jpg)' }}
      />
      <div className="absolute inset-0 bg-warm/85" />

      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 py-20">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="font-heading text-3xl md:text-5xl font-bold text-dark">
            It started with coffee
          </h1>
          <div className="w-16 h-1 bg-primary mt-4 rounded-full" />

          <p className="text-gray-700 leading-relaxed mt-8 text-lg">
            Greenwich Parents &amp; Carers was born in July 2021, during the COVID-19
            pandemic. Aster, a new parent in Greenwich, saw how isolated local
            families had become and decided to do something about it, starting
            with simple coffee meetups at Davy's in Greenwich.
          </p>

          <p className="text-gray-700 leading-relaxed mt-4 text-lg">
            Those early conversations over coffee quickly grew into something
            much bigger. Meetups moved to Greenwich Park, the Maritime Museum,
            and local cafes as more parents joined. What everyone had in common
            was a hunger for connection, friendship, and a real sense of
            community.
          </p>

          <p className="text-gray-700 leading-relaxed mt-4 text-lg">
            Today, GPC is a thriving WhatsApp community of over 1,800 members,
            supported by 20 volunteer admins. We run weekly meetups, seasonal
            fairs, Mums in Business networking events, a free weekly What's On
            guide, and WhatsApp groups covering everything from baby groups by
            school year to local recommendations, dads' meetups, and SEND
            support. All run by local parents and carers, for local families.
          </p>

          {/* Founder */}
          <div className="flex items-center gap-3 mt-8">
            <img
              src="/images/aster.jpg"
              alt="Aster"
              className="w-12 h-12 rounded-full object-cover"
              loading="lazy"
            />
            <div>
              <p className="font-heading font-semibold text-dark">Aster</p>
              <p className="text-gray-500 text-sm">Founder</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
