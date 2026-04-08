import api from '../../../lib/api'
import dayjs from 'dayjs'
import {formatMoney } from '../../../utils/Money';



export function DeliveryOptions({deliveryOptions , cartItem , loadCart}) {
  return (
    <div className="delivery-options">
      <div className="delivery-options-title">
        Choose a delivery option:
      </div>
      {deliveryOptions.map(deliveryOption => {
        let priceString = 'Free Shipping';
        if (deliveryOption.priceCents > 0) {
          priceString = `${formatMoney(deliveryOption.priceCents)} - Shipping`
        }

        const updateDeliveryOption = async () =>{
          await api.put(`/api/cart-items/${cartItem.productId}`, {
            deliveryOptionId: deliveryOption.id
          })
          await loadCart();
        }

        return (
          <div key={deliveryOption.id} className="delivery-option" onClick={updateDeliveryOption}>
            <input type="radio"
             checked={deliveryOption.id === cartItem.deliveryOptionId ? 'ckecked' : ''}
             onChange={()=>{}}
              className="delivery-option-input"
              name={`delivery-option-${cartItem.product.id}`} />
            <div>
              <div className="delivery-option-date">
                {dayjs(deliveryOption.estimatedDeliveryTimeMs).format('dddd, MMMM D')}
              </div>
              <div className="delivery-option-price">
                {priceString}
              </div>
            </div>
          </div>
        )
      })}

    </div>
  )
}
