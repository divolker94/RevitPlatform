import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaTrash, FaEdit, FaFileUpload, FaCalculator, FaCreditCard, FaPaperPlane } from 'react-icons/fa';
import './OrderCart.css';

const OrderCart = () => {
    const [cartItems, setCartItems] = useState([]);
    const [orderData, setOrderData] = useState({
        title: '',
        description: '',
        requirements: '',
        work_type: 'new_construction',
        customer_area: ''
    });
    const [documents, setDocuments] = useState([]);
    const [calculation, setCalculation] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        loadCartItems();
    }, []);

    const loadCartItems = () => {
        const cart = JSON.parse(localStorage.getItem('orderCart') || '[]');
        setCartItems(cart);
    };

    const removeFromCart = (itemType, itemId) => {
        const updatedCart = cartItems.filter(item => 
            !(item.itemType === itemType && item.itemId === itemId)
        );
        localStorage.setItem('orderCart', JSON.stringify(updatedCart));
        setCartItems(updatedCart);
        
        // Обновляем счетчик в хедере
        const event = new CustomEvent('cartUpdated', { 
            detail: { totalItems: updatedCart.reduce((sum, item) => sum + item.quantity, 0) } 
        });
        window.dispatchEvent(event);
    };

    const updateQuantity = (itemType, itemId, newQuantity) => {
        if (newQuantity < 1) return;
        
        const updatedCart = cartItems.map(item => {
            if (item.itemType === itemType && item.itemId === itemId) {
                return { ...item, quantity: newQuantity };
            }
            return item;
        });
        
        localStorage.setItem('orderCart', JSON.stringify(updatedCart));
        setCartItems(updatedCart);
        
        // Обновляем счетчик в хедере
        const event = new CustomEvent('cartUpdated', { 
            detail: { totalItems: updatedCart.reduce((sum, item) => sum + item.quantity, 0) } 
        });
        window.dispatchEvent(event);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setOrderData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleFileUpload = (e) => {
        const files = Array.from(e.target.files);
        const newDocuments = files.map(file => ({
            id: Date.now() + Math.random(),
            file,
            name: file.name,
            size: file.size,
            type: file.type
        }));
        setDocuments(prev => [...prev, ...newDocuments]);
    };

    const removeDocument = (docId) => {
        setDocuments(prev => prev.filter(doc => doc.id !== docId));
    };

    const calculateOrderCost = () => {
        if (cartItems.length === 0) return;

        const workTypeMultipliers = {
            'new_construction': 1.0,
            'reconstruction': 1.15,
            'capital_repair': 1.25,
            'cramped_conditions': 1.2
        };

        const workTypeMultiplier = workTypeMultipliers[orderData.work_type];
        
        // Базовая стоимость (архитектурные проекты)
        const baseCost = cartItems
            .filter(item => item.itemType === 'architectural_project')
            .reduce((sum, item) => sum + (item.itemCost * item.quantity), 0);

        // Стоимость BIM-семейств
        const familyCost = cartItems
            .filter(item => item.itemType === 'bim_family')
            .reduce((sum, item) => sum + (item.itemCost * item.quantity), 0);

        // Корректировка по площади
        let areaAdjustment = 1.0;
        if (orderData.customer_area && baseCost > 0) {
            const baseArea = cartItems
                .filter(item => item.itemType === 'architectural_project' && item.itemArea)
                .reduce((sum, item) => sum + (item.itemArea * item.quantity), 0);
            
            if (baseArea > 0) {
                const areaRatio = parseFloat(orderData.customer_area) / baseArea;
                if (areaRatio < 0.8 || areaRatio > 1.2) {
                    areaAdjustment = 1.3; // Увеличение на 30%
                }
            }
        }

        const finalCost = (baseCost * workTypeMultiplier * areaAdjustment) + familyCost;
        const advanceAmount = finalCost * 0.5;

        setCalculation({
            baseCost,
            workTypeMultiplier,
            areaAdjustment,
            familyCost,
            finalCost,
            advanceAmount,
            remainingAmount: finalCost - advanceAmount
        });
    };

    const createOrder = async () => {
        if (cartItems.length === 0) {
            setError('Корзина пуста');
            return;
        }

        if (!orderData.title.trim()) {
            setError('Необходимо указать название заказа');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const token = localStorage.getItem('access_token');
            
            // Создаем заказ
            const orderResponse = await fetch('http://localhost:8000/api/orders/orders/', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    title: orderData.title,
                    description: orderData.description,
                    requirements: orderData.requirements,
                    work_type: orderData.work_type,
                    customer_area: orderData.customer_area || null
                })
            });

            if (!orderResponse.ok) {
                throw new Error('Ошибка при создании заказа');
            }

            const order = await orderResponse.json();

            // Добавляем элементы заказа
            for (const item of cartItems) {
                const itemData = {
                    item_type: item.itemType,
                    item_id: item.itemId,
                    quantity: item.quantity,
                    notes: ''
                };

                await fetch(`http://localhost:8000/api/orders/orders/${order.id}/add_item/`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(itemData)
                });
            }

            // Загружаем документы
            for (const doc of documents) {
                const formData = new FormData();
                formData.append('title', doc.name);
                formData.append('document_type', 'source');
                formData.append('file', doc.file);

                await fetch(`http://localhost:8000/api/orders/orders/${order.id}/upload_document/`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    body: formData
                });
            }

            // Рассчитываем стоимость
            await fetch(`http://localhost:8000/api/orders/orders/${order.id}/calculate_cost/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    customer_area: orderData.customer_area
                })
            });

            // Очищаем корзину
            localStorage.removeItem('orderCart');
            setCartItems([]);
            
            // Обновляем счетчик в хедере
            const event = new CustomEvent('cartUpdated', { detail: { totalItems: 0 } });
            window.dispatchEvent(event);

            setSuccess('Заказ успешно создан!');
            
            // Перенаправляем на страницу заказа
            setTimeout(() => {
                navigate(`/orders/${order.id}`);
            }, 2000);

        } catch (error) {
            console.error('Error creating order:', error);
            setError('Ошибка при создании заказа: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const getWorkTypeLabel = (workType) => {
        const labels = {
            'new_construction': 'Новое строительство',
            'reconstruction': 'Реконструкция',
            'capital_repair': 'Капитальный ремонт',
            'cramped_conditions': 'Стесненные условия'
        };
        return labels[workType] || workType;
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('ru-RU', {
            style: 'currency',
            currency: 'RUB'
        }).format(amount);
    };

    if (cartItems.length === 0) {
        return (
            <div className="order-cart-container">
                <div className="empty-cart">
                    <h2>Корзина заказов пуста</h2>
                    <p>Добавьте архитектурные проекты или BIM-семейства в корзину для создания заказа</p>
                    <button 
                        className="btn btn-primary"
                        onClick={() => navigate('/architectural-projects')}
                    >
                        Перейти к каталогу
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="order-cart-container">
            <div className="order-cart-header">
                <h1>Корзина заказов</h1>
                <p>Проверьте выбранные элементы и создайте заказ</p>
            </div>

            <div className="order-cart-content">
                <div className="cart-items-section">
                    <h2>Выбранные элементы ({cartItems.length})</h2>
                    
                    <div className="cart-items">
                        {cartItems.map((item, index) => (
                            <div key={`${item.itemType}-${item.itemId}`} className="cart-item">
                                <div className="item-info">
                                    <h4>{item.itemName}</h4>
                                    <p className="item-category">{item.itemCategory}</p>
                                    <p className="item-cost">
                                        Стоимость: {formatCurrency(item.itemCost)}
                                    </p>
                                    {item.itemArea && (
                                        <p className="item-area">
                                            Площадь: {item.itemArea} м²
                                        </p>
                                    )}
                                </div>
                                
                                <div className="item-actions">
                                    <div className="quantity-controls">
                                        <button 
                                            onClick={() => updateQuantity(item.itemType, item.itemId, item.quantity - 1)}
                                            disabled={item.quantity <= 1}
                                            className="quantity-btn"
                                        >
                                            -
                                        </button>
                                        <span className="quantity">{item.quantity}</span>
                                        <button 
                                            onClick={() => updateQuantity(item.itemType, item.itemId, item.quantity + 1)}
                                            className="quantity-btn"
                                        >
                                            +
                                        </button>
                                    </div>
                                    
                                    <button 
                                        onClick={() => removeFromCart(item.itemType, item.itemId)}
                                        className="remove-btn"
                                        title="Убрать из корзины"
                                    >
                                        <FaTrash />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="order-form-section">
                    <h2>Информация о заказе</h2>
                    
                    <div className="form-group">
                        <label>Название заказа *</label>
                        <input
                            type="text"
                            name="title"
                            value={orderData.title}
                            onChange={handleInputChange}
                            placeholder="Введите название заказа"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Описание</label>
                        <textarea
                            name="description"
                            value={orderData.description}
                            onChange={handleInputChange}
                            placeholder="Опишите ваш заказ"
                            rows="3"
                        />
                    </div>

                    <div className="form-group">
                        <label>Требования и пожелания</label>
                        <textarea
                            name="requirements"
                            value={orderData.requirements}
                            onChange={handleInputChange}
                            placeholder="Укажите особые требования"
                            rows="3"
                        />
                    </div>

                    <div className="form-group">
                        <label>Тип работ</label>
                        <select
                            name="work_type"
                            value={orderData.work_type}
                            onChange={handleInputChange}
                        >
                            <option value="new_construction">Новое строительство</option>
                            <option value="reconstruction">Реконструкция</option>
                            <option value="capital_repair">Капитальный ремонт</option>
                            <option value="cramped_conditions">Стесненные условия</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Площадь объекта (м²)</label>
                        <input
                            type="number"
                            name="customer_area"
                            value={orderData.customer_area}
                            onChange={handleInputChange}
                            placeholder="Введите площадь вашего объекта"
                            min="0"
                            step="0.01"
                        />
                    </div>

                    <div className="form-group">
                        <label>Исходные документы</label>
                        <div className="file-upload">
                            <input
                                type="file"
                                multiple
                                onChange={handleFileUpload}
                                accept=".pdf,.jpg,.jpeg,.png,.dwg,.rvt"
                            />
                            <span>Выберите файлы</span>
                        </div>
                        
                        {documents.length > 0 && (
                            <div className="uploaded-files">
                                {documents.map(doc => (
                                    <div key={doc.id} className="file-item">
                                        <span>{doc.name}</span>
                                        <button 
                                            onClick={() => removeDocument(doc.id)}
                                            className="remove-file-btn"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <button 
                        className="btn btn-secondary calculate-btn"
                        onClick={calculateOrderCost}
                        disabled={cartItems.length === 0}
                    >
                        <FaCalculator />
                        Рассчитать стоимость
                    </button>

                    {calculation && (
                        <div className="cost-calculation">
                            <h3>Расчет стоимости</h3>
                            <div className="calculation-details">
                                <div className="calculation-row">
                                    <span>Базовая стоимость:</span>
                                    <span>{formatCurrency(calculation.baseCost)}</span>
                                </div>
                                <div className="calculation-row">
                                    <span>Коэффициент типа работ ({getWorkTypeLabel(orderData.work_type)}):</span>
                                    <span>× {calculation.workTypeMultiplier}</span>
                                </div>
                                <div className="calculation-row">
                                    <span>Корректировка по площади:</span>
                                    <span>× {calculation.areaAdjustment}</span>
                                </div>
                                <div className="calculation-row">
                                    <span>Стоимость BIM-семейств:</span>
                                    <span>{formatCurrency(calculation.familyCost)}</span>
                                </div>
                                <div className="calculation-row total">
                                    <span>Итоговая стоимость:</span>
                                    <span>{formatCurrency(calculation.finalCost)}</span>
                                </div>
                                <div className="calculation-row">
                                    <span>Аванс (50%):</span>
                                    <span>{formatCurrency(calculation.advanceAmount)}</span>
                                </div>
                                <div className="calculation-row">
                                    <span>К оплате после выполнения:</span>
                                    <span>{formatCurrency(calculation.remainingAmount)}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    <button 
                        className="btn btn-primary create-order-btn"
                        onClick={createOrder}
                        disabled={loading || !orderData.title.trim() || !calculation}
                    >
                        {loading ? (
                            <>
                                <div className="spinner"></div>
                                Создание заказа...
                            </>
                        ) : (
                            <>
                                <FaPaperPlane />
                                Создать заказ
                            </>
                        )}
                    </button>
                </div>
            </div>

            {error && (
                <div className="alert alert-danger">
                    {error}
                </div>
            )}

            {success && (
                <div className="alert alert-success">
                    {success}
                </div>
            )}
        </div>
    );
};

export default OrderCart;
