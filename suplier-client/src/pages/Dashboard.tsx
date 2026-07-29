import React from 'react';
import { Link } from 'react-router-dom';
import { Construction, LayoutDashboard, ArrowRight } from 'lucide-react';

const Dashboard: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
      {/* Іконка з анімацією */}
      <div className="bg-blue-50 p-6 rounded-full mb-6 ring-4 ring-blue-100">
        <Construction className="w-16 h-16 text-blue-600 animate-bounce" />
      </div>

      {/* Текст */}
      <h1 className="text-3xl font-extrabold text-gray-900 mb-4 flex items-center gap-3">
        <LayoutDashboard className="text-blue-600" /> Dashboard Under Development
      </h1>
      
      <p className="text-lg text-gray-600 max-w-lg mb-8">
        I am currently building a powerful analytics engine to track supplier performance, 
        matching accuracy, and price trends. This module will be available soon!
      </p>

      {/* Заклик до дії */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Link
          to="/suppliers"
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all shadow-md hover:shadow-lg"
        >
          Explore Suppliers <ArrowRight className="w-4 h-4" />
        </Link>
        
        <a
          href="https://github.com/alexhamash/supplier-product-matching-system"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all"
        >
          View Roadmap on GitHub
        </a>
      </div>

      {/* Прогрес-бар для вигляду */}
      <div className="mt-12 w-full max-w-xs">
        <div className="flex justify-between mb-1 text-sm font-medium text-blue-600">
          <span>Development Progress</span>
          <span>65%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '65%' }}></div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
