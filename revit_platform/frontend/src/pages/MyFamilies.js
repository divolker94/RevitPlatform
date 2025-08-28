import React from 'react';

function MyFamilies() {
    return (
        <div className="container mt-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>Мои семейства</h2>
                <button className="btn btn-primary">
                    Добавить семейство
                </button>
            </div>
            <div className="row">
                {/* Здесь будет список семейств */}
                <div className="col-12">
                    <div className="alert alert-info">
                        У вас пока нет семейств. Добавьте свое первое семейство!
                    </div>
                </div>
            </div>
        </div>
    );
}

export default MyFamilies; 