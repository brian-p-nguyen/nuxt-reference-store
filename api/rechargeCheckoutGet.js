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

    const token = body.data?.token

    // Recharge Checkout GET request
    const rechargeResponse = axios.get(rechargeAPI + "checkouts/" + token,{
            headers:{
                'Content-Type':'application/json',
                'X-Recharge-Access-Token': rechargeAPIToken
            }
        })

    // Process response
    if (rechargeResponse.status == '200' && rechargeResponse.data)
    {
        // Process Results
        const checkoutToken = rechargeResponse.data?.checkout?.token   // unique recharge checkout token
        const redirectURL = generateUrl(checkoutToken)

        // Set successful response
        response.status(200).json({checkoutToken:checkoutToken, redirectURL:redirectURL})
    } else {
        response.status(rechargeResponse.status).json({error: "Error sending GET recharge request"})
    }
    
    return []
}

function generateUrl (token){
    const rechargeBaseCheckoutURL = process.env.RECHARGE_CHECKOUT_BASE_URL
    const shopifyDomain = process.env.SHOPIFY_DOMAIN
    return rechargeBaseCheckoutURL + token + '?myshopify_domain=' + shopifyDomain
}