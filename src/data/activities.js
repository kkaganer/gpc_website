import { Baby, Users, Mail, MessageCircle, PartyPopper, Heart } from 'lucide-react';

export const activities = [
  {
    title: 'Parent & Baby Meetups',
    description: 'Regular meet-ups for parents and babies at local cafes and parks. A great way to make new friends in the area.',
    icon: Baby,
    free: true,
  },
  {
    title: 'Community Events',
    description: 'Seasonal fairs, egg hunts, and social gatherings that bring families together throughout the year.',
    icon: PartyPopper,
    free: false,
  },
  {
    title: 'Networking',
    description: 'Connect with other local parents, share recommendations, and build your support network.',
    icon: Users,
    free: true,
  },
  {
    title: 'Weekly Newsletter',
    description: 'Stay in the loop with our weekly newsletter covering local events, activities, and family-friendly recommendations.',
    icon: Mail,
    free: true,
  },
  {
    title: 'WhatsApp Community',
    description: 'Join our active WhatsApp community group to chat with other parents, ask questions, and share tips.',
    icon: MessageCircle,
    free: true,
  },
  {
    title: 'Wellbeing Support',
    description: 'Resources and connections for parental wellbeing, because looking after yourself matters too.',
    icon: Heart,
    free: true,
  },
];
