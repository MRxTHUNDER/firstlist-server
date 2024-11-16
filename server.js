const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const axios = require('axios');
const { url } = require('inspector');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

let key = '3064fbf3-4d48-458a-8e6d-c086629916f5'
let merchant_id = 'M22N5T3LZUUAV'


app.get('/', (req, res) => {
    res.send('Hello from Express.js');
});


app.post('/order', async (req, res) => { 

    try{

        let merchantTransactionId = req.body.transactionId

        const data = {
            merchantTransactionId: merchantTransactionId,
            merchantId: merchant_id,
            amount: req.body.amount * 100,
            currency: req.body.currency,
            redirectUrl: `http://localhost:5173/status?id=${merchantTransactionId}`,
            redirectMode: "POST",
            paymentInstrument:{
                type: "PAY_PAGE"
            },


            // "email": req.body.email,
            // "merchantTransactionNote": req.body.merchantTransactionNote,
            // "paymentMethods": req.body.paymentMethods,


            // "customer": {
            //     "name": req.body.customer.name,
            //     "email": req.body.customer.email,
            //     "phone": req.body.customer.phone
            // }

            
        }

        const payload = JSON.stringify(data);
        const payload64 = Buffer.from(payload).toString('base64');
        const keyIndex =1;
        const string = payload64 + '/pg/v1/pay' + key; 
        const sha256 = crypto.createHash('sha256').update(string).digest('hex');
        const checksum = sha256 + '###' + keyIndex;

        const test_URL = "https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/pay"
        const prod_URL = "https://api.phonepe.com/apis/hermes/pg/v1/pay"

        const options = {
            method: 'POST',
            url: prod_URL,
            headers: {
                accept: 'application/json',
                'Content-Type': 'application/json',
                'X-VERIFY': checksum
            },
            data: {
                request: payload64
            }
        }

        await axios(options).then(function (response)  {
            console.log(response.data);
            return res.json(response.data);
        }).catch((error) => {
            console.log(error);
        })

    } catch (error) {
        console.log(error);

    }

});

app.post('/status', async (req, res) => {

    const merchantTransactionId = req.query.id 
    const merchantId = merchant_id

    const keyIndex =1
    const string = `/pg/v1/status/${merchantId}/${merchantTransactionId}` + key;
    const sha256 = crypto.createHash('sha256').update(string).digest('hex');
    const checksum = sha256 + '###' + keyIndex;

    const options = {
        method: 'GET',
        url: `https://api.phonepe.com/apis/hermes/pg/v1/status/${merchantId}/${merchantTransactionId}`,
        headers: {
            accept: 'application/json',
            'Content-Type': 'application/json',
            'X-VERIFY': checksum,
            'X-MERCHANT-ID': `${merchantId}`
        }
    }

    axios.request(options).then(function (response) {
        if(response.data.success === true ) {
            const url = 'http://localhost:5173/success'
            console.log('Payment Successful');
            return res.redirect(url);
        }else{
            const url = 'http://localhost:5173/failure'
            console.log('Payment Failed');
            return res.redirect(url);
        }
        
    }).catch(function (error) {
        console.log(error);
    })

})



app.listen(8000, () => { console.log('Server is running on port 8000') });

