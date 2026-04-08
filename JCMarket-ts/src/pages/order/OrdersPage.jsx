import api from '../../lib/api'
import { OrdersGrid } from './OrdersGrid'
import { useState, useEffect } from 'react'
import { Header } from '../../components/Header'
import './OrdersPage.css'


export function OrdersPage({loadCart, cart }) {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const fetchOrdersData = async () => {
      const response = await api.get('/api/orders?expand=products')
      setOrders(response.data);
    }
    fetchOrdersData();
  }, [])

  return (
    <>
      <title>Orders</title>
      <Header cart={cart} />
      <div className="orders-page">
        <div className="page-title">Your Orders</div>
      
      <OrdersGrid loadCart={loadCart} orders={orders} />
        
      </div>
    </>
  )
}



 

