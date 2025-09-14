import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Collection from './pages/Collection'
import About from './pages/About'
import Contact from './pages/Contact'
import Product from './pages/Product'
import Cart from './pages/Cart'
import Login from './pages/Login'
import PlaceOrder from './pages/PlaceOrder'
import Orders from './pages/Orders'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import SearchBar from './components/SearchBar'
import TrackOrder from './pages/TrackOrder'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import Verify from './pages/Verify'
import PrivacyPolicy from './pages/PrivacyPolicy'
import DeliveryReturns from './pages/Delivery'

const App = () => {
  return (
    <div className='bg-gray-100'>
      <ToastContainer />

      {/* 🔹 Top Banner */}
      <div className="w-full bg-green-600 text-white text-center py-2 text-md font-medium">
        Bulk Order for Events/Festivals?{" "}
        <a
          href="https://wa.me/916386242220" // <-- replace with your WhatsApp number
          target="_blank"
          rel="noopener noreferrer"
          className="underline font-semibold hover:text-gray-200"
        >
          Message us on WhatsApp
        </a>
      </div>

      {/* Navbar full width */}
      <Navbar />
      <SearchBar />

      {/* Main content with padding */}
      <div className="bg-gray-400 px-4 sm:px-[5vw] md:px-[7vw] lg:px-[9vw]">
        <Routes>
          <Route path='/' element={<Home />} />
          <Route path='/collection' element={<Collection />} />
          <Route path='/about' element={<About />} />
          <Route path='/contact' element={<Contact />} />
          <Route path='/product/:productId' element={<Product />} />
          <Route path='/cart' element={<Cart />} />
          <Route path='/login' element={<Login />} />
          <Route path='/place-order' element={<PlaceOrder />} />
          <Route path="/track/:orderId" element={<TrackOrder />} />
          <Route path='/orders' element={<Orders />} />
          <Route path='/verify' element={<Verify />} />
          <Route path="/Delivery" element={<DeliveryReturns />} />
          <Route path="/PrivacyPolicy" element={<PrivacyPolicy />} />
        </Routes>
      </div>

      {/* Footer full width */}
      <Footer />
    </div>
  )
}

export default App
