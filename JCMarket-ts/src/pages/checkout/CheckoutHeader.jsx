import { NavLink } from 'react-router'
import { useLanguage } from '../../i18n/LanguageContext'
import { resolveBackendAssetUrl } from '../../lib/assets'
import './CheckoutHeader.css'
export function CheckoutHeader({cart}){
  const { t } = useLanguage();
  let totalQuantity = 0;
  cart.forEach(cartItem => {
  totalQuantity += cartItem.quantity;
  })
  return (
    <>
       <div className="checkout-header">
        <div className="header-content">
          <div className="checkout-header-left-section">
            <NavLink to="/"  >
              {/* <img className="logo" src="/images/logo1.png" />
              <img className="mobile-logo" src="/images/mobile-logo1.png" /> */}
              <span className="logo-text">JCMarket</span>
              <span className="mobile-logo-text">JC</span>
            </NavLink>
          </div>

          <div className="checkout-header-middle-section">
            {t('checkout')} (<NavLink className="return-to-home-link"
              to="/">{t('itemCount', { count: totalQuantity })} </NavLink>)
          </div>

          <div className="checkout-header-right-section">
            <img src={resolveBackendAssetUrl('/images/icons/checkout-lock-icon.png')} />
          </div>
        </div>
      </div>
    </>
  )
}
