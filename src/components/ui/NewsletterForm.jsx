const BREVO_URL = 'https://sh1.sendinblue.com/amn2zqxhtxpfe.html?t=1774565443585'

export default function NewsletterForm() {
  return (
    <div className="flex justify-center">
      <a
        href={BREVO_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="px-6 py-3 rounded-full bg-gradient-to-r from-primary to-dark text-white text-sm font-bold hover:scale-105 transition-transform focus:ring-2 focus:ring-primary focus:outline-none text-center"
      >
        Subscribe to Our Newsletter
      </a>
    </div>
  )
}
