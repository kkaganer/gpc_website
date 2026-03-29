import { motion } from 'framer-motion';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import SectionHeading from '../ui/SectionHeading';
import { activities } from '../../data/activities';

export default function Activities() {
  return (
    <section className="py-16 md:py-24 px-4 max-w-6xl mx-auto">
      <SectionHeading
        title="What We Do"
        subtitle="Free activities and resources for local families"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
        {activities.map((activity, i) => {
          const Icon = activity.icon;
          return (
            <motion.div
              key={activity.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
            >
              <Card className="h-full">
                <div className="p-6">
                  <Icon size={40} className="text-primary mb-4" />
                  <h3 className="font-heading font-bold text-lg text-dark mb-2">
                    {activity.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-3">
                    {activity.description}
                  </p>
                  {activity.free && <Badge variant="free">Free</Badge>}
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
