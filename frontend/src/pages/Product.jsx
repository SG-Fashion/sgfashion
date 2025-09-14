import React, { useContext, useEffect, useState, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { ShopContext } from '../context/ShopContext';
import { assets } from '../assets/assets';
import RelatedProducts from '../components/RelatedProducts';
import axios from 'axios';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { Navigation, Pagination } from 'swiper/modules';
import './swiperStyles.css'

const Product = () => {

  const { productId } = useParams();
  const { backendUrl, products, currency ,token,addToCart } = useContext(ShopContext);
  const [productData, setProductData] = useState(false);
  const [image, setImage] = useState('')
  const [size,setSize] = useState('')
  const [reviews, setReviews] = useState([]);
  const [reviewText, setReviewText] = useState('');
  const [rating, setRating] = useState(0);
  const [activeTab, setActiveTab] = useState('description');
  const [activeIndex, setActiveIndex] = useState(0);
  const swiperRef = useRef(null);


  const fetchProductData = async () => {

    products.map((item) => {
      if (item._id === productId) {
        setProductData(item)
        setImage(item.image[0])
        return null;
      }
    })

  }
const formatDescription = (text) => {
  // Step 1: Bold certain keywords
  let formatted = text.replace(
    /(Material:|Fit:|Design:|Print Quality:|Color:|Unisex:|Care Instructions:)/g,
    '<strong>$1</strong>'
  );

  // Step 2: Convert newlines to <br> for line breaks
  formatted = formatted.replace(/\n/g, '<br>');

  return formatted;
};
  const fetchReviews = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/product/${productId}/reviews`);
      if (data.success) {
        setReviews(data.reviews);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  const handleAddReview = async () => {
    if (!reviewText.trim()) {
      alert('Review cannot be empty');
      return;
    }
    try {
      const { data } = await axios.post(
        `${backendUrl}/api/product/addReview`,
        {
          productId,
          comment: reviewText,
          rating,
        },
        { headers: { token } }
      );
      if (data.success) {
        setReviewText('');
        setRating(0);
        fetchProductData(); // to update averageRating
        fetchReviews();
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error('Error adding review:', error);
    }
  };


  useEffect(() => {
    fetchProductData();
    fetchReviews();
  }, [productId,products])

  return productData ? (
    <div className='border-t-2 pt-10 transition-opacity ease-in duration-500 opacity-100'>
      {/*----------- Product Data-------------- */}
      <div className='flex gap-12 sm:gap-12 flex-col sm:flex-row'>

        {/*---------- Product Images------------- */}
        <div className="flex-1 flex flex-col-reverse gap-3 sm:flex-row">
    <div className="flex sm:flex-col overflow-x-auto sm:overflow-y-scroll justify-between sm:justify-normal sm:w-[18.7%] w-full">
      {productData.image.map((item, index) => (
        <img 
          onClick={() => {
            setActiveIndex(index);
            if (swiperRef.current) swiperRef.current.swiper.slideTo(index);
          }}
          src={item} 
          key={index} 
          className="w-[24%] sm:w-full sm:mb-3 flex-shrink-0 cursor-pointer" 
          alt=""
        />
      ))}
    </div>
    <div className="w-full sm:w-[80%]">
      <Swiper
        navigation
        pagination={{ clickable: true }}
        modules={[Navigation, Pagination]}
        className="custom-swiper"
        ref={swiperRef}
        style={{ maxWidth: '600px', margin: 'auto' }}
        initialSlide={activeIndex}
      >
        {productData.image.map((item, index) => (
          <SwiperSlide key={index}>
            <img src={item} onClick={()=>{setLightboxIndex(index);
            setLightboxOpen(true);}} alt={`Product ${index}`} className="w-full h-auto" />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  </div>

        {/* -------- Product Info ---------- */}
        <div className='flex-1'>
          <h1 className='font-medium text-2xl mt-2'>{productData.name}</h1>
          <div className="flex items-center gap-1 mt-2">
            {productData.averageRating ? (
              <>
                {[1, 2, 3, 4, 5].map((i) => (
                  <img
                    key={i}
                    src={i <= productData.averageRating ? assets.star_icon : assets.star_dull_icon}
                    alt="star"
                    className="w-4"
                  />
                ))}
                <p className="text-gray-600 text-sm mt-1">
                <span className='font-semibold'>{productData.averageRating.toFixed(1)}</span>
      </p>
                <p className="pl-2">({reviews.length} reviews)</p>
              </>
            ) : (
              <p className="text-gray-500">No reviews yet.</p>
            )}
          </div>
          <div className='mt-5 flex items-center gap-4'>
  <p className='text-3xl font-medium'>{currency}{productData.price}</p>
  <p className='text-gray-500 line-through text-lg'>
    {currency}{(productData.originalPrice).toFixed(0)}
  </p>
</div>

          <p
      className="mt-5 text-gray-500 md:w-4/5"
      dangerouslySetInnerHTML={{ __html: formatDescription(productData.description) }}
    ></p>
          <div className='flex flex-col gap-4 my-8'>
              <p>Select Size</p>
              <div className='flex gap-2'>
                {productData.sizes.map((item,index)=>(
                  <button onClick={()=>setSize(item)} className={`border py-2 px-4 bg-gray-100 ${item === size ? 'border-gray-900' : ''}`} key={index}>{item}</button>
                ))}
              </div>
          </div>
          <button onClick={()=>addToCart(productData._id,size)} className='bg-black text-white px-8 py-3 text-sm active:bg-gray-700'>ADD TO CART</button>
          <hr className='mt-8 sm:w-4/5' />
          <div className='text-sm text-gray-500 mt-5 flex flex-col gap-1'>
              <p>100% Original product.</p>
              <p>Cash on delivery is not available on this product.</p>
              <p>Free Delivery for more than 2 products.</p>
              <p>Easy return and exchange policy within 7 days.</p>
          </div>
        </div>
      </div>

      {/* ---------- Description & Review Section ------------- */}
      <div className="mt-20">
        <div className="flex border-b">
          <button className={`px-5 py-3 text-sm ${activeTab === 'description' ? 'border-b-2 border-red-700 font-bold' : ''}`} onClick={() => setActiveTab('description')}>Description</button>
          <button className={`px-5 py-3 text-sm ${activeTab === 'reviews' ? 'border-b-2 border-red-700 font-bold' : ''}`} onClick={() => setActiveTab('reviews')}>Reviews</button>
        </div>

        <div className="border px-6 py-6 text-sm text-gray-800">
          {activeTab === 'description' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h2 className="text-lg font-medium mb-4">Product <span className="text-red-700">Description</span></h2>
                <p>{productData.description}</p>
              </div>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="flex flex-col gap-4">
              <h2 className="text-lg font-medium">Customer Reviews</h2>
              {reviews.length > 0 ? reviews.map((review, i) => (
                <div key={i} className="border-b pb-3">
                  <p className="font-semibold">{review.name}</p>
                  <p>{review.comment}</p>
                  <p className="text-gray-400">Rating: {review.rating} / 5</p>
                </div>
              )) : <p>No reviews yet.</p>}
            </div>
          )}
        </div>

        {/* Review form */}
        <div className="mt-8 ml-4 pr-4">
          <h3 className="text-lg font-semibold">Add Your Review</h3>
          <textarea
            className="border w-full p-2 mt-3"
            placeholder="Write your review..."
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
          />
          <div className="flex gap-1 mt-2">
            {[1, 2, 3, 4, 5].map((num) => (
              <img
                key={num}
                src={num <= rating ? assets.star_icon : assets.star_dull_icon}
                className="w-5 cursor-pointer"
                onClick={() => setRating(num)}
                alt={`${num} Star`}
              />
            ))}
          </div>
          <button
            onClick={handleAddReview}
            className="bg-black text-white px-8 py-2 mt-4 text-sm"
          >
            Submit Review
          </button>
        </div>
      </div>

      {/* --------- display related products ---------- */}

      <RelatedProducts category={productData.category} subCategory={productData.subCategory} currentProductId={productId}/>

    </div>
  ) : <div className=' opacity-0'></div>
}

export default Product
