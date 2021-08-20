const express = require('express');
const paypal = require('paypal-rest-sdk');
const app = express();
const bodyparser = require("body-parser");
const path = require("path");
const mongoose = require("mongoose");
const { stringify } = require('querystring');
const PORT = 3000;

mongoose.connect('mongodb://local/contactUs', { useNewUrlParser: true, useUnifiedtopology: true });

app.use(express.static(__dirname));
app.use(express.urlencoded());


var CSchema = new mongoose.Schema({
    name:String,
    phone:String,
    email:String,
    address:String,
    desc: String
})


var contact = mongoose.model('contact', CSchema);
app.get('/contact', (req, res) => {
    res.sendFile(path.join(__dirname + "/html/contact.html"));

});


app.post('/contact',(req,res)=>{
  var myData =new contact(req.body);
  myData.save().then(()=>{
      res.send("this item has been saved to database");
  }).catch(()=>{
      res.status(400).send("item was not saved to the database")
  })
});


paypal.configure({
    'mode': 'sandbox', //sandbox or live
    'client_id': 'ARPfnlTYl_dj5HJ8e6O--ytU80dx5KOw5NuxCdQeh8puI-Xg_PsxIblKm0fxBTCBW9HkqokPEwFXsOuB',
    'client_secret': 'EF-E5IJ3r6eQXCtJ26wLnJOhQZKfWco6nfm9-VRc9P9gAfkPR90mCH1H8DEoLD2FPiuLIDvLhb6ffpan'
});


app.get('/', (req, res) => res.sendFile(__dirname + "/html/index.html"));

app.post('/pay', (req, res) => {
    const create_payment_json = {
        "intent": "sale",
        "payer": {
            "payment_method": "paypal"
        },
        "redirect_urls": {
            "return_url": "http://localhost:3000/success",
            "cancel_url": "http://localhost:3000/cancel"
        },
        "transactions": [{
            "item_list": {
                "items": [{
                    "name": "Red Sox Hat",
                    "sku": "001",
                    "price": "5.00",
                    "currency": "USD",
                    "quantity": 1
                }]
            },
            "amount": {
                "currency": "USD",
                "total": "5.00"
            },
            "description": "Hat for the best team ever"
        }]
    };

    paypal.payment.create(create_payment_json, function (error, payment) {
        if (error) {
            throw error;
        } else {
            for (let i = 0; i < payment.links.length; i++) {
                if (payment.links[i].rel === 'approval_url') {
                    res.redirect(payment.links[i].href);
                }
            }
        }
    });

});

app.get('/success', (req, res) => {
    const payerId = req.query.PayerID;
    const paymentId = req.query.paymentId;

    const execute_payment_json = {
        "payer_id": payerId,
        "transactions": [{
            "amount": {
                "currency": "USD",
                "total": "5.00"
            }
        }]
    };

    paypal.payment.execute(paymentId, execute_payment_json, function (error, payment) {
        if (error) {
            console.log(error.response);
            throw error;
        } else {
            console.log(JSON.stringify(payment));
            res.send('Success');
        }
    });
});
app.get('/cancel', (req, res) => res.send('Cancelled'));
app.listen(PORT, () => console.log(`Server Started on ${PORT}`));