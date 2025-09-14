import React from 'react'
import Title from '../components/Title'
import { assets } from '../assets/assets'
import NewsletterBox from '../components/NewsletterBox'

const About = () => {
  return (
    <div>

      <div className='text-2xl text-center pt-8 border-t'>
          <Title text1={'ABOUT'} text2={'US'} />
      </div>

      <div className='py-10 flex flex-col md:flex-row gap-16'>
          <img className='w-full md:max-w-[450px]' src={assets.about_img} alt="about SG" />
          <div className='flex flex-col justify-center gap-6 md:w-2/4 text-gray-600'>
              <p>SG Fashion began its journey in 2025 as a small Instagram-based fashion label driven by creativity, individuality, and streetwear passion. What started with a few designs and posts quickly turned into a movement followed by a loyal and growing community.</p>
              <p>Our roots are digital, but our vision is bold. We create fashion that's expressive, edgy, and made to stand out. From limited drops to standout graphics, every piece is crafted with care, designed for those who dare to wear different.</p>
              <b className='text-gray-800'>Our Mission</b>
              <p>At SG, our mission is simple: to push boundaries through bold streetwear while staying connected with our community. We aim to make fashion accessible, unapologetic, and truly personal.</p>
          </div>
      </div>

      <div className='text-xl pt-10'>
          <Title text1={'WHY'} text2={'CHOOSE US'} />
      </div>

      <div className='flex flex-col md:flex-row text-sm pb-10'>
          <div className='border px-10 md:px-16 py-8 sm:py-20 flex flex-col gap-5'>
            <b>Authentic Designs:</b>
            <p className='text-gray-600'>Every drop tells a story. We design with originality, meaning, and style that speaks louder than trends.</p>
          </div>
          <div className='border px-10 md:px-16 py-8 sm:py-20 flex flex-col gap-5'>
            <b>Community-Driven:</b>
            <p className='text-gray-600'>Our customers are our core. We value your voice, your support, and your style—every collection is inspired by you.</p>
          </div>
          <div className='border px-10 md:px-16 py-8 sm:py-20 flex flex-col gap-5'>
            <b>Limited Drops, High Quality:</b>
            <p className='text-gray-600'>We believe in quality over quantity. Our collections are small-batch, well-crafted, and designed to last.</p>
          </div>
      </div>
      
    </div>
  )
}

export default About
