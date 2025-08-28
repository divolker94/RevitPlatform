import React from 'react';

function About() {
    return (
        <div className="container mt-5">
            <h1>О нас</h1>
            <div className="row mt-4">
                <div className="col-md-8">
                    <h2>RevitPlatform - ваш надежный партнер в BIM проектировании</h2>
                    <p className="lead">
                        Мы предоставляем платформу для эффективной работы с Revit проектами 
                        и обмена семействами между профессионалами.
                    </p>
                    <p>
                        Наша миссия - создать единое пространство для архитекторов, 
                        инженеров и проектировщиков, где они могут делиться опытом, 
                        находить нужные семейства Revit и эффективно управлять проектами.
                    </p>
                    <h3 className="mt-4">Наши преимущества:</h3>
                    <ul className="list-group list-group-flush">
                        <li className="list-group-item">✓ Большая библиотека семейств Revit</li>
                        <li className="list-group-item">✓ Удобное управление проектами</li>
                        <li className="list-group-item">✓ Профессиональное сообщество</li>
                        <li className="list-group-item">✓ Регулярные обновления контента</li>
                    </ul>
                </div>
                <div className="col-md-4">
                    <div className="card">
                        <div className="card-body">
                            <h5 className="card-title">Контакты</h5>
                            <p className="card-text">
                                <strong>Email:</strong> info@revitplatform.com<br />
                                <strong>Телефон:</strong> +7 (XXX) XXX-XX-XX<br />
                                <strong>Адрес:</strong> г. Москва, ул. Примерная, д. 1
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default About;
