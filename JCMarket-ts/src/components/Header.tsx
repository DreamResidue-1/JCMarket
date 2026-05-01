import {  useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { useAuth } from '../hooks/useAuthHook';
import { getAvatarInitials, readAvatarFile } from '../lib/avatar';
import { resolveBackendAssetUrl } from '../lib/assets';
import { consumeCompanyNotice } from '../lib/companyNotice';
import './Header.css';

type HeaderProps = {
  cart: {
   productId : number;
   quantity: number;
   deliveryOptionId: number;
  }[];
};

export function Header({ cart }: HeaderProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, logout, updateProfileImage } = useAuth();
  const [companyNotice, setCompanyNotice] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isUpdatingAvatar, setIsUpdatingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const canManageStore = Boolean(
    user?.permissions.includes('create_product')
    || user?.permissions.includes('manage_users')
  );

  // I need to use a different variable name since "search"
  // is already being used below.
  const searchText = searchParams.get('search');

  // || '' is a shortcut. It means if searchText does not exist
  // it will use a default value of ''.
  const [search, setSearch] = useState(searchText || '');

  useEffect(() => {
    setSearch(searchText || '');
  }, [searchText]);

  useEffect(() => {
    const message = consumeCompanyNotice();

    if (!message) {
      return;
    }

    setCompanyNotice(message);
  }, []);

  useEffect(() => {
    if (!companyNotice) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setCompanyNotice(null);
    }, 5000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [companyNotice]);

  useEffect(() => {
    setAvatarPreview(user?.picture || null);
  }, [user?.picture]);

  const updateSearchInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value);
  };
  
  
  const searchProducts = (event?: React.FormEvent<HTMLFormElement>) => {
    event?.preventDefault();

    const trimmedSearch = search.trim();
    const nextParams = new URLSearchParams();

    if (trimmedSearch) {
      nextParams.set('search', trimmedSearch);
    }

    navigate(nextParams.toString() ? `/?${nextParams.toString()}` : '/');
  };

  const openAvatarPicker = () => {
    if (!user || isUpdatingAvatar) {
      return;
    }

    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      setIsUpdatingAvatar(true);
      const nextImage = await readAvatarFile(file);
      setAvatarPreview(nextImage);
      await updateProfileImage({ picture: nextImage });
      setCompanyNotice('Message from JCMarket: Your profile image was updated.');
    } catch (error) {
      setAvatarPreview(user?.picture || null);
      const message = error instanceof Error ? error.message : 'Profile image update failed.';
      setCompanyNotice(message);
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      setIsUpdatingAvatar(false);
    }
  };

  let totalQuantity = 0;

  cart.forEach((cartItem) => {
    totalQuantity += cartItem.quantity;
  });

  return (
    <>
   
      <div className="header">
        <div className={` ${user? "image-active": "left-section "} `} >
            {user ? (
          
         
           <div className="user-info">
              <button
                type="button"
                className="user-avatar-button"
                onClick={openAvatarPicker}
                disabled={isUpdatingAvatar}
                title={isUpdatingAvatar ? 'Updating profile image...' : 'Update profile image'}
              >
                {avatarPreview ? (
                  <img src={avatarPreview} alt={user.email} className="user-avatar" />
                ) : (
                  <div className="user-avatar user-avatar-fallback">
                    {getAvatarInitials(user.email)}
                  </div>
                )}
                <span className="user-avatar-edit">{isUpdatingAvatar ? '...' : '+'}</span>
              </button>
              <input
                ref={fileInputRef}
                className="user-avatar-input"
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
              />
              <span className="user-name">{user.email}</span>
              <button type="button" className="logout-link header-link" onClick={logout}>
                <span className="logout-text">Logout</span>
              </button>
            </div>

            
           ) : (
          <></>
          )}
       
      {companyNotice && (
        <div className="company-notice">
          <span>{companyNotice}</span>
          <button
            type="button"
            onClick={() => {
              setCompanyNotice(null);
            }}
          >
            x
          </button>
        </div>
      )}

          <Link to="/" className="header-link">
           { //<img className="logo"
             // src="/images/logo-white.png" />
            //<img className="mobile-logo"
             // src="/images/mobile-logo-white.png" /> 
             }
              <span className="logo-text" style={{color: "white"}}>JCMarket</span>
              <span className="mobile-logo-text" style={{color: "white"}}>JC</span>
          </Link>
        </div>

        <form className="middle-section" onSubmit={searchProducts}>
          <input className="search-bar" type="text" placeholder="Search"
            value={search} onChange={updateSearchInput} />

          <button className="search-button"
            type="submit">
            <img className="search-icon" src={resolveBackendAssetUrl('/images/icons/search-icon.png')} />
          </button>
        </form>

        <div className={` ${user? "image-not-active": "right-section"}`}>
          <Link className="orders-link header-link" to="/orders">
            <span className="orders-text">Orders</span>
          </Link>

          {canManageStore && (
            <Link className="admin-link header-link" to="/admin">
              <span className="admin-text">Admin</span>
            </Link>
          )}

          {user ? (
             <></>
          ) : (
            <Link className="login-link header-link" to="/login">
              <span className="login-text">Login</span>
            </Link>
          )}

          <Link className="cart-link header-link" to="/checkout">
            <img className="cart-icon" src={resolveBackendAssetUrl('/images/icons/cart-icon.png')} />
            <div className="cart-quantity">&#60;{totalQuantity}&#62;</div>
          </Link>
        </div>
      </div>

      
    </>
  );
}
