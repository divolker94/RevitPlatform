import React, { useState, useEffect } from 'react';
import './Projects.css';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

function Projects() {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newProject, setNewProject] = useState({
        name: '',
        description: '',
        status: 'draft',
        files: []
    });
    const [uploadedFiles, setUploadedFiles] = useState([]);
    const navigate = useNavigate();
    const isAuthenticated = !!localStorage.getItem('token');

    useEffect(() => {
        if (isAuthenticated) {
            fetchProjects();
        } else {
            setLoading(false);
        }
    }, [isAuthenticated]); // Added isAuthenticated to dependency array

    const fetchProjects = async () => {
        try {
            const response = await api.get('/projects/');
            console.log('Projects API Response:', response.data);
            setProjects(response.data);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching projects:', err.response || err);
            setError(err.response?.data?.detail || 'Ошибка при загрузке проектов');
            setLoading(false);
        }
    };

    const handleCreateProject = async (e) => {
        e.preventDefault();
        try {
            const formData = new FormData();
            formData.append('name', newProject.name);
            formData.append('description', newProject.description);
            formData.append('status', newProject.status);
            
            uploadedFiles.forEach((file, index) => {
                formData.append(`files[${index}]`, file);
            });

            const response = await api.post('/projects/', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                }
            });
            
            setProjects([...projects, response.data]);
            setShowCreateForm(false);
            setNewProject({ name: '', description: '', status: 'draft', files: [] });
            setUploadedFiles([]);
        } catch (err) {
            console.error('Error creating project:', err.response || err);
            setError(err.response?.data?.detail || 'Ошибка при создании проекта');
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewProject(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        setUploadedFiles(files);
    };

    const handleDeleteProject = async (projectId) => {
        if (window.confirm('Вы уверены, что хотите удалить этот проект?')) {
            try {
                await api.delete(`/projects/${projectId}/`);
                setProjects(projects.filter(project => project.id !== projectId));
            } catch (err) {
                console.error('Error deleting project:', err);
                setError(err.response?.data?.detail || 'Ошибка при удалении проекта');
            }
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="container mt-5 text-center">
                <h2>Доступ к проектам</h2>
                <p>Для просмотра и работы с проектами необходимо войти в систему</p>
                <button 
                    className="btn btn-primary"
                    onClick={() => navigate('/login')}
                >
                    Войти в систему
                </button>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="container mt-5">
                <div className="text-center">
                    <div className="spinner-border" role="status">
                        <span className="visually-hidden">Загрузка...</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container mt-5">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>Проекты</h2>
                <button
                    className="btn btn-primary"
                    onClick={() => setShowCreateForm(!showCreateForm)}
                >
                    {showCreateForm ? 'Отменить' : 'Создать проект'}
                </button>
            </div>

            {error && (
                <div className="alert alert-danger" role="alert">
                    {error}
                </div>
            )}

            {showCreateForm && (
                <div className="card mb-4">
                    <div className="card-body">
                        <form onSubmit={handleCreateProject}>
                            <div className="mb-3">
                                <label htmlFor="name" className="form-label">Название проекта</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    id="name"
                                    name="name"
                                    value={newProject.name}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                            <div className="mb-3">
                                <label htmlFor="description" className="form-label">Описание</label>
                                <textarea
                                    className="form-control"
                                    id="description"
                                    name="description"
                                    value={newProject.description}
                                    onChange={handleInputChange}
                                    rows="3"
                                ></textarea>
                            </div>
                            <div className="mb-3">
                                <label htmlFor="status" className="form-label">Статус</label>
                                <select
                                    className="form-select"
                                    id="status"
                                    name="status"
                                    value={newProject.status}
                                    onChange={handleInputChange}
                                >
                                    <option value="draft">Черновик</option>
                                    <option value="in_progress">В работе</option>
                                    <option value="completed">Завершен</option>
                                </select>
                            </div>
                            <div className="mb-3">
                                <label htmlFor="files" className="form-label">Файлы проекта</label>
                                <input
                                    type="file"
                                    className="form-control"
                                    id="files"
                                    onChange={handleFileChange}
                                    multiple
                                />
                            </div>
                            <button type="submit" className="btn btn-success">Создать</button>
                        </form>
                    </div>
                </div>
            )}

            <div className="row">
                {projects.map(project => (
                    <div key={project.id} className="col-md-4 mb-4">
                        <div className="card h-100">
                            <div className="card-body">
                                <h5 className="card-title">{project.name}</h5>
                                <p className="card-text">{project.description}</p>
                                <p className="card-text">
                                    <small className="text-muted">
                                        Статус: {project.status === 'draft' ? 'Черновик' :
                                                project.status === 'in_progress' ? 'В работе' : 'Завершен'}
                                    </small>
                                </p>
                            </div>
                            <div className="card-footer">
                                <button
                                    className="btn btn-danger btn-sm"
                                    onClick={() => handleDeleteProject(project.id)}
                                >
                                    Удалить
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {projects.length === 0 && !loading && (
                <div className="text-center mt-4">
                    <p>Нет доступных проектов</p>
                </div>
            )}
        </div>
    );
}

export default Projects;
