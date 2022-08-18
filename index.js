const express = require('express');
const app = express();
const port = process.env.PORT || 3030;

require('dotenv').config();

const cors = require('cors');
app.use(cors());
app.use(express.json());

//Express Fileupload
const fileUpload = require('express-fileupload');
app.use(fileUpload());

const { MongoClient } = require('mongodb');
const ObjectId = require('mongodb').ObjectId;

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.p55ig.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

const stripe = require('stripe')(process.env.STRIPE_SECRET);

async function run() {
    try {
        await client.connect();
        const database = client.db('MotoZone');

        const usersCollection = database.collection('users');
        const ordersCollection = database.collection('orders');
        const reviewsCollection = database.collection('reviews');
        const productsCollection = database.collection('products');
        const subscribeCollection = database.collection('subscribe');


        // load all products
        app.get('/products', async (req, res) => {
            const allProducts = productsCollection.find({});
            const products = await allProducts.toArray();

            // catch details by id
            const selectedProduct = req.query.pdt;
            const queryProduct = { _id: ObjectId(selectedProduct) };
            const queryProductInfo = await productsCollection.find(queryProduct).toArray();

            res.send({
                products,
                queryProductInfo
            });
        })
        // post new product
        /*app.post('/products', async (req, res) => {
            const addProduct = req.body;
            const result = await productsCollection.insertOne(addProduct);
            res.json(result);
        })*/

        app.post('/products', async (req, res) => {
            console.log('body', req.body);
            console.log('files', req.files);
            const name = req.body.name;
            const price = req.body.price;
            const description = req.body.description;

            const pic = req.files.image;
            const picData = pic.data;
            const encodedPic = picData.toString('base64');
            const imageBuffer = Buffer.from(encodedPic, 'base64');

            const product = {
                name,
                image: imageBuffer,
                price,
                description
            }
            const result = await productsCollection.insertOne(product);
            console.log(result);
            res.json(result);
        })

        // delete a product
        app.delete('/products/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await productsCollection.deleteOne(query);
            res.json(result);
        })


        // load all reviews
        app.get('/reviews', async (req, res) => {
            const allReviews = reviewsCollection.find({});
            const reviews = await allReviews.toArray();
            res.send(reviews);
        })
        // post a review
        app.post('/reviews', async (req, res) => {
            const postReview = req.body;
            const result = await reviewsCollection.insertOne(postReview);
            res.json(result);
        })


        // load all orders
        app.get('/orders', async (req, res) => {
            const allOrders = ordersCollection.find({});
            const orders = await allOrders.toArray();

            // MyOrders.js => query-order
            const myOrder = req.query.email;
            const queryMyOrder = { email: myOrder };
            const myOrderInfo = await ordersCollection.find(queryMyOrder).toArray();

            res.send({
                orders,
                myOrderInfo
            });
        })
        // payment
        app.get('/orders/:id', async (req, res) => {
            const id = req.params.id;

            const query = { _id: ObjectId(id) };
            const result = await ordersCollection.findOne(query);
            res.json(result);
        })
        // post a order
        app.post('/orders', async (req, res) => {
            const postPurchaseInfo = req.body;
            const result = await ordersCollection.insertOne(postPurchaseInfo);
            res.json(result);
        })
        // update order status
        app.put('/orders/:id', async (req, res) => {
            const id = req.params.id;
            const orderStatus = req.body.status;

            const filter = { _id: ObjectId(id) };
            const updateDoc = { $set: { status: orderStatus } };
            const options = { upsert: true };

            const result = await ordersCollection.updateOne(filter, updateDoc, options);
            res.json(result);
        });
        // delete a order
        app.delete('/orders/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await ordersCollection.deleteOne(query);
            res.json(result);
        })


        // load all users
        app.get('/users', async (req, res) => {
            const allUsers = usersCollection.find({});
            const users = await allUsers.toArray();
            res.send(users);
        })
        // collect user data
        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            console.log(result);
            res.json(result);
        });
        // upsert user data
        app.put('/users', async (req, res) => {
            const user = req.body;

            const filter = { email: user.email };
            const updateDoc = { $set: user };
            const options = { upsert: true };

            const result = await usersCollection.updateOne(filter, updateDoc, options);

            res.json(result);
        });
        // set user as admin
        app.put('/users/admin', async (req, res) => {
            const user = req.body;

            const filter = { email: user.email };
            const updateDoc = { $set: { role: 'admin' } };

            const result = await usersCollection.updateOne(filter, updateDoc);

            res.json(result);
        });
        // check user as admin
        app.get('/users/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            let isAdmin = false;
            if (user?.role === 'admin') {
                isAdmin = true;
            }
            res.json({ admin: isAdmin });
        })


        // load all subscribe-data
        app.get('/subscribe', async (req, res) => {
            const allSubscribeData = subscribeCollection.find({});
            const subscribe = await allSubscribeData.toArray();
            res.send(subscribe);
        })

        // subscribe
        app.post('/subscribe', async (req, res) => {
            const subscribe = req.body;
            const result = await subscribeCollection.insertOne(subscribe);
            res.json(result);
        })

        
        // stripe payment
        app.post('/create-payment-intent', async (req, res) => {
            const paymentInfo = req.body;

            // stripe always count from cents(paisa)
            const amount = paymentInfo * 100;
            const paymentIntent = await stripe.paymentIntents.create({
                currency: 'bdt',
                amount: amount,
                payment_method_types: ['card'],
            });
            res.json({ clientSecret: paymentIntent.client_secret });
        })
    }
    finally {
        // await client.close();
    }
}
run().catch(console.dir)

app.get('/', (req, res) => {
    res.send('MotoZone Server is running');
})
app.listen(port, () => {
    console.log('Server running at:', port);
})