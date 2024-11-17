const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const axios = require('axios');
const bodyParser = require("body-parser");

const { url } = require('inspector');
let key = '96434309-7796-489d-8924-ab56988a6076'
let merchant_id = 'PGTESTPAYUAT86'

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.urlencoded({
    extended: false
}));



const test_URL = "https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/pay"
const test_URL2 = "https://api-preprod.phonepe.com/apis/pg-sandbox/"
const prod_URL = "https://api.phonepe.com/apis/hermes/pg/v1/pay"


app.get('/', (req, res) => {
    res.send('Hello from Express.js');
});


app.post('/order', async (req, res) => { 

    try{
        console.log(req.body);

        let merchantTransactionId = req.body.transactionId

        const data = {
            merchantTransactionId: merchantTransactionId,
            merchantId: merchant_id,
            merchantUserId: req.body.MID,
            amount: req.body.amount * 100,
            currency: req.body.currency,
            redirectUrl: `http://localhost:5173/DemoDashboard/PaymentStatus`,
            redirectMode: 'REDIRECT',
            paymentInstrument:{
                type: 'PAY_PAGE'
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

        

        const options = {
            method: 'POST',
            url: test_URL,
            headers: {
                accept: 'application/json',
                'Content-Type': 'application/json',
                'X-VERIFY': checksum
            },
            data: {
                request: payload64
            }
        }

        axios.request(options).then(function (response)  {
            console.log(response.data);
            return res.json(response.data);
        }).catch(function (error) {
            console.log(error);
        })

    } catch (error) {
        console.log(error);
        res.status(500).send({
            message: error.message,
            success: false
        })

    }

});

app.post('/status', async (req, res) => {
    try {
        const merchantTransactionId = req.query.id;
        const merchantId = merchant_id;
        const keyIndex = 1;
        const string = `/pg/v1/status/${merchantId}/${merchantTransactionId}` + key;
        const sha256 = crypto.createHash('sha256').update(string).digest('hex');
        const checksum = sha256 + '###' + keyIndex;

        const options = {
            method: 'GET',
            url: `https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/status/${merchantId}/${merchantTransactionId}`,
            headers: {
                accept: 'application/json',
                'Content-Type': 'application/json',
                'X-VERIFY': checksum,
                'X-MERCHANT-ID': `${merchantId}`
            }
        };

        // Request to get the payment status
        const response = await axios.request(options);

        if (response.data.success === true) {
            console.log('Payment Successful');
            res.redirect('http://localhost:5173/DemoDashboard/DemoSuccess');
        } else {
            console.log('Payment Failed');
            res.redirect('http://localhost:5173/DemoDashboard/DemoFailure');
        }
    } catch (error) {
        console.error('Error while checking payment status:', error);
        res.status(500).send({
            message: 'An error occurred while processing the payment status.',
            success: false
        });
    }
});





app.listen(8000, () => { console.log('Server is running on port 8000') });

