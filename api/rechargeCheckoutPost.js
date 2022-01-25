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

    // Map Checkout Items
    console.log("mapping checkout items")
    console.log(body)
    const mappedData = body.cartItems.map((item) => {
        const lineItem = {
            // Decode Shopify's variantID
            external_variant_id: {"ecommerce": decodeBase64ProductVariantId(item.variantId)},
            quantity: item.quantity,
        }

        return lineItem
    });

    // Recharge Checkout POST request
    console.log("making post request")

    const axios = require('axios');
    const options = {
        method: 'POST',
        url: 'https://api.rechargeapps.com/checkouts',
        headers: {
            'Content-Type': 'application/json',
            'X-Recharge-Access-Token': rechargeAPIToken,
            'X-Recharge-Version': '2021-11'
        },
        data: {
            line_items: [...mappedData]
        }
    };
        
    axios.request(options).then(function (rechargeResponse) {
        console.log(rechargeResponse.data);
        
        // Process Results
        const checkoutToken = rechargeResponse?.data?.checkout?.token   // unique recharge checkout token
        const redirectURL = generateUrl(checkoutToken)

        console.log(redirectURL)

        // Set successful response
        response.status(200).json({'checkoutToken':checkoutToken, 'redirectURL':redirectURL})
    }).catch(function (error) {
        console.log(error);
    });
}

function generateUrl (token){
    const rechargeBaseCheckoutURL = process.env.RECHARGE_CHECKOUT_BASE_URL
    const shopifyDomain = process.env.SHOPIFY_DOMAIN
    return rechargeBaseCheckoutURL + token + '?myshopify_domain=' + shopifyDomain
}

function decodeBase64ProductVariantId(encodedId) {
    console.log(encodedId)
    const decodedId = Buffer.from(encodedId, 'base64').toString('ascii')
    const decodedID = decodedId.split('gid://shopify/ProductVariant/')[1]
    console.log(decodedID)
    return decodedID
}