import { useState } from 'react'
import { motion } from 'framer-motion'
import { MessageCircle } from 'lucide-react'
import { communities } from '../data/communities'
import { ORG } from '../utils/constants'
import JoinCommunityModal from '../components/home/JoinCommunityModal'

function Pill({ name, description, i }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(i * 0.04, 0.4) }}
      className="group relative flex items-center gap-2 bg-white rounded-full border border-gray-200 shadow-sm px-4 py-2 text-sm text-dark"
    >
      <MessageCircle size={16} className="text-primary shrink-0" />
      <span>{name}</span>
      {description && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-dark text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap max-w-xs truncate">
          {description}
        </span>
      )}
    </motion.div>
  )
}

export default function JoinTest() {
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <>
      <div className="min-h-screen bg-warm">
        {/* Hero */}
        <section className="bg-dark text-white py-20 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="font-heading text-4xl md:text-5xl font-bold mb-4">
              Join {ORG.memberCount} parents in Greenwich
            </h1>
            <p className="text-white/70 text-lg max-w-xl mx-auto">
              Our WhatsApp community is where local parents chat, share recommendations, and support each other every day.
            </p>
          </div>
        </section>

        {/* How it works */}
        <section className="py-16 px-4 max-w-3xl mx-auto">
          <h2 className="font-heading text-2xl font-bold text-dark text-center mb-10">
            How joining works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { step: '1', title: 'Tell us about you', desc: 'Fill in a quick form so we know which groups suit you.' },
              { step: '2', title: 'We review', desc: 'A volunteer admin checks your request — usually within 24 hours.' },
              { step: '3', title: 'You\'re in!', desc: 'We send you the invite link to join the WhatsApp community.' },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-10 h-10 rounded-full bg-primary text-white font-bold flex items-center justify-center mx-auto mb-3">
                  {item.step}
                </div>
                <h3 className="font-heading font-semibold text-dark mb-1">{item.title}</h3>
                <p className="text-gray-500 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Community groups */}
        <section className="py-16 px-4 bg-white">
          <div className="max-w-4xl mx-auto">
            <h2 className="font-heading text-2xl font-bold text-dark text-center mb-3">
              Our communities
            </h2>
            <p className="text-gray-500 text-center mb-10 max-w-xl mx-auto">
              Choose the groups that are right for you — from local recommendations to baby groups by school year.
            </p>

            <div className="flex flex-wrap justify-center gap-3">
              {communities.general.map((c, i) => (
                <Pill key={c.key} name={c.name} description={c.description} i={i} />
              ))}
            </div>

            <div className="mt-8">
              <h3 className="text-center font-heading font-semibold text-dark text-lg mb-4">
                Baby groups by school year
              </h3>
              <div className="flex flex-wrap justify-center gap-3">
                {communities.schoolYear.map((c, i) => (
                  <Pill key={c.key} name={c.name} i={i} />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Join CTA */}
        <section className="py-16 px-4">
          <div className="max-w-md mx-auto text-center">
            <button
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-bold rounded-full bg-gradient-to-r from-primary to-dark text-white hover:scale-105 transition-transform focus:ring-2 focus:ring-primary focus:outline-none"
            >
              <MessageCircle size={20} />
              Join our WhatsApp community
            </button>
            <p className="text-gray-400 text-xs mt-4">
              We review all requests to keep our community safe for families.
            </p>
          </div>
        </section>
      </div>

      {modalOpen && <JoinCommunityModal onClose={() => setModalOpen(false)} />}
    </>
  )
}
