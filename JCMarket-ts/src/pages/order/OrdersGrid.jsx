import { OrdersDetails } from "./OrdersDetails";
import { OrdersHeader } from "./OrdersHeader";


export function OrdersGrid({loadCart,orders}) {

  return (
    <div className="orders-grid">
      {orders.map(order => {
        return (
          <div className="order-container"
            key={order.id}
          >

         <OrdersHeader order={order}/>

         <OrdersDetails loadCart={loadCart} order={order} />
          </div>

        )
      })}
    </div>
  )
}