import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Home.css';
import Carousel from 'react-bootstrap/Carousel'; // Import Carousel component
import { FaProjectDiagram, FaBlog, FaUsers } from 'react-icons/fa'; // Import icons

import ArchitecturalProjectsCarousel from '../components/ArchitecturalProjectsCarousel';
import BimFamiliesCarousel from '../components/BimFamiliesCarousel';

function Home() {
    const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));

    const [userData, setUserData] = useState(JSON.parse(localStorage.getItem('user_data')) || {});
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const [recentProjects, setRecentProjects] = useState([]); // State for recent projects

    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const response = await fetch('http://localhost:8000/api/auth/users/me/', {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json',
                        },
                    });

                    if (!response.ok) {
                        localStorage.removeItem('token');
                        setIsAuthenticated(false);
                        setUserData({});
                    } else {
                        const userData = await response.json();
                        setUserData(userData);
                        localStorage.setItem('user_data', JSON.stringify(userData));
                        setIsAuthenticated(true);
                    }
                } catch (error) {
                    console.error('Auth check error:', error);
                    setIsAuthenticated(false);
                }
            } else {
                setIsAuthenticated(false);
            }
            setLoading(false);
        };

        checkAuth();

        // Fetch recent projects
        const fetchRecentProjects = async () => {
            try {
                const response = await fetch('http://localhost:8000/api/projects/recent/');
                const data = await response.json();
                
                // Ensure data is an array
                if (Array.isArray(data)) {
                    setRecentProjects(data);
                } else {
                    console.error('Expected an array but got:', data);
                    setRecentProjects([]); // Set to empty array if not an array
                }
            } catch (error) {
                console.error('Error fetching recent projects:', error);
                setRecentProjects([]); // Set to empty array on error
            }
        };

        fetchRecentProjects();
    }, []);

    const handleStartNow = () => {
        if (isAuthenticated) {
            navigate('/projects');
        } else {
            navigate('/login');
        }
    };

    return (
        <div className="home-page">
            {/* Фоновое изображение */}
            <div className="home-background"></div>
            
            <div className="hero-section text-center py-5 fade-in">
                <div className="container">
                    <h1 className="display-4 mb-4">Добро пожаловать в RevitPlatform</h1>
                    <p className="lead mb-4">
                        Платформа для эффективной работы с Revit проектами и семействами
                    </p>
                    {loading ? (
                        <p>Загрузка...</p>
                    ) : isAuthenticated ? (
                        <div>
                            <h3 className="greeting-text mb-3">
                                Рады вас видеть здесь, {userData.last_name || ''} {userData.first_name?.charAt(0) || ''}.{userData.middle_name ? userData.middle_name.charAt(0) + '.' : ''}
                            </h3>
                            <Link 
                                to="/projects" 
                                className="cta-button"
                            >
                                Перейти к проектам
                            </Link>
                        </div>
                    ) : (
                        <button 
                            className="btn btn-primary btn-lg"
                            onClick={handleStartNow}
                        >
                            Начать работу
                        </button>
                    )}
                </div>
            </div>

            <div className="container mt-5">
                <Carousel>
                    {recentProjects.map(project => (
                        <Carousel.Item key={project.id}>
                            <img
                                className="d-block w-100"
                                src={project.image_url}
                                alt={project.title}
                            />
                            <Carousel.Caption>
                                <h3>{project.title}</h3>
                                <p>{project.description}</p>
                            </Carousel.Caption>
                        </Carousel.Item>
                    ))}
                </Carousel>

                <div className="row mt-5">
                    <div className="col-md-4 mb-4">
                        <div className="card h-100">
                            <div className="card-body">
                                <h5 className="card-title"><FaProjectDiagram /> Проекты Revit</h5>
                                <p className="card-text">
                                    Управляйте своими Revit проектами, делитесь ими с командой
                                    и отслеживайте изменения.
                                </p>
                                <Link to="/projects" className="btn btn-outline-primary">
                                    Перейти к проектам
                                </Link>
                            </div>
                        </div>
                    </div>

                    <div className="col-md-4 mb-4">
                        <div className="card h-100">
                            <div className="card-body">
                                <h5 className="card-title"><FaUsers /> Семейства Revit</h5>
                                <p className="card-text">
                                    Доступ к библиотеке семейств Revit, возможность загружать
                                    и делиться своими семействами.
                                </p>
                                <Link to="/families" className="btn btn-outline-primary">
                                    Перейти к семействам
                                </Link>
                            </div>
                        </div>
                    </div>

                    <div className="col-md-4 mb-4">
                        <div className="card h-100">
                            <div className="card-body">
                                <h5 className="card-title"><FaBlog /> Блог и Новости</h5>
                                <p className="card-text">
                                    Следите за последними новостями, обновлениями и полезными
                                    статьями о Revit.
                                </p>
                                <Link to="/blog" className="btn btn-outline-primary">
                                    Читать блог
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Карусель архитектурных проектов */}
            <ArchitecturalProjectsCarousel />

            {/* Карусель BIM семейств */}
            <BimFamiliesCarousel />

            <div className="testimonials-section text-center py-5 mt-5 bg-light">
                <div className="container">
                    <h2 className="mb-4">Отзывы наших пользователей</h2>
                    <p className="lead mb-4">
                        Узнайте, что говорят наши пользователи о платформе.
                    </p>
                    
                    <div className="row">
                        <div className="col-lg-4 col-md-6 mb-4">
                            <div className="testimonial-card">
                                <div className="testimonial-content">
                                    <div className="testimonial-quote">
                                        <i className="fas fa-quote-left"></i>
                                    </div>
                                    <p className="testimonial-text">
                                        "RevitPlatform значительно упростил нашу работу с проектами. 
                                        Удобная система управления, быстрый доступ к семействам и 
                                        отличная поддержка команды. Рекомендую всем архитекторам!"
                                    </p>
                                    <div className="testimonial-author">
                                        <h5>Александр Петров</h5>
                                        <span>Главный архитектор, ООО "АрхПроект"</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="col-lg-4 col-md-6 mb-4">
                            <div className="testimonial-card">
                                <div className="testimonial-content">
                                    <div className="testimonial-quote">
                                        <i className="fas fa-quote-left"></i>
                                    </div>
                                    <p className="testimonial-text">
                                        "Платформа помогла нам организовать библиотеку семейств 
                                        и ускорить процесс проектирования. Интерфейс интуитивно 
                                        понятен, а функционал превосходит ожидания."
                                    </p>
                                    <div className="testimonial-author">
                                        <h5>Мария Сидорова</h5>
                                        <span>BIM-менеджер, "СтройИнвест"</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="col-lg-4 col-md-6 mb-4">
                            <div className="testimonial-card">
                                <div className="testimonial-content">
                                    <div className="testimonial-quote">
                                        <i className="fas fa-quote-left"></i>
                                    </div>
                                    <p className="testimonial-text">
                                        "Отличная платформа для совместной работы над проектами. 
                                        Наша команда из 15 человек теперь эффективно 
                                        координирует работу и обменивается ресурсами."
                                    </p>
                                    <div className="testimonial-author">
                                        <h5>Дмитрий Козлов</h5>
                                        <span>Руководитель проектов, "МегаСтрой"</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {!isAuthenticated && (
                <div className="cta-section text-center py-5 mt-5 bg-light">
                    <div className="container">
                        <h2 className="mb-4">Готовы начать?</h2>
                        <p className="lead mb-4">
                            Присоединяйтесь к нашему сообществу и получите доступ ко всем возможностям платформы.
                        </p>
                        <button 
                            className="btn btn-primary btn-lg"
                            onClick={handleStartNow}
                        >
                            Зарегистрироваться
                        </button>
                    </div>
                </div>
            )}


        </div>
    );
}

export default Home;
