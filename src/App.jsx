import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Home from './pages/Home/Home';
import Article from './pages/Article/Article';
import Category from './pages/Category/Category';
import { MyET, NewsBriefing, VideoStudio, StoryArc } from './pages/Placeholder/Placeholder';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<MainLayout />}>
          {/* Core pages */}
          <Route path="/" element={<Home />} />
          <Route path="/article/:id" element={<Article />} />
          <Route path="/category/:slug" element={<Category />} />

          {/* Feature placeholder routes — for teammates */}
          <Route path="/my-et" element={<MyET />} />
          <Route path="/briefing/:topic" element={<NewsBriefing />} />
          <Route path="/video/:id" element={<VideoStudio />} />
          <Route path="/story-arc/:slug" element={<StoryArc />} />
        </Route>
      </Routes>
    </Router>
  );
}
