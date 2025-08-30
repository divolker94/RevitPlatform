import React, { useState, useEffect } from 'react';
import { FaTrash, FaPlus } from 'react-icons/fa';
import './AddToOrderButton.css';

const AddToOrderButton = ({ 
    itemType, 
    itemId, 
    itemName, 
    itemCost, 
    itemArea, 
    itemCategory 
}) => {
    const [isInCart, setIsInCart] = useState(false);
    const [userRole, setUserRole] = useState(null);

    useEffect(() => {
        // Проверяем роль пользователя
        const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
        const userType = userData.user_type;
        const specialistType = userData.specialist_type;
        const userRole = userData.user_role;
        
        console.log('AddToOrderButton - userData:', userData);
        console.log('AddToOrderButton - userType:', userType);
        console.log('AddToOrderButton - specialistType:', specialistType);
        console.log('AddToOrderButton - userRole:', userRole);
        
        // Определяем роль для логики корзины
        let roleForCart = 'customer';
        if (userType === 'specialist') {
            if (specialistType === 'manager') {
                roleForCart = 'manager';
            } else {
                roleForCart = 'executor';
            }
        } else if (userType === 'legal' || userType === 'individual') {
            roleForCart = userRole || 'customer';
        }
        
        console.log('AddToOrderButton - roleForCart:', roleForCart);
        setUserRole(roleForCart);
        
        // Проверяем, есть ли элемент в корзине
        const cartItems = JSON.parse(localStorage.getItem('orderCart') || '[]');
        console.log('AddToOrderButton - cartItems:', cartItems);
        const exists = cartItems.some(item => 
            item.itemType === itemType && item.itemId === itemId
        );
        setIsInCart(exists);
    }, [itemType, itemId]);

    // Если пользователь BIM-менеджер, не показываем кнопку
    if (userRole === 'manager') {
        return null;
    }

    const handleAddToCart = () => {
        const cartItems = JSON.parse(localStorage.getItem('orderCart') || '[]');
        
        const newItem = {
            itemType,
            itemId,
            itemName,
            itemCost,
            itemArea,
            itemCategory,
            quantity: 1
        };
        
        // Проверяем, есть ли уже такой элемент
        const existingIndex = cartItems.findIndex(item => 
            item.itemType === itemType && item.itemId === itemId
        );
        
        if (existingIndex >= 0) {
            // Если элемент уже есть, увеличиваем количество
            cartItems[existingIndex].quantity = (cartItems[existingIndex].quantity || 1) + 1;
        } else {
            // Если элемента нет, добавляем новый
            cartItems.push(newItem);
        }
        
        localStorage.setItem('orderCart', JSON.stringify(cartItems));
        setIsInCart(true);
        
        // Отправляем событие об обновлении корзины
        window.dispatchEvent(new CustomEvent('cartUpdated', { 
            detail: { totalItems: cartItems.length } 
        }));
    };

    const handleRemoveFromCart = () => {
        const cartItems = JSON.parse(localStorage.getItem('orderCart') || '[]');
        const filteredItems = cartItems.filter(item => 
            !(item.itemType === itemType && item.itemId === itemId)
        );
        
        localStorage.setItem('orderCart', JSON.stringify(filteredItems));
        setIsInCart(false);
        
        // Отправляем событие об обновлении корзины
        window.dispatchEvent(new CustomEvent('cartUpdated', { 
            detail: { totalItems: filteredItems.length } 
        }));
    };

    return (
        <div className="add-to-order-container">
            {!isInCart ? (
                <button 
                    className="add-to-order-btn"
                    onClick={handleAddToCart}
                >
                    <FaPlus />
                    Добавить в заказ
                </button>
            ) : (
                <button 
                    className="remove-from-order-btn"
                    onClick={handleRemoveFromCart}
                >
                    <FaTrash />
                    Убрать из заказа
                </button>
            )}
        </div>
    );
};

export default AddToOrderButton;
