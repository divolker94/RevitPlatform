import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './ForumPostDetail.css';

function ForumPostDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [post, setPost] = useState(null);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(true);
    const [commentLoading, setCommentLoading] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('access_token'));

    useEffect(() => {
        fetchPost();
        fetchComments();
    }, [id]);

    const fetchPost = async () => {
        try {
            const response = await fetch(`http://localhost:8000/api/blog/posts/${id}/`);
            if (response.ok) {
                const data = await response.json();
                setPost(data);
            } else {
                console.error('Ошибка загрузки поста');
            }
        } catch (error) {
            console.error('Ошибка загрузки поста:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchComments = async () => {
        try {
            const response = await fetch(`http://localhost:8000/api/blog/comments/?post=${id}`);
            if (response.ok) {
                const data = await response.json();
                setComments(data);
            }
        } catch (error) {
            console.error('Ошибка загрузки комментариев:', error);
        }
    };

    const handleSubmitComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        setCommentLoading(true);
        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch(`http://localhost:8000/api/blog/posts/${id}/add_comment/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ content: newComment }),
            });

            if (response.ok) {
                const comment = await response.json();
                setComments([comment, ...comments]);
                setNewComment('');
            } else {
                console.error('Ошибка добавления комментария');
            }
        } catch (error) {
            console.error('Ошибка добавления комментария:', error);
        } finally {
            setCommentLoading(false);
        }
    };

    const handleBackToForum = () => {
        navigate('/forum');
    };

    if (loading) {
        return (
            <div className="forum-post-detail-loading">
                <div className="loading-spinner"></div>
                <p>Загрузка поста...</p>
            </div>
        );
    }

    if (!post) {
        return (
            <div className="forum-post-detail-error">
                <h2>Пост не найден</h2>
                <button onClick={handleBackToForum} className="back-button">
                    Вернуться к форуму
                </button>
            </div>
        );
    }

    return (
        <div className="forum-post-detail-page">
            <div className="forum-post-detail-container">
                {/* Кнопка возврата */}
                <button onClick={handleBackToForum} className="back-button">
                    ← Вернуться к форуму
                </button>

                {/* Основной контент поста */}
                <article className="forum-post-content">
                    <div className="post-header">
                        <span className="post-category">{post.category}</span>
                        <h1 className="post-title">{post.title}</h1>
                        <div className="post-meta">
                            <span className="post-author">
                                <i className="fas fa-user"></i> {post.author_full_name}
                            </span>
                            <span className="post-date">
                                <i className="fas fa-calendar"></i> {post.created_at_formatted}
                            </span>
                        </div>
                    </div>

                    {/* Изображение поста */}
                    {post.image && (
                        <div className="post-image-container">
                            <img src={post.image} alt={post.title} className="post-image" />
                        </div>
                    )}

                    {/* Превью поста */}
                    {post.preview && (
                        <div className="post-preview">
                            <p>{post.preview}</p>
                        </div>
                    )}

                    {/* Основное содержание */}
                    <div className="post-content">
                        <p>{post.content}</p>
                    </div>

                    {/* Дополнительные абзацы (можно добавить в модель) */}
                    <div className="post-additional-content">
                        <h3>Дополнительная информация</h3>
                        <p>Здесь может быть дополнительная информация о теме, полезные ссылки, ресурсы или другие материалы, которые помогут читателям лучше понять обсуждаемую тему.</p>
                        <p>Вы также можете поделиться своим опытом, задать вопросы или предложить альтернативные решения в комментариях ниже.</p>
                    </div>
                </article>

                {/* Секция комментариев */}
                <section className="comments-section">
                    <h2>Обсуждение ({comments.length})</h2>
                    
                    {/* Форма добавления комментария */}
                    {isAuthenticated ? (
                        <form onSubmit={handleSubmitComment} className="comment-form">
                            <textarea
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder="Напишите ваш комментарий..."
                                className="comment-input"
                                rows="4"
                                required
                            />
                            <button 
                                type="submit" 
                                className="comment-submit"
                                disabled={commentLoading}
                            >
                                {commentLoading ? 'Отправка...' : 'Отправить комментарий'}
                            </button>
                        </form>
                    ) : (
                        <div className="login-prompt">
                            <p>Войдите в систему, чтобы оставить комментарий</p>
                            <button onClick={() => navigate('/login')} className="login-button">
                                Войти
                            </button>
                        </div>
                    )}

                    {/* Список комментариев */}
                    <div className="comments-list">
                        {comments.length === 0 ? (
                            <p className="no-comments">Пока нет комментариев. Будьте первым!</p>
                        ) : (
                            comments.map(comment => (
                                <div key={comment.id} className="comment-item">
                                    <div className="comment-header">
                                        <span className="comment-author">{comment.author_full_name}</span>
                                        <span className="comment-date">{comment.created_at_formatted}</span>
                                    </div>
                                    <div className="comment-content">
                                        <p>{comment.content}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}

export default ForumPostDetail;
