import React from 'react'
import { assets } from '../assets/assets'
import { Link } from 'react-router-dom'

const Footer = () => {
  return (
    <div>
      <div className='px-10 py-5 flex flex-col bg-[#1b1b1b] sm:grid grid-cols-[3fr_1fr_1fr] gap-1 text-sm'>

        <div>
            <img src={assets.logo} className='mb-5 w-32' alt="" />
            <p className='w-full md:w-2/3 text-[#08fdd8]'>
            SG Fashion — Established in 2025 with a vision to blend timeless style and bold individuality. Proudly creating looks that speak for you.</p>
        </div>

        <div>
            <p className='text-xl font-medium text-white mb-5'>COMPANY</p>
            <ul className='flex flex-col gap-1 text-[#08fdd8]'>
                <li><Link to='/'>Home</Link></li>
                <li><Link to='/about'>About us</Link></li>
                <li><Link to='/delivery'>Delivery</Link></li>
                <li><Link to="/privacypolicy">Privacy policy</Link></li>
            </ul>
        </div>

        <div>
            <p className='text-xl font-medium mb-5 text-white'>GET IN TOUCH</p>
            <ul className='flex flex-col gap-1 text-[#08fdd8]'>
                <li className='text-md'><b><u>+91 6386242220 / 9670117381</u></b></li>
                <li>sgfashion2001@gmail.com</li>
                <li>D/5 Gilbert compound opposite Anthony Church khairani road Sakinaka 400072</li>
            </ul>
        </div>

      </div>

        <div>
            <hr />
            <p className='bg-gray-600 text-sm text-center'>Copyright 2025@ sg-fashions.com - All Right Reserved.</p>
        </div>

    </div>
  )
}

export default Footer
