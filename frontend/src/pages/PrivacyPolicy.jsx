import React from 'react'
import Title from '../components/Title'
import NewsletterBox from '../components/NewsletterBox'

const PrivacyPolicy = () => {
  return (
    <div className='ml-4 mr-4'>

      {/* Page Header */}
      <div className='text-2xl text-center pt-8 border-t'>
        <Title text1={'PRIVACY'} text2={'POLICY'} />
      </div>

      {/* Privacy Policy Content */}
      <div className='my-10 flex flex-col gap-6 text-gray-600'>
        <h2 className='text-xl font-semibold'>Introduction</h2>
        <p>
          At Yes Fashion, we respect your privacy and are committed to protecting the personal information you share with us.
          This Privacy Policy explains how we collect, use, and safeguard your data when you browse our site or place an order.
        </p>

        <h2 className='text-xl font-semibold'>Information We Collect</h2>
        <p>
          <strong>Personal Data:</strong> When you register, shop, or contact us, we may collect your name, email, shipping address, phone number, and payment details.
        </p>
        <p>
          <strong>Usage Data:</strong> We automatically gather non‑personal info—like IP address, browser type, pages visited, and time spent—with cookies and similar tech to improve your experience.
        </p>

        <h2 className='text-xl font-semibold'>How We Use Your Data</h2>
        <p>
          <strong>Order Fulfillment:</strong> We use your info to process orders, arrange delivery, and send updates.
        </p>
        <p>
          <strong>Account Management:</strong> If you create an account, we store your data so you can track past orders, save addresses, and checkout faster.
        </p>
        <p>
          <strong>Marketing:</strong> With your consent, we’ll send you style drops, sale alerts, and news. You can opt‑out anytime via the link in our emails.
        </p>
        <p>
          <strong>Site Improvement:</strong> Usage data helps us spot bugs, optimize performance, and tailor content.
        </p>

        <h2 className='text-xl font-semibold'>Cookies &amp; Tracking</h2>
        <p>
          We use cookies and web beacons to remember your preferences and show relevant content. You can disable cookies in your browser, but some features may not work as intended.
        </p>

        <h2 className='text-xl font-semibold'>Third‑Party Services</h2>
        <p>
          We partner with trusted providers (payment gateways, shipping couriers, email platforms) who have access only to the data needed to perform their services. They may not use it for other purposes.
        </p>
        <p>
          We also use Google Analytics for aggregated, non‑personal insights. For details, see Google’s Privacy Policy.
        </p>

        <h2 className='text-xl font-semibold'>Data Security</h2>
        <p>
          We implement SSL encryption and best practices to protect your data. While we strive for strong security, no system is 100% foolproof. In case of a breach, we will notify you and relevant authorities as required.
        </p>

        <h2 className='text-xl font-semibold'>Children’s Privacy</h2>
        <p>
          Our site is intended for ages 14+. We do not knowingly collect data from minors. If you believe we’ve received such info, please let us know so we can delete it.
        </p>

        <h2 className='text-xl font-semibold'>Your Rights</h2>
        <p>
          You can access, update, or delete your personal data any time by logging into your account or emailing{' '}
          <a href="mailto:yesfashion25@gmail.com" className='text-blue-600 underline'>
            yesfashion25@gmail.com
          </a>
          . You can also opt‑out of marketing emails at any time.
        </p>

        <h2 className='text-xl font-semibold'>Policy Updates</h2>
        <p>
          We may update this policy from time to time. The latest version will always be posted here with a “Last Updated” date.
        </p>

        <h2 className='text-xl font-semibold'>Contact Us</h2>
        <p>
          If you have questions or concerns about our Privacy Policy, email us at{' '}
          <a href="mailto:yesfashion25@gmail.com" className='text-blue-600 underline'>
            yesfashion25@gmail.com
          </a>{' '}
          or call +91 6386242220 / 9670117381.
        </p>
      </div>
    </div>
  )
}

export default PrivacyPolicy
