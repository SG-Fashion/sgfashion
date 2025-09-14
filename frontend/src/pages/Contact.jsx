import React from 'react'
import Title from '../components/Title'
import { assets } from '../assets/assets'
import NewsletterBox from '../components/NewsletterBox'

const Contact = () => {
  return (
    <div>
      
      <div className='text-center text-2xl pt-10 border-t'>
          <Title text1={'CONTACT'} text2={'US'} />
      </div>

      <div className='py-10 flex flex-col justify-center md:flex-row gap-10 pb-28'>
        <img className='w-full md:max-w-[480px]' src={assets.contact_img} alt="contact stoffs" />
        <div className='flex flex-col justify-center items-start gap-6'>
          <p className='font-semibold text-xl text-black-600'>Let's Connect</p>
          <p className='text-gray-800'>
            Got a question? Want to collab? Just drop us a message — we’d love to hear from you.
          </p>
          <p className='text-gray-800'>
            Tel: <b>+91 6386242220 / 9670117381</b> <br />
            Email: sgfashion2001@gmail.com
          </p>
          <p className='font-semibold text-xl text-black-600'>Work With SG</p>
          <p className='text-gray-800'>We're always on the lookout for creative minds to join our journey.</p>
        </div>
      </div>

    </div>
  )
}

export default Contact
