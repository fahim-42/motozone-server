const express = require('express');
const app = express();
const port = process.env.PORT || 3030;

require('dotenv').config();

const cors = require('cors');
app.use(cors());
app.use(express.json());

const { MongoClient } = require('mongodb');
const ObjectId = require('mongodb').ObjectId;

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.p55ig.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
// @ts-ignore
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });


async function run() {
    try {
        await client.connect();
        const database = client.db('MotoZone');

        const usersCollection = database.collection('users');
        const ordersCollection = database.collection('orders');
        const reviewsCollection = database.collection('reviews');
        const productsCollection = database.collection('products');

        // load all products
        app.get('/products', async (req, res) => {
            const allProducts = productsCollection.find({});
            const products = await allProducts.toArray();

            // catch details by id
            const selectedProduct = req.query.pdt;
            // @ts-ignore
            const queryProduct = { _id: ObjectId(selectedProduct) };
            const queryProductInfo = await productsCollection.find(queryProduct).toArray();

            res.send({
                products,
                queryProductInfo
            });
        })
        // post new product
        app.post('/products', async (req, res) => {
            const addProduct = req.body;
            const result = await productsCollection.insertOne(addProduct);
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
        // post a order
        app.post('/orders', async (req, res) => {
            const postPurchaseInfo = req.body;
            const result = await ordersCollection.insertOne(postPurchaseInfo);
            res.json(result);
        })
        // delete a order
        app.delete('/orders/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await ordersCollection.deleteOne(query);
            res.json(result);
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