const port = 8080;
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const cors = require("cors");

app.use(express.json());
app.use(cors());

// Database connection
mongoose.connect("mongodb://localhost:27017/shopping-app", {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// API CREATION 

app.get("/", (req, res) => {
    res.send("Express app is running");
});

// Image storage system
const storage = multer.diskStorage({
    destination: './upload/images',
    filename: (req, file, cb) => {
        cb(null, `${file.fieldname}_${Date.now()}_${path.extname(file.originalname)}`);
    }
});
const upload = multer({ storage: storage });

// Creating upload endpoint for images
app.use('/images', express.static('upload/images'));
app.post("/upload", upload.single('product'), (req, res) => {
    res.json({
        success: 1,
        image_url: `http://localhost:${port}/images/${req.file.filename}`
    });
});

// Schema for creating products
const Product = mongoose.model("Product", {
    id: {
        type: Number,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    image: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    new_price: {
        type: Number,
        required: true
    },
    old_price: {
        type: Number,
        required: true
    },
    stock_quantity: {
        type: Number,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    available: {
        type: Boolean,
        default: true
    }
});

app.post('/addproduct', async (req, res) => {
    let products = await Product.find({});
    
    // Creating product ID
    let id;
    if (products.length > 0) {
        let last_product = products[products.length - 1];
        id = last_product.id + 1;
    } else {
        id = 1;
    }
    
    // Creating a product
    const product = new Product({
        id: id,
        name: req.body.name,
        image: req.body.image,
        category: req.body.category,
        new_price: req.body.new_price,
        old_price: req.body.old_price,
        stock_quantity: req.body.stock_quantity
    });
    
    try {
        await product.save();
        console.log("Product saved");
        res.json({
            success: true,
            name: req.body.name
        });
    } catch (error) {
        console.error("Error saving product:", error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

// DELETE PRODUCTS API 
app.post('/removeproduct', async (req, res) => {
    await Product.findOneAndDelete({ id: req.body.id });
    console.log("Product removed");
    res.json({
        success: true,
        name: req.body.name
    });
});

// CREATING API FOR GETTING ALL PRODUCTS
app.get('/allproducts', async (req, res) => {
    let products = await Product.find({});
    console.log("All products fetched");
    res.send(products);
});

// Creating schema for user model
const User = mongoose.model('User', {
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        unique: true,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    cart: {
        type: Map, // Use Map for cart to handle dynamic keys
        of: Number,
        default: {}
    },
    date: {
        type: Date,
        default: Date.now
    }
});

// Creating endpoint for registering the user
app.post('/signup', async (req, res) => {
    const { name, email, password } = req.body;

    try {
        // Check if user already exists
        const checkQuery = 'SELECT * FROM users WHERE email = $1';
        const checkResult = await pool.query(checkQuery, [email]);
        if (checkResult.rows.length > 0) {
            return res.status(400).json({
                success: false,
                errors: "Existing user found with the same email address"
            });
        }

        // Initialize cart
        const cart = {};

        // Function to add items to the cart with a specific quantity (if needed)
        function addItemToCart(itemId, quantity) {
            if (cart[itemId]) {
                cart[itemId] += quantity;
            } else {
                cart[itemId] = quantity;
            }
        }

        // Insert new user
        const insertQuery = `
            INSERT INTO users (name, email, password, cart, date)
            VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
            RETURNING id
        `;
        const cartJson = JSON.stringify(cart); // Convert cart object to JSON string
        const insertValues = [name, email, password, cartJson];
        const insertResult = await pool.query(insertQuery, insertValues);
        const userId = insertResult.rows[0].id;

        // Generate JWT token
        const data = {
            user: {
                id: userId
            }
        };
        const token = jwt.sign(data, 'secret_ecom', { expiresIn: '1h' }); // Added expiresIn for better security

        res.json({
            success: true,
            token: token
        });
    } catch (error) {
        console.error("Error saving user:", error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});


app.post('/login', async (req, res) => {
    try {
        // Find the user by email
        let user = await User.findOne({ email: req.body.email });

        if (user) {
            // Compare password
            const passCompare = req.body.password === user.password;
            if (passCompare) {
                // Generate JWT token
                const data = {
                    user: {
                        id: user.id,
                    }
                };
                const token = jwt.sign(data, 'secret_ecom');
                res.json({ success: true, token });
            } else {
                res.json({ success: false, errors: "Wrong Password" });
            }
        } else {
            res.json({ success: false, errors: "Wrong email id" });
        }
    } catch (error) {
        console.error("Error logging in:", error);
        res.status(500).json({ success: false, errors: "Internal server error" });
    }
});


// creating endpoint for new collection data

app.get('/newcollections', async (req, res) => {
    try {
        // Fetch all products from the database
        let products = await Product.find({});

        // Get the latest products, handling cases with fewer than 8 products
        let newcollection = products.length < 8 ? products : products.slice(-8);

        console.log("New collection fetched");
        res.json(newcollection);
    } catch (error) {
        console.error("Error fetching new collections:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
});


//  creating endpoint for popular in women section

app.get('/popularinwomen',async(req,res)=>{
    let products = await Product.find({category:"women"});
    let popular_in_women = products.slice(0,4);
    console.log("popular in women fetched");
    res.send(popular_in_women);
})

// creating miidleware to fetch user
const fetchUser = async(req,res,next)=>{
      const token = req.header('auth-token');
      if (!token) {
        res.status(401).send({errors:"please authenticate using valid token"});

      }else{
        try {
            const data = jwt.verify(token,'secret_ecom');
            req.user = data.user;
            next();
        } catch (error) {
            res.status(401).send({errors:"please authenticate using a valid token"});
        }
      }
}
app.post('/addtocart', fetchUser, async (req, res) => {
    try {
        console.log("Request Body:", req.body);
        console.log("User ID:", req.user.id);

        let userData = await User.findOne({ _id: req.user.id });

        console.log("Before Update - Cart Data:", userData.cart);

        if (!userData.cart) {
            userData.cart = {};
        }

        if (!userData.cart[req.body.itemId]) {
            userData.cart[req.body.itemId] = 0;
        }

        userData.cart[req.body.itemId] += 1;

        console.log("After Update - Cart Data:", userData.cart);

        // Perform the update
        let updateResult = await User.findOneAndUpdate(
            { _id: req.user.id },
            { cart: userData.cart },
            { new: true }
        );

        console.log("Update Result:", updateResult);

        // Fetch the updated document separately
        let updatedUserData = await User.findOne({ _id: req.user.id });
        console.log("Updated User Data (Separate Fetch):", updatedUserData.cart);

        res.send(`Added ${req.body.itemId}`);
    } catch (error) {
        console.error(error);
        res.status(500).send("Server Error");
    }
});






// creating endpoint to remove product from cartdata

app.post('/removefromcart', fetchUser, async (req, res) => {
    try {
        const { itemId } = req.body; // Extract itemId from the request
        console.log("Removing item:", itemId);

        // Fetch the user from the database
        let userData = await User.findOne({ _id: req.user.id });
        if (!userData) {
            return res.status(404).send("User not found");
        }

        // Initialize cartData if it doesn't exist
        if (!userData.cart || !userData.cart[itemId]) {
            return res.status(404).send("Item not found in cart");
        }

        // Check if the item quantity is greater than zero
        if (userData.cart[itemId] > 0) {
            userData.cart[itemId] -= 1;

            // Remove item if quantity becomes zero
            if (userData.cart[itemId] === 0) {
                delete userData.cart[itemId];
            }

            // Update the user's cart in the database
            await User.findOneAndUpdate({ _id: req.user.id }, { cart: userData.cart });

            return res.send("Item removed from cart");
        } else {
            return res.status(400).send("Item quantity is already zero");
        }
    } catch (error) {
        console.error(error);
        return res.status(500).send("Server error");
    }
});


// creating endpoint to get cart data
app.post('/getcart',fetchUser,async(req,res)=>{
    console.log("getcart");
    let userData = await User.findOne({_id:req.user.id});
    res.json(userData.cartData);
})


app.listen(port, (error) => {
    if (!error) {
        console.log(`Server is listening at ${port}`);
    } else {
        console.log("Error: " + error.message);
    }
});
