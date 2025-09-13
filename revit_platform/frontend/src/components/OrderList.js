import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './OrderList.css';

const OrderList = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [deletingOrderId, setDeletingOrderId] = useState(null);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showCommentModal, setShowCommentModal] = useState(false);
    const [comment, setComment] = useState('');
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showFileView, setShowFileView] = useState(false);
    const [orderFiles, setOrderFiles] = useState([]);
    const [showImageViewer, setShowImageViewer] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [showCommentInDetails, setShowCommentInDetails] = useState(false);
    const [commentInDetails, setCommentInDetails] = useState('');
    const [showFileUploadInDetails, setShowFileUploadInDetails] = useState(false);
    const [uploadFile, setUploadFile] = useState(null);
    const [uploadTitle, setUploadTitle] = useState('');
    const [uploadDescription, setUploadDescription] = useState('');
    const [userRole, setUserRole] = useState(null);
    const [uploadedFiles, setUploadedFiles] = useState([]);
    const [paymentMethod, setPaymentMethod] = useState('card');
    const [cardNumber, setCardNumber] = useState('');
    const [cardExpiry, setCardExpiry] = useState('');
    const [cardCvv, setCardCvv] = useState('');
    const [cardName, setCardName] = useState('');
    const [paymentType, setPaymentType] = useState('advance'); // 'advance' или 'final'

    useEffect(() => {
        // Проверяем роль пользователя
        const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
        const userType = userData.user_type;
        const specialistType = userData.specialist_type;
        const userRole = userData.user_role;
        
        console.log('OrderList - userData:', userData);
        console.log('OrderList - userType:', userType);
        console.log('OrderList - specialistType:', specialistType);
        console.log('OrderList - userRole:', userRole);
        
        // Определяем роль для логики отображения
        let roleForDisplay = 'customer';
        if (userType === 'specialist') {
            if (specialistType === 'manager') {
                roleForDisplay = 'manager';
            } else {
                roleForDisplay = 'executor';
            }
        } else if (userType === 'legal' || userType === 'individual') {
            roleForDisplay = userRole || 'customer';
        }
        
        console.log('OrderList - roleForDisplay:', roleForDisplay);
        setUserRole(roleForDisplay);
        
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
                console.log('OrderList - Полученные заказы:', data);
                console.log('OrderList - Количество заказов:', data.length);
                setOrders(data);
            } else {
                const errorData = await response.json();
                console.error('OrderList - Ошибка при загрузке заказов:', errorData);
                setError('Ошибка при загрузке заказов');
            }
        } catch (error) {
            console.error('Error fetching orders:', error);
            setError('Ошибка при загрузке заказов');
        } finally {
            setLoading(false);
        }
    };

    const deleteOrder = async (orderId) => {
        if (!window.confirm('Вы уверены, что хотите удалить этот заказ? Это действие нельзя отменить.')) {
            return;
        }

        setDeletingOrderId(orderId);
        
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:8000/api/orders/orders/${orderId}/`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                setOrders(prevOrders => prevOrders.filter(order => order.id !== orderId));
                alert('Заказ успешно удален');
            } else {
                const errorData = await response.json();
                alert(`Ошибка при удалении заказа: ${errorData.detail || 'Неизвестная ошибка'}`);
            }
        } catch (error) {
            console.error('Error deleting order:', error);
            alert('Ошибка при удалении заказа');
        } finally {
            setDeletingOrderId(null);
        }
    };

    const submitComment = async (orderId) => {
        if (!comment.trim()) {
            alert('Введите комментарий');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:8000/api/orders/orders/${orderId}/add_comment/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ comment: comment.trim() }),
            });

            if (response.ok) {
                alert('Комментарий успешно добавлен');
                setShowCommentModal(false);
                setSelectedOrder(null);
                setComment('');
                fetchOrders(); // Обновляем список заказов
            } else {
                const errorData = await response.json();
                alert(`Ошибка при добавлении комментария: ${errorData.detail || 'Неизвестная ошибка'}`);
            }
        } catch (error) {
            console.error('Error submitting comment:', error);
            alert('Ошибка при добавлении комментария');
        }
    };

    const confirmSketch = async (orderId) => {
        if (!window.confirm('Подтвердить эскиз? Это действие нельзя отменить.')) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:8000/api/orders/orders/${orderId}/confirm_sketch/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                alert('Эскиз подтвержден! BIM-менеджер продолжит работу.');
                fetchOrders(); // Обновляем список заказов
            } else {
                const errorData = await response.json();
                alert(`Ошибка при подтверждении эскиза: ${errorData.detail || 'Неизвестная ошибка'}`);
            }
        } catch (error) {
            console.error('Error confirming sketch:', error);
            alert('Ошибка при подтверждении эскиза');
        }
    };

    const completeOrder = async (orderId) => {
        if (!window.confirm('Завершить заказ? Это действие нельзя отменить.')) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:8000/api/orders/orders/${orderId}/complete_order/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                alert('Заказ завершен! Вы можете скачать файлы.');
                fetchOrders(); // Обновляем список заказов
            } else {
                const errorData = await response.json();
                alert(`Ошибка при завершении заказа: ${errorData.detail || 'Неизвестная ошибка'}`);
            }
        } catch (error) {
            console.error('Error completing order:', error);
            alert('Ошибка при завершении заказа');
        }
    };

    const waitForFiles = (order) => {
        alert(`Ожидайте файлы от BIM-менеджера ${order.manager_name || 'BIM-менеджера'}. После получения файлов вы сможете их просмотреть и прокомментировать.`);
    };

    const fetchOrderFiles = async (orderId) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                console.error('Необходима авторизация');
                setOrderFiles([]);
                return;
            }

            const response = await fetch(`http://localhost:8000/api/orders/orders/${orderId}/files/`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                const data = await response.json();
                setOrderFiles(data);
            } else if (response.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('user_data');
                console.error('Сессия истекла');
                setOrderFiles([]);
            } else {
                console.error('Ошибка при загрузке файлов заказа');
                setOrderFiles([]);
            }
        } catch (error) {
            console.error('Error fetching order files:', error);
            setOrderFiles([]);
        }
    };

    const handleFileUploadFromDetails = async (orderId) => {
        if (!uploadFile || !uploadTitle.trim()) {
            alert('Пожалуйста, выберите файл и введите название');
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
                // Обновляем файлы заказа
                fetchOrderFiles(orderId);
            } else {
                const errorData = await response.json();
                alert(`Ошибка при загрузке файла: ${errorData.detail || 'Неизвестная ошибка'}`);
            }
        } catch (error) {
            console.error('Error uploading file:', error);
            alert('Ошибка при загрузке файла');
        }
    };

    const viewOrderDetails = async (order) => {
        setSelectedOrder(order);
        await fetchOrderFiles(order.id);
        setShowFileView(true);
    };

    const isImageFile = (filename) => {
        const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
        return imageExtensions.some(ext => filename.toLowerCase().endsWith(ext));
    };

    const openImageViewer = (file) => {
        setSelectedImage(file);
        setShowImageViewer(true);
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

    const getPaymentStatusText = (status) => {
        const statusMap = {
            'pending': 'Ожидает оплаты',
            'partial': 'Частично оплачен',
            'paid': 'Оплачен',
            'refunded': 'Возвращен'
        };
        return statusMap[status] || status;
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

    if (loading) {
        return (
            <div className="order-list-container">
                <div className="loading">Загрузка заказов...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="order-list-container">
                <div className="error">{error}</div>
            </div>
        );
    }

    return (
        <div className="order-list-container">
            <div className="orders-header">
                <h2>Мои заказы</h2>
                <Link to="/order" className="create-order-btn">Создать новый заказ</Link>
            </div>

            {orders.length === 0 ? (
                <div className="no-orders">
                    <p>У вас пока нет заказов</p>
                    <Link to="/order" className="create-order-btn">Создать первый заказ</Link>
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
                                    <span className="value">{order.customer_name || 'Не указан'}</span>
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
                                <button 
                                    className="action-button view-btn"
                                    onClick={() => viewOrderDetails(order)}
                                >
                                    Просмотреть детали
                                </button>
                                
                                {order.order_status === 'draft' && (
                                    <button className="action-button edit-btn">Редактировать</button>
                                )}
                                
                                {/* Кнопки для заказчиков */}
                                {order.order_status === 'review' && userRole === 'customer' && (
                                    <button 
                                        className="action-button confirm-sketch-btn"
                                        onClick={() => confirmSketch(order.id)}
                                    >
                                        Подтвердить эскиз
                                    </button>
                                )}
                                
                                {order.order_status === 'review' && userRole === 'customer' && (
                                    <button 
                                        className="action-button comment-btn"
                                        onClick={() => {
                                            setSelectedOrder(order);
                                            setShowCommentModal(true);
                                        }}
                                    >
                                        Добавить комментарий
                                    </button>
                                )}

                                {/* Кнопка оплаты аванса за эскиз */}
                                {order.order_status === 'review' && userRole === 'customer' && order.payment_status !== 'paid' && (
                                    <button 
                                        className="action-button payment-btn"
                                        onClick={() => {
                                            setSelectedOrder(order);
                                            setPaymentType('advance');
                                            setShowPaymentModal(true);
                                        }}
                                    >
                                        💳 Оплатить аванс ({order.advance_paid || 0} ₽)
                                    </button>
                                )}
                                
                                {order.order_status === 'in_progress' && userRole === 'customer' && (
                                    <button 
                                        className="action-button wait-files-btn"
                                        onClick={() => waitForFiles(order)}
                                    >
                                        Ожидаем файлы
                                    </button>
                                )}
                                
                                {order.order_status === 'in_progress' && userRole === 'customer' && (
                                    <button 
                                        className="action-button complete-order-btn"
                                        onClick={() => completeOrder(order.id)}
                                    >
                                        Завершить заказ
                                    </button>
                                )}

                                {/* Кнопка оплаты остатка после завершения работы */}
                                {order.order_status === 'completed' && userRole === 'customer' && order.payment_status !== 'paid' && (
                                    <button 
                                        className="action-button payment-btn"
                                        onClick={() => {
                                            setSelectedOrder(order);
                                            setPaymentType('final');
                                            setShowPaymentModal(true);
                                        }}
                                    >
                                        💳 Оплатить остаток ({(order.final_cost || 0) - (order.advance_paid || 0)} ₽)
                                    </button>
                                )}
                                
                                <button 
                                    className={`action-button delete-btn ${deletingOrderId === order.id ? 'deleting' : ''}`}
                                    onClick={() => deleteOrder(order.id)}
                                    disabled={deletingOrderId === order.id}
                                >
                                    {deletingOrderId === order.id ? 'Удаление...' : 'Удалить'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Модальное окно для комментариев */}
            {showCommentModal && selectedOrder && (
                <div className="comment-modal-overlay">
                    <div className="comment-modal-content">
                        <div className="comment-modal-header">
                            <h3>Добавить комментарий к заказу {selectedOrder.order_number}</h3>
                            <button 
                                className="comment-close-btn"
                                onClick={() => {
                                    setShowCommentModal(false);
                                    setSelectedOrder(null);
                                    setComment('');
                                }}
                            >
                                ✕
                            </button>
                        </div>
                        
                        <div className="modal-body">
                            <div className="comment-section">
                                <h4>Ваш комментарий</h4>
                            <textarea
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                    placeholder="Введите ваш комментарий к заказу..."
                                className="comment-input"
                                rows="4"
                            />
                            </div>
                        </div>
                        
                        <div className="comment-modal-footer">
                            <button 
                                className="comment-view-btn"
                                onClick={() => {
                                    setShowCommentModal(false);
                                    viewOrderDetails(selectedOrder);
                                }}
                            >
                                Просмотреть детали
                            </button>
                            <button 
                                className="comment-submit-btn"
                                onClick={() => submitComment(selectedOrder.id)}
                                disabled={!comment.trim()}
                            >
                                Отправить комментарий
                            </button>
                            <button 
                                className="comment-cancel-btn"
                                onClick={() => {
                                    setShowCommentModal(false);
                                    setSelectedOrder(null);
                                    setComment('');
                                }}
                            >
                                Отмена
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Модальное окно для оплаты */}
            {showPaymentModal && selectedOrder && (
                <div className="comment-modal-overlay">
                    <div className="comment-modal-content">
                        <div className="comment-modal-header">
                            <h3>
                                {paymentType === 'advance' ? '💳 Оплата аванса за эскиз' : '💳 Оплата остатка'} - Заказ {selectedOrder.order_number}
                            </h3>
                            <button 
                                className="comment-close-btn"
                                onClick={() => {
                                    setShowPaymentModal(false);
                                    setSelectedOrder(null);
                                }}
                            >
                                ✕
                            </button>
                        </div>
                        
                        <div className="modal-body">
                            <div className="comment-section">
                                <h4>Информация об оплате</h4>
                                <div style={{ padding: '1rem', background: 'white', borderRadius: '8px', border: '1px solid #e9ecef', marginBottom: '1.5rem' }}>
                                    {/* Отладочная информация */}
                                    {console.log('Payment Modal - selectedOrder:', selectedOrder)}
                                    {console.log('Payment Modal - final_cost:', selectedOrder.final_cost)}
                                    {console.log('Payment Modal - advance_paid:', selectedOrder.advance_paid)}
                                    
                                    <p style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem' }}>
                                        <strong>Итоговая стоимость:</strong> <span style={{ color: '#2c3e50', fontSize: '1.2rem', fontWeight: '700' }}>{selectedOrder.final_cost || 0} ₽</span>
                                    </p>
                                    {paymentType === 'advance' ? (
                                        <>
                                            <p style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem' }}>
                                                <strong>Аванс за эскиз:</strong> <span style={{ color: '#28a745', fontSize: '1.2rem', fontWeight: '700' }}>{selectedOrder.advance_paid || 0} ₽</span>
                                            </p>
                                            <p style={{ margin: '0', color: '#6c757d', fontSize: '0.9rem' }}>
                                                После оплаты аванса BIM-менеджер приступит к работе над эскизом.
                                            </p>
                                        </>
                                    ) : (
                                        <>
                                            <p style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem' }}>
                                                <strong>Уже оплачено (аванс):</strong> <span style={{ color: '#007bff', fontSize: '1.1rem', fontWeight: '600' }}>{selectedOrder.advance_paid || 0} ₽</span>
                                            </p>
                                            <p style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem' }}>
                                                <strong>К доплате (остаток):</strong> <span style={{ color: '#28a745', fontSize: '1.2rem', fontWeight: '700' }}>{(selectedOrder.final_cost || 0) - (selectedOrder.advance_paid || 0)} ₽</span>
                                            </p>
                                            <p style={{ margin: '0', color: '#6c757d', fontSize: '0.9rem' }}>
                                                После оплаты остатка вы сможете скачать готовые файлы.
                                            </p>
                                        </>
                                    )}
                            </div>
                            
                                <h4 style={{ marginBottom: '1rem', color: '#2c3e50', fontSize: '1.1rem', fontWeight: '600' }}>Способы оплаты:</h4>
                                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                                    <button className="comment-submit-btn" style={{ flex: '1', minWidth: '120px' }}>Банковская карта</button>
                                    <button className="comment-submit-btn" style={{ flex: '1', minWidth: '120px' }}>СБП</button>
                                    <button className="comment-submit-btn" style={{ flex: '1', minWidth: '120px' }}>Электронный кошелек</button>
                                </div>
                            </div>
                        </div>
                        
                        <div className="comment-modal-footer">
                            <button 
                                className="comment-submit-btn"
                                onClick={() => {
                                    alert('Переход к оплате...');
                                    setShowPaymentModal(false);
                                    setSelectedOrder(null);
                                }}
                            >
                                Перейти к оплате
                            </button>
                            <button 
                                className="comment-cancel-btn"
                                onClick={() => {
                                    setShowPaymentModal(false);
                                    setSelectedOrder(null);
                                }}
                            >
                                Отмена
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Модальное окно для просмотра деталей заказа с файлами */}
            {showFileView && selectedOrder && (
                <div className="order-details-modal-overlay">
                    <div className="order-details-modal-content">
                        <div className="order-details-modal-header">
                            <h3>Детали заказа {selectedOrder.order_number}</h3>
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
                                    {selectedOrder.manager_name && (
                                        <div className="order-details-info-item">
                                            <span className="label">BIM-менеджер:</span>
                                            <span className="value">{selectedOrder.manager_name}</span>
                                        </div>
                                    )}
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

export default OrderList;