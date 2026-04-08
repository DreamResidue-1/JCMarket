import api from '../../lib/api'
import { useNavigate } from 'react-router';
import {formatMoney} from '../../utils/Money'



export function PaymentSummary({ loadCart , paymentSummary}){
const navigate = useNavigate();

  const createOrder = async () => {
    await api.post('/api/orders');
    await loadCart();
    navigate('/orders');
  };
  return (
          <div className="payment-summary">
            <div className="payment-summary-title">
              Payment Summary
            </div>
           {paymentSummary && (<>
           
            <div className="payment-summary-row">
              <div>Items ({paymentSummary.totalItems}):</div>
              <div className="payment-summary-money">{
              formatMoney(paymentSummary.productCostCents)}</div>
            </div>

            <div className="payment-summary-row">
              <div>Shipping &amp; handling:</div>
              <div className="payment-summary-money">{formatMoney(paymentSummary.shippingCostCents)}</div>
            </div>

            <div className="payment-summary-row subtotal-row">
              <div>Total before tax:</div>
              <div className="payment-summary-money">{formatMoney(paymentSummary.totalCostBeforeTaxCents)}</div>
            </div>

            <div className="payment-summary-row">
              <div>Estimated tax (10%):</div>
              <div className="payment-summary-money">{formatMoney(paymentSummary.taxCents)}</div>
            </div>

            <div className="payment-summary-row total-row">
              <div>Order total:</div>
              <div className="payment-summary-money">{formatMoney(paymentSummary.totalCostCents)}</div>
            </div>

            <button className="place-order-button button-primary" onClick={createOrder}>
              Place your order
            </button>
           </>)}
          </div>
  )
}
