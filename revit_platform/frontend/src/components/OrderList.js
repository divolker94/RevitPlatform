import React, { useState, useEffect } from 'react';
import './OrderList.css';

const OrderList = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // TODO: Implement API call to fetch orders
        const fetchOrders = async () => {
            try {
                // Simulated API call
                const response = await fetch('/api/orders');
                const data = await response.json();
                setOrders(data);
            } catch (error) {
                console.error('Error fetching orders:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, []);

    if (loading) {
        return <div className="loading">Loading orders...</div>;
    }

    return (
        <div className="order-list-container">
            <h2>Project Orders</h2>
            <div className="order-list">
                {orders.map(order => (
                    <div key={order.id} className="order-item">
                        <div className="order-header">
                            <h3>{order.projectName}</h3>
                            <span className="order-status">{order.status}</span>
                        </div>
                        <div className="order-details">
                            <div className="detail-item">
                                <span className="label">Construction Type:</span>
                                <span className="value">{order.constructionType}</span>
                            </div>
                            <div className="detail-item">
                                <span className="label">Sections:</span>
                                <span className="value">{order.documentationSections}</span>
                            </div>
                            <div className="detail-item">
                                <span className="label">Deadline:</span>
                                <span className="value">{new Date(order.deadline).toLocaleDateString()}</span>
                            </div>
                            <div className="detail-item">
                                <span className="label">Budget:</span>
                                <span className="value">${order.budget}</span>
                            </div>
                        </div>
                        <div className="order-actions">
                            <button className="action-button view">View Details</button>
                            <button className="action-button assign">Assign</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default OrderList;