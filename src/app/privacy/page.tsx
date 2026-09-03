export const metadata = {
  title: 'Privacy Policy — Helvia',
  description: 'How Helvia collects, uses, and protects your data.'
}

export default function PrivacyPolicy() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12 text-gray-100">
      <h1 className="text-3xl font-bold text-white">Privacy Policy</h1>
      <p className="mt-3 text-sm text-gray-400">Last updated: {new Date().toLocaleDateString()}</p>

      <section className="mt-8 space-y-4 text-gray-300">
        <p>
          Helvia respects your privacy. This Privacy Policy explains what information we collect, how we use it,
          and your rights and choices. If you have any questions, contact us at privacy@helvia.ai.
        </p>
        <h2 className="mt-6 text-xl font-semibold text-white">Information we collect</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>Account info (name, email) from sign-in providers</li>
          <li>Usage data to improve product reliability and performance</li>
          <li>Content you choose to upload or connect</li>
        </ul>
        <h2 className="mt-6 text-xl font-semibold text-white">How we use information</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>Provide and improve Helvia features</li>
          <li>Security, fraud prevention, and compliance</li>
          <li>Customer support and product communications</li>
        </ul>
        <h2 className="mt-6 text-xl font-semibold text-white">Sharing</h2>
        <p>
          We do not sell personal data. We may share with service providers under contract, or when required by law.
        </p>
        <h2 className="mt-6 text-xl font-semibold text-white">Your choices</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>Access, export, or delete your data by contacting support</li>
          <li>Manage connected integrations from your account</li>
        </ul>
        <h2 className="mt-6 text-xl font-semibold text-white">Contact</h2>
        <p>privacy@helvia.ai</p>
        <p className="text-sm text-gray-400">Founder: N Yashwanth</p>
      </section>
    </main>
  )
}
