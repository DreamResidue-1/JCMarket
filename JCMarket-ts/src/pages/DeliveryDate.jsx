import dayjs from 'dayjs';
import { resolveBackendAssetUrl } from '../lib/assets';
import { useLanguage } from '../i18n/LanguageContext';
export function DeliveryDate({order ,orderProduct}){
  const { t } = useLanguage();
  const totalDeliveryTimeMs = orderProduct.estimatedDeliveryTimeMs - order.orderTimeMs;
  const timePassedMs = dayjs().valueOf() - order.orderTimeMs;
  const deliveryPresent = (timePassedMs / totalDeliveryTimeMs ) * 100;
  return (
    <>  
           <div className="delivery-date">
            { deliveryPresent >= 100 ? `${t('deliveredOn')} ` : `${t('arrivingOn')} `}
             {dayjs(orderProduct.estimatedDeliveryTimeMs).format('dddd, MMMM D')}
          </div>

          <div className="product-info">
            {orderProduct.product.name}
          </div>

          <div className="product-info">
            {t('quantity')}: {orderProduct.quantity}
          </div>

          <img className="product-image" src={resolveBackendAssetUrl(orderProduct.product.image)} />

          <div className="progress-labels-container">
            <div className={`progress-label ${deliveryPresent < 33 ? 'current-status':''}`}> 
              {t('preparing')}
            </div>
            <div className={`progress-label ${ deliveryPresent >= 33 && deliveryPresent < 100? 'current-status':''}`}>
              {t('shipped')}
            </div>
            <div className={`progress-label ${deliveryPresent >= 100 ? 'current-status':''}`}>
              {t('delivered')}
            </div>
          </div>

          <div className="progress-bar-container">
            <div className="progress-bar" style={{width: `${deliveryPresent}%`}}></div>
          </div>
          </>
  )
}
