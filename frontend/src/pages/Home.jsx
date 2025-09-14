// src/pages/Home.jsx
import React, { useState, useEffect } from 'react';
import Hero from '../components/Hero';
import LatestCollection from '../components/LatestCollection';
import BestSeller from '../components/BestSeller';
import OurPolicy from '../components/OurPolicy';
import DevNoticeModal from '../components/DevNoticeModal';

const Home = () => {
  const [showDevNotice, setShowDevNotice] = useState(false);

  // Show the modal once when the page first loads
  useEffect(() => {
    setShowDevNotice(true);
  }, []);

  return (
    <div>
      <DevNoticeModal
        open={showDevNotice}
        onClose={() => setShowDevNotice(false)}
      />
      <Hero />
      <LatestCollection/>
      <BestSeller/>
    </div>
  );
};

export default Home;
