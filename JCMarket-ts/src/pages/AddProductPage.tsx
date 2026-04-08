import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { Header } from '../components/Header';
import { useAuth } from '../hooks/useAuthHook';
import api from '../lib/api';
import { getErrorMessage } from '../lib/errors';
import type { AdminUser, UserRole, UsersResponse } from '../types/auth';
import './AddProductPage.css';

type CartItem = {
  productId: number;
  quantity: number;
  deliveryOptionId: number;
};

type AddProductPageProps = {
  cart: CartItem[];
};

export function AddProductPage({ cart }: AddProductPageProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const canCreateProducts = Boolean(user?.permissions.includes('create_product'));
  const canManageUsers = Boolean(user?.permissions.includes('manage_users'));

  const [name, setName] = useState('');
  const [image, setImage] = useState('');
  const [priceCents, setPriceCents] = useState('');
  const [keywords, setKeywords] = useState('');
  const [stars, setStars] = useState('4');
  const [count, setCount] = useState('0');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [roles, setRoles] = useState<UserRole[]>(['admin', 'user', 'moderator']);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState('');
  const [usersMessage, setUsersMessage] = useState('');
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);

  const loadUsers = async () => {
    if (!canManageUsers) {
      setUsers([]);
      return;
    }

    setUsersLoading(true);
    setUsersError('');

    try {
      const response = await api.get<UsersResponse>('/api/users');
      setUsers(response.data.users);
      setRoles(response.data.roles);
    } catch (loadError) {
      setUsersError(getErrorMessage(loadError, 'Failed to load users.'));
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    void loadUsers();
  }, [canManageUsers]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage('');
    setError('');

    if (!canCreateProducts) {
      setError('You do not have permission to add products.');
      return;
    }

    try {
      await api.post('/api/products', {
        name,
        image,
        priceCents,
        keywords: keywords.split(',').map((keyword) => keyword.trim()).filter(Boolean),
        rating: { stars: Number(stars), count: Number(count) }
      });

      setMessage('Product added successfully.');
      setName('');
      setImage('');
      setPriceCents('');
      setKeywords('');
      setStars('4');
      setCount('0');

      setTimeout(() => {
        navigate('/');
      }, 1200);
    } catch (submitError) {
      setError(getErrorMessage(submitError, 'Failed to add product.'));
    }
  };

  const updateUserRole = (userId: string, nextRole: UserRole) => {
    setUsers((currentUsers) => currentUsers.map((currentUser) => (
      currentUser.id === userId
        ? {
            ...currentUser,
            role: nextRole
          }
        : currentUser
    )));
  };

  const saveUserRole = async (userToSave: AdminUser) => {
    setPendingUserId(userToSave.id);
    setUsersError('');
    setUsersMessage('');

    try {
      const response = await api.patch<AdminUser>(`/api/users/${userToSave.id}`, {
        role: userToSave.role
      });

      setUsers((currentUsers) => currentUsers.map((currentUser) => (
        currentUser.id === response.data.id ? response.data : currentUser
      )));
      setUsersMessage(`Updated ${response.data.email}.`);
    } catch (saveError) {
      setUsersError(getErrorMessage(saveError, 'Failed to update user.'));
      await loadUsers();
    } finally {
      setPendingUserId(null);
    }
  };

  const deleteUser = async (userId: string) => {
    setPendingUserId(userId);
    setUsersError('');
    setUsersMessage('');

    try {
      await api.delete(`/api/users/${userId}`);
      setUsers((currentUsers) => currentUsers.filter((currentUser) => currentUser.id !== userId));
      setUsersMessage('User removed.');
    } catch (deleteError) {
      setUsersError(getErrorMessage(deleteError, 'Failed to delete user.'));
    } finally {
      setPendingUserId(null);
    }
  };

  return (
    <>
      <title>Admin Dashboard - JCMarket</title>
      <Header cart={cart} />
      <div className="add-product-page">
        <div className="admin-dashboard">
          <section className="dashboard-panel">
            <div className="panel-header">
              <div>
                <p className="panel-eyebrow">Store tools</p>
                <h1>Admin dashboard</h1>
                <p className="panel-copy">
                  Manage products, roles, and the Google-authenticated accounts allowed into the store.
                </p>
              </div>
            </div>

            <div className="permission-summary">
              <span className="permission-pill">
                Product access: {canCreateProducts ? 'Enabled' : 'Disabled'}
              </span>
              <span className="permission-pill">
                User management: {canManageUsers ? 'Enabled' : 'Disabled'}
              </span>
            </div>

            <form className="add-product-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="name">Product name</label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="image">Image URL</label>
                <input
                  id="image"
                  type="text"
                  value={image}
                  onChange={(event) => setImage(event.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="priceCents">Price (cents)</label>
                <input
                  id="priceCents"
                  type="number"
                  value={priceCents}
                  onChange={(event) => setPriceCents(event.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="keywords">Keywords (comma separated)</label>
                <input
                  id="keywords"
                  type="text"
                  value={keywords}
                  onChange={(event) => setKeywords(event.target.value)}
                  required
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="stars">Rating stars</label>
                  <input
                    id="stars"
                    type="number"
                    min="0"
                    max="5"
                    step="0.1"
                    value={stars}
                    onChange={(event) => setStars(event.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="count">Rating count</label>
                  <input
                    id="count"
                    type="number"
                    min="0"
                    value={count}
                    onChange={(event) => setCount(event.target.value)}
                    required
                  />
                </div>
              </div>
              <button type="submit" className="login-button" disabled={!canCreateProducts}>
                Add Product
              </button>
            </form>
            {message && <div className="login-success">{message}</div>}
            {error && <div className="login-error">{error}</div>}
          </section>

          {canManageUsers && (
            <section className="dashboard-panel">
              <div className="panel-header">
                <div>
                  <p className="panel-eyebrow">Access control</p>
                  <h2>User roles</h2>
                  <p className="panel-copy">
                    Promote or restrict Google users without touching the database directly.
                  </p>
                </div>
              </div>

              {usersLoading && <div className="login-success">Loading users...</div>}
              {usersMessage && <div className="login-success">{usersMessage}</div>}
              {usersError && <div className="login-error">{usersError}</div>}

              <div className="users-grid">
                {users.map((managedUser) => (
                  <article className="user-card" key={managedUser.id}>
                    <div className="user-card-top">
                      <div className="user-identity">
                        {managedUser.picture ? (
                          <img className="user-avatar" src={managedUser.picture} alt={managedUser.email} />
                        ) : (
                          <div className="user-avatar placeholder">{managedUser.email.slice(0, 1).toUpperCase()}</div>
                        )}
                        <div>
                          <strong>{managedUser.email}</strong>
                          <p>Joined {new Date(managedUser.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <span className="role-badge">{managedUser.role}</span>
                    </div>

                    <label className="user-role-field">
                      <span>Role</span>
                      <select
                        value={managedUser.role}
                        onChange={(event) => updateUserRole(managedUser.id, event.target.value as UserRole)}
                        disabled={pendingUserId === managedUser.id}
                      >
                        {roles.map((roleOption) => (
                          <option key={roleOption} value={roleOption}>
                            {roleOption}
                          </option>
                        ))}
                      </select>
                    </label>

                    <div className="permissions-list">
                      {(managedUser.permissions.length > 0 ? managedUser.permissions : ['No custom permissions']).map((permission) => (
                        <span className="permission-pill" key={`${managedUser.id}-${permission}`}>
                          {permission}
                        </span>
                      ))}
                    </div>

                    <div className="user-actions">
                      <button
                        type="button"
                        className="secondary-button"
                        disabled={pendingUserId === managedUser.id}
                        onClick={() => {
                          void saveUserRole(managedUser);
                        }}
                      >
                        Save Role
                      </button>
                      <button
                        type="button"
                        className="danger-button"
                        disabled={pendingUserId === managedUser.id || managedUser.id === user?.id}
                        onClick={() => {
                          void deleteUser(managedUser.id);
                        }}
                      >
                        Delete User
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </>
  );
}
