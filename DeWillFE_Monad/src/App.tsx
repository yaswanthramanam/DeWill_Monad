import _React from 'react'
import './App.css'
import './components/AppBar/ResponsiveAppBar'
import { Routes, Route } from 'react-router-dom';
import Home from './components/Home/Home'
import FAQ from './components/FAQ/FAQ';
import DeWill from './components/DeWill/DeWill';
import Send from './components/Send/Send';
import Redeem from './components/Redeem/Redeem';

function App() {

  return (
    <div>
          <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/faq" element={<FAQ />} />
                <Route path="/dewill" element={<DeWill />} />
                <Route path="/send" element={< Send/>} />
                <Route path="/redeem" element={< Redeem/>} />
          </Routes>
    </div>



  )
}

export default App
