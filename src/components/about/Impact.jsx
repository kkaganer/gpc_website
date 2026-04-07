import { motion } from 'framer-motion';
import { Heart, Gift, Megaphone, ExternalLink } from 'lucide-react';
import Button from '../ui/Button';
import { CONTACT } from '../../utils/constants';

const initiatives = [
  {
    icon: Heart,
    title: 'MammaKind',
    description:
      'Our partner baby bank supporting families with essential items for babies and young children. We work closely with MammaKind to collect and distribute donations to families who need them.',
    url: 'https://mammakind.org.uk/',
  },
  {
    icon: Gift,
    title: 'Lewisham Toy Library',
    description:
      'Community toy donations to support families in our wider South East London neighbourhood, giving pre-loved toys a second life.',
    url: 'https://www.lewishamtoylibrary.org.uk/',
  },
  {
    icon: Megaphone,
    title: 'Dadshift Campaign',
    description:
      'Raising awareness for better paternity leave in the UK, because supporting families means supporting all parents from day one.',
    url: 'https://www.dadshift.com/',
  },
];

const joinUrl = `mailto:${CONTACT.email}?subject=${encodeURIComponent('I want to get involved with GPC')}`;

export default function Impact() {
  return (
    <section className="bg-dark py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="font-heading text-3xl md:text-4xl font-bold text-white text-center mb-4">
          Making a difference
        </h2>
        <p className="text-white/70 text-center mb-12">
          Charities we support and campaigns we're proud of
        </p>

        <div className="grid md:grid-cols-3 gap-8">
          {initiatives.map((initiative, i) => {
            const Icon = initiative.icon;
            return (
              <motion.div
                key={initiative.title}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="bg-white/10 rounded-2xl p-8 text-center"
              >
                <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center mx-auto">
                  <Icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-heading text-xl font-bold text-white mt-4">
                  {initiative.title}
                </h3>
                <p className="text-white/70 mt-2">{initiative.description}</p>
                {initiative.url && (
                  <a
                    href={initiative.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-primary text-sm font-semibold hover:underline mt-3"
                  >
                    Visit website <ExternalLink size={14} />
                  </a>
                )}
              </motion.div>
            );
          })}
        </div>

        <div className="text-center mt-12">
          <Button variant="outline" href={joinUrl}>
            Want to get involved? Join our community
          </Button>
        </div>
      </div>
    </section>
  );
}
