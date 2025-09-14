import { v2 as cloudinary } from "cloudinary"
import productModel from "../models/productModel.js"
import userModel from "../models/userModel.js";
import mongoose from 'mongoose';



// function for add product
const addProduct = async (req, res) => {
    try {

        const { name, description, price, category, subCategory, sizes, bestseller, inStock, originalPrice } = req.body

        const image1 = req.files.image1 && req.files.image1[0]
        const image2 = req.files.image2 && req.files.image2[0]
        const image3 = req.files.image3 && req.files.image3[0]
        const image4 = req.files.image4 && req.files.image4[0]

        const images = [image1, image2, image3, image4].filter((item) => item !== undefined)

        let imagesUrl = await Promise.all(
            images.map(async (item) => {
                let result = await cloudinary.uploader.upload(item.path, { resource_type: 'image' });
                return result.secure_url
            })
        )

        const productData = {
            name,
            description,
            category,
            price: Number(price),
            subCategory,
            bestseller: bestseller === "true" ? true : false,
            sizes: JSON.parse(sizes),
            image: imagesUrl,
            date: Date.now(),
            originalPrice,
            inStock
        }

        console.log(productData);

        const product = new productModel(productData);
        await product.save()

        res.json({ success: true, message: "Product Added" })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// function for list product
const listProducts = async (req, res) => {
    try {
        
        const products = await productModel.find({});
        res.json({success:true,products})

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// function for removing product
const removeProduct = async (req, res) => {
    try {
        
        await productModel.findByIdAndDelete(req.body.id)
        res.json({success:true,message:"Product Removed"})

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// robust sizes parser - safe to paste above updateProduct or inside the same file
function parseSizesSafely(raw, fallback = []) {
  if (raw === undefined || raw === null) return fallback;
  if (Array.isArray(raw)) return raw;

  let value = raw;
  if (typeof value !== 'string') {
    try { value = String(value); } catch (e) { return fallback; }
  }

  // Try repeatedly to JSON.parse until we get an array or until attempts exhausted
  let attempts = 0;
  while (typeof value === 'string' && attempts < 6) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed;
      value = parsed;
      attempts++;
      if (typeof value !== 'string') break;
    } catch (err) {
      break;
    }
  }

  // If still a string, try comma-splitting
  if (typeof value === 'string') {
    const splitted = value.split(',').map(s => s.trim()).filter(Boolean);
    if (splitted.length) return splitted;
  }

  // final fallback
  if (Array.isArray(value)) return value;
  return fallback;
}

const updateProduct = async (req, res) => {
  try {
    const { id, name, description, category, price, inStock, bestseller, sizes } = req.body;
    const existing = await productModel.findById(id);
    if (!existing) return res.status(404).json({ success: false, message: "Not found" });

    // make a shallow copy of DB images
    existing.image = Array.isArray(existing.image) ? existing.image.slice() : [];

    // ---------- Build baseSlots (4 fixed slots) ----------
    let baseSlots = ['', '', '', ''];
    if (req.body.existingImages) {
      try {
        const parsed = typeof req.body.existingImages === 'string'
          ? JSON.parse(req.body.existingImages)
          : req.body.existingImages;
        baseSlots = [
          parsed[0] || '',
          parsed[1] || '',
          parsed[2] || '',
          parsed[3] || ''
        ];
      } catch (e) {
        console.warn('Could not parse existingImages:', e);
        const dbImgs = existing.image || [];
        baseSlots = [dbImgs[0] || '', dbImgs[1] || '', dbImgs[2] || '', dbImgs[3] || ''];
      }
    } else if (req.body.image) {
      try {
        const parsed = typeof req.body.image === 'string' ? JSON.parse(req.body.image) : req.body.image;
        if (Array.isArray(parsed)) {
          baseSlots = [
            parsed[0] || '',
            parsed[1] || '',
            parsed[2] || '',
            parsed[3] || ''
          ];
        } else {
          const dbImgs = existing.image || [];
          baseSlots = [dbImgs[0] || '', dbImgs[1] || '', dbImgs[2] || '', dbImgs[3] || ''];
        }
      } catch (e) {
        console.warn('Could not parse req.body.image:', e);
        const dbImgs = existing.image || [];
        baseSlots = [dbImgs[0] || '', dbImgs[1] || '', dbImgs[2] || '', dbImgs[3] || ''];
      }
    } else {
      const dbImgs = existing.image || [];
      baseSlots = [dbImgs[0] || '', dbImgs[1] || '', dbImgs[2] || '', dbImgs[3] || ''];
    }

    // finalImages starts with baseSlots
    const finalSlots = baseSlots.slice(0, 4);

    // ---------- Handle uploaded files (image0..image3 or image1..image4) ----------
    if (req.files) {
      for (const fieldName of Object.keys(req.files)) {
        if (fieldName === 'images') continue; // appended images handled later

        const m = fieldName.match(/image(\d+)$/i);
        if (!m) continue;
        const num = parseInt(m[1], 10);
        // mapping: image0 -> index 0, image1 -> index 0 (num-1), image4 -> index 3
        let index = (num === 0) ? 0 : (num - 1);
        if (index < 0 || index > 3) continue;

        const filesArr = req.files[fieldName];
        if (!filesArr || !filesArr[0]) continue;

        // upload to cloudinary (wrap to avoid crashing whole route on single failure)
        try {
          const uploaded = await cloudinary.uploader.upload(
            filesArr[0].tempFilePath || filesArr[0].path,
            { resource_type: 'image' }
          );
          finalSlots[index] = uploaded.secure_url;
        } catch (uErr) {
          console.error(`Upload failed for ${fieldName}:`, uErr);
          // keep previous value (do not overwrite) or set '' — here we keep whatever was there
        }
      }
    }

    // ---------- Handle appended extra images (req.files.images) ----------
    const appended = req.files?.images ?? [];
    let appendedUrls = [];
    if (appended.length) {
      appendedUrls = await Promise.all(
        appended.map(async (f) => {
          try {
            const r = await cloudinary.uploader.upload(f.tempFilePath || f.path, { resource_type: 'image' });
            return r.secure_url;
          } catch (e) {
            console.error('Failed to upload appended image:', e);
            return null;
          }
        })
      );
      // filter out any failed (null) uploads
      appendedUrls = appendedUrls.filter(Boolean);
    }

    // ---------- Compose final existing.image ----------
    // Keep only non-empty first-four slots, then keep any DB extras after index 4, then append new appendedUrls
    const firstFour = finalSlots.filter(s => typeof s === 'string' && s.trim() !== '');
    const dbExtras = (existing.image && existing.image.length > 4) ? existing.image.slice(4) : [];
    existing.image = firstFour.concat(dbExtras).concat(appendedUrls);

    // ---------- Parse sizes safely and assign ----------
    const parsedSizes = parseSizesSafely(sizes, existing.sizes || []);
    existing.sizes = parsedSizes;

    // ---------- Update other fields ----------
    existing.description = description ?? existing.description;
    existing.category = category ?? existing.category;
    existing.price = price ?? existing.price;
    existing.name = name ?? existing.name;
    existing.inStock = (inStock !== undefined) ? inStock : existing.inStock;
    existing.bestseller = (bestseller !== undefined) ? bestseller : existing.bestseller;

    await existing.save();
    return res.json({ success: true, message: "Product updated", product: existing });
  } catch (err) {
    console.error("Error in updateProduct:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};




// function for single product info
const singleProduct = async (req, res) => {
    try {
        
        const { productId } = req.body
        const product = await productModel.findById(productId)
        res.json({success:true,product})

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}
const addProductReview = async (req, res) => {
    try {
        const { productId, comment, rating, userId, userName } = req.body;

        if (!mongoose.Types.ObjectId.isValid(productId) || !mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ success: false, message: "Invalid productId or userId" });
        }

        const product = await productModel.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        const user = await userModel.findById(userId).select("name");

        const newReview = {
            user: new mongoose.Types.ObjectId(userId),
            name: user.name,
            rating: rating,
            comment: comment,
        };

        product.reviews.push(newReview);

        const totalRatings = product.reviews.reduce((acc, review) => acc + review.rating, 0);
        product.averageRating = totalRatings / product.reviews.length;

        await product.save();

        res.status(201).json({ success: true, message: "Review added successfully", product });
    } catch (error) {
        console.error("Error adding review:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

const getProductReviews = async (req, res) => {
    try {
        const { productId } = req.params;
        const product = await productModel.findById(productId).select('reviews');

        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        res.json({ success: true, reviews: product.reviews });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }


};
export {updateProduct, listProducts, addProduct, removeProduct, singleProduct, addProductReview, getProductReviews}