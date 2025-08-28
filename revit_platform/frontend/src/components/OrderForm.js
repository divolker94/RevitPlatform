import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './OrderForm.css';

const OrderForm = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        reference_project: null,
        project_name: '',
        description: '',
        deadline: '',
        budget: '',
        percentage_change: 0
    });

    // Проверяем, что пользователь является клиентом
    const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
    const isClient = userData.user_type === 'individual' || userData.user_type === 'legal';

    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showProjectSelector, setShowProjectSelector] = useState(false);

    const [selectedFiles, setSelectedFiles] = useState([]);

    // Загружаем проекты при монтировании компонента
    useEffect(() => {
        loadProjects();
    }, []);

    // Загружаем проекты из каталога
    const loadProjects = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/api/architectural-projects/');
            setProjects(response.data.results || response.data);
        } catch (error) {
            console.error('Error loading projects:', error);
        } finally {
            setLoading(false);
        }
    };

    // Выбираем референсный проект
    const selectReferenceProject = (project) => {
        setFormData(prev => ({
            ...prev,
            reference_project: project,
            project_name: project.name,
            budget: project.design_cost
        }));
        setShowProjectSelector(false);
    };

    // Рассчитываем бюджет с учетом процента изменения
    const calculateBudget = () => {
        if (formData.reference_project && formData.percentage_change) {
            const baseCost = parseFloat(formData.reference_project.design_cost);
            const changeMultiplier = 1 + (parseFloat(formData.percentage_change) / 100);
            return (baseCost * changeMultiplier).toFixed(2);
        }
        return formData.budget;
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        setSelectedFiles(prev => [...prev, ...files]);
    };

    const handleProjectSelection = (projectId) => {
        setFormData(prev => {
            const selected = [...prev.selectedProjects];
            if (selected.includes(projectId)) {
                return {
                    ...prev,
                    selectedProjects: selected.filter(id => id !== projectId)
                };
            }
            if (selected.length < 3) {
                return {
                    ...prev,
                    selectedProjects: [...selected, projectId]
                };
            }
            return prev;
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        try {
            const token = localStorage.getItem('access_token');
            if (!token) {
                alert('Пожалуйста, войдите в систему');
                return;
            }

            const orderData = {
                ...formData,
                reference_project: formData.reference_project?.id || null,
                budget: calculateBudget()
            };

            const response = await axios.post(
                '/api/orders/',
                orderData,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.status === 201) {
                alert('Заказ успешно создан!');
                navigate('/');
            }
        } catch (error) {
            console.error('Error submitting order:', error);
            alert(error.response?.data?.message || 'Произошла ошибка при создании заказа');
        }
    };

    // Если пользователь не клиент, показываем сообщение
    if (!isClient) {
        return (
            <div className="order-form-container">
                <h2>Доступ запрещен</h2>
                <p>Только клиенты могут создавать заказы. Пожалуйста, войдите в систему как клиент.</p>
                <button onClick={() => navigate('/')} className="submit-button">
                    Вернуться на главную
                </button>
            </div>
        );
    }

    return (
        <div className="order-form-container">
            <h2>Создать новый заказ проекта</h2>
            
            {/* Выбор референсного проекта */}
            <div className="reference-project-section">
                <h3>Выберите референсный проект</h3>
                <button 
                    type="button" 
                    className="project-selector-btn"
                    onClick={() => setShowProjectSelector(!showProjectSelector)}
                >
                    {formData.reference_project ? 'Изменить проект' : 'Выбрать проект из каталога'}
                </button>
                
                {showProjectSelector && (
                    <div className="project-selector">
                        <div className="project-grid">
                            {loading ? (
                                <div className="loading">Загрузка проектов...</div>
                            ) : (
                                projects.map(project => (
                                    <div 
                                        key={project.id} 
                                        className={`project-card ${formData.reference_project?.id === project.id ? 'selected' : ''}`}
                                        onClick={() => selectReferenceProject(project)}
                                    >
                                        <div className="project-image">
                                            <img src={project.get_3d_view_url || '/images/placeholder.png'} alt={project.name} />
                                        </div>
                                        <div className="project-info">
                                            <h4>{project.name}</h4>
                                            <p>Категория: {project.category}</p>
                                            <p>Площадь: {project.total_area} м²</p>
                                            <p className="project-cost">Стоимость: {project.design_cost} ₽</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
                
                {formData.reference_project && (
                    <div className="selected-project">
                        <h4>Выбранный проект:</h4>
                        <div className="selected-project-card">
                            <div className="project-image">
                                <img src={formData.reference_project.get_3d_view_url || '/images/placeholder.png'} alt={formData.reference_project.name} />
                            </div>
                            <div className="project-info">
                                <h5>{formData.reference_project.name}</h5>
                                <p>Базовая стоимость: {formData.reference_project.design_cost} ₽</p>
                                <p>Площадь: {formData.reference_project.total_area} м²</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <form onSubmit={handleSubmit} className="order-form">
                <div className="form-group">
                    <label htmlFor="project_name">Название проекта</label>
                    <input
                        type="text"
                        id="project_name"
                        name="project_name"
                        value={formData.project_name}
                        onChange={handleInputChange}
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="description">Описание</label>
                    <textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="deadline">Срок выполнения</label>
                    <input
                        type="date"
                        id="deadline"
                        name="deadline"
                        value={formData.deadline}
                        onChange={handleInputChange}
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="percentage_change">Процент изменения (%)</label>
                    <input
                        type="number"
                        id="percentage_change"
                        name="percentage_change"
                        value={formData.percentage_change}
                        onChange={handleInputChange}
                        step="0.01"
                        placeholder="0"
                    />
                    <small>Положительное значение - увеличение, отрицательное - уменьшение</small>
                </div>

                <div className="form-group">
                    <label htmlFor="budget">Бюджет (₽)</label>
                    <input
                        type="number"
                        id="budget"
                        name="budget"
                        value={formData.budget}
                        onChange={handleInputChange}
                        required
                    />
                    {formData.reference_project && formData.percentage_change && (
                        <div className="budget-calculation">
                            <p>Базовая стоимость: {formData.reference_project.design_cost} ₽</p>
                            <p>Процент изменения: {formData.percentage_change}%</p>
                            <p className="calculated-budget">
                                <strong>Рассчитанная стоимость: {calculateBudget()} ₽</strong>
                            </p>
                        </div>
                    )}
                </div>

                <button type="submit" className="submit-button">
                    Создать заказ
                </button>
            </form>
        </div>
    );
};

export default OrderForm;