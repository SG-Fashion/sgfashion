import userModel from "../models/userModel.js"

// merge guest cart into user cart
const mergeCart = async (req, res) => {
  try {
    const { userId, guestCart } = req.body;
    const userData = await userModel.findById(userId);
    let cartData = userData.cartData || {};

    // merge guestCart into user’s cartData
    for (const itemId in guestCart) {
      for (const size in guestCart[itemId]) {
        if (!cartData[itemId]) cartData[itemId] = {};
        if (!cartData[itemId][size]) cartData[itemId][size] = 0;
        cartData[itemId][size] += guestCart[itemId][size];
      }
    }

    await userModel.findByIdAndUpdate(userId, { cartData });
    res.json({ success: true, message: "Cart merged successfully" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};


// add products to user cart
const addToCart = async (req,res) => {
    try {
        
        const { userId, itemId, size } = req.body

        const userData = await userModel.findById(userId)
        let cartData = await userData.cartData;

        if (cartData[itemId]) {
            if (cartData[itemId][size]) {
                cartData[itemId][size] += 1
            }
            else {
                cartData[itemId][size] = 1
            }
        } else {
            cartData[itemId] = {}
            cartData[itemId][size] = 1
        }

        await userModel.findByIdAndUpdate(userId, {cartData})

        res.json({ success: true, message: "Added To Cart" })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// update user cart
const updateCart = async (req, res) => {
  try {
    const { userId, itemId, size, quantity } = req.body;

    const userData = await userModel.findById(userId);
    let cartData = userData.cartData || {};

    // Initialize the item object if it doesn't exist
    if (!cartData[itemId]) cartData[itemId] = {};

    if (quantity > 0) {
      // Update normally
      cartData[itemId][size] = quantity;
    } else {
      // Delete size if quantity is 0
      delete cartData[itemId][size];

      // If the item has no more sizes, remove the whole item
      if (Object.keys(cartData[itemId]).length === 0) {
        delete cartData[itemId];
      }
    }

    await userModel.findByIdAndUpdate(userId, { cartData });

    res.json({ success: true, message: "Cart Updated" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};



// get user cart data
const getUserCart = async (req,res) => {

    try {
        
        const { userId } = req.body
        
        const userData = await userModel.findById(userId)
        let cartData = await userData.cartData;

        res.json({ success: true, cartData })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }

}

export { addToCart, updateCart, getUserCart, mergeCart }