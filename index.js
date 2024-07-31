const port = 4001;
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const cors = require("cors");

app.use(express.json());
app.use(cors());

// Database connection with mongodb
mongoose.connect("mongodb://UrbanThread:Urbantc1123@ac-cbn8v55-shard-00-00.nyt1iku.mongodb.net:27017,ac-cbn8v55-shard-00-01.nyt1iku.mongodb.net:27017,ac-cbn8v55-shard-00-02.nyt1iku.mongodb.net:27017/urban-thread?replicaSet=atlas-p6hmj2-shard-0&ssl=true&authSource=admin&retryWrites=true&w=majority&appName=Cluster0");

// Api creation
app.get("/", (req, res) => {
    res.send("Express App is running")
})

// Image storage engine
const storage = multer.diskStorage({
    destination: './upload/images',
    filename: (req, file, cb) => {
        return cb(null, `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`)
    }
})

const upload = multer({storage:storage})

//creating upload endpoint for images
app.use('/images', express.static('upload/images'))
app.post("/upload", upload.single('product'), (req, res) => {
    res.json({
        success: 1,
        image_url: `http://localhost:${port}/images/${req.file.filename}`
    })
})

// Schema for creating products
const Product = mongoose.model("Product", {
    id: {
        type: Number,
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    image: {
        type: String,
        required: true,
    },
    category: {
        type: String,
        required: true,
    },
    new_price: {
        type: Number,
        required: true,
    },
    old_price: {
        type: Number,
        required: true,
    },
    date: {
        type: Date,
        default: Date.now,
    },
    available: {
        type: Boolean,
        default: true,
    },
})

//creating api for add products

app.post('/addproduct', async(req, res) => {
    let products = await Product.find ({});
    let id;
    if(products.length > 0) {
        let last_product_array = products.slice(-1);
        let last_product = last_product_array[0];
        id = last_product.id +1; 
    } else {
        id = 1;
    }
    
    const product = new Product({
        id:id,
        name: req.body.name,
        image: req.body.image,
        category: req.body.category,
        new_price: req.body.new_price,
        old_price: req.body.old_price,
    });
    console.log(product);
    await product.save();
    console.log("Saved")
    res.json({
        success: true,
        name:req.body.name,
    })
})

//creating api for add products
app.post('/removeproduct', async(req, res) => {
    await Product.findOneAndDelete({id:req.body.id});
    console.log("Removed");
    res.json({
        success: true,
        name: req.body.name,
    })
})

//creating api for get all the products
app.get('/allproducts', async(req, res) => {
    let products = await Product.find({});
        console.log("All products Fetched");
        res.send(products);
})

//Schema user model
const User = mongoose.model('User', {
    name: {
        type: String, 
    },
    email: {
        type: String,
        unique: true,
    },
    password:{
        type: String,
    },
    cartData: {
        type: Object,
    },
    date: {
        type: Date,
        default: Date.now,
    },
})

//creating end point for registring the user
app.post('/signup', async(req, res) => {
    let check = await User.findOne({email: req.body.email});
    if(check){
        return res.status(400).json({success: false, errors: "Existing user found with same email address"});
    }
    let cart = {};
    for (let i = 0; i < 300; i++){
        cart[i] = 0;
    }
    const user = new User({
        name: req.body.username,
        email:req.body.email,
        password:req.body.password,
        cartData: cart,
    })
    await user.save();

    const data = {
        user: {
            id: user.id
        }
    }
    const token = jwt.sign(data, 'secret_ecom');
    res.json({success: true, token})
})

//creating endpoint for user login
app.post('/login', async (req, res)=> {
    let user = await User.findOne({email:req.body.email});
    if(user) {
        const passMatch = req.body.password === user.password;
        if(passMatch){
            const data = {
                user: {
                    id: user.id
                }
            }
            const token = jwt.sign(data, 'secret_ecom');
            res.json({success:true, token});
        } else {
            res.json({success:false, errors:"Wrong Password"});
        }
    } else {
        res.json({success:false, errors:"Wrong Email address"})
    }
})

// creating endpoint for latestproducts
app.get('/newcollections', async(req, res) => {
    let products = await Product.find({});
    let newcollection = products.slice(1).slice(-8);
    console.log("Newcollection Fetched")
    res.send(newcollection);
})

// creating endpoint for popular products
app.get('/popularproducts', async (req, res)=> {
    let products = await Product.find({category: "men"});
    let popularproducts = products.slice(0, 4);
    console.log("popular products Fetched");
    res.send(popularproducts);
})



app.listen(port, (error) => {
    if (!error) {
        console.log("Server is running on port " + port);
    } else {
        console.log("Error: " + error);
    }
})


