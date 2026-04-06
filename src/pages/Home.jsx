import { useEffect } from 'react';
import NewsletterBanner from '../components/home/NewsletterBanner';
import Hero from '../components/home/Hero';
import WhatHappensHere from '../components/home/WhatHappensHere';
import PullQuote from '../components/ui/PullQuote';
import FindYourPeople from '../components/home/FindYourPeople';
import Newsletter from '../components/home/Newsletter';
import { testimonials } from '../data/testimonials';

export default function Home() {
  useEffect(() => {
    document.title = 'Greenwich Parents & Carers | Community for Local Families';
  }, []);

  const quote = testimonials[0];

  return (
    <>
      <NewsletterBanner />
      <Hero />
      <WhatHappensHere />
      <PullQuote quote={quote.quote} name={quote.name} role={quote.role} />
      <FindYourPeople />
      <Newsletter />
    </>
  );
}
