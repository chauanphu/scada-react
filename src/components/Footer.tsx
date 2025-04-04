import React from 'react';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-gray-800 text-white py-4">
      <div className="container mx-auto px-4 text-center">
        <p>© {currentYear} CTY TNHH Gia Phát | Phiên bản v3.1.0</p>
      </div>
    </footer>
  );
};

export default Footer;