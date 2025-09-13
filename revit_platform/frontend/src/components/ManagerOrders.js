import React, { useState, useEffect } from 'react';
import './ManagerOrders.css';

const ManagerOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showFileUpload, setShowFileUpload] = useState(false);
    const [showFileView, setShowFileView] = useState(false);
    const [uploadedFiles, setUploadedFiles] = useState([]);
    const [orderFiles, setOrderFiles] = useState([]);
    const [showCommentInDetails, setShowCommentInDetails] = useState(false);
    const [commentInDetails, setCommentInDetails] = useState('');
    const [showFileUploadInDetails, setShowFileUploadInDetails] = useState(false);
    const [uploadFile, setUploadFile] = useState(null);
    const [uploadTitle, setUploadTitle] = useState('');
    const [uploadDescription, setUploadDescription] = useState('');
    const [showImageViewer, setShowImageViewer] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);

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

    const fetchOrderFiles = async (orderId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:8000/api/orders/orders/${orderId}/files/`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                const data = await response.json();
                setOrderFiles(data);
            } else {
                console.error('Ошибка при загрузке файлов заказа');
                setOrderFiles([]);
            }
        } catch (error) {
            console.error('Error fetching order files:', error);
            setOrderFiles([]);
        }
    };

    const viewOrderDetails = async (order) => {
        setSelectedOrder(order);
        await fetchOrderFiles(order.id);
        setShowFileView(true);
    };

    const getFileIcon = (fileType) => {
        const icons = {
            'sketch': '🎨',
            'draft': '📐',
            'final': '✅',
            'other': '📄'
        };
        return icons[fileType] || '📄';
    };

    const getFileTypeText = (fileType) => {
        const types = {
            'sketch': 'Эскиз',
            'draft': 'Чертеж',
            'final': 'Финальный файл',
            'other': 'Другое'
        };
        return types[fileType] || 'Другое';
    };

    const getPaymentStatusText = (status) => {
        const statusMap = {
            'pending': 'Ожидает оплаты',
            'partial': 'Частично оплачен',
            'paid': 'Оплачен',
            'refunded': 'Возвращен'
        };
        return statusMap[status] || 'Неизвестно';
    };

    const submitCommentFromDetails = async (orderId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:8000/api/orders/orders/${orderId}/comment/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    comment: commentInDetails
                }),
            });

            if (response.ok) {
                alert('Комментарий добавлен!');
                setCommentInDetails('');
                setShowCommentInDetails(false);
                // Обновляем данные заказа
                fetchOrders();
            } else {
                const errorData = await response.json();
                alert(`Ошибка при добавлении комментария: ${errorData.detail || 'Неизвестная ошибка'}`);
            }
        } catch (error) {
            console.error('Error submitting comment:', error);
            alert('Ошибка при добавлении комментария');
        }
    };

    const handleFileUploadFromDetails = async (orderId) => {
        if (!uploadFile) {
            alert('Выберите файл для загрузки');
            return;
        }

        if (!uploadTitle.trim()) {
            alert('Введите название файла');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const formData = new FormData();
            formData.append('file', uploadFile);
            formData.append('title', uploadTitle);
            formData.append('description', uploadDescription);

            const response = await fetch(`http://localhost:8000/api/orders/orders/${orderId}/upload_file/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: formData,
            });

            if (response.ok) {
                alert('Файл успешно загружен!');
                setUploadFile(null);
                setUploadTitle('');
                setUploadDescription('');
                setShowFileUploadInDetails(false);
                fetchOrderFiles(orderId); // Обновляем список файлов
                fetchOrders(); // Обновляем данные заказа
            } else {
                const errorData = await response.json();
                alert(`Ошибка при загрузке файла: ${errorData.detail || 'Неизвестная ошибка'}`);
            }
        } catch (error) {
            console.error('Error uploading file:', error);
            alert('Ошибка при загрузке файла');
        }
    };

    const isImageFile = (fileName) => {
        const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
        return imageExtensions.some(ext => fileName.toLowerCase().endsWith(ext));
    };

    const openImageViewer = (file) => {
        setSelectedImage(file);
        setShowImageViewer(true);
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
                                    <span className="label">Вид работ:</span>
                                    <span className="value">{getWorkTypeText(order.work_type)}</span>
                                </div>
                                
                                <div className="detail-item">
                                    <span className="label">Заказчик:</span>
                                    <span className="value">{order.customer_name}</span>
                                </div>
                                
                                <div className="detail-item">
                                    <span className="label">Статус оплаты:</span>
                                    <span className={`payment-status ${order.payment_status}`}>
                                        {getPaymentStatusText(order.payment_status)}
                                    </span>
                                </div>
                                
                                <div className="detail-item">
                                    <span className="label">Дата создания:</span>
                                    <span className="value">
                                        {new Date(order.created_at).toLocaleDateString('ru-RU')}
                                    </span>
                                </div>
                                
                                {/* Итоговая стоимость */}
                                {order.final_cost > 0 && (
                                    <div className="detail-item cost-highlight">
                                        <span className="label">Итоговая стоимость:</span>
                                        <span className="value cost">{order.final_cost} ₽</span>
                                    </div>
                                )}
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

                                

                                <button 
                                    className="action-button view-btn"
                                    onClick={() => viewOrderDetails(order)}
                                >
                                    Просмотреть детали
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Модальное окно для загрузки файлов */}
            {showFileUpload && selectedOrder && (
                <div className="file-upload-modal-overlay">
                    <div className="file-upload-modal-content">
                        <div className="file-upload-modal-header">
                            <h3>Загрузка файлов для заказа {selectedOrder.order_number}</h3>
                            <button 
                                className="file-upload-close-btn"
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
                                <h4>Загрузка файлов</h4>
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
                        
                        <div className="file-upload-modal-footer">
                            <button 
                                className="file-upload-send-btn"
                                onClick={() => sendToCustomer(selectedOrder.id)}
                                disabled={uploadedFiles.length === 0}
                            >
                                Отправить заказчику
                            </button>
                            <button 
                                className="file-upload-cancel-btn"
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

            {/* Модальное окно для просмотра файлов заказа */}
            {showFileView && selectedOrder && (
                <div className="order-details-modal-overlay">
                    <div className="order-details-modal-content">
                        <div className="order-details-modal-header">
                            <h3>Файлы заказа {selectedOrder.order_number}</h3>
                            <button 
                                className="order-details-close-btn"
                                onClick={() => {
                                    setShowFileView(false);
                                    setSelectedOrder(null);
                                    setOrderFiles([]);
                                }}
                            >
                                ✕
                            </button>
                        </div>
                        
                        <div className="modal-body">
                            <div className="order-details-info-section">
                                <h4>Информация о заказе</h4>
                                <div className="order-details-info-grid">
                                    <div className="order-details-info-item">
                                        <span className="label">Наименование объекта:</span>
                                        <span className="value">{selectedOrder.title}</span>
                                    </div>
                                    <div className="order-details-info-item">
                                        <span className="label">Вид работ:</span>
                                        <span className="value">{getWorkTypeText(selectedOrder.work_type)}</span>
                                    </div>
                                    <div className="order-details-info-item">
                                        <span className="label">Заказчик:</span>
                                        <span className="value">{selectedOrder.customer_name}</span>
                                    </div>
                                    {selectedOrder.customer_area && (
                                        <div className="order-details-info-item">
                                            <span className="label">Площадь:</span>
                                            <span className="value">{selectedOrder.customer_area} м²</span>
                                        </div>
                                    )}
                                    {selectedOrder.calculated_budget > 0 && (
                                        <div className="order-details-info-item">
                                            <span className="label">Расчетная стоимость:</span>
                                            <span className="value cost">{selectedOrder.calculated_budget} ₽</span>
                                        </div>
                                    )}
                                    {selectedOrder.advance_paid > 0 && (
                                        <div className="order-details-info-item">
                                            <span className="label">Аванс за работу эскиза:</span>
                                            <span className="value cost">{selectedOrder.advance_paid} ₽</span>
                                        </div>
                                    )}
                                    {selectedOrder.final_cost > 0 && (
                                        <div className="order-details-info-item">
                                            <span className="label">Итоговая стоимость:</span>
                                            <span className="value cost">{selectedOrder.final_cost} ₽</span>
                                        </div>
                                    )}
                                    <div className="order-details-info-item">
                                        <span className="label">Статус:</span>
                                        <span className={`value status ${getStatusClass(selectedOrder.order_status)}`}>
                                            {getStatusText(selectedOrder.order_status)}
                                        </span>
                                    </div>
                                    <div className="order-details-info-item">
                                        <span className="label">Дата создания:</span>
                                        <span className="value">
                                            {new Date(selectedOrder.created_at).toLocaleDateString('ru-RU')}
                                        </span>
                                    </div>
                                </div>
                            </div>

                {/* Описание и требования */}
                {(selectedOrder.description || selectedOrder.requirements) && (
                    <div className="order-details-info-section">
                        <h4>Описание и требования</h4>
                        <div className="order-details-description">
                            {selectedOrder.description && (
                                <div className="description-item">
                                    <h5>Описание проекта:</h5>
                                    <p>{selectedOrder.description}</p>
                                </div>
                            )}
                            {selectedOrder.requirements && (
                                <div className="description-item">
                                    <h5>Требования и пожелания:</h5>
                                    <p>{selectedOrder.requirements}</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Секция файлов заказа */}
                <div className="order-details-files-section">
                    <div className="order-details-files-header">
                        <h4>Файлы заказа</h4>
                        <button
                            className="order-details-upload-btn"
                            onClick={() => setShowFileUploadInDetails(!showFileUploadInDetails)}
                        >
                            {showFileUploadInDetails ? 'Скрыть загрузку' : '📤 Загрузить файл'}
                        </button>
                    </div>

                    {/* Форма загрузки файлов */}
                    {showFileUploadInDetails && (
                        <div className="order-details-upload-form">
                            <div className="upload-form-group">
                                <label>Выберите файл:</label>
                                <input
                                    type="file"
                                    onChange={(e) => setUploadFile(e.target.files[0])}
                                    className="upload-file-input"
                                />
                            </div>
                            <div className="upload-form-group">
                                <label>Название файла:</label>
                                <input
                                    type="text"
                                    value={uploadTitle}
                                    onChange={(e) => setUploadTitle(e.target.value)}
                                    placeholder="Введите название файла"
                                    className="upload-title-input"
                                />
                            </div>
                            <div className="upload-form-group">
                                <label>Описание (необязательно):</label>
                                <textarea
                                    value={uploadDescription}
                                    onChange={(e) => setUploadDescription(e.target.value)}
                                    placeholder="Введите описание файла"
                                    className="upload-description-input"
                                    rows="2"
                                />
                            </div>
                            <div className="upload-form-actions">
                                <button
                                    className="upload-submit-btn"
                                    onClick={() => handleFileUploadFromDetails(selectedOrder.id)}
                                    disabled={!uploadFile || !uploadTitle.trim()}
                                >
                                    Загрузить файл
                                </button>
                                <button
                                    className="upload-cancel-btn"
                                    onClick={() => {
                                        setShowFileUploadInDetails(false);
                                        setUploadFile(null);
                                        setUploadTitle('');
                                        setUploadDescription('');
                                    }}
                                >
                                    Отмена
                                </button>
                            </div>
                        </div>
                    )}

                    {orderFiles.length === 0 ? (
                        <div className="order-details-no-files">
                            <p>📁 Файлы не загружены</p>
                        </div>
                    ) : (
                        <div className="order-details-files-list">
                            {orderFiles.map((file, index) => (
                                <div key={index} className="order-details-file-card">
                                    <div className="order-details-file-header">
                                        <div className="order-details-file-icon">
                                            {getFileIcon(file.file_type)}
                                        </div>
                                        <h5 className="order-details-file-title">{file.title}</h5>
                                    </div>
                                    <div className="order-details-file-details">
                                        <p className="order-details-file-description">{file.description || 'Без описания'}</p>
                                        <div className="order-details-file-meta">
                                            <span className="order-details-file-type">{getFileTypeText(file.file_type)}</span>
                                            <span className="order-details-file-date">
                                                {new Date(file.uploaded_at).toLocaleDateString('ru-RU')}
                                            </span>
                                            <span className="order-details-file-uploader">
                                                Загрузил: {file.uploaded_by_name || 'Неизвестно'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="order-details-file-actions">
                                        {isImageFile(file.file) && (
                                            <button
                                                className="order-details-view-btn"
                                                onClick={() => openImageViewer(file)}
                                            >
                                                👁️ Просмотреть
                                            </button>
                                        )}
                                        {/* Показываем кнопку скачивания только после завершения работы и оплаты */}
                                        {selectedOrder.order_status === 'completed' && selectedOrder.payment_status === 'paid' && (
                                            <a
                                                href={`http://localhost:8000${file.file}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="order-details-download-btn"
                                            >
                                                📥 Скачать
                                            </a>
                                        )}
                                        {/* Показываем сообщение, если работа не завершена или не оплачена */}
                                        {(selectedOrder.order_status !== 'completed' || selectedOrder.payment_status !== 'paid') && (
                                            <span className="order-details-download-disabled">
                                                📥 Скачивание доступно после завершения работы и оплаты
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Секция комментариев */}
                <div className="order-details-comments-section">
                                <h4>Общение по заказу</h4>
                                
                                {/* Существующие комментарии */}
                                {selectedOrder.customer_comment && (
                                    <div className="comment-item customer-comment">
                                        <div className="comment-header">
                                            <span className="comment-author">Заказчик</span>
                                            <span className="comment-date">
                                                {selectedOrder.comment_date ? new Date(selectedOrder.comment_date).toLocaleDateString('ru-RU') : 'Не указана'}
                                            </span>
                                        </div>
                                        <div className="comment-text">{selectedOrder.customer_comment}</div>
                                    </div>
                                )}

                                {selectedOrder.manager_comment && (
                                    <div className="comment-item manager-comment">
                                        <div className="comment-header">
                                            <span className="comment-author">BIM-менеджер</span>
                                            <span className="comment-date">
                                                {selectedOrder.manager_comment_date ? new Date(selectedOrder.manager_comment_date).toLocaleDateString('ru-RU') : 'Не указана'}
                                            </span>
                                        </div>
                                        <div className="comment-text">{selectedOrder.manager_comment}</div>
                                    </div>
                                )}

                                {/* Кнопка добавления комментария */}
                                <div className="add-comment-section">
                                    <button
                                        className="add-comment-btn"
                                        onClick={() => setShowCommentInDetails(!showCommentInDetails)}
                                    >
                                        {showCommentInDetails ? 'Скрыть форму' : 'Добавить комментарий'}
                                    </button>

                                    {showCommentInDetails && (
                                        <div className="comment-form">
                                            <textarea
                                                value={commentInDetails}
                                                onChange={(e) => setCommentInDetails(e.target.value)}
                                                placeholder="Введите ваш комментарий к заказу..."
                                                className="comment-textarea"
                                                rows="3"
                                            />
                                            <div className="comment-form-actions">
                                                <button
                                                    className="comment-submit-btn"
                                                    onClick={() => submitCommentFromDetails(selectedOrder.id)}
                                                    disabled={!commentInDetails.trim()}
                                                >
                                                    Отправить комментарий
                                                </button>
                                                <button
                                                    className="comment-cancel-btn"
                                                    onClick={() => {
                                                        setShowCommentInDetails(false);
                                                        setCommentInDetails('');
                                                    }}
                                                >
                                                    Отмена
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                        </div>
                        
                        <div className="modal-footer">
                            <button 
                                className="action-button cancel-btn"
                                onClick={() => {
                                    setShowFileView(false);
                                    setSelectedOrder(null);
                                    setOrderFiles([]);
                                }}
                            >
                                Закрыть
                            </button>
                        </div>
                    </div>
                </div>
            )}


            {/* Модальное окно для просмотра изображений */}
            {showImageViewer && selectedImage && (
                <div className="image-viewer-overlay">
                    <div className="image-viewer-content">
                        <div className="image-viewer-header">
                            <h3>{selectedImage.title}</h3>
                            <button
                                className="image-viewer-close-btn"
                                onClick={() => {
                                    setShowImageViewer(false);
                                    setSelectedImage(null);
                                }}
                            >
                                ✕
                            </button>
                        </div>
                        <div className="image-viewer-body">
                            <img
                                src={`http://localhost:8000${selectedImage.file}`}
                                alt={selectedImage.title}
                                className="image-viewer-img"
                            />
                            {selectedImage.description && (
                                <div className="image-viewer-description">
                                    <p>{selectedImage.description}</p>
                                </div>
                            )}
                        </div>
                        <div className="image-viewer-footer">
                            <a
                                href={`http://localhost:8000${selectedImage.file}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="image-viewer-download-btn"
                            >
                                📥 Скачать изображение
                            </a>
                            <button
                                className="image-viewer-close-btn-footer"
                                onClick={() => {
                                    setShowImageViewer(false);
                                    setSelectedImage(null);
                                }}
                            >
                                Закрыть
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManagerOrders;
