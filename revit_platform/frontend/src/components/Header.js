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
        if (!isAuthenticated) return;
        
        try {
            const token = localStorage.getItem('token');
            if (token) {
                // Загружаем основную информацию о пользователе
                const userResponse = await fetch('http://localhost:8000/api/accounts/users/me/', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });
                
                if (userResponse.ok) {
                    const userData = await userResponse.json();
                    console.log('Основные данные пользователя:', userData);
                    console.log('user_type:', userData.user_type);
                    console.log('user_role:', userData.user_role);
                    console.log('specialist_type:', userData.specialist_type);
                    setUserData(userData);
                    
                    // Если это специалист, specialist_type уже должен быть в userData
                    if (userData.user_type === 'specialist') {
                        console.log('Тип специалиста:', userData.specialist_type);
                    }
                }
            }
        } catch (error) {
            console.error('Error loading user profile:', error);
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
                        {/* Для всех BIM-специалистов - личные проекты */}
                        {userData.user_type === 'specialist' && (
                            <Link to="/projects" className={`nav-link ${isActivePath('/projects') ? 'active' : ''}`}>Мои проекты</Link>
                        )}
                        
                        {/* Для BIM-менеджеров - заказы заказчиков */}
                        {(userData.user_type === 'specialist' && userData.specialist_type === 'manager') && (
                            <Link to="/manager-orders" className={`nav-link ${isActivePath('/manager-orders') ? 'active' : ''}`}>Заказы заказчиков</Link>
                        )}
                        
                        {/* Для заказчиков - заказы */}
                        {((userData.user_type === 'legal' && userData.user_role === 'customer') ||
                          (userData.user_type === 'individual' && userData.user_role === 'customer')) && (
                            <Link to="/order-list" className={`nav-link ${isActivePath('/order-list') ? 'active' : ''}`}>Мои заказы</Link>
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
                                            userData.user_role === 'customer' ? 'Заказчик' : 'Подрядчик'
                                        )}
                                        {userData.user_type === 'individual' && (
                                            userData.user_role === 'customer' ? 'Заказчик' : 'Подрядчик'
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
                            
                            {/* Корзина заказов - только для заказчиков */}
                            {((userData.user_type === 'legal' && userData.user_role === 'customer') ||
                              (userData.user_type === 'individual' && userData.user_role === 'customer') ||
                              (userData.user_type === 'specialist' && userData.specialist_type === 'executor')) && (
                                <Link to="/order-cart" className="cart-link">
                                    <FaShoppingCart />
                                    {cartItemsCount > 0 && (
                                        <span className="cart-counter">{cartItemsCount}</span>
                                    )}
                                </Link>
                            )}
                            
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