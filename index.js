const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.ekuronr.mongodb.net/?retryWrites=true&w=majority`;
console.log(uri)

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });



function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send('you are not authorized for this access');
    }
    const token = authHeader.split(' ')[1];
    console.log(token)
    jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'access is forbiden' })
        }
        req.decoded = decoded;
        next();
    })

}


async function run(){
    try{
        const catagoryCollection = client.db('greenPlant').collection('catagories');
        const plantPotsCollection = client.db('greenPlant').collection('plant&pots');
        const userCollection = client.db('greenPlant').collection('usersdatabase');
        const bookedCollection = client.db('greenPlant').collection('bookeddatabase');

        //JWT implement
        app.get('/jwt', async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const user = await userCollection.findOne(query);
            if (user) {
                const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, { expiresIn: '10d' })
                return res.send({ tokenForAccess: token });
            }
            res.status(403).send({ tokenForAccess: 'congratulation you have got ghorar egg' })
        })

        //category
        app.get('/catagory', async (req, res) => {
            const query = {};
            const catagoryitem = await catagoryCollection.find(query).toArray();
            res.send(catagoryitem);
        });

        //plant&pots collection collection
        app.get('/plantspots', async (req, res) => {
            const query = {};
            const categoryPlant = await plantPotsCollection.find(query).toArray();
            res.send(categoryPlant);
        });


        //categorywise product collection get
        app.get('/products', async (req, res) => {
            console.log(req.query)
            let query = {};
            if (req.query.product_category) {
                query = {
                    product_category: req.query.product_category

                }
            }

            const cursor = plantPotsCollection.find(query);
            const productItem = await cursor.toArray();
            res.send(productItem);
        });


        //product details
        app.get('/product/:id', async(req, res)=>{
            const id = req.params.id;
      
            const query = {_id: new ObjectId(id)};
            const productDetails = await plantPotsCollection.findOne(query);
            res.send(productDetails)
            
          })

        //uploading user information
        app.post('/users', async (req, res) => {
            const userInformation = req.body;
            console.log(userInformation);
            const result = await userCollection.insertOne(userInformation);
            res.send(result);
        });


        //buyer route checking
        app.get('/buyer/:email', async (req, res) => {
            const email = req.params.email;
            console.log(email)
            const query = { email }
            const user = await userCollection.findOne(query);
            res.send({ isBuyer: user?.role === 'Buyer' })

        })

        //modal data sending
        app.post('/bookdata', async (req, res) => {
            const book = req.body;
            console.log(book);
            const result = await bookedCollection.insertOne(book);
            res.send(result);
        });


        //buyer myorder data
        app.get('/myorder', verifyJWT, async (req, res) => {
            const email = req.query.email;
            const decodedEmail = req.decoded.email;

            if (email !== decodedEmail) {
                return res.status(403).send({ message: 'access is forbiden' })
            }


            if (req.query.email) {
                query = {
                    email: req.query.email

                }
            }

            const cursor = bookedCollection.find(query);
            const result = await cursor.toArray();
            res.send(result);
        });



    }
    finally{

    }
}

run().catch(err => console.error(err))


app.get('/', (req,res)=>{
    res.send('Grenn plant server is running');
})

app.listen(port, () =>{
    console.log(`Green plant server is running on ${port}`)
})