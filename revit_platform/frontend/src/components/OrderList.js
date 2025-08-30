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
    const [userRole, setUserRole] = useState(null);

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
                                    <span className="label">Тип работ:</span>
                                    <span className="value">{getWorkTypeText(order.work_type)}</span>
                                </div>
                                
                                {order.customer_area && (
                                    <div className="detail-item">
                                        <span className="label">Площадь:</span>
                                        <span className="value">{order.customer_area} м²</span>
                                    </div>
                                )}
                                
                                <div className="detail-item">
                                    <span className="label">Статус оплаты:</span>
                                    <span className={`payment-status ${order.payment_status}`}>
                                        {getPaymentStatusText(order.payment_status)}
                                    </span>
                                </div>
                                
                                {/* Расчетная стоимость - только итоговая */}
                                {order.final_cost > 0 && (
                                    <div className="detail-item cost-highlight">
                                        <span className="label">Итоговая стоимость:</span>
                                        <span className="value cost">{order.final_cost} ₽</span>
                                    </div>
                                )}
                                
                                {order.advance_paid > 0 && (
                                    <div className="detail-item payment-info">
                                        <span className="label">Оплачено авансом:</span>
                                        <span className="value paid">{order.advance_paid} ₽</span>
                                    </div>
                                )}
                                
                                {order.final_cost > 0 && order.advance_paid > 0 && (
                                    <div className="detail-item payment-info">
                                        <span className="label">К оплате:</span>
                                        <span className="value remaining">{order.final_cost - order.advance_paid} ₽</span>
                                    </div>
                                )}
                                
                                <div className="detail-item">
                                    <label>Дата создания:</label>
                                    <span className="value">
                                        {new Date(order.created_at).toLocaleDateString('ru-RU')}
                                    </span>
                                </div>
                                
                                {/* Отображение комментария заказчика */}
                                {order.customer_comment && (
                                    <div className="comment-section">
                                        <div className="comment-text">{order.customer_comment}</div>
                                        {order.comment_date && (
                                            <div className="comment-date">
                                                {new Date(order.comment_date).toLocaleDateString('ru-RU')}
                                            </div>
                                        )}
                                    </div>
                                )}
                                
                                {/* Отображение файлов заказа */}
                                {order.files && order.files.length > 0 && (
                                    <div className="files-section">
                                        <h4>Файлы заказа:</h4>
                                        {order.files.map((file, index) => (
                                            <div key={index} className="file-item">
                                                <span className="file-title">{file.title}</span>
                                                <span className="file-type">({file.file_type})</span>
                                                <span className="file-date">
                                                    {new Date(file.uploaded_at).toLocaleDateString('ru-RU')}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            
                            <div className="order-actions">
                                <button className="action-button view-btn">Просмотреть детали</button>
                                
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
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>Добавить комментарий к заказу {selectedOrder.order_number}</h3>
                            <button 
                                className="close-btn"
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
                            <textarea
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="Введите ваш комментарий..."
                                className="comment-input"
                                rows="4"
                            />
                        </div>
                        
                        <div className="modal-footer">
                            <button 
                                className="action-button submit-btn"
                                onClick={() => submitComment(selectedOrder.id)}
                                disabled={!comment.trim()}
                            >
                                Отправить комментарий
                            </button>
                            <button 
                                className="action-button cancel-btn"
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
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>Оплата за заказ {selectedOrder.order_number}</h3>
                            <button 
                                className="close-btn"
                                onClick={() => {
                                    setShowPaymentModal(false);
                                    setSelectedOrder(null);
                                }}
                            >
                                ✕
                            </button>
                        </div>
                        
                        <div className="modal-body">
                            <div className="payment-info">
                                <p><strong>Итоговая стоимость:</strong> {selectedOrder.final_cost} ₽</p>
                                <p><strong>К оплате (30%):</strong> {selectedOrder.final_cost * 0.3} ₽</p>
                                <p>После оплаты BIM-менеджер получит ваш комментарий и продолжит работу.</p>
                            </div>
                            
                            <div className="payment-methods">
                                <h4>Способы оплаты:</h4>
                                <button className="payment-method-btn">Банковская карта</button>
                                <button className="payment-method-btn">СБП</button>
                                <button className="payment-method-btn">Электронный кошелек</button>
                            </div>
                        </div>
                        
                        <div className="modal-footer">
                            <button 
                                className="action-button pay-btn"
                                onClick={() => {
                                    alert('Переход к оплате...');
                                    setShowPaymentModal(false);
                                    setSelectedOrder(null);
                                }}
                            >
                                Перейти к оплате
                            </button>
                            <button 
                                className="action-button cancel-btn"
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
        </div>
    );
};

export default OrderList;