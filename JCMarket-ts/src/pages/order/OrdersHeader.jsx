import dayjs from 'dayjs';
import {formatMoney } from '../../utils/Money';
import { useLanguage } from '../../i18n/LanguageContext';


export function OrdersHeader({order}){
  const { t } = useLanguage();

  return (
         <div className="order-header">
                  <div className="order-header-left-section">
                    <div className="order-date">
                      <div className="order-header-label">{t('orderPlaced')}:</div>
                      <div>{dayjs(order.orderTimeMs).format('MMMM D')}</div>
                    </div>
                    <div className="order-total">
                      <div className="order-header-label">{t('total')}:</div>
                      <div>{formatMoney(order.totalCostCents)}</div>
                    </div>
                  </div>

                  <div className="order-header-right-section">
                    <div className="order-header-label">{t('orderId')}:</div>
                    <div>{order.id}</div>
                  </div>
                </div>

  )
}

