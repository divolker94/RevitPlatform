import React from 'react';

function Contact() {
    return (
        <div className="container mt-5">
            <h1>Контакты</h1>
            <div className="row mt-4">
                <div className="col-md-6">
                    <h2>Свяжитесь с нами</h2>
                    <p className="lead">
                        Мы всегда готовы ответить на ваши вопросы и помочь вам в использовании нашей платформы.
                    </p>
                    <div className="contact-info mt-4">
                        <h3>Наши контакты:</h3>
                        <ul className="list-unstyled">
                            <li className="mb-3">
                                <strong>Email:</strong> info@revitplatform.com
                            </li>
                            <li className="mb-3">
                                <strong>Телефон:</strong> +7 (XXX) XXX-XX-XX
                            </li>
                            <li className="mb-3">
                                <strong>Адрес:</strong> г. Москва, ул. Примерная, д. 1
                            </li>
                        </ul>
                    </div>
                    <div className="working-hours mt-4">
                        <h3>Часы работы:</h3>
                        <p>
                            Понедельник - Пятница: 9:00 - 18:00<br />
                            Суббота - Воскресенье: Выходной
                        </p>
                    </div>
                </div>
                <div className="col-md-6">
                    <div className="support-info">
                        <h3>Техническая поддержка</h3>
                        <p>
                            Если у вас возникли технические вопросы или проблемы при использовании платформы,
                            наша команда поддержки готова помочь вам:
                        </p>
                        <ul className="list-unstyled">
                            <li className="mb-3">
                                <strong>Email поддержки:</strong> support@revitplatform.com
                            </li>
                            <li className="mb-3">
                                <strong>Время ответа:</strong> в течение 24 часов
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Contact;