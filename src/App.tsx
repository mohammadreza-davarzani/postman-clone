import { HashRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Client from './pages/Client';

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/client" element={<Client />} />
      </Routes>
    </HashRouter>
  );
}
