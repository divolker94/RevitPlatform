import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import SearchBar from './SearchBar';
import AuthModal from './AuthModal';

import './Header.css';

function Header() {
    const [username, setUsername] = useState(localStorage.getItem('username'));
    const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));
    const [showDropdown, setShowDropdown] = useState(false);
    const [userData, setUserData] = useState(JSON.parse(localStorage.getItem('user_data')) || {});
    const dropdownRef = useRef(null);
    const [showAuthModal, setShowAuthModal] = useState(false);

    const location = useLocation();
    const navigate = useNavigate();

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

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

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
                <div className="search-container">
                    <SearchBar onSearch={handleSearch} />
                </div>
            </div>

            <nav className="header-nav">
                <Link to="/" className={`nav-link ${isActivePath('/') ? 'active' : ''}`}>Главная</Link>
                <Link to="/architectural-projects" className={`nav-link ${isActivePath('/architectural-projects') ? 'active' : ''}`}>Каталог архитектурных проектов</Link>
                <Link to="/families" className={`nav-link ${isActivePath('/families') ? 'active' : ''}`}>Каталог BIM семейств</Link>
                <Link to="/projects" className={`nav-link ${isActivePath('/projects') ? 'active' : ''}`}>Личные проекты</Link>
                <Link to="/blog" className={`nav-link ${isActivePath('/blog') ? 'active' : ''}`}>Форум</Link>
                <Link to="/order" className={`nav-link ${isActivePath('/order') ? 'active' : ''}`}>Заказ</Link> {/* Add link to OrderForm */}
            </nav>

            <div className="header-right">
                {isAuthenticated ? (
                    <div className="user-menu" ref={dropdownRef}>
                        <button 
                            className="profile-button"
                            onClick={() => setShowDropdown(!showDropdown)}
                            title={userData.user_type === 'legal' 
                                ? userData.company_name 
                                : `${userData.first_name} ${userData.last_name}`}
                        >
                            {userData.user_type === 'legal' 
                                ? (userData.company_name?.charAt(0) || '?').toUpperCase()
                                : `${userData.first_name?.charAt(0) || ''}${userData.last_name?.charAt(0) || ''}`.toUpperCase() || '?'}
                        </button>
                        <button 
                            className="logout-button"
                            onClick={handleLogout}
                        >
                            Выход
                        </button>
                        {showDropdown && (
                            <div className="profile-dropdown">
                                <div className="profile-info">
                                    {userData.user_type === 'legal' ? (
                                        <>
                                            <p><strong>Компания:</strong> {userData.company_name}</p>
                                            <p><strong>ИНН:</strong> {userData.inn}</p>
                                        </>
                                    ) : (
                                        <>
                                            <p><strong>Имя:</strong> {userData.first_name}</p>
                                            <p><strong>Фамилия:</strong> {userData.last_name}</p>
                                        </>
                                    )}
                                    <p><strong>Email:</strong> {userData.email}</p>
                                    <p><strong>Телефон:</strong> {userData.phone}</p>
                                </div>
                                <div className="profile-actions">
                                    <Link to="/profile" className="profile-link">Профиль</Link>
                                    <button onClick={handleLogout} className="logout-button">Выйти</button>
                                </div>
                            </div>
                        )}
                    </div>
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