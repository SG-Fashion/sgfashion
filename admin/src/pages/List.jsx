import axios from 'axios'
import React, { useEffect, useState } from 'react'
import { backendUrl, currency } from '../App'
import { toast } from 'react-toastify'
import { useNavigate } from 'react-router-dom'

const List = ({ token }) => {
  const navigate = useNavigate()

  const [list, setList] = useState([])
  const [editData, setEditData] = useState(null)
  const [newImages, setNewImages] = useState([])
  const [filter, setFilter] = useState('all') // 'all' | 'in' | 'out'

  useEffect(() => {
    fetchList()
  }, [])

  const fetchList = async () => {
    try {
      // if token is present fetch admin list otherwise public list
      const url = `${backendUrl}/api/product/list`
      const res = await axios.get(url, token ? { headers: { token } } : {})
      if (res.data.success) setList(res.data.products.reverse())
      else toast.error(res.data.message)
    } catch (e) {
      console.error(e)
      toast.error(e.message)
    }
  }

  const uploadToCloudinary = async file => {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('upload_preset', 'update');
    try {
      const res = await axios.post(
        'https://api.cloudinary.com/v1_1/dda3k7ixqb/image/upload',
        fd
      );
      return res.data.secure_url;
    } catch (err) {
      console.error(err)
      toast.error('Image upload failed');
      return null;
    }
  };

  const removeProduct = async id => {
    try {
      const res = await axios.post(
        backendUrl + '/api/product/remove',
        { id },
        { headers: token ? { token } : {} }
      )
      if (res.data.success) {
        toast.success(res.data.message)
        fetchList()
      } else toast.error(res.data.message)
    } catch (e) {
      console.error(e)
      toast.error(e.message)
    }
  }

  const updateProduct = async () => {
    if (!editData) return
    try {
      // keep existing non-blob images
      let imgs = (editData.image || []).filter(u => typeof u === 'string' ? !u.startsWith('blob:') : true)
      // upload new files
      const uploads = await Promise.all(newImages.map(f => uploadToCloudinary(f)))
      imgs = [...imgs, ...uploads.filter(u => u)]

      const payload = {
        id: editData._id,
        name: editData.name,
        category: editData.category,
        price: editData.price,
        inStock: editData.inStock,
        bestseller: editData.bestseller,
        image: imgs,
        description: editData.description,
        sizes: editData.sizes,
      }

      const res = await axios.post(
        `${backendUrl}/api/product/update`,
        payload,
        { headers: { 'Content-Type': 'application/json', ...(token ? { token } : {}) } }
      )

      if (res.data.success) {
        toast.success('Updated!')
        setEditData(null)
        setNewImages([])
        fetchList()
      } else toast.error(res.data.message)
    } catch (e) {
      console.error(e)
      toast.error('Update failed')
    }
  }

  const onAddImage = e => {
    const files = Array.from(e.target.files)
    setNewImages(p => [...p, ...files])
    setEditData(p => ({
      ...(p || {}),
      image: [...((p && p.image) || []), ...files.map(f => URL.createObjectURL(f))],
    }))
  }

  const onKey = e => {
    if (e.key === 'Enter') updateProduct()
  }

  // flat list when filtering stock
  const flatList =
    filter === 'in'
      ? list.filter(p => p.inStock)
      : filter === 'out'
      ? list.filter(p => !p.inStock)
      : []

  return (
    <div className="space-y-6">
      {/* Header + Filter */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Products</h2>
        <select
          className="border p-2 rounded"
          value={filter}
          onChange={e => setFilter(e.target.value)}
        >
          <option value="all">All Products</option>
          <option value="in">In Stock</option>
          <option value="out">Out of Stock</option>
        </select>
      </div>

      {filter === 'all' ? (
        /* Standalone product list (no grouping) */
        list.map((item, idx) => (
          <div key={item._id || idx} className="grid grid-cols-[150px_2fr_1fr_1fr_1fr_150px] gap-2 items-center p-2 border bg-white">
            {/* Images (editable when this item is in edit mode) */}
            <div className="flex flex-wrap gap-1">
              {editData?._id === item._id ? (
                (editData.image || []).map((u, i) => (
                  <div key={i} className="relative w-12 h-12">
                    <img src={u} className="w-full h-full object-cover rounded" alt="" />
                    <button
                      onClick={() => setEditData(p => ({ ...p, image: (p.image || []).filter((_, idx2) => idx2 !== i) }))}
                      className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full px-1"
                    >
                      X
                    </button>
                  </div>
                ))
              ) : (
                <>
                  {(item.image || []).slice(0, 3).map((u, i) => (
                    <img key={i} src={u} className="w-12 h-12 object-cover rounded" alt="" />
                  ))}
                  {(item.image || []).length > 3 && (
                    <div className="w-12 h-12 flex items-center justify-center bg-gray-200 text-xs rounded">
                      +{(item.image || []).length - 3}
                    </div>
                  )}
                </>
              )}

              {editData?._id === item._id && (
                <label className="w-12 h-12 flex items-center justify-center border cursor-pointer">
                  <input type="file" multiple accept="image/*" onChange={onAddImage} className="hidden" />
                  +
                </label>
              )}
            </div>

            {/* Name */}
            {editData?._id === item._id ? (
              <input type="text" className="border p-1" value={editData.name} onChange={e => setEditData(p => ({ ...p, name: e.target.value }))} onKeyDown={onKey} />
            ) : (
              <p className="truncate">{item.name}</p>
            )}

            {/* Category */}
            {editData?._1d === item._id ? (
              <input type="text" className="border p-1" value={editData.category} onChange={e => setEditData(p => ({ ...p, category: e.target.value }))} onKeyDown={onKey} />
            ) : (
              <p>{item.category}</p>
            )}

            {/* Price */}
            {editData?._id === item._id ? (
              <input type="number" className="border p-1" value={editData.price} onChange={e => setEditData(p => ({ ...p, price: e.target.value }))} onKeyDown={onKey} />
            ) : (
              <p>{currency}{item.price}</p>
            )}

            {/* Stock */}
            {editData?._id === item._id ? (
              <select className="border p-1" value={String(editData.inStock)} onChange={e => setEditData(p => ({ ...p, inStock: e.target.value === 'true' }))}>
                <option value="true">In Stock</option>
                <option value="false">Out of Stock</option>
              </select>
            ) : (
              <p>{item.inStock ? '✅ In Stock' : '❌ Out of Stock'}</p>
            )}

            {/* Actions */}
            <div className="flex gap-2 justify-center">
              {editData?._id === item._id ? (
                <>
                  <button onClick={updateProduct} className="bg-blue-500 text-white px-3 py-1 rounded">Save</button>
                  <button onClick={() => { setEditData(null); setNewImages([]) }} className="bg-gray-300 px-3 py-1 rounded">Cancel</button>
                </>
              ) : (
                <>
                  <button onClick={() => navigate(`/add/${item._id}/edit`, { state: item })} className="bg-yellow-500 text-white px-3 py-1 rounded">Edit</button>
                </>
              )}

              <button onClick={() => removeProduct(item._id)} className="bg-red-500 text-white px-3 py-1 rounded">X</button>
            </div>
          </div>
        ))
      ) : (
        /* Flat List View for In/Out */
        flatList.map(item => (
          <div key={item._id} className="grid grid-cols-[150px_2fr_1fr_1fr_1fr_150px] gap-2 items-center p-2 border bg-white">
            <div className="flex flex-wrap gap-1">
              {(item.image || []).map((src, i) => (
                <img key={i} src={src} className="w-12 h-12 object-cover rounded" alt="" />
              ))}
            </div>
            <p className="truncate">{item.name}</p>
            <p>{item.category}</p>
            <p>{currency}{item.price}</p>
            <p>{item.inStock ? '✅ In Stock' : '❌ Out of Stock'}</p>
            <div className="flex gap-2 justify-center">
              <button onClick={() => navigate(`/add/${item._id}/edit`, { state: item })} className="bg-yellow-500 text-white px-3 py-1 rounded">Edit</button>
              <button onClick={() => removeProduct(item._id)} className="bg-red-500 text-white px-3 py-1 rounded">X</button>
            </div>
          </div>
        ))
      )}
    </div>
  )
}

export default List
