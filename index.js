const express = require('express');
const { MongoClient, ServerApiVersion } = require('mongodb');
const cors = require('cors');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;


// Middletire
app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@doctors-portal.dtj5s.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        await client.connect();
        const serviceCollection = client.db('doctors_portal').collection('services');
        const bookingCollection = client.db('doctors_portal').collection('bookings');
        const userCollection = client.db('doctors_portal').collection('users');


        app.get('/service', async (req, res) => {
            const query = {};
            const cursor = serviceCollection.find(query);
            const services = await cursor.toArray();
            res.send(services)
        });

        app.put('/user/:email', async (req, res) => {
            const email = req.params.email;
            const user = req.body;
            const filter = { email: email };
            const options = { upsert: true };
            const updateDoc = {
                $set: user,
            };
            const result = await userCollection.updateOne(filter, updateDoc, options);
            res.send(result);
        })
        app.get('/available', async (req, res) => {
            const date = req.query.date;
            const services = await serviceCollection.find().toArray();
            const query = { date: date };
            const bookings = await bookingCollection.find(query).toArray();
            services.forEach(service => {
                const serviceBookings = bookings.filter(book => book.treatment === service.name);
                const booked = serviceBookings.map(book => book.slot);
                const available = service.slots.filter(slot => !booked.includes(slot));
                service.slots = available;
            })
            res.send(services);
        })

        /**
        * API naming conventions
        * app.get('/booking') //get all booking in this collection or getting more than 1 or by filter
        * app.get('/booking/:id') // get a specific booking
        * app.post('/booking') // add a new booking
        * app.patch('/booking/:id) //update a specific booking
        * app.put('/booking/:id) // upert ==> update (if exists) or insert (if doesn't exists)
        * app.delete('/booking/:id) // specific delete booking
        */

        app.get('/booking', async (req, res) => {
            const patient = req.query.patient;
            const query = { patient: patient };
            const bookings = await bookingCollection.find(query).toArray();
            res.send(bookings);
        })

        app.post('/booking', async (req, res) => {
            const booking = req.body;
            const query = { treatment: booking.treatment, date: booking.date, patient: booking.patient }
            const exists = await bookingCollection.findOne(query);
            if (exists) {
                return res.send({ success: false, booking: exists })
            }
            const result = await bookingCollection.insertOne(booking);
            return res.send({ success: true, result });
        })

    }
    finally {

    }

}
run().catch(console.dir);




app.get('/', (req, res) => {
    res.send('Hello Doctor Uncle!')
})

app.listen(port, () => {
    console.log(`Hei are you listening my port -  ${port}`)
})