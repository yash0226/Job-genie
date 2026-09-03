export const metadata = {
  title: 'Terms of Service — Helvia',
  description: 'The terms that govern your use of Helvia.'
}

export default function TermsOfService() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12 text-gray-100">
      <h1 className="text-3xl font-bold text-white">Terms of Service</h1>
      <p className="mt-3 text-sm text-gray-400">Last updated: {new Date().toLocaleDateString()}</p>

      <section className="mt-8 space-y-4 text-gray-300">
        <p>
          These Terms of Service ("Terms") govern your access to and use of Helvia. By using Helvia,
          you agree to be bound by these Terms.
        </p>
        <h2 className="mt-6 text-xl font-semibold text-white">Use of Service</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>You must comply with all applicable laws and regulations.</li>
          <li>Do not misuse, interfere with, or disrupt the Service.</li>
          <li>You are responsible for maintaining the confidentiality of your account.</li>
        </ul>
        <h2 className="mt-6 text-xl font-semibold text-white">Content</h2>
        <p>
          You retain ownership of your content. You grant Helvia the rights necessary to provide the Service.
          Do not upload or share content you do not have rights to.
        </p>
        <h2 className="mt-6 text-xl font-semibold text-white">Disclaimers</h2>
        <p>
          The Service is provided "as is" without warranties of any kind. To the maximum extent permitted by law,
          Helvia disclaims all warranties and liability.
        </p>
        <h2 className="mt-6 text-xl font-semibold text-white">Termination</h2>
        <p>
          We may suspend or terminate access if these Terms are violated or for operational/security reasons.
        </p>
        <h2 className="mt-6 text-xl font-semibold text-white">Contact</h2>
        <p>legal@helvia.ai</p>
        <p className="text-sm text-gray-400">Founder: N Yashwanth</p>
      </section>
    </main>
  )
}
