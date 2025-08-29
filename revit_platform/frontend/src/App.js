import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Home from './pages/Home';
import OrderForm from './components/OrderForm'; // Import OrderForm component
import ArchitecturalProjects from './pages/ArchitecturalProjects';
import Footer from './components/Footer';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import Families from './pages/Families';
import BimFamilyDetail from './pages/BimFamilyDetail';
import Forum from './pages/Forum';
import News from './pages/forum/News';
import Tips from './pages/forum/Tips';
import Technology from './pages/forum/Technology';
import Training from './pages/forum/Training';
import ForumPostDetail from './pages/ForumPostDetail';
import Profile from './pages/Profile';
import MyFamilies from './pages/MyFamilies';
import About from './pages/About';
import Contact from './pages/Contact';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import './App.css';
import UserTypeSelect from './components/UserTypeSelect';
import CompanyProfile from './components/CompanyProfile'; // Импорт переименованного компонента
import ClientProfile from './components/ClientProfile'; // Импорт переименованного компонента
import BimSpecialistProfile from './components/BimSpecialistProfile'; // Импорт переименованного компонента
import OrderCart from './pages/OrderCart';

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('access_token'));

    useEffect(() => {
        const handleStorageChange = () => {
            setIsAuthenticated(!!localStorage.getItem('access_token'));
        };
        
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    return (
        <Router>
            <div className="app">
                <Header isAuthenticated={isAuthenticated} setIsAuthenticated={setIsAuthenticated} />
                <main className="main-content">
                    <Routes>
                        {/* Public routes */}
                        <Route path="/" element={<Home />} />
                        <Route path="/about" element={<About />} />
                        <Route path="/contact" element={<Contact />} />
                        <Route path="/terms" element={<Terms />} />
                        <Route path="/privacy" element={<Privacy />} />
                        <Route path="/architectural-projects" element={<ArchitecturalProjects />} />
                        <Route path="/architectural-projects/:id" element={<ProjectDetail />} />
                        <Route path="/order" element={<OrderForm />} />
                        <Route path="/families" element={<Families />} />
                        <Route path="/bim-families/:id" element={<BimFamilyDetail />} />
                        <Route path="/blog" element={<Forum />} />
                        <Route path="/forum" element={<Forum />} />
                        <Route path="/forum/news" element={<News />} />
                        <Route path="/forum/tips" element={<Tips />} />
                        <Route path="/forum/technology" element={<Technology />} />
                        <Route path="/forum/training" element={<Training />} />
                        <Route path="/forum/post/:id" element={<ForumPostDetail />} />
                        <Route path="/order-cart" element={<OrderCart />} />

                        {/* Previously protected routes, now public */}
                        <Route path="/projects" element={<Projects />} />
                        <Route path="/profile" element={<Profile />} />
                        <Route path="/my-projects" element={<Projects />} />
                        <Route path="/my-families" element={<MyFamilies />} />
                        <Route path="/select-user-type" element={<UserTypeSelect />} />
                        <Route path="/legal-entity-profile" element={<CompanyProfile />} />
                        <Route path="/individual-profile" element={<ClientProfile />} />
                        <Route path="/specialist-profile" element={<BimSpecialistProfile />} />
                    </Routes>
                </main>
                <Footer />
            </div>
        </Router>
    );
}

export default App;