export const metadata = {
  title: 'Refund & Cancellation Policy — Helvia',
  description: 'Our policy regarding cancellations and refunds.'
}

export default function RefundCancellationPolicy() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12 text-gray-100">
      <h1 className="text-3xl font-bold text-white">Refund & Cancellation Policy</h1>
      <p className="mt-3 text-sm text-gray-400">Last updated: {new Date().toLocaleDateString()}</p>

      <section className="mt-8 space-y-5 text-gray-300">
        <div>
          <h2 className="text-xl font-semibold text-white">Cancellations</h2>
          <p className="mt-2">There is no in-app cancellation for current billing periods. You can stop future renewals by not renewing your plan at the end of the term.</p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-white">Refunds</h2>
          <p className="mt-2">If you encounter a critical bug that prevents normal use of Helvia, you may request a refund. Please contact us with details and reproduction steps so we can verify and assist promptly.</p>
          <ul className="list-disc pl-6 mt-3 space-y-2">
            <li>Refunds are considered for functionality-breaking issues.</li>
            <li>We may request logs/screenshots to diagnose the problem.</li>
            <li>Approved refunds are processed back to the original payment method.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-white">Contact</h2>
          <p>support@helvia.ai</p>
        </div>
      </section>
    </main>
  )
}
