
import { OrderProduct } from './OrderProduct';

export function OrdersDetails({loadCart,order}){
  return (
        <div className="order-details-grid">

              {order.products.map(orderProduct => {
                
                return (
                 <OrderProduct key={orderProduct.product.id} loadCart={loadCart} order={order} orderProduct={orderProduct} />
                )
              })}

            </div>
  )
}

            
          
       