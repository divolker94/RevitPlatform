import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import SearchBar from './SearchBar';
import AuthModal from './AuthModal';
import { FaShoppingCart } from 'react-icons/fa';

import './Header.css';

function Header() {
    const [username, setUsername] = useState(localStorage.getItem('username'));
    const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));
    const [userData, setUserData] = useState(JSON.parse(localStorage.getItem('user_data')) || {});
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [cartItemsCount, setCartItemsCount] = useState(0);

    const location = useLocation();
    const navigate = useNavigate();

    const loadUserProfile = async () => {
        if (isAuthenticated) {
            try {
                const token = localStorage.getItem('token');
                const userResponse = await fetch('http://localhost:8000/api/auth/users/me/', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });

                if (userResponse.ok) {
                    const userData = await userResponse.json();
                    setUserData(userData);

                    // Загружаем профиль в зависимости от типа пользователя
                    if (userData.user_type === 'specialist') {
                        const specialistResponse = await fetch('http://localhost:8000/api/specialists/me/', {
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json',
                            },
                        });
                                            if (specialistResponse.ok) {
                        const specialistData = await specialistResponse.json();
                        // Объединяем данные пользователя с данными профиля специалиста
                        setUserData(prev => ({ 
                            ...prev, 
                            ...specialistData,
                            first_name: prev.first_name || specialistData.first_name || '',
                            last_name: prev.last_name || specialistData.last_name || '',
                            phone: prev.phone || specialistData.phone || ''
                        }));
                    }
                    } else if (userData.user_type === 'legal') {
                        const legalResponse = await fetch('http://localhost:8000/api/clients/legal-entities/', {
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json',
                            },
                        });
                        if (legalResponse.ok) {
                            const legalData = await legalResponse.json();
                            if (legalData.length > 0) {
                                setUserData(prev => ({ ...prev, ...legalData[0] }));
                            }
                        }
                    } else if (userData.user_type === 'individual') {
                        const individualResponse = await fetch('http://localhost:8000/api/clients/individuals/', {
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json',
                            },
                        });
                        if (individualResponse.ok) {
                            const individualData = await individualResponse.json();
                            if (individualData.length > 0) {
                                setUserData(prev => ({ ...prev, ...individualData[0] }));
                            }
                        }
                    }
                }
            } catch (error) {
                console.error('Error loading user profile:', error);
            }
        }
    };

    useEffect(() => {
        // Проверяем, есть ли токен в localStorage
        const token = localStorage.getItem('token');
        if (token) {
            setIsAuthenticated(true);
            setUsername(localStorage.getItem('username') || '');
            setUserData(JSON.parse(localStorage.getItem('user_data')) || {});
        }
    }, []);

    useEffect(() => {
        loadUserProfile();
    }, [isAuthenticated]);

    useEffect(() => {
        // Загружаем количество элементов в корзине
        const cart = JSON.parse(localStorage.getItem('orderCart') || '[]');
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        setCartItemsCount(totalItems);

        // Слушаем обновления корзины
        const handleCartUpdate = (event) => {
            setCartItemsCount(event.detail.totalItems);
        };

        window.addEventListener('cartUpdated', handleCartUpdate);
        return () => window.removeEventListener('cartUpdated', handleCartUpdate);
    }, []);

    const isActivePath = (path) => {
        if (path === '/') {
            return location.pathname === '/';
        }
        return location.pathname.startsWith(path);
    };

    const handleLogin = (newUsername) => {
        setIsAuthenticated(true);
        setUsername(newUsername);
        setUserData(JSON.parse(localStorage.getItem('user_data')) || {});
        setShowAuthModal(false);
    };



    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        setIsAuthenticated(false);
        setUsername('');
        navigate('/');
    };

    const handleSearch = (searchQuery, category) => {
        if (category === 'architectural-projects') {
            navigate(`/architectural-projects?search=${searchQuery}`);
        } else {
            navigate(`/search?q=${searchQuery}&category=${category}`);
        }
    };

    return (
        <header className="header">
            <div className="header-left">
                <Link to="/" className="logo">RevitPlatform</Link>
            </div>

            <nav className="header-nav">
                <Link to="/" className={`nav-link ${isActivePath('/') ? 'active' : ''}`}>Главная</Link>
                <Link to="/architectural-projects" className={`nav-link ${isActivePath('/architectural-projects') ? 'active' : ''}`}>Каталог архитектурных проектов</Link>
                <Link to="/families" className={`nav-link ${isActivePath('/families') ? 'active' : ''}`}>Каталог BIM семейств</Link>
                {isAuthenticated && (
                    <>
                        {/* Для BIM-специалистов и подрядчиков - личные проекты */}
                        {((userData.user_type === 'specialist') || 
                          (userData.user_type === 'legal' && userData.client_type === 'contractor') ||
                          (userData.user_type === 'individual' && userData.client_type === 'contractor')) && (
                            <Link to="/projects" className={`nav-link ${isActivePath('/projects') ? 'active' : ''}`}>Личные проекты</Link>
                        )}
                        
                        {/* Для BIM-менеджеров - управление заказами */}
                        {(userData.user_type === 'specialist' && userData.specialist_type === 'manager') && (
                            <Link to="/order-management" className={`nav-link ${isActivePath('/order-management') ? 'active' : ''}`}>Управление заказами</Link>
                        )}
                        
                        {/* Для заказчиков - заказы */}
                        {((userData.user_type === 'legal' && userData.client_type === 'customer') ||
                          (userData.user_type === 'individual' && userData.client_type === 'customer')) && (
                            <Link to="/orders" className={`nav-link ${isActivePath('/orders') ? 'active' : ''}`}>Мои заказы</Link>
                        )}
                    </>
                )}
                <Link to="/blog" className={`nav-link ${isActivePath('/blog') ? 'active' : ''}`}>Форум</Link>
            </nav>

            <div className="header-right">
                {isAuthenticated ? (
                    <>
                        {/* Объединенная кнопка профиля с типом и инициалами */}
                        <div className="profile-section">
                            <Link to="/profile" className="profile-button">
                                <span className="profile-info">
                                    <span className="profile-type-text">
                                        {userData.user_type === 'specialist' && (
                                            userData.specialist_type === 'manager' ? 'BIM-менеджер' : 'Исполнитель'
                                        )}
                                        {userData.user_type === 'legal' && (
                                            userData.client_type === 'customer' ? 'Заказчик' : 'Подрядчик'
                                        )}
                                        {userData.user_type === 'individual' && (
                                            userData.client_type === 'customer' ? 'Заказчик' : 'Подрядчик'
                                        )}
                                    </span>
                                    {' • '}
                                    <span className="profile-initials">
                                        {userData?.first_name && userData?.last_name ? (
                                            `${userData.first_name[0]}${userData.last_name[0]}`
                                        ) : (
                                            userData?.username ? userData.username[0].toUpperCase() : 'U'
                                        )}
                                    </span>
                                </span>
                            </Link>
                            
                            {/* Корзина заказов */}
                            <Link to="/order-cart" className="cart-link">
                                <FaShoppingCart />
                                {cartItemsCount > 0 && (
                                    <span className="cart-counter">{cartItemsCount}</span>
                                )}
                            </Link>
                            
                            {/* Кнопка выхода */}
                            <button onClick={handleLogout} className="logout-button">
                                Выход
                            </button>
                        </div>
                    </>
                ) : (
                    <button onClick={() => setShowAuthModal(true)} className="login-button">Войти</button>
                )}
            </div>

            <AuthModal
                show={showAuthModal}
                onHide={() => setShowAuthModal(false)}
                onLogin={handleLogin}
            />


        </header>
    );
}

export default Header;