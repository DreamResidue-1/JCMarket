import api from '../lib/api';
import { useEffect , useState } from  'react'
import  { useParams , NavLink} from 'react-router';
import  {Header} from '../components/Header'
import { DeliveryDate } from './DeliveryDate';
import './TrackingPage.css'


export function TrackingPage({cart}) {
  const {orderId , productId } = useParams();
  const [order , setOrder] = useState(null);


  useEffect(() => {
    const fetchTrackingData= async ()=>{
      const response = await api.get(`/api/orders/${orderId}?expand=products`);
      setOrder(response.data)
    }
    fetchTrackingData();
  },[orderId])
  
  if(!order){
    return null;
  }

  const orderProduct =  order.products.find(p => p.productId === productId)

  return (
    <>
      <title>Tracking</title>
      <Header cart={cart}/>
      <div className="tracking-page">
        <div className="order-tracking">
          <NavLink className="back-to-orders-link link-primary" to="/orders">
            View all orders
          </NavLink>
  
         <DeliveryDate order ={order} orderProduct={orderProduct}/>

        </div>
      </div>
    </>
  )
}
