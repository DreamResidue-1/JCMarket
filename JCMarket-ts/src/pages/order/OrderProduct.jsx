import api from '../../lib/api';
import {  useState } from "react"
import { resolveBackendAssetUrl } from '../../lib/assets';
import dayjs from 'dayjs';
import { NavLink , useNavigate } from 'react-router'


export function OrderProduct ({orderProduct , order, loadCart}) {
  const navigate = useNavigate();
  const [added, setAdded] =useState(false);
  const addToCart = async()=>{
                           setAdded(!added);
                           await api.post('/api/cart-items', {
                              productId: orderProduct.product.id,
                              quantity: 1
                            })
                            await loadCart();
                            setTimeout(()=>{
                              setAdded(false) 
                              navigate('/checkout');
                            }, 2000)
                }
  return (
    
                  <>
                    <div className="product-image-container">
                      <img src={resolveBackendAssetUrl(orderProduct.product.image)} />
                    </div>

                    <div className="product-details">
                      <div className="product-name">
                        {orderProduct.product.name}
                      </div>
                      <div className="product-delivery-date">
                        Arriving on: {
                          dayjs(orderProduct.product.estimatedDeliveryTimeMs).format('MMMM D')
                        }
                      </div>
                      <div className="product-quantity">
                        Quantity: {orderProduct.quantity}
                      </div>
                      <button className="buy-again-button button-primary">
                        <img className="buy-again-icon" src={resolveBackendAssetUrl('/images/icons/buy-again.png')} style={{opacity: added? 1:0 }} />
                        <span className="buy-again-message" onClick={addToCart}>Add to Cart</span>
                      </button>
                    </div>

                    <div className="product-actions">
                      <NavLink to={`/tracking/${order.id}/${orderProduct.product.id}`}>
                        <button className="track-package-button button-secondary">
                          Track package
                        </button>
                      </NavLink>
                    </div>

                  </>
  )
}
