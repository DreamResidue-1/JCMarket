import dayjs from 'dayjs'

export function DeliveryDate({deliveryOptions, cartItem}){
    const SelectedDeliveryOption = deliveryOptions.find(deliveryOption => deliveryOption.id === cartItem.deliveryOptionId)

  return (
     <div className="delivery-date">
              Delivery date: {dayjs(SelectedDeliveryOption.estimatedDeliveryTimeMs).format('dddd, MMMM D')}
      </div>
  )
}