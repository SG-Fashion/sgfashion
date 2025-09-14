import React from 'react'
import Title from '../components/Title'
import NewsletterBox from '../components/NewsletterBox'

const DeliveryReturns = () => {
  return (
    <div className='ml-4 mr-4'>

      {/* Page Header */}
      <div className='text-2xl text-center pt-8 border-t'>
        <Title text1={'DELIVERY'} text2={'& RETURNS'} />
      </div>

      {/* Delivery Section */}
      <div className='my-10 flex flex-col gap-6 text-gray-600'>
        <h2 className='text-xl font-semibold'>Delivery Information</h2>
        <p>
          At SG Fashion, we aim to ship your orders as quickly as possible. Once your order is placed, it will be processed and dispatched within 2–5 business days.
        </p>
        <p>
          All orders are shipped via trusted delivery partners to ensure safe and timely delivery. You’ll receive a tracking link on Order page once your order is shipped.
        </p>
        <p>
          Standard delivery timelines are 5–10 business days across India. Delivery delays may occur during sales, drops, or due to external factors like weather or courier disruptions.
        </p>
        <p>
          Please make sure your shipping address and contact details are accurate when placing the order. We are not responsible for lost packages due to incorrect information.
        </p>
      </div>

      {/* Returns & Refunds Section */}
      <div className='my-10 flex flex-col gap-6 text-gray-600'>
        <h2 className='text-xl font-semibold'>Returns &amp; Exchange Policy</h2>
        <p>
          We accept returns only in case of defective or wrong items received. If you receive a damaged, misprinted, or incorrect item, please email us within 48 hours of delivery at{' '}
          <a href="mailto:yesfashion25@gmail.com" className='text-blue-600 underline'>
            yesfashion25@gmail.com
          </a>{' '}
          with clear photos and your order details.
        </p>
        <p>
          All items must be unused, unwashed, and returned in original packaging. We reserve the right to refuse returns that show signs of wear or use.
        </p>
        <p>
          We do not offer returns or refunds on size issues or change-of-mind purchases, as our products are limited drops with custom printing. Please refer to the size guide before placing your order.
        </p>
        <p>
          If approved, exchanges will be processed within 7 working days, and replacement items will be shipped out accordingly.
        </p>
      </div>

    </div>
  )
}

export default DeliveryReturns
