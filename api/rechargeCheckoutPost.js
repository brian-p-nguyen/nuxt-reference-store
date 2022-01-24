import { axios } from 'axios'

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
    const mappedData = body.cartItems.map((item) => {
        const lineItem = {
            // Decode Shopify's variantID
            'external_variant_id': decodeBase64ProductVariantId(item.variantId),
            'quantity': item.quantity,
            'properties': {}
        }

        return lineItem
    });
    
    // Recharge Checkout POST request
    try {
        const rechargeResponse = axios.post(rechargeAPI + "checkouts", {line_items: mappedData}, 
        {
            headers:{
                'Content-Type':'application/json',
                'X-Recharge-Access-Token': rechargeAPIToken
            }
        })

        if (rechargeResponse.data)
        {
            // Process Results
            const checkoutToken = rechargeResponse?.data?.checkout?.token   // unique recharge checkout token
            const redirectURL = generateUrl(checkoutToken)

            // Set successful response
            response.status(200).json({checkoutToken:checkoutToken, redirectURL:redirectURL})
        }
    } catch (error) {
        console.error(error);
        response.status(rechargeResponse.status).json({error: "Error sending POST recharge request"})
    }
}

function generateUrl (token){
    const rechargeBaseCheckoutURL = process.env.RECHARGE_CHECKOUT_BASE_URL
    const shopifyDomain = process.env.SHOPIFY_DOMAIN
    return rechargeBaseCheckoutURL + token + '?myshopify_domain=' + shopifyDomain
}

function decodeBase64ProductVariantId(encodedId) {
    const decodedId = Buffer.from(encodedId, 'base64').toString('ascii')
    return decodedId.split('gid://shopify/ProductVariant/')[1]
}