const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const axios = require("axios");
const bodyParser = require("body-parser");

const { url } = require("inspector");
let key = "3064fbf3-4d48-458a-8e6d-c086629916f5";
let merchant_id = "M22N5T3LZUUAV";

const app = express();

const corsOptions = {
  origin: "https://firstlist.in",
  methods: ["GET", "POST"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-VERIFY",
    "X-MERCHANT-ID",
  ],
  credentials: true,
};

app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  bodyParser.urlencoded({
    extended: false,
  })
);

const test_URL = "https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/pay";
const test_URL2 = "https://api-preprod.phonepe.com/apis/pg-sandbox/";
const prod_URL = "https://api.phonepe.com/apis/hermes/pg/v1/pay";

app.get("/", (req, res) => {
  res.send("Hello from Express.js");
});

app.post("/order", async (req, res) => {
  try {
    // console.log(req.body);

    // let merchantTransactionId = req.body.transactionId
    const transactionId = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const data = {
      merchantTransactionId: transactionId,
      merchantId: merchant_id,
      merchantUserId: req.body.MID,
      amount: req.body.amount * 100,
      currency: req.body.currency,
      redirectUrl: `https://firstlist.in/`,
      redirectMode: "REDIRECT",
      paymentInstrument: {
        type: "PAY_PAGE",
      },

      // "email": req.body.email,
      // "merchantTransactionNote": req.body.merchantTransactionNote,
      // "paymentMethods": req.body.paymentMethods,

      // "customer": {
      //     "name": req.body.customer.name,
      //     "email": req.body.customer.email,
      //     "phone": req.body.customer.phone
      // }
    };

    console.log("data", data);

    const payload = JSON.stringify(data);
    const payload64 = Buffer.from(payload).toString("base64");
    const keyIndex = 1;
    const string = payload64 + "/pg/v1/pay" + key;
    const sha256 = crypto.createHash("sha256").update(string).digest("hex");
    const checksum = sha256 + "###" + keyIndex;

    console.log("Reached in backend");
    const options = {
      method: "POST",
      url: prod_URL,
      headers: {
        accept: "application/json",
        "Content-Type": "application/json",
        "X-VERIFY": checksum,
      },
      data: {
        request: payload64,
      },
    };
    console.log("=================");
    try {
      console.log("options", options);
      const response = await axios.request(options);
      console.log("Axios response:", response.data);
      console.log(",,,,,,,,,,,,,,,,,,,,,");
      const redirectUrl =
        response.data?.data?.instrumentResponse?.redirectInfo?.url;
      if (redirectUrl) {
        return res.json({
          transactionId: transactionId,
          redirectURL: redirectUrl,
        });
      } else {
        console.error("Invalid response format:", response.data);
        return res.status(500).json({
          message: "Invalid response from payment gateway",
          success: false,
        });
      }
    } catch (error) {
      console.error("Request failed:", error.message);
      if (error.response) {
        console.error("Error response:", error.response.data);
      }
      return res.status(500).json({
        message: "Payment request failed",
        success: false,
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: error.message,
      success: false,
    });
  }
});

app.post("/status/:txnId", async (req, res) => {
  // Extract transaction ID from route parameters
  const transactionId = req.params.txnId;
  const merchantTransactionId = transactionId || req.body.merchantTransactionId; // Fallback to body if not in params
  const merchantId = req.body.merchantId;

  console.log("Status ID:", merchantTransactionId);
  console.log("Merchant ID:", merchantId);

  if (!merchantTransactionId || !merchantId) {
    return res
      .status(400)
      .json({ error: "Missing transactionId or merchantId" });
  }

  const key = "your_secret_key"; // Replace with your actual key
  const keyIndex = 1;

  // Prepare checksum string
  const string = `/pg/v1/status/${merchantId}/${merchantTransactionId}` + key;
  const sha256 = crypto.createHash("sha256").update(string).digest("hex");
  const checksum = sha256 + "###" + keyIndex;

  const options = {
    method: "GET",
    url: `https://api.phonepe.com/apis/hermes/pg/v1/status/${merchantId}/${merchantTransactionId}`,
    headers: {
      accept: "application/json",
      "X-VERIFY": checksum,
      "X-MERCHANT-ID": `${merchantId}`,
    },
  };

  // Send request to PhonePe API
  try {
    const response = await axios.request(options);
    console.log("Response:", response.data);

    if (response.data.success === true) {
      return res.redirect("https://firstlist.in/DemoDashboard/DemoSuccess");
    } else {
      return res.redirect("https://firstlist.in/DemoDashboard/DemoFailure");
    }
  } catch (error) {
    console.error("Error:", error.message);
    return res
      .status(500)
      .json({
        error: "Failed to fetch transaction status",
        details: error.message,
      });
  }
});

app.listen(8000, () => {
  console.log("Server is running on port 8000");
});
