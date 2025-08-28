import React from 'react';

function MyProjects() {
    return (
        <div className="container mt-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>Мои проекты</h2>
                <button className="btn btn-primary">
                    Добавить проект
                </button>
            </div>
            <div className="row">
                {/* Здесь будет список проектов */}
                <div className="col-12">
                    <div className="alert alert-info">
                        У вас пока нет проектов. Создайте свой первый проект!
                    </div>
                </div>
            </div>
        </div>
    );
}

export default MyProjects; 