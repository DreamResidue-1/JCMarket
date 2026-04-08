import api from '../../lib/api'
import { useState, useEffect } from 'react'
import { CheckoutHeader } from './CheckoutHeader';
import { OrderSummary } from './orderSummary/OrderSummary';
import { PaymentSummary } from './PaymentSummary';
import './CheckoutPage.css';


export function CheckoutPage({ loadCart ,cart }) {
  const [deliveryOptions, setDeliveryOptions] = useState([])
  const [paymentSummary , setPaymentSummary] = useState(null)

  useEffect(() => {
  const fetchCheckoutData = async ()=>{
    let response =  await api.get('/api/delivery-options?expand=estimatedDeliveryTime')
        setDeliveryOptions(response.data);
    }
    fetchCheckoutData();
  }, [])

  useEffect(()=>{
    (async ()=>{
      const response =  await api.get('/api/payment-summary')
      setPaymentSummary(response.data);
    })()
  }, [cart])




  return (
    <>
      <title>Checkout</title>

      <CheckoutHeader  cart={cart}/>
      <div className="checkout-page">
        <div className="page-title">Review your order</div>

        <div className="checkout-grid">
        
        <OrderSummary loadCart={loadCart} deliveryOptions={deliveryOptions}  cart={cart}/>

        <PaymentSummary  loadCart={loadCart} paymentSummary={paymentSummary}/>
        </div>
      </div>
    </>
  )
}
