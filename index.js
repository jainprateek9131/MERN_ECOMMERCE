/* const connectDB = async ()=>{
    mongoose.connect('mongodb://localhost27017/test')
    const ccsitSchema = new mongoose.Schema({});
    const ccsit = mongoose.model('users',ccsitSchema)
    const data =  await ccsit.find();
    console.warn(data)
} */
const cors = require('cors')
const express = require("express")
const app = express()
require('./db/config')
const User = require('./db/User')
const Product = require('./db/Product')

//jwt
const Jwt = require('jsonwebtoken')
const jwtkey = 'e-comm'

//to resolve cors issue
app.use(cors())
//midleware for body
app.use(express.json())
app.post("/register", async (req, resp) => {
    let user = new User(req.body)
    let result = await user.save()
    result = result.toObject();
    delete result.password;
    //GENERATION OF TOKEN WHILE REGISTRATION
    Jwt.sign({ result }, jwtkey, { expiresIn: "2h" }, (err, token) => {
        if (err) {
            resp.send({ result: "SOMETHING WENT WRONG TRY AFTER SOME TIME" })
        }
        resp.send({ result, auth: token })
    })
})

app.post('/login', async (req, resp) => {
    if (req.body.password && req.body.email) {
        let user = await User.findOne(req.body).select("-password");
        if (user) {
            //GENERATION OF TOKEN WHILE LOGIN
            Jwt.sign({ user }, jwtkey, { expiresIn: "2h" }, (err, token) => {
                if (err) {
                    resp.send({ result: "SOMETHING WENT WRONG TRY AFTER SOME TIME" })
                }
                resp.send({ user, auth: token })
            })
            // {
            //     "user": {
            //         "_id": "64c103cb1f1cf17926d5527a",
            //         "name": "dd",
            //         "email": "dd",
            //         "__v": 0
            //     },
            //     "auth": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7Il9pZCI6IjY
            // 0YzEwM2NiMWYxY2YxNzkyNmQ1NTI3YSIsIm5hbWUiOiJkZCIsImVtYWlsIjoiZGQiLCJfX3YiOjB
            // 9LCJpYXQiOjE2OTc1NTI4MTcsImV4cCI6MTY5NzU2MDAxN30.y42mq6d9iG6DvElNOyPgZzZw_D
            // DXHYjk8vCtkMxTpzU"
            // }
        } else {
            resp.send({ result: "USER NOT FOUND" })
        }
    } else {
        resp.send({ result: "USER NOT FOUND" })
    }
})

//FROM HERE VERIFICATION OF TOKEN STARTED
app.post('/add-product', verifyToken, async (req, resp) => {
    let product = new Product(req.body);
    let result = await product.save();
    resp.send(result);
})

//product list
app.get("/products", verifyToken, async (req, resp) => {
    let products = await Product.find();
    if (products.length > 0) {
        resp.send(products)
    } else {
        resp.send({ result: "NO RESULT FOUND" })
    }
})

//we are getting product id to delete product
app.delete("/product/:id", verifyToken ,async (req, resp) => {
    console.log(req.params.id)
    const result = await Product.deleteOne({ _id: req.params.id })
    resp.send(result)
})

/* for getting data for prefill blanks ie getting perticular product by its id */
app.get("/get-product/:id", verifyToken ,async (req, resp) => {
    let result = await Product.findOne({ _id: req.params.id })
    if (result) {
        resp.send(result)
    } else {
        resp.send({ result: "No Record Found" })
    }
})
//updating
app.put("/update/:id", verifyToken ,async (req, resp) => {
    let result = await Product.updateOne(
        { _id: req.params.id },
        {
            $set: req.body
            /* {
                "name":"Poco m3"
            } body */
        }
    )
    resp.send(result)
    /* {
        "acknowledged": true,
        "modifiedCount": 1,
        "upsertedId": null,
        "upsertedCount": 0,
        "matchedCount": 1
    } */
})

//search  http://localhost:5000/search/m5
app.get("/search/:key", verifyToken, async (req, resp) => {
    let result = await Product.find({
        "$or": [
            { name: { $regex: req.params.key } },//search in name
            { company: { $regex: req.params.key } },
            { price: { $regex: req.params.key } },
            { category: { $regex: req.params.key } },
        ]
    })
    resp.send(result)
})

//middleware that can verify for all api like get product upadate or all

function verifyToken(req, resp, next) {
    let token = req.headers['authorization']
    // authorization :  bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyZXN1bHQiOnsibmFtZSI6InByIiwiZW1haWwiOiJkZ
    // CIsIl9pZCI6IjY1MmU5YWRkMmM3NTliNzM0NzA2NGYyMSIsIl9fdiI6MH0sImlhd
    // CI6MTY5NzU1MzExNywiZXhwIjoxNjk3NTYwMzE3fQ.K_BHjuHSNaVmpxf8emqR3np3jagYBPC1pzDGYlA79Lc
    console.log("middleware called", token)//middleware called-- authorization: bearer xyz(token)
    if (token) {
        token = token.split(' ')
        console.log("middleware called", token) //middleware called [ 'bearer', 'xyz' ]
        token = token[1]
        //verify it
        Jwt.verify(token, jwtkey, (err, valid) => {
            if (err) {
                resp.status(401).send({ result: "please provide valid token" })
            } else {
                next() //ye age badhayega warna atak jayega program
            }
        })

    } else {
        resp.status(403).send({ result: "Please add token with header" })
    }
}

app.listen(5000)
// without jwt
// /* const connectDB = async ()=>{
//     mongoose.connect('mongodb://localhost27017/test')
//     const ccsitSchema = new mongoose.Schema({});
//     const ccsit = mongoose.model('users',ccsitSchema)
//     const data =  await ccsit.find();
//     console.warn(data)
// } */
// const cors = require('cors')
// const express = require("express")
// const app = express()
// require('./db/config')
// const User = require('./db/User')
// const Product = require('./db/Product')

// //to resolve cors issue
// app.use(cors())
// //midleware for body
// app.use(express.json())
// app.post("/register",async (req,resp)=>{
//     let user = new User(req.body)
//     let result = await user.save()
//     result = result.toObject();
//     delete result.password;
//     resp.send(result)
//     /* {
//         "name": "Poco mp5",
//         "email": "abc@gmail.com",
//         "_id": "652ba47b2f998f220e41d860",
//         "__v": 0
//     } */
// })

// app.post('/login',async(req,resp)=>{
//     if(req.body.password && req.body.email){
//         let user = await User.findOne(req.body).select("-password");
//        if(user){
//         resp.send(user)
//     /* "_id": "652b9252bb6ee3da6cdb232e",
//     "name": "Poco mp5",
//     "email": "abc@gmail.com",
//     "__v": 0 */
//         }else{
//         resp.send({result:"USER NOT FOUND"})
//         }
//     }else{
//         resp.send({result:"USER NOT FOUND"})
//     }
// })

// app.post('/add-product',async(req,resp)=>{
//     let product = new Product(req.body);
//     let result = await product.save();
//     resp.send(result);
// })

// //product list
// app.get("/products",async (req,resp)=>{
//     let products = await Product.find();
//     if(products.length>0){
//         resp.send(products)
//     }else{
//         resp.send({result:"NO RESULT FOUND"})
//     }
// })

// //we are getting product id to delete product
// app.delete("/product/:id",async (req,resp)=>{
//     console.log(req.params.id)
//     const result = await Product.deleteOne({_id:req.params.id})
//     resp.send(result)
// })

// /* for getting data for prefill blanks ie getting perticular product by its id */
// app.get("/get-product/:id",async (req,resp)=>{
//     let result = await Product.findOne({_id:req.params.id})
//     if(result){
//         resp.send(result)
//     }else{
//         resp.send({result:"No Record Found"})
//     }
// })
// //updating
// app.put("/update/:id" ,async (req , resp)=>{
//     let result = await Product.updateOne(
//         {_id: req.params.id},
//         {
//             $set : req.body
//             /* {
//                 "name":"Poco m3"
//             } body */
//         }
//     )
//     resp.send(result)
//     /* {
//         "acknowledged": true,
//         "modifiedCount": 1,
//         "upsertedId": null,
//         "upsertedCount": 0,
//         "matchedCount": 1
//     } */
// })

// //search  http://localhost:5000/search/m5
// app.get("/search/:key",async(req,resp)=>{
//     let result = await Product.find({
//         "$or":[
//             {name:{$regex:req.params.key}},//search in name
//             {company:{$regex:req.params.key}},
//             {price:{$regex:req.params.key}},
//             {category:{$regex:req.params.key}},
//         ]
//     })
//     resp.send(result)
// })
// app.listen(5000)