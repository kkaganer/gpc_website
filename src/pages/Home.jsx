import { useEffect } from 'react';
import NewsletterBanner from '../components/home/NewsletterBanner';
import Hero from '../components/home/Hero';
import WhatHappensHere from '../components/home/WhatHappensHere';
import Testimonials from '../components/home/Testimonials';
import FindYourPeople from '../components/home/FindYourPeople';
import Newsletter from '../components/home/Newsletter';

export default function Home() {
  useEffect(() => {
    document.title = 'Greenwich Parents & Carers | Community for Local Families';
  }, []);

  return (
    <>
      <NewsletterBanner />
      <Hero />
      <WhatHappensHere />
      <Testimonials />
      <FindYourPeople />
      <Newsletter />
    </>
  );
}
