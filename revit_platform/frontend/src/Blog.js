import React, { useState, useEffect } from 'react';

function Blog() {
    const [posts, setPosts] = useState([]);

    useEffect(() => {
        fetch('http://localhost:8000/api/blog/posts/')
            .then(response => response.json())
            .then(data => setPosts(data))
            .catch(error => console.error('Error:', error));
    }, []);

    return (
        <div className="container mt-5">
            <h1>Блог</h1>
            <div className="row">
                {posts.map(post => (
                    <div key={post.id} className="col-md-6 mb-4">
                        <div className="card">
                            {post.image && (
                                <img 
                                    src={post.image} 
                                    className="card-img-top" 
                                    alt={post.title} 
                                />
                            )}
                            <div className="card-body">
                                <h5 className="card-title">{post.title}</h5>
                                <p className="card-text">{post.content.substring(0, 200)}...</p>
                                <div className="d-flex justify-content-between align-items-center">
                                    <button className="btn btn-primary">Читать далее</button>
                                    <small className="text-muted">
                                        {new Date(post.created_at).toLocaleDateString()}
                                    </small>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default Blog;