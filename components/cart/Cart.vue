<template>
  <div
    v-show="showCart"
    class="fixed inset-0 overflow-hidden z-20"
    aria-labelledby="slide-over-title"
    role="dialog"
    aria-modal="true"
  >
    <div class="absolute inset-0 overflow-hidden">
      <cart-overlay />
      <cart-drawer />
    </div>
  </div>
</template>

<script>
import {
  inject,
  onMounted,
  provide,
  reactive,
  ref,
  useContext,
  watch
} from "@nuxtjs/composition-api";
import { useCartProvider } from "@nacelle/vue";
import CartOverlay from "./CartOverlay.vue";
import CartDrawer from "./CartDrawer.vue";
import axios from "axios";

export default {
  name: "Cart",
  components: { CartOverlay, CartDrawer },
  props: {
    content: {
      type: Object,
      required: true
    }
  },
  setup(props) {
    const { cart } = useCartProvider();
    const showCart = ref(false);
    const cartOpen = inject("cartOpen");
    const { $shopifyCheckout } = useContext();
    const { clearCart } = useCartProvider();
    const initialCheckoutData = {
      id: "",
      url: "",
      completed: false
    };
    const checkoutData = reactive(initialCheckoutData);
    const isCheckingOut = ref(false);

    const updateCheckoutData = newData => {
      if (newData?.id !== checkoutData.id) {
        window.localStorage.setItem("checkoutId", newData.id);
      }

      Object.keys(newData).forEach(
        property => (checkoutData[property] = newData[property])
      );
    };

    onMounted(async () => {
      let checkoutId = window.localStorage.getItem("checkoutId") || "";

      if (checkoutId) {
        const apiResponse = axios.get("/api/rechargeCheckoutGet" + '?token=' + checkoutId).then(function (response) {
          if(response.data.checkout && response.data.checkout?.completed_at)
          {
            clearCart();
            updateCheckoutData(initialCheckoutData);            
          } else {
            updateCheckoutData(response.data.checkout);
          }
        }).catch(function (error){
          $shopifyCheckout.get({ id: checkoutId }).then(checkout => {
            if (checkout.completed) {
              clearCart();
              updateCheckoutData(initialCheckoutData);
            } else {
              updateCheckoutData(checkout);
            }
          }).catch(error => {
            console.log(error);
            updateCheckoutData(initialCheckoutData);  
          })
        })
      }
    });

    const processCheckout = () => {
      let isRecharge
      isCheckingOut.value = true;
    
      for(const lineItem of cart.lineItems) {
        if (lineItem.product.metafields){
          lineItem.product.metafields.forEach((metafield) => {
            console.log(metafield.key)
            if (metafield.key && (metafield.key == 'charge_interval_frequency' || metafield.key == 'order_interval_frequency' || metafield.key == 'order_interval_unit')) {
              isRecharge=true
            }
          })
        }

          if (!isRecharge && lineItem.variant.metafields){
            lineItem.variant.metafields.forEach((metafield) => {
              console.log(metafield.key)
              if (metafield.key && (metafield.key == 'charge_interval_frequency' || metafield.key == 'order_interval_frequency' || metafield.key == 'order_interval_unit')) {
                isRecharge=true
              }
            })
          }
      }

      if (isRecharge){
        const body = {
          cartItems: cart.lineItems.map(cartItem => ({
              quantity: cartItem.quantity,
              variantId: cartItem.variant.id,
              metafields: {
                ...cartItem.product.metafields,
                ...cartItem.variant.metafields
              }
            }))
        }

        const apiResponse = axios.post("/api/rechargeCheckoutPost", body)
        .then(function (response) {
          console.log(response.data)
          if (response.data.redirectURL)
          {
            window.location.href = response.data.redirectURL;
          }
        }).catch(err => {
          console.log(apiResponse.status)
          console.log("error posting to checkout");
          isCheckingOut.value = false;

          throw new Error(err);
        })
      } else {
        $shopifyCheckout
          .process({
            cartItems: cart.lineItems.map(cartItem => ({
              quantity: cartItem.quantity,
              variantId: cartItem.variant.id,
              metafields: {
                ...cartItem.product.metafields,
                ...cartItem.variant.metafields
              }
            })),
            id: checkoutData.id
          })
          .then(checkoutData => {
            updateCheckoutData(checkoutData);

            if (checkoutData.url) {
              window.location.href = checkoutData.url;
            }
          })
          .catch(err => {
            isCheckingOut.value = false;

            throw new Error(err);
          });        
      }
    };

    watch(cartOpen, value => {
      if (value) {
        showCart.value = value;
      } else {
        setTimeout(() => {
          showCart.value = value;
        }, 500);
      }
    });

    provide("checkoutData", checkoutData);
    provide("crosssells", props.content?.fields?.crosssells);
    provide("drawer", props.content?.fields?.drawer);
    provide("isCheckingOut", isCheckingOut);
    provide("item", props.content?.fields?.item);
    provide("processCheckout", processCheckout);
    provide("total", props.content?.fields?.total);
    provide("updateCheckoutData", updateCheckoutData);

    return { showCart };
  }
};
</script>
