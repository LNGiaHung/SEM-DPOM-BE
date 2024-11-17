import axios from 'axios';
import crypto from 'crypto';

// MoMo payment parameters
const accessKey = 'F8BBA842ECF85';
const secretKey = 'K951B6PE1waDMi640xX08PD3vg6EkVlz';
const orderInfo = 'pay with MoMo';
const partnerCode = 'MOMO';
const redirectUrl = 'https://webhook.site/b3088a6a-2d17-4f8d-a383-71389a6c600b';
const ipnUrl = 'https://webhook.site/b3088a6a-2d17-4f8d-a383-71389a6c600b';
const requestType = "payWithMethod";
const amount = '50000';
const orderId = partnerCode + new Date().getTime();
const requestId = orderId;
const extraData = '';
const orderGroupId = '';
const autoCapture = true;
const lang = 'vi';

// Create the raw signature
const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;

// Generate the signature
const signature = crypto.createHmac('sha256', secretKey)
    .update(rawSignature)
    .digest('hex');

// Prepare the request body
const requestBody = {
    partnerCode: partnerCode,
    partnerName: "Test",
    storeId: "MomoTestStore",
    requestId: requestId,
    amount: amount,
    orderId: orderId,
    orderInfo: orderInfo,
    redirectUrl: redirectUrl,
    ipnUrl: ipnUrl,
    lang: lang,
    requestType: requestType,
    autoCapture: autoCapture,
    extraData: extraData,
    orderGroupId: orderGroupId,
    signature: signature
};

// Function to initiate payment
const initiatePayment = async () => {
    try {
        const response = await axios.post('https://test-payment.momo.vn/v2/gateway/api/create', requestBody, {
            headers: {
                'Content-Type': 'application/json',
            }
        });

        console.log(`Status: ${response.status}`);
        console.log(`Headers: ${JSON.stringify(response.headers)}`);
        console.log('Body: ', response.data);
        console.log('Result Code: ', response.data.resultCode);
        
        return response.data; // Return the response data for further processing
    } catch (error) {
        console.error(`Error during payment request: ${error.message}`);
        throw error; // Rethrow the error for handling in the calling function
    }
};

// Export the initiatePayment function
export default initiatePayment;
