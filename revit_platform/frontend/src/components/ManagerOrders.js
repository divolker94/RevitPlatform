import React, { useState, useEffect } from 'react';
import './ManagerOrders.css';

const ManagerOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showFileUpload, setShowFileUpload] = useState(false);
    const [uploadedFiles, setUploadedFiles] = useState([]);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setError('Необходима авторизация');
                setLoading(false);
                return;
            }

            const response = await fetch('http://localhost:8000/api/orders/orders/', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                const data = await response.json();
                console.log('ManagerOrders - Полученные заказы:', data);
                console.log('ManagerOrders - Количество заказов:', data.length);
                setOrders(data);
            } else {
                const errorData = await response.json();
                console.error('ManagerOrders - Ошибка при загрузке заказов:', errorData);
                setError('Ошибка при загрузке заказов');
            }
        } catch (error) {
            console.error('Error fetching orders:', error);
            setError('Ошибка при загрузке заказов');
        } finally {
            setLoading(false);
        }
    };

    const takeOrderInWork = async (orderId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:8000/api/orders/orders/${orderId}/take_in_work/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                // Обновляем статус заказа локально
                setOrders(prevOrders => 
                    prevOrders.map(order => 
                        order.id === orderId 
                            ? { ...order, order_status: 'in_progress' }
                            : order
                    )
                );
                alert('Заказ взят в работу!');
            } else {
                alert('Ошибка при взятии заказа в работу');
            }
        } catch (error) {
            console.error('Error taking order in work:', error);
            alert('Ошибка при взятии заказа в работу');
        }
    };

    const sendToCustomer = async (orderId) => {
        try {
            const token = localStorage.getItem('token');
            
            // Загружаем каждый файл отдельно
            for (const fileData of uploadedFiles) {
                const formData = new FormData();
                formData.append('file', fileData.file);
                formData.append('title', fileData.title);
                formData.append('description', fileData.description || '');
                formData.append('file_type', fileData.fileType || 'other');
                
                const response = await fetch(`http://localhost:8000/api/orders/orders/${orderId}/upload_file/`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                    body: formData
                });
                
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.detail || 'Ошибка при загрузке файла');
                }
            }
            
            alert('Файлы успешно загружены и отправлены заказчику!');
            setShowFileUpload(false);
            setSelectedOrder(null);
            setUploadedFiles([]);
            fetchOrders(); // Обновляем список заказов
        } catch (error) {
            console.error('Error uploading files:', error);
            alert(`Ошибка при загрузке файлов: ${error.message}`);
        }
    };

    const getStatusText = (status) => {
        const statusMap = {
            'draft': 'Черновик',
            'submitted': 'Отправлен',
            'in_progress': 'В работе',
            'review': 'На согласовании',
            'completed': 'Завершен',
            'cancelled': 'Отменен'
        };
        return statusMap[status] || status;
    };

    const getStatusClass = (status) => {
        const classMap = {
            'draft': 'status-draft',
            'submitted': 'status-submitted',
            'in_progress': 'status-progress',
            'review': 'status-review',
            'completed': 'status-completed',
            'cancelled': 'status-cancelled'
        };
        return classMap[status] || 'status-default';
    };

    const getWorkTypeText = (type) => {
        const typeMap = {
            'new_construction': 'Новое строительство',
            'reconstruction': 'Реконструкция',
            'capital_repair': 'Капитальный ремонт',
            'cramped_conditions': 'Стесненные условия'
        };
        return typeMap[type] || type;
    };

    const handleFileUpload = (event) => {
        const files = Array.from(event.target.files);
        const newFiles = files.map(file => ({
            file: file,
            name: file.name,
            title: file.name.replace(/\.[^/.]+$/, ''), // Убираем расширение для названия
            description: '',
            fileType: 'other'
        }));
        setUploadedFiles(prev => [...prev, ...newFiles]);
    };

    const removeFile = (index) => {
        setUploadedFiles(prev => prev.filter((_, i) => i !== index));
    };

    if (loading) {
        return (
            <div className="manager-orders-container">
                <div className="loading">Загрузка заказов...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="manager-orders-container">
                <div className="error">{error}</div>
            </div>
        );
    }

    return (
        <div className="manager-orders-container">
            <div className="orders-header">
                <h2>Заказы заказчиков</h2>
            </div>

            {orders.length === 0 ? (
                <div className="no-orders">
                    <p>Нет заказов для обработки</p>
                </div>
            ) : (
                <div className="order-list">
                    {orders.map(order => (
                        <div key={order.id} className="order-item">
                            <div className="order-header">
                                <h3>{order.title}</h3>
                                <span className={`order-status ${getStatusClass(order.order_status)}`}>
                                    {getStatusText(order.order_status)}
                                </span>
                            </div>
                            
                            <div className="order-details">
                                <div className="detail-item">
                                    <span className="label">Номер заказа:</span>
                                    <span className="value">{order.order_number}</span>
                                </div>
                                
                                <div className="detail-item">
                                    <span className="label">Заказчик:</span>
                                    <span className="value">{order.customer_name}</span>
                                </div>
                                
                                <div className="detail-item">
                                    <span className="label">Тип работ:</span>
                                    <span className="value">{getWorkTypeText(order.work_type)}</span>
                                </div>
                                
                                {order.customer_area && (
                                    <div className="detail-item">
                                        <span className="label">Площадь:</span>
                                        <span className="value">{order.customer_area} м²</span>
                                    </div>
                                )}
                                
                                {order.final_cost > 0 && (
                                    <div className="detail-item cost-highlight">
                                        <span className="label">Итоговая стоимость:</span>
                                        <span className="value cost">{order.final_cost} ₽</span>
                                    </div>
                                )}
                                
                                <div className="detail-item">
                                    <span className="label">Дата создания:</span>
                                    <span className="value">
                                        {new Date(order.created_at).toLocaleDateString('ru-RU')}
                                    </span>
                                </div>
                            </div>
                            
                            <div className="order-actions">
                                {order.order_status === 'draft' && (
                                    <button 
                                        className="action-button take-work-btn"
                                        onClick={() => takeOrderInWork(order.id)}
                                    >
                                        Взять в работу
                                    </button>
                                )}
                                
                                {order.order_status === 'in_progress' && (
                                    <button 
                                        className="action-button upload-files-btn"
                                        onClick={() => {
                                            setSelectedOrder(order);
                                            setShowFileUpload(true);
                                        }}
                                    >
                                        Загрузить файлы
                                    </button>
                                )}
                                
                                <button className="action-button view-btn">Просмотреть детали</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Модальное окно для загрузки файлов */}
            {showFileUpload && selectedOrder && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>Загрузка файлов для заказа {selectedOrder.order_number}</h3>
                            <button 
                                className="close-btn"
                                onClick={() => {
                                    setShowFileUpload(false);
                                    setSelectedOrder(null);
                                    setUploadedFiles([]);
                                }}
                            >
                                ✕
                            </button>
                        </div>
                        
                        <div className="modal-body">
                            <div className="file-upload-section">
                                <input
                                    type="file"
                                    multiple
                                    onChange={handleFileUpload}
                                    accept=".pdf,.dwg,.rvt,.ifc,.jpg,.png"
                                    className="file-input"
                                />
                                <p className="file-hint">
                                    Поддерживаемые форматы: PDF, DWG, RVT, IFC, JPG, PNG
                                </p>
                            </div>
                            
                            {uploadedFiles.length > 0 && (
                                <div className="uploaded-files">
                                    <h4>Загруженные файлы:</h4>
                                    {uploadedFiles.map((fileData, index) => (
                                        <div key={index} className="file-item">
                                            <div className="file-info">
                                                <span className="file-name">{fileData.name}</span>
                                                <input
                                                    type="text"
                                                    value={fileData.title}
                                                    onChange={(e) => {
                                                        const newFiles = [...uploadedFiles];
                                                        newFiles[index].title = e.target.value;
                                                        setUploadedFiles(newFiles);
                                                    }}
                                                    placeholder="Название файла"
                                                    className="file-title-input"
                                                />
                                                <textarea
                                                    value={fileData.description}
                                                    onChange={(e) => {
                                                        const newFiles = [...uploadedFiles];
                                                        newFiles[index].description = e.target.value;
                                                        setUploadedFiles(newFiles);
                                                    }}
                                                    placeholder="Описание файла"
                                                    className="file-description-input"
                                                    rows="2"
                                                />
                                                <select
                                                    value={fileData.fileType}
                                                    onChange={(e) => {
                                                        const newFiles = [...uploadedFiles];
                                                        newFiles[index].fileType = e.target.value;
                                                        setUploadedFiles(newFiles);
                                                    }}
                                                    className="file-type-select"
                                                >
                                                    <option value="sketch">Эскиз</option>
                                                    <option value="draft">Чертеж</option>
                                                    <option value="final">Финальный файл</option>
                                                    <option value="other">Другое</option>
                                                </select>
                                            </div>
                                            <button 
                                                className="remove-file-btn"
                                                onClick={() => removeFile(index)}
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        
                        <div className="modal-footer">
                            <button 
                                className="action-button send-btn"
                                onClick={() => sendToCustomer(selectedOrder.id)}
                                disabled={uploadedFiles.length === 0}
                            >
                                Отправить заказчику
                            </button>
                            <button 
                                className="action-button cancel-btn"
                                onClick={() => {
                                    setShowFileUpload(false);
                                    setSelectedOrder(null);
                                    setUploadedFiles([]);
                                }}
                            >
                                Отмена
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManagerOrders;
