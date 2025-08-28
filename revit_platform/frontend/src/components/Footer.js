import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

function Footer() {
    return (
        <footer className="footer">
            <div className="footer-content">
                <div className="footer-links">
                    <Link to="/about" className="footer-link" onClick={() => console.log('Клик по "О нас"')}>О нас</Link>
                    <Link to="/contact" className="footer-link" onClick={() => console.log('Клик по "Контакты"')}>Контакты</Link>
                    <Link to="/terms" className="footer-link" onClick={() => console.log('Клик по "Условия"')}>Условия использования</Link>
                    <Link to="/privacy" className="footer-link" onClick={() => console.log('Клик по "Политика"')}>Политика конфиденциальности</Link>
                </div>
                <div className="footer-social">
                    <a href="https://t.me/your_channel" target="_blank" rel="noopener noreferrer" className="social-link">
                        <i className="fa-brands fa-telegram"></i>
                    </a>
                    <a href="https://instagram.com/your_profile" target="_blank" rel="noopener noreferrer" className="social-link">
                        <i className="fa-brands fa-instagram"></i>
                    </a>
                    <a href="https://github.com/your_profile" target="_blank" rel="noopener noreferrer" className="social-link">
                        <i className="fa-brands fa-github"></i>
                    </a>
                </div>
                <div className="copyright">
                    © 2025 RevitPlatform. Все права защищены.
                </div>
            </div>
        </footer>
    );
}

export default Footer;