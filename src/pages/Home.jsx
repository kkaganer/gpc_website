import { useEffect } from 'react';
import NewsletterBanner from '../components/home/NewsletterBanner';
import Hero from '../components/home/Hero';
import UpcomingEvents from '../components/home/UpcomingEvents';
import Activities from '../components/home/Activities';
import Stats from '../components/home/Stats';
import Newsletter from '../components/home/Newsletter';
import WaveDivider from '../components/ui/WaveDivider';

export default function Home() {
  useEffect(() => {
    document.title = 'Greenwich Parents & Carers | Community for Local Families';
  }, []);

  return (
    <>
      <NewsletterBanner />
      <Hero />
      <WaveDivider color="white" />
      <UpcomingEvents />
      <WaveDivider color="#fffaf5" />
      <Activities />
      <Stats />
      <WaveDivider color="#fffbeb" />
      <Newsletter />
    </>
  );
}
