import type { DestinationContent } from './destination-types'
import { NAP } from '@/lib/seo/site'

export const suratLocalPage: DestinationContent = {
  path: '/visa-consultants-in-surat',
  kind: 'local',
  serviceType: 'Visa consultancy',
  eyebrow: 'Local visa consultants · Surat',
  h1: 'Visa Consultants in Surat — Study & Work Abroad',
  title: 'Best Visa Consultants in Surat | Study, Work & Immigration',
  description:
    'Trusted visa consultants in Surat for study visas and work visas to Canada, UK, Australia, USA, Germany and Japan. Visit our Pragti IT Park office or book a free consultation.',
  keywords:
    'visa consultants in Surat, best visa consultant in Surat, visa agents in Surat, immigration consultant in Surat, study visa consultant in Surat, student visa consultant in Surat, work visa consultant in Surat, Europe visa consultant in Surat, study abroad consultants Surat, overseas education consultants Surat, Siddhivinayak Overseas Surat',
  heroDescription:
    `Meet counsellors at ${NAP.streetAddress}, Surat. We help students and professionals with honest eligibility checks, documentation and visa filing support.`,
  breadcrumbs: [
    { label: 'Home', to: '/' },
    { label: 'Visa Consultants in Surat' },
  ],
  highlights: [
    { title: 'Surat office', desc: 'Counselling at Pragti IT Park, Kiran Chowk–Yogi Chowk Road.' },
    { title: 'Study + work', desc: 'One team for student visas and overseas work pathways.' },
    { title: 'Document rigor', desc: 'Checklists that reduce avoidable refusals.' },
    { title: 'Clear communication', desc: 'WhatsApp + phone updates in Gujarati, Hindi or English.' },
  ],
  sections: [
    {
      heading: 'Looking for visa consultants in Surat?',
      body: [
        'If you are searching for study visa consultants or work visa consultants in Surat, you usually need three things: an honest profile assessment, a country/course strategy that matches your budget, and documentation support that survives embassy scrutiny.',
        `Siddhivinayak Overseas operates from ${NAP.fullAddress}. Call ${NAP.phoneINDisplay} or WhatsApp us to book a free counselling slot.`,
      ],
      bullets: [
        'Study visas: Canada, UK, Australia, USA, Germany, Ireland, New Zealand',
        'Work visas: Japan SSW, Germany, Canada, UK, Australia pathways',
        'SOP / GS / interview preparation',
        'End-to-end file tracking until a decision',
      ],
    },
    {
      heading: 'Study abroad consultants in Surat for every major destination',
      body: [
        'As study abroad consultants in Surat we counsel for Canada, the UK, Australia, the USA, Germany, Ireland and New Zealand. Canada remains the most common first question we get, so if you are looking for a Canada visa consultant in Surat, start with an honest eligibility check rather than an application.',
        'We also handle the step most agencies skip: what happens when a study visa ends. If you are already abroad and your course is finishing, we map the post-study work routes for that country.',
      ],
    },
    {
      heading: 'Why local Surat counselling helps',
      body: [
        'Online forms are easy. Choosing the wrong country, underfunding a visa, or submitting inconsistent documents is expensive. In-person or video counselling from a Surat team that understands Gujarat academic patterns (gaps, backlogs, medium of instruction, sponsor structures) helps you avoid generic advice.',
      ],
    },
    {
      heading: 'Our process',
      body: [
        'We start with eligibility, not sales. If a destination is a poor fit, we say so. If you are ready, we build a step-by-step plan covering admissions or employer pathway readiness, finances, language tests and visa documentation.',
      ],
    },
  ],
  processSteps: [
    { title: 'Free consult', desc: 'Share academics, budget and target country.' },
    { title: 'Strategy', desc: 'Study vs work vs pathway plan with timelines.' },
    { title: 'Execution', desc: 'Applications, SOPs and document quality control.' },
    { title: 'Visa stage', desc: 'Forms, biometrics and decision follow-up.' },
  ],
  faqs: [
    {
      question: 'Where is Siddhivinayak Overseas located in Surat?',
      answer: `We are at ${NAP.fullAddress}. Please call before visiting so a counsellor is available.`,
    },
    {
      question: 'Which landmark is your Surat office near?',
      answer: `We are on the Kiran Chowk to Yogi Chowk Road in Pragti IT Park, Surat. If you are coming from Yogi Chowk, we are a short distance along that road. Call ${NAP.phoneINDisplay} and we will guide you in.`,
    },
    {
      question: 'Do you help with both study and work visas?',
      answer:
        'Yes. Many families start with study counselling; working professionals explore Japan, Germany, UK, Canada or Australia work routes based on eligibility.',
    },
    {
      question: 'How do I book a consultation?',
      answer: `Call ${NAP.phoneINDisplay}, WhatsApp on the same number, email ${NAP.email}, or use the contact form on this website.`,
    },
  ],
  related: [
    { label: 'Study Visa', to: '/study-visa' },
    { label: 'Work Visa', to: '/work-visa' },
    { label: 'Study in Canada', to: '/study-in-canada' },
    { label: 'Japan Work Visa', to: '/work-visa/japan' },
    { label: 'Success Stories', to: '/success-stories' },
    { label: 'Contact', to: '/contact' },
  ],
}
