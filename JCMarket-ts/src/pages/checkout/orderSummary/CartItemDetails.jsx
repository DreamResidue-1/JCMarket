import api from '../../../lib/api';
import { resolveBackendAssetUrl } from '../../../lib/assets';
import { useState , useRef} from 'react';
import { formatMoney } from '../../../utils/Money';

export function CartItemDetails({ cartItem, loadCart }) {
  const inputRef = useRef(null);
  const [isUpdatingQuantity, setIsUpdatingQuantity] = useState(false);
  const [quantity, setQuantity] = useState(cartItem.quantity);
  
  const deleteCartItem = async () => {
    await api.delete(`/api/cart-items/${cartItem.productId}`);
    await loadCart();
  };


const handleInput = () => {
  if (inputRef.current) {
    const newWidth = 20 + inputRef.current.value.length * 8;
    inputRef.current.style.width = `${newWidth}px`;
  }
};
  const updateQuantity = async () => {
    // Switch between true and false for isUpdatingQuantity.
    if (isUpdatingQuantity) {

      await api.put(`/api/cart-items/${cartItem.productId}`, {
        quantity:  quantity ?  Number(quantity) : 1,
      });
      await loadCart();
      setIsUpdatingQuantity(false);
    } else {
      setIsUpdatingQuantity(true);
    }
  };
  
  const updateQuantityInput = (event) => {
    
    setQuantity(event.target.value);
  };

  return (
    <>
      <img className="product-image"
        src={resolveBackendAssetUrl(cartItem.product.image)} />

      <div className="cart-item-details">
        <div className="product-name">
          {cartItem.product.name}
        </div>
        <div className="product-price">
          {formatMoney(cartItem.product.priceCents)}
        </div>
        <div className="product-quantity">
          <span>
            Quantity: {isUpdatingQuantity
              ? <input type="text" className="quantity-textbox" ref={inputRef} onInput={handleInput}
                style={{width:`50px`}}
                  value={quantity} onChange={updateQuantityInput}
                />
              : <span className="quantity-label">{cartItem.quantity}</span>
            }
          </span>
          <span className="update-quantity-link link-primary" 
            onClick={updateQuantity}>
            Update
          </span>
          <span className="delete-quantity-link link-primary"
            onClick={deleteCartItem}>
            Delete
          </span>
        </div>
      </div>
    </>
  );
}
