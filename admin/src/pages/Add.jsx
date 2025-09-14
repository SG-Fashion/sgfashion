// Add.jsx
import React, { useState, useEffect, useRef } from 'react'
import { assets } from '../assets/assets'
import axios from 'axios'
import { backendUrl } from '../App'
import { toast } from 'react-toastify'
import { useParams, useLocation, useNavigate } from 'react-router-dom'

// Clothing Add/Edit page — supports both adding new product and editing existing one
const Add = ({ token }) => {
  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const isEdit = Boolean(id)
  const initial = location.state || {}

  // image slots (can be false | string(URL) | File)
  const [image1, setImage1] = useState(false)
  const [image2, setImage2] = useState(false)
  const [image3, setImage3] = useState(false)
  const [image4, setImage4] = useState(false)

  // preview URLs for each slot (either remote URL or blob URL created via URL.createObjectURL)
  const [previews, setPreviews] = useState([null, null, null, null])
  // track created blob URLs so we can revoke them safely
  const createdPreviewsRef = useRef(new Set())

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [originalPrice, setOriginalPrice] = useState('')
  const [category, setCategory] = useState('Men')
  const [subCategory, setSubCategory] = useState('Topwear')
  const [bestseller, setBestseller] = useState(false)
  const [inStock, setInStock] = useState(false)
  const [sizes, setSizes] = useState([])

  // utility: map index -> setter for image slots
  const setters = [setImage1, setImage2, setImage3, setImage4]
  const getters = [() => image1, () => image2, () => image3, () => image4]

  // populate fields when editing
  useEffect(() => {
    if (!isEdit) return

    // If we have initial state from navigation, use it. Otherwise fetch by id as fallback
    const populate = (prod) => {
      setName(prod.name || '')
      setDescription(prod.description || '')
      setPrice(prod.price || '')
      setOriginalPrice(prod.originalPrice || '')
      setCategory(prod.category || 'Men')
      setSubCategory(prod.subCategory || 'Topwear')
      setBestseller(!!prod.bestseller)
      setInStock(prod.inStock ?? false)
      setSizes(Array.isArray(prod.sizes) ? prod.sizes : [])

      // initial images (may be URLs)
      const imgs = prod.image || []
      // fill image slots with URL strings (or false if missing)
      const slots = [imgs[0] || false, imgs[1] || false, imgs[2] || false, imgs[3] || false]
      setImage1(slots[0])
      setImage2(slots[1])
      setImage3(slots[2])
      setImage4(slots[3])

      // set previews to same remote URLs (no blob creation)
      setPreviews([
        slots[0] || null,
        slots[1] || null,
        slots[2] || null,
        slots[3] || null
      ])
    }

    if (initial && Object.keys(initial).length) {
      populate(initial)
    } else {
      // fallback fetch by id
      axios.post(`${backendUrl}/api/product/single`, { productId: id })
        .then(res => {
          if (res.data.success) populate(res.data.product)
          else toast.error('Could not fetch product data')
        })
        .catch(err => {
          console.error('Error fetching product:', err)
          toast.error('Error fetching product')
        })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, initial, id])

  // cleanup on unmount: revoke any created blob URLs
  useEffect(() => {
    return () => {
      createdPreviewsRef.current.forEach(url => {
        try { URL.revokeObjectURL(url) } catch (e) {}
      })
      createdPreviewsRef.current.clear()
    }
  }, [])

  // appendImage: fill first empty slot with provided file
  const appendImage = (file) => {
    if (!file) return

    // find first empty slot (we treat false as empty)
    const currentVals = [image1, image2, image3, image4]
    const emptyIndex = currentVals.findIndex(v => v === false)

    if (emptyIndex === -1) {
      toast.info('Maximum 4 images allowed. Remove one first to add more.')
      return
    }

    // If there is an existing preview blob at that index (unlikely because slot was false),
    // revoke it — but slot is false so none to revoke.

    // set file into slot
    setters[emptyIndex](file)

    // create preview blob URL and mark it as created so we can revoke later
    const blobUrl = URL.createObjectURL(file)
    createdPreviewsRef.current.add(blobUrl)
    setPreviews(prev => {
      const copy = [...prev]
      copy[emptyIndex] = blobUrl
      return copy
    })
  }

  // helper used from <input onChange> to call appendImage
  const handleImgInput = (e) => {
    const f = e.target.files && e.target.files[0]
    if (f) appendImage(f)
    // clear input so selecting same file again triggers change if needed
    e.target.value = ''
  }

  // remove image at index (0..3)
  const removeImage = (index) => {
    // revoke preview if we created a blob url
    const prev = previews[index]
    if (prev && createdPreviewsRef.current.has(prev)) {
      try { URL.revokeObjectURL(prev) } catch (e) {}
      createdPreviewsRef.current.delete(prev)
    }

    // clear both preview and slot state
    setPreviews(prevArr => {
      const copy = [...prevArr]
      copy[index] = null
      return copy
    })
    setters[index](false)
  }

  const onSubmitHandler = async (e) => {
  e.preventDefault()
  const formData = new FormData()

  formData.append('name', name)
  formData.append('description', description)
  formData.append('price', price)
  formData.append('originalPrice', originalPrice)
  formData.append('category', category)
  formData.append('subCategory', subCategory)
  formData.append('bestseller', bestseller)
  formData.append('sizes', JSON.stringify(sizes))
  formData.append('inStock', inStock)

  if (isEdit) formData.append('id', id)

  // Build existingImages array of exact 4 slots: url-string or null
  const existingImages = [
    (image1 && typeof image1 === 'string') ? image1 : null,
    (image2 && typeof image2 === 'string') ? image2 : null,
    (image3 && typeof image3 === 'string') ? image3 : null,
    (image4 && typeof image4 === 'string') ? image4 : null,
  ]
  // put as JSON so server can parse and use it
  formData.append('existingImages', JSON.stringify(existingImages))

  // Append file objects into their slot keys ONLY if they are Files
  if (image1 && image1 instanceof File) formData.append('image1', image1)
  if (image2 && image2 instanceof File) formData.append('image2', image2)
  if (image3 && image3 instanceof File) formData.append('image3', image3)
  if (image4 && image4 instanceof File) formData.append('image4', image4)

  try {
    const url = isEdit ? `${backendUrl}/api/product/update` : `${backendUrl}/api/product/add`
    const res = await axios.post(url, formData, { headers: { token } })
    if (res.data.success) {
      toast.success(res.data.message)
      navigate('/list')
    } else {
      toast.error(res.data.message)
    }
  } catch (error) {
    console.error(error)
    toast.error(error.message || 'Error saving product')
  }
}

  // small helper to render preview image src: prefer preview slot, else if slot has URL use it
  const previewSrc = (idx, slotValue) => {
    if (previews[idx]) return previews[idx]
    if (slotValue && typeof slotValue === 'string') return slotValue
    return null
  }

  return (
    <form onSubmit={onSubmitHandler} className='flex flex-col w-full items-start gap-3'>
      <div>
        <p className='mb-2'>Upload Image (max 4)</p>

        <div className='flex gap-2'>
          {/* Slot 1 */}
          <div className="flex flex-col items-center">
            <label htmlFor='image1'>
              <img
                className='w-20 h-20 object-cover'
                src={previewSrc(0, image1) || assets.upload_area}
                alt=''
              />
              <input onChange={handleImgInput} type='file' id='image1' accept="image/*" hidden />
            </label>
            {previews[0] || (image1 && typeof image1 === 'string') ? (
              <button type="button" className="mt-1 text-xs text-red-600" onClick={() => removeImage(0)}>Remove</button>
            ) : null}
          </div>

          {/* Slot 2 */}
          <div className="flex flex-col items-center">
            <label htmlFor='image2'>
              <img
                className='w-20 h-20 object-cover'
                src={previewSrc(1, image2) || assets.upload_area}
                alt=''
              />
              <input onChange={handleImgInput} type='file' id='image2' accept="image/*" hidden />
            </label>
            {previews[1] || (image2 && typeof image2 === 'string') ? (
              <button type="button" className="mt-1 text-xs text-red-600" onClick={() => removeImage(1)}>Remove</button>
            ) : null}
          </div>

          {/* Slot 3 */}
          <div className="flex flex-col items-center">
            <label htmlFor='image3'>
              <img
                className='w-20 h-20 object-cover'
                src={previewSrc(2, image3) || assets.upload_area}
                alt=''
              />
              <input onChange={handleImgInput} type='file' id='image3' accept="image/*" hidden />
            </label>
            {previews[2] || (image3 && typeof image3 === 'string') ? (
              <button type="button" className="mt-1 text-xs text-red-600" onClick={() => removeImage(2)}>Remove</button>
            ) : null}
          </div>

          {/* Slot 4 */}
          <div className="flex flex-col items-center">
            <label htmlFor='image4'>
              <img
                className='w-20 h-20 object-cover'
                src={previewSrc(3, image4) || assets.upload_area}
                alt=''
              />
              <input onChange={handleImgInput} type='file' id='image4' accept="image/*" hidden />
            </label>
            {previews[3] || (image4 && typeof image4 === 'string') ? (
              <button type="button" className="mt-1 text-xs text-red-600" onClick={() => removeImage(3)}>Remove</button>
            ) : null}
          </div>
        </div>
      </div>

      <div className='w-full'>
        <p className='mb-2'>Product name</p>
        <input onChange={(e) => setName(e.target.value)} value={name} className='w-full max-w-[500px] px-3 py-2' type='text' placeholder='Type here' required />
      </div>

      <div className='w-full'>
        <p className='mb-2'>Product description</p>
        <textarea onChange={(e) => setDescription(e.target.value)} value={description} className='w-full max-w-[500px] px-3 py-2' type='text' placeholder='Write content here' required />
      </div>

      <div className='flex flex-col sm:flex-row gap-2 w-full sm:gap-8'>
        <div>
          <p className='mb-2'>Product category</p>
          <select onChange={(e) => setCategory(e.target.value)} value={category} className='w-full px-3 py-2'>
            <option value='Men'>Men</option>
            <option value='Women'>Women</option>
            <option value='Kids'>Kids</option>
          </select>
        </div>

        <div>
          <p className='mb-2'>Sub category</p>
          <select onChange={(e) => setSubCategory(e.target.value)} value={subCategory} className='w-full px-3 py-2'>
            <option value='Topwear'>Topwear</option>
            <option value='Bottomwear'>Bottomwear</option>
            <option value='Winterwear'>Winterwear</option>
          </select>
        </div>

        <div>
          <p className='mb-2'>Product Price</p>
          <input onChange={(e) => setPrice(e.target.value)} value={price} className='w-full px-3 py-2 sm:w-[120px]' type='number' placeholder='25' required />
        </div>

        <div>
          <p className='mb-2'>Original Price</p>
          <input type='number' className='px-3 py-2 sm:w-[150px]' value={originalPrice} onChange={(e) => setOriginalPrice(e.target.value)} required />
        </div>
      </div>

      <div>
        <p className='mb-2'>Product Sizes</p>
        <div className='flex gap-3'>
          {['S', 'M', 'L', 'XL', 'XXL'].map((sz) => (
            <div key={sz} onClick={() => setSizes(prev => prev.includes(sz) ? prev.filter(item => item !== sz) : [...prev, sz])}>
              <p className={`${sizes.includes(sz) ? 'bg-pink-100' : 'bg-slate-200'} px-3 py-1 cursor-pointer`}>{sz}</p>
            </div>
          ))}
        </div>
      </div>

      <div className='flex gap-2 mt-2'>
        <label>
          <input type='checkbox' checked={bestseller} onChange={() => setBestseller((p) => !p)} />{' '}
          Bestseller
        </label>
        <label>
          <input type='checkbox' checked={inStock} onChange={() => setInStock((p) => !p)} /> In Stock
        </label>
      </div>

      <button type='submit' className='w-28 py-3 mt-4 bg-black text-white'>
        {isEdit ? 'Save Changes' : 'ADD'}
      </button>
    </form>
  )
}

export default Add
