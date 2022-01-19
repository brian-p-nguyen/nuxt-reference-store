import { axios } from 'axios'

const subscriptionKeys = [
    'shipping_interval_frequency',
    'shipping_interval_unit_type',
    'charge_interval_frequency',
    'charge_interval_unit_type',
    'first_recurring_charge_delay',
    'number_charges_until_expiration',
    'charge_on_day_of_month',
    'charge_on_day_of_week',
    'charge_delay',
    'order_interval_frequency',
    'order_interval_unit',
    'cutoff_day_of_month',
    'cutoff_day_of_week',
    'expire_after_specific_number_of_charges',
    'order_day_of_month',
    'order_day_of_week',
  ]

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
            'variantID': decodeBase64ProductVariantId(item.variantId),
            'quantity': item.quantity,
            'properties': {}
        }

        return lineItem
    });
    

    // Recharge Checkout POST request
    const rechargeResponse = await axios.post(rechargeAPI + "checkouts", mappedData, 
        {
            headers:{
                'Content-Type':'application/json',
                'X-Recharge-Access-Token': rechargeAPIToken
            }
        })

    if (rechargeResponse.status == '200' && rechargeResponse.data)
    {
        // Process Results
        const checkoutToken = rechargeResponse?.data?.checkout?.token   // unique recharge checkout token
        const redirectURL = generateUrl(checkoutToken)

        // Set successful response
        response.status(200).json({checkoutToken:checkoutToken, redirectURL:redirectURL})
    } else {
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