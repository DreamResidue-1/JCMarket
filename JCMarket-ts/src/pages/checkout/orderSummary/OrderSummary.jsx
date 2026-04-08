

import { DeliveryOptions } from './DeliveryOptions';
import { DeliveryDate } from './DeliveryDate';
import { CartItemDetails } from './CartItemDetails'

export function OrderSummary({loadCart ,cart , deliveryOptions  }) {
  return (
    <div className="order-summary">

      {deliveryOptions.length > 0 && cart.map(cartItem => {
        return (
          <div className="cart-item-container"
            key={cartItem.productId}>
            
            <DeliveryDate  cartItem={cartItem} deliveryOptions={deliveryOptions}  />

            <div className="cart-item-details-grid">
             <CartItemDetails  cartItem={cartItem} loadCart={loadCart}/>
              
             <DeliveryOptions deliveryOptions={deliveryOptions} cartItem={cartItem} loadCart={loadCart}/>
              
            </div>
          </div>
        )
      })}

    </div>
  )
}