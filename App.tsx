import React, { useState } from 'react';
import { NAV_ITEMS, APP_NAME, APP_VERSION } from './constants';
import { ViewMode, ProductData } from './types';
import { Dashboard } from './components/Dashboard';
import { ExtractionView } from './components/ExtractionView';
import { LeadManager } from './components/LeadManager';
import { Radar, ShieldCheck } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<ViewMode>('extraction'); // Default to extraction for immediate action
  const [products, setProducts] = useState<ProductData[]>([]);

  const handleProductsExtracted = (newProducts: ProductData[]) => {
    setProducts(prev => [...newProducts, ...prev]);
    setActiveTab('products'); // Switch to results view
  };

  const handleClearProducts = () => {
    if(window.confirm('确定要清空所有已抓取的数据吗？此操作不可恢复。')) {
      setProducts([]);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard leads={products} />;
      case 'extraction':
        return <ExtractionView onProductsExtracted={handleProductsExtracted} />;
      case 'products':
        return <LeadManager leads={products} onClear={handleClearProducts} />;
      case 'settings':
        return (
          <div className="flex items-center justify-center h-full text-slate-500">
            <div className="text-center">
              <ShieldCheck size={48} className="mx-auto mb-4 text-emerald-500" />
              <h3 className="text-xl font-bold text-slate-300">系统运行正常</h3>
              <p className="mt-2 text-sm">API Key 已配置 (环境安全)</p>
              <p className="text-xs mt-1">{APP_VERSION}</p>
            </div>
          </div>
        );
      default:
        return <Dashboard leads={products} />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-500/30">
      
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-800 bg-slate-950 flex flex-col hidden md:flex">
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Radar size={18} className="text-white" />
          </div>
          <div>
            <h1 className="font-bold tracking-tight text-lg leading-none">{APP_NAME}</h1>
            <span className="text-[10px] text-emerald-500 font-mono tracking-wider">ONLINE</span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as ViewMode)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200
                ${activeTab === item.id 
                  ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20' 
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                }`}
            >
              <item.icon size={18} />
              {item.label}
              {item.id === 'products' && products.length > 0 && (
                <span className="ml-auto bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                  {products.length}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
           <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
              <p className="text-xs text-slate-500 mb-2">今日额度</p>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 w-[35%]"></div>
              </div>
              <p className="text-[10px] text-right text-slate-500 mt-1">350 / 1000 次调用</p>
           </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-950/50 backdrop-blur-md sticky top-0 z-20">
           <div className="md:hidden flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <Radar size={14} className="text-white" />
              </div>
              <span className="font-bold">{APP_NAME}</span>
           </div>
           
           <div className="ml-auto flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 rounded-full border border-slate-800">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-xs text-slate-400">系统运行中</span>
              </div>
           </div>
        </header>

        <div className="flex-1 p-6 overflow-hidden relative">
          {/* Background Grid Pattern */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
               style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
          </div>
          
          <div className="relative h-full z-10">
            {renderContent()}
          </div>
        </div>
      </main>
    </div>
  );
}