const port = 4000;
const express = require("express");
const app = express();
const { Pool } = require("pg");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const cors = require("cors");
const saltRounds = 10;
const bcrypt = require("bcrypt"); // Import bcrypt

app.use(express.json());
app.use(cors());


// PostgreSQL database connection
const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "shoppingApp",
  password: "postgre",
  port: 5432,
});

// Image storage system
const storage = multer.diskStorage({
  destination: "./upload/images",
  filename: (req, file, cb) => {
    return cb(
      null,
      `${file.fieldname}_${Date.now()}_${path.extname(file.originalname)}`
    );
  },
});

const upload = multer({ storage: storage });

// creating Upload endpoint for images
app.use("/images", express.static("upload/images"));
app.post("/upload", upload.single("product"), (req, res) => {
  res.json({
    success: 1,
    image_url: `http://localhost:${port}/images/${req.file.filename}`,
  });
});

// API for adding a product
app.post("/addproduct", async (req, res) => {
  const { name, image, category, new_price, old_price, stock_quantity } =
    req.body;

  try {
    const result = await pool.query(
      "INSERT INTO products (name, image, category, new_price, old_price, stock_quantity) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [name, image, category, new_price, old_price, stock_quantity]
    );

    const newProduct = result.rows[0];
    res.json({
      success: true,
      name: newProduct.name,
    });
  } catch (error) {
    console.error("Error saving product:", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// API for removing a product
app.post("/removeproduct", async (req, res) => {
  const { id } = req.body;
  try {
    await pool.query("DELETE FROM products WHERE id = $1", [id]);
    console.log("removed");
    res.json({ success: true, id });
  } catch (error) {
    console.error("Error removing product:", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// API for getting all products
app.get("/allproducts", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM products");
    console.log("All Products fetched");
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// API for editing a product
app.put("/editproduct", async (req, res) => {
  const { id, name, image, category, new_price, old_price, stock_quantity } =
    req.body;

  try {
    const result = await pool.query(
      "UPDATE products SET name = $1, image = $2, category = $3, new_price = $4, old_price = $5, stock_quantity = $6 WHERE id = $7 RETURNING *",
      [name, image, category, new_price, old_price, stock_quantity, id]
    );

    const updatedProduct = result.rows[0];
    res.json({
      success: true,
      product: updatedProduct,
    });
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// REGISTER USER


app.post("/signup", async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    // Check if user already exists
    const checkQuery = "SELECT * FROM users WHERE email = $1";
    const checkResult = await pool.query(checkQuery, [email]);

    if (checkResult.rows.length > 0) {
      return res.status(400).json({
        success: false,
        errors: "Existing user found with the same email address",
      });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Initialize cart
    const cart = {};
    const cartJson = JSON.stringify(cart);

    // Insert new user into the database
    const insertQuery = `
      INSERT INTO users (name, email, password, cart, role, date)
      VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
      RETURNING id
    `;
    const insertValues = [name, email, hashedPassword, cartJson, role || 'customer'];
    const insertResult = await pool.query(insertQuery, insertValues);
    
    if (insertResult.rows.length === 0) {
      throw new Error('Failed to insert user into the database');
    }

    const userId = insertResult.rows[0].id;

    // Generate JWT token
    const data = {
      user: {
        id: userId,
      },
    };
    const token = jwt.sign(data, "secret_ecom", { expiresIn: "1h" });

    res.json({
      success: true,
      token: token,
    });
  } catch (error) {
    console.error("Error saving user:", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// LOGIN API

app.post("/userlogin", async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if the user exists
    const checkQuery = "SELECT * FROM users WHERE email = $1";
    const checkResult = await pool.query(checkQuery, [email]);

    if (checkResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const user = checkResult.rows[0];

    // Compare the provided password with the hashed password in the database
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const data = {
      user: {
        id: user.id,
      },
    };
    const token = jwt.sign(data, "secret_ecom", { expiresIn: "1h" });

    res.json({
      success: true,
      token: token,
    });
  } catch (error) {
    console.error("Error logging in:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// MIDDLEWARE

const fetchUser = async (req, res, next) => {
  const token = req.header("auth-token");

  if (!token) {
    return res
      .status(401)
      .json({ errors: "Please authenticate using a valid token" });
  }

  try {
    const data = jwt.verify(token, "secret_ecom");
    req.user = data.user;

    // Fetch user from PostgreSQL
    const userQuery = "SELECT id FROM users WHERE id = $1";
    const userResult = await pool.query(userQuery, [req.user.id]);

    if (userResult.rows.length === 0) {
      return res.status(401).json({ errors: "User not found" });
    }

    next();
  } catch (error) {
    return res
      .status(401)
      .json({ errors: "Please authenticate using a valid token" });
  }
};

// Add product to cart

app.post("/addtocart", fetchUser, async (req, res) => {
  try {
    console.log("Request Body:", req.body);
    console.log("User ID:", req.user.id);

    // Fetch the user's cart from the database
    const userQuery = "SELECT cart FROM users WHERE id = $1";
    const userResult = await pool.query(userQuery, [req.user.id]);

    if (userResult.rows.length === 0) {
      return res.status(404).send("User not found");
    }

    let userCart = userResult.rows[0].cart || {};

    console.log("Before Update - Cart Data:", userCart);

    // Initialize cart if not present
    if (!userCart) {
      userCart = {};
    }

    // Update the cart
    if (!userCart[req.body.itemId]) {
      userCart[req.body.itemId] = 0;
    }
    userCart[req.body.itemId] += 1;

    console.log("After Update - Cart Data:", userCart);

    // Perform the update
    const updateQuery = `
          UPDATE users
          SET cart = $1
          WHERE id = $2
      `;
    const cartJson = JSON.stringify(userCart);
    await pool.query(updateQuery, [cartJson, req.user.id]);

    res.send(`Added ${req.body.itemId}`);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Server Error");
  }
});

//  API TO REMOVE ITEM FROM CART

app.post("/removefromcart", fetchUser, async (req, res) => {
  try {
    const { itemId } = req.body;
    console.log("Removing item:", itemId);

    // Fetch the user's cart from the database
    const userQuery = "SELECT cart FROM users WHERE id = $1";
    const userResult = await pool.query(userQuery, [req.user.id]);

    if (userResult.rows.length === 0) {
      return res.status(404).send("User not found");
    }

    let userCart = userResult.rows[0].cart || {};

    console.log("Before Update - Cart Data:", userCart);

    // Initialize cartData if it doesn't exist
    if (!userCart || !userCart[itemId]) {
      return res.status(404).send("Item not found in cart");
    }

    // Check if the item quantity is greater than zero
    if (userCart[itemId] > 0) {
      userCart[itemId] -= 1;

      // Remove item if quantity becomes zero
      if (userCart[itemId] === 0) {
        delete userCart[itemId];
      }

      // Update the user's cart in the database
      const updateQuery = `
              UPDATE users
              SET cart = $1
              WHERE id = $2
          `;
      const cartJson = JSON.stringify(userCart);
      await pool.query(updateQuery, [cartJson, req.user.id]);

      return res.send("Item removed from cart");
    } else {
      return res.status(400).send("Item quantity is already zero");
    }
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).send("Server error");
  }
});

//  API TO GET NEW COLLECTIONS

app.get("/newcollections", async (req, res) => {
  try {
    // Fetch all products from the database
    const query = "SELECT * FROM products ORDER BY id DESC";
    const result = await pool.query(query);

    // Get the latest products, handling cases with fewer than 8 products
    const products = result.rows;
    const newcollection = products.length < 8 ? products : products.slice(0, 8);

    console.log("New collection fetched");
    res.json(newcollection);
  } catch (error) {
    console.error("Error fetching new collections:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

//  API FOR POPULAR IN WOMEN SECTION
app.get("/popularinwomen", async (req, res) => {
  try {
    // Fetch products in the "women" category from the database
    const query = "SELECT * FROM products WHERE category = $1 ORDER BY id DESC";
    const result = await pool.query(query, ["women"]);

    // Get the top 4 popular products in the "women" section
    const products = result.rows;
    const popular_in_women = products.slice(0, 4);

    console.log("Popular in women fetched");
    res.json(popular_in_women);
  } catch (error) {
    console.error("Error fetching popular items in women section:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// API TO GET CART DATA
app.post("/getcart", fetchUser, async (req, res) => {
  try {
    console.log("Fetching cart data");

    // Fetch the user's cart data from the database
    const query = "SELECT cart FROM users WHERE id = $1";
    const result = await pool.query(query, [req.user.id]);

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Parse the cart JSON data
    app.get('/cart/:userId', async (req, res) => {
      const userId = req.params.userId;
    
      try {
        // Query to get the cart data for the specific user
        const query = 'SELECT cart FROM users WHERE id = $1';
        const result = await pool.query(query, [userId]);
    
        if (result.rows.length === 0) {
          return res.status(404).json({ success: false, message: "User not found" });
        }
    
        // Parse the cart JSON data
        const cartData = result.rows[0].cart;
    
        console.log("Cart data fetched:", cartData);
        res.json({ success: true, cart: cartData });
      } catch (error) {
        console.error("Error fetching cart data:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
      }
    });

// API FOR ADMIN LOGIN

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const userQuery = "SELECT * FROM users WHERE email = $1";
    const userResult = await pool.query(userQuery, [email]);

    if (userResult.rows.length === 0) {
      return res.status(400).json({ success: false, errors: "User not found" });
    }

    const user = userResult.rows[0];
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(400).json({ success: false, errors: "Invalid password" });
    }

    if (user.role !== "Admin") {
      return res.status(403).json({ success: false, errors: "User is not authorized" });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, "secret_ecom", { expiresIn: "1h" });

    res.json({
      success: true,
      token: token,
      role: user.role // Include the role in the response
    });
  } catch (error) {
    console.error("Error logging in user:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Route to get all users
app.get("/allusers", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM user");
    console.log("All users fetched");
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});


app.listen(port, (error) => {
  if (!error) {
    console.log(`Server is listening at ${port}`);
  } else {
    console.log("Error : " + error.message);
  }
});
