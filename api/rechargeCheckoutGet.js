export default function handler(request, response) {
    const rechargeAPIToken = process.env.RECHARGE_TOKEN
    const rechargeAPI = process.env.RECHARGE_API
    let body

    // Obtain request body for processing
    try{
        body = request.body
    } catch (error) {
        return response.status(400).json({ error: "Error retrieving request body" });
    }

    const token = body.data?.token

    // Recharge Checkout GET request
    console.log("Making post request")

    const axios = require('axios');
    const options = {
        method: 'GET',
        url: 'https://api.rechargeapps.com/checkouts/' + token,
        headers: {
            'X-Recharge-Access-Token': rechargeAPIToken,
            'X-Recharge-Version': '2021-11'
        }
    };
    axios.request(options).then(function (rechargeResponse) {
        console.log(rechargeResponse.data);
        
        // Process Results
        const checkoutToken = rechargeResponse?.data?.checkout?.token   // unique recharge checkout token
        const redirectURL = generateUrl(checkoutToken)

        // Set successful response
        response.status(200).json({'redirectURL':redirectURL, 'id':checkoutToken, 'checkout':rechargeResponse.data.checkout})
    }).catch(function (error) {
        console.log(error);
    });
}

function generateUrl (token){
    const rechargeBaseCheckoutURL = process.env.RECHARGE_CHECKOUT_BASE_URL
    const shopifyDomain = process.env.SHOPIFY_DOMAIN
    return rechargeBaseCheckoutURL + token + '?myshopify_domain=' + shopifyDomain
}