import { useEffect } from 'react'
import Story from '../components/about/Story'
import Values from '../components/about/Values'
import Team from '../components/about/Team'
import Milestones from '../components/about/Milestones'
import WaveDivider from '../components/ui/WaveDivider'

export default function About() {
  useEffect(() => {
    document.title = 'About Us | Greenwich Parents & Carers';
  }, []);

  return (
    <>
      <Story />
      <WaveDivider color="#fffaf5" />
      <div className="bg-warm">
        <Values />
      </div>
      <WaveDivider color="#ffffff" flip />
      <Team />
      <WaveDivider color="#fffaf5" />
      <div className="bg-warm">
        <Milestones />
      </div>
    </>
  )
}
