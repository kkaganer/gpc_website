import { useEffect } from 'react';
import Story from '../components/about/Story';
import Milestones from '../components/about/Milestones';
import Values from '../components/about/Values';
import Impact from '../components/about/Impact';

export default function About() {
  useEffect(() => {
    document.title = 'About Us | Greenwich Parents & Carers';
  }, []);

  return (
    <>
      <Story />
      <Milestones />
      <Values />
      <Impact />
    </>
  );
}
