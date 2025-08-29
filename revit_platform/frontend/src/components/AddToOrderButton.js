import React, { useState, useEffect } from 'react';
import { FaShoppingCart } from 'react-icons/fa';
import './AddToOrderButton.css';

const AddToOrderButton = ({ itemType, itemId, itemName, itemCost, itemArea, itemCategory }) => {
    const [isInCart, setIsInCart] = useState(false);
    const [quantity, setQuantity] = useState(1);
    const [showQuantityInput, setShowQuantityInput] = useState(false);

    useEffect(() => {
        // Проверяем, есть ли элемент в корзине
        const cart = JSON.parse(localStorage.getItem('orderCart') || '[]');
        const existingItem = cart.find(item => 
            item.itemType === itemType && item.itemId === itemId
        );
        if (existingItem) {
            setIsInCart(true);
            setQuantity(existingItem.quantity);
        }
    }, [itemType, itemId]);

    const addToCart = () => {
        const cart = JSON.parse(localStorage.getItem('orderCart') || '[]');
        
        const newItem = {
            itemType,
            itemId,
            itemName,
            itemCost: itemCost || 0,
            itemArea: itemArea || 0,
            itemCategory,
            quantity,
            addedAt: new Date().toISOString()
        };

        // Проверяем, есть ли уже такой элемент
        const existingIndex = cart.findIndex(item => 
            item.itemType === itemType && item.itemId === itemId
        );

        if (existingIndex !== -1) {
            // Обновляем количество
            cart[existingIndex].quantity = quantity;
        } else {
            // Добавляем новый элемент
            cart.push(newItem);
        }

        localStorage.setItem('orderCart', JSON.stringify(cart));
        setIsInCart(true);
        setShowQuantityInput(false);
        
        // Обновляем счетчик в хедере
        updateHeaderCounter();
    };

    const removeFromCart = () => {
        const cart = JSON.parse(localStorage.getItem('orderCart') || '[]');
        const filteredCart = cart.filter(item => 
            !(item.itemType === itemType && item.itemId === itemId)
        );
        localStorage.setItem('orderCart', JSON.stringify(filteredCart));
        setIsInCart(false);
        setQuantity(1);
        
        // Обновляем счетчик в хедере
        updateHeaderCounter();
    };

    const updateHeaderCounter = () => {
        const cart = JSON.parse(localStorage.getItem('orderCart') || '[]');
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        
        // Обновляем счетчик в хедере
        const event = new CustomEvent('cartUpdated', { detail: { totalItems } });
        window.dispatchEvent(event);
    };

    const handleQuantityChange = (e) => {
        const value = parseInt(e.target.value);
        if (value > 0) {
            setQuantity(value);
        }
    };

    const handleQuantitySubmit = (e) => {
        e.preventDefault();
        if (isInCart) {
            // Обновляем количество существующего элемента
            const cart = JSON.parse(localStorage.getItem('orderCart') || '[]');
            const itemIndex = cart.findIndex(item => 
                item.itemType === itemType && item.itemId === itemId
            );
            if (itemIndex !== -1) {
                cart[itemIndex].quantity = quantity;
                localStorage.setItem('orderCart', JSON.stringify(cart));
                updateHeaderCounter();
            }
        } else {
            addToCart();
        }
        setShowQuantityInput(false);
    };

    if (showQuantityInput) {
        return (
            <form onSubmit={handleQuantitySubmit} className="quantity-input-form">
                <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={handleQuantityChange}
                    className="quantity-input"
                    autoFocus
                />
                <button type="submit" className="quantity-submit-btn">
                    ✓
                </button>
                <button 
                    type="button" 
                    onClick={() => setShowQuantityInput(false)}
                    className="quantity-cancel-btn"
                >
                    ✕
                </button>
            </form>
        );
    }

    if (isInCart) {
        return (
            <div className="add-to-order-container">
                <button 
                    className="add-to-order-btn in-cart"
                    onClick={() => setShowQuantityInput(true)}
                    title="Изменить количество"
                >
                    <FaShoppingCart />
                    <span>В корзине ({quantity})</span>
                </button>
                <button 
                    className="remove-from-cart-btn"
                    onClick={removeFromCart}
                    title="Убрать из корзины"
                >
                    ✕
                </button>
            </div>
        );
    }

    return (
        <button 
            className="add-to-order-btn"
            onClick={() => setShowQuantityInput(true)}
            title="Добавить в заказ"
        >
            <FaShoppingCart />
            <span>В заказ</span>
        </button>
    );
};

export default AddToOrderButton;
