import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router';
import { useAuth } from '../hooks/useAuthHook';
import { useLanguage } from '../i18n/LanguageContext';
import { getAvatarInitials, readAvatarFile } from '../lib/avatar';
import { resolveBackendAssetUrl } from '../lib/assets';
import { consumeCompanyNotice } from '../lib/companyNotice';
import './Header.css';

type HeaderProps = {
  cart: {
    productId: number;
    quantity: number;
    deliveryOptionId: number;
  }[];
};

export function Header({ cart }: HeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user, logout, updateProfileImage } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [companyNotice, setCompanyNotice] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isUpdatingAvatar, setIsUpdatingAvatar] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const canManageStore = Boolean(
    user?.permissions.includes('create_product')
    || user?.permissions.includes('manage_users')
  );
  const searchText = searchParams.get('search');
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

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMenuOpen(false);
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMenuOpen]);

  const updateSearchInput = (event: ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value);
  };

  const searchProducts = (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault();

    const trimmedSearch = search.trim();
    const nextParams = new URLSearchParams();

    if (trimmedSearch) {
      nextParams.set('search', trimmedSearch);
    }

    navigate(nextParams.toString() ? `/?${nextParams.toString()}` : '/');
    setIsMenuOpen(false);
  };

  const openAvatarPicker = () => {
    if (!user || isUpdatingAvatar) {
      return;
    }

    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      setIsUpdatingAvatar(true);
      const nextImage = await readAvatarFile(file);
      setAvatarPreview(nextImage);
      await updateProfileImage({ picture: nextImage });
      setCompanyNotice(t('profileImageUpdated'));
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

  const avatarTitle = isUpdatingAvatar ? t('updatingProfileImage') : t('updateProfileImage');

  return (
    <>
      <header className="site-header">
        {companyNotice && (
          <div className="company-notice">
            <span>{companyNotice}</span>
            <button
              type="button"
              aria-label="Close"
              onClick={() => {
                setCompanyNotice(null);
              }}
            >
              x
            </button>
          </div>
        )}

        <div className="site-header__inner">
          <div style={{display: 'flex'}}>

          <Link to="/" className="site-header__brand" aria-label="JCMarket">
            <span className="site-header__brand-desktop">JCMarket</span>
            <span className="site-header__brand-mobile">JC</span> 
          </Link>
      {user && (
              <div className="site-header__user">
                <button
                  type="button"
                  className="site-header__avatar-button"
                  onClick={openAvatarPicker}
                  disabled={isUpdatingAvatar}
                  title={avatarTitle}
                >
                  {avatarPreview ? (
                    <img src={avatarPreview} alt={user.email} className="site-header__avatar-image" />
                  ) : (
                    <div className="site-header__avatar-image site-header__avatar-fallback">
                      {getAvatarInitials(user.email)}
                    </div>
                  )}
                  <span className="site-header__avatar-edit">{isUpdatingAvatar ? '...' : '+'}</span>
                </button>

                <span className="site-header__user-email">{user.email}</span>

                <button type="button" className="site-header__nav-link site-header__logout" onClick={logout}>
                  {t('logout')}
                </button>
              </div>
            )} 
          </div>
        
          <form className="site-header__search" onSubmit={searchProducts}>
            <input
              className="site-header__search-input"
              type="text"
              placeholder={t('searchPlaceholder')}
              value={search}
              onChange={updateSearchInput}
            />

            <button
              className="site-header__search-button"
              type="submit"
              aria-label={t('search')}
            >
              <img
                className="site-header__search-icon"
                src={resolveBackendAssetUrl('/images/icons/search-icon.png')}
                alt=""
              />
            </button>
          </form>

          <div className="site-header__desktop">
            <nav className="site-header__nav" aria-label="Primary">
              <Link className="site-header__nav-link" to="/orders">
                {t('orders')}
              </Link>

              {canManageStore && (
                <Link className="site-header__nav-link" to="/admin">
                  {t('admin')}
                </Link>
              )}

              {!user && (
                <Link className="site-header__nav-link" to="/login">
                  {t('signIn')}
                </Link>
              )}

              <Link className="site-header__cart-link" to="/checkout">
                <img
                  className="site-header__cart-icon"
                  src={resolveBackendAssetUrl('/images/icons/cart-icon.png')}
                  alt=""
                />
                <span className="site-header__cart-count">{totalQuantity}</span>
              </Link>
            </nav>

            <div className="site-header__language-toggle" role="group" aria-label={t('language')}>
              <button
                type="button"
                className={`site-header__language-button ${language === 'en' ? 'is-active' : ''}`}
                onClick={() => {
                  setLanguage('en');
                }}
              >
                En
              </button>
              <button
                type="button"
                className={`site-header__language-button ${language === 'ar' ? 'is-active' : ''}`}
                onClick={() => {
                  setLanguage('ar');
                }}
              >
                Ar
              </button>
            </div>

          
          </div>

          <button
            type="button"
            className="site-header__menu-button"
            aria-expanded={isMenuOpen}
            aria-label={isMenuOpen ? t('closeMenu') : t('openMenu')}
            onClick={() => {
              setIsMenuOpen((currentValue) => !currentValue);
            }}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>

          <input
            ref={fileInputRef}
            className="site-header__avatar-input"
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
          />
        </div>
      </header>

      {isMenuOpen && (
        <>
          <button
            type="button"
            className="site-header__backdrop"
            aria-label={t('closeMenu')}
            onClick={() => {
              setIsMenuOpen(false);
            }}
          />

          <aside className="site-header__drawer" aria-label={t('menu')}>
            <div className="site-header__drawer-header">
              <div>
                <strong>{t('menu')}</strong>
                <p>{user?.email || t('myAccount')}</p>
              </div>
              <button
                type="button"
                className="site-header__drawer-close"
                aria-label={t('closeMenu')}
                onClick={() => {
                  setIsMenuOpen(false);
                }}
              >
                x
              </button>
            </div>

            {user && (
              <div className="site-header__drawer-user">
                <button
                  type="button"
                  className="site-header__avatar-button"
                  onClick={openAvatarPicker}
                  disabled={isUpdatingAvatar}
                  title={avatarTitle}
                >
                  {avatarPreview ? (
                    <img src={avatarPreview} alt={user.email} className="site-header__avatar-image" />
                  ) : (
                    <div className="site-header__avatar-image site-header__avatar-fallback">
                      {getAvatarInitials(user.email)}
                    </div>
                  )}
                  <span className="site-header__avatar-edit">{isUpdatingAvatar ? '...' : '+'}</span>
                </button>

                <div className="site-header__drawer-user-copy">
                  <strong>{t('myAccount')}</strong>
                  <span>{user.email}</span>
                </div>
              </div>
            )}

            <nav className="site-header__drawer-nav">
              <Link className="site-header__drawer-link" to="/orders">
                {t('orders')}
              </Link>

              {canManageStore && (
                <Link className="site-header__drawer-link" to="/admin">
                  {t('admin')}
                </Link>
              )}

              {!user && (
                <Link className="site-header__drawer-link" to="/login">
                  {t('signIn')}
                </Link>
              )}

              <Link className="site-header__drawer-link" to="/checkout">
                {t('cart')} ({totalQuantity})
              </Link>

              {user && (
                <button
                  type="button"
                  className="site-header__drawer-link site-header__drawer-button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    logout();
                  }}
                >
                  {t('logout')}
                </button>
              )}
            </nav>

            <div className="site-header__drawer-language">
              <span>{t('language')}</span>
              <div className="site-header__language-toggle" role="group" aria-label={t('language')}>
                <button
                  type="button"
                  className={`site-header__language-button ${language === 'en' ? 'is-active' : ''}`}
                  onClick={() => {
                    setLanguage('en');
                  }}
                >
                  En
                </button>
                <button
                  type="button"
                  className={`site-header__language-button ${language === 'ar' ? 'is-active' : ''}`}
                  onClick={() => {
                    setLanguage('ar');
                  }}
                >
                  Ar
                </button>
              </div>
            </div>
          </aside>
        </>
      )}
    </>
  );
}
