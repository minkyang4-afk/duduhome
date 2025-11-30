import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ProductData } from '../types';
import { Download, Search, Trash2, Link as LinkIcon, ShoppingBag, ExternalLink, Filter, X, ChevronDown, FileJson, FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import { PRODUCT_CATEGORIES } from '../constants';
import * as XLSX from 'xlsx';

interface LeadManagerProps {
  leads: ProductData[]; // Kept prop name as 'leads' in App.tsx but treating as products
  onClear: () => void;
}

export const LeadManager: React.FC<LeadManagerProps> = ({ leads: products, onClear }) => {
  // Local Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('所有类目');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minSales, setMinSales] = useState('');

  // Export UI States
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  // Close export menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Helper to parse price string to number
  const parsePrice = (priceStr: string) => {
    return parseFloat(priceStr.replace(/[^0-9.]/g, '')) || 0;
  };

  // Helper to parse sales string (e.g., "10.2k", "500+") to number
  const parseSales = (salesStr: string) => {
    const lower = salesStr.toLowerCase().replace(/,/g, '');
    let val = parseFloat(lower);
    if (isNaN(val)) return 0;
    
    if (lower.includes('k')) val *= 1000;
    else if (lower.includes('w')) val *= 10000;
    else if (lower.includes('m')) val *= 1000000;
    
    return val;
  };

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      // 1. Search Term
      const matchesSearch = 
        p.productName.toLowerCase().includes(searchTerm.toLowerCase()) || 
        p.shopName.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (!matchesSearch) return false;

      // 2. Category
      if (categoryFilter !== '所有类目') {
        if (p.category && p.category !== categoryFilter) return false;
      }

      // 3. Price
      const pPrice = parsePrice(p.price);
      if (minPrice && pPrice < parseFloat(minPrice)) return false;
      if (maxPrice && pPrice > parseFloat(maxPrice)) return false;

      // 4. Sales
      const pSales = parseSales(p.salesVolume);
      if (minSales && pSales < parseFloat(minSales)) return false;

      return true;
    });
  }, [products, searchTerm, categoryFilter, minPrice, maxPrice, minSales]);

  // Prepare data for export with Chinese headers
  const getExportData = () => {
    return filteredProducts.map(p => ({
      "商品名称": p.productName,
      "类目": p.category || "未知",
      "价格": p.price,
      "销量": p.salesVolume,
      "店铺名称": p.shopName,
      "店铺链接": p.shopLink || "无",
      "商品链接": p.productLink || "无",
      "采集时间": new Date(p.timestamp).toLocaleString('zh-CN'),
      "原始内容": p.rawContent
    }));
  };

  const triggerDownload = (url: string, filename: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExport = async (format: 'csv' | 'xlsx' | 'json') => {
    setIsExporting(true);
    setShowExportMenu(false);

    // Short delay to allow UI to show loading state
    await new Promise(resolve => setTimeout(resolve, 300));

    try {
      const data = getExportData();
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const filename = `TikTok数据_${timestamp}`;

      if (format === 'csv') {
        const headers = Object.keys(data[0]);
        const csvContent = "\ufeff" + [ // BOM for Excel
          headers.join(","),
          ...data.map(row => headers.map(fieldName => {
            const val = row[fieldName as keyof typeof row] || "";
            return `"${String(val).replace(/"/g, '""')}"`; // Escape quotes
          }).join(","))
        ].join("\n");
        
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        triggerDownload(URL.createObjectURL(blob), `${filename}.csv`);
      } 
      else if (format === 'json') {
        const jsonContent = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonContent], { type: "application/json" });
        triggerDownload(URL.createObjectURL(blob), `${filename}.json`);
      }
      else if (format === 'xlsx') {
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "商品数据");
        XLSX.writeFile(workbook, `${filename}.xlsx`);
      }
    } catch (error) {
      console.error("Export failed:", error);
      alert("导出失败，请检查数据量或重试。");
    } finally {
      setIsExporting(false);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setCategoryFilter('所有类目');
    setMinPrice('');
    setMaxPrice('');
    setMinSales('');
  };

  const hasActiveFilters = searchTerm || categoryFilter !== '所有类目' || minPrice || maxPrice || minSales;

  return (
    <div className="h-full flex flex-col space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-100">采集商品库</h2>
          <p className="text-slate-400 text-sm">管理已抓取的商品数据，支持高级筛选与多种格式导出。</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={onClear}
            className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-950/30 rounded-lg transition-colors"
            title="清空所有数据"
          >
            <Trash2 size={20} />
          </button>
          
          <div className="relative" ref={exportMenuRef}>
            <button 
              onClick={() => setShowExportMenu(!showExportMenu)}
              disabled={products.length === 0 || isExporting}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-emerald-900/20 disabled:opacity-50 disabled:cursor-not-allowed min-w-[120px] justify-center"
            >
              {isExporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
              <span>{isExporting ? '导出中...' : '导出数据'}</span>
              <ChevronDown size={14} className={`transition-transform duration-200 ${showExportMenu ? 'rotate-180' : ''}`} />
            </button>

            {showExportMenu && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-slate-900 border border-slate-800 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="py-1">
                  <button 
                    onClick={() => handleExport('xlsx')}
                    className="w-full text-left px-4 py-3 text-sm text-slate-300 hover:bg-slate-800 hover:text-white flex items-center gap-3 transition-colors"
                  >
                    <FileSpreadsheet size={16} className="text-emerald-500"/>
                    <div>
                      <div className="font-medium">导出 Excel</div>
                      <div className="text-[10px] text-slate-500">.xlsx 格式 (推荐)</div>
                    </div>
                  </button>
                  <button 
                    onClick={() => handleExport('csv')}
                    className="w-full text-left px-4 py-3 text-sm text-slate-300 hover:bg-slate-800 hover:text-white flex items-center gap-3 transition-colors border-t border-slate-800/50"
                  >
                    <FileText size={16} className="text-blue-500"/>
                    <div>
                      <div className="font-medium">导出 CSV</div>
                      <div className="text-[10px] text-slate-500">通用表格格式</div>
                    </div>
                  </button>
                  <button 
                    onClick={() => handleExport('json')}
                    className="w-full text-left px-4 py-3 text-sm text-slate-300 hover:bg-slate-800 hover:text-white flex items-center gap-3 transition-colors border-t border-slate-800/50"
                  >
                    <FileJson size={16} className="text-amber-500"/>
                    <div>
                      <div className="font-medium">导出 JSON</div>
                      <div className="text-[10px] text-slate-500">开发人员专用</div>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg flex flex-col">
        {/* Toolbar & Filters */}
        <div className="p-4 border-b border-slate-800 space-y-4">
           {/* Top Row: Search and Quick Actions */}
           <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input 
                  type="text" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="搜索商品名称、店铺..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>
              
              {/* Filter Inputs Row */}
              <div className="flex items-center gap-2 flex-wrap">
                  <select 
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-blue-500"
                  >
                    {PRODUCT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>

                  <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg px-2">
                     <span className="text-xs text-slate-500 px-1">$</span>
                     <input 
                       type="number" 
                       placeholder="Min" 
                       value={minPrice}
                       onChange={(e) => setMinPrice(e.target.value)}
                       className="w-12 bg-transparent py-2 text-sm text-center focus:outline-none"
                     />
                     <span className="text-slate-600">-</span>
                     <input 
                       type="number" 
                       placeholder="Max" 
                       value={maxPrice}
                       onChange={(e) => setMaxPrice(e.target.value)}
                       className="w-12 bg-transparent py-2 text-sm text-center focus:outline-none"
                     />
                  </div>

                  <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg px-2" title="最低销量">
                     <span className="text-xs text-slate-500 px-1">Sold</span>
                     <input 
                       type="number" 
                       placeholder="0" 
                       value={minSales}
                       onChange={(e) => setMinSales(e.target.value)}
                       className="w-16 bg-transparent py-2 text-sm text-center focus:outline-none"
                     />
                  </div>

                  {hasActiveFilters && (
                    <button 
                      onClick={clearFilters}
                      className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                      title="清除筛选"
                    >
                      <X size={16} />
                    </button>
                  )}
              </div>
           </div>
           
           <div className="flex justify-between items-center text-xs text-slate-500 font-mono">
             <span>显示 {filteredProducts.length} / {products.length} 个结果</span>
           </div>
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-auto">
          {products.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-4">
              <div className="p-4 bg-slate-800/50 rounded-full">
                <ShoppingBag size={32} />
              </div>
              <p>暂无商品数据，请前往“商品采集”页面开始。</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-4">
               <div className="p-4 bg-slate-800/50 rounded-full">
                <Filter size={32} />
              </div>
              <p>没有符合当前筛选条件的商品。</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-950/50 sticky top-0 z-10">
                <tr>
                  <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider w-1/4">商品名称</th>
                  <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">类目</th>
                  <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">价格</th>
                  <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">销量/热度</th>
                  <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">店铺信息</th>
                  <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">链接</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/30 transition-colors group">
                    <td className="p-4 align-top">
                      <div className="font-medium text-slate-200 line-clamp-2">{p.productName}</div>
                      <div className="text-xs text-slate-500 mt-1 truncate max-w-[200px] opacity-60">
                        {p.rawContent}
                      </div>
                    </td>
                    <td className="p-4 align-top">
                      {p.category ? (
                         <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 border border-slate-700">
                           {p.category}
                         </span>
                      ) : <span className="text-slate-600 text-xs">-</span>}
                    </td>
                    <td className="p-4 align-top font-mono text-emerald-400 font-medium">
                      {p.price}
                    </td>
                    <td className="p-4 align-top">
                       <span className="inline-flex items-center px-2 py-1 rounded bg-slate-800 text-xs text-blue-300 border border-slate-700">
                         {p.salesVolume || "未知"}
                       </span>
                    </td>
                    <td className="p-4 align-top">
                      <div className="text-sm text-slate-300">{p.shopName}</div>
                      {p.shopLink && (
                        <a href={p.shopLink} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-slate-500 hover:text-blue-400 mt-1 transition-colors">
                          <ExternalLink size={10} /> 访问店铺
                        </a>
                      )}
                    </td>
                    <td className="p-4 align-top text-right">
                      <div className="flex justify-end gap-2">
                         {p.productLink ? (
                            <a href={p.productLink} target="_blank" rel="noreferrer" className="p-2 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 rounded-lg transition-colors" title="打开商品链接">
                              <LinkIcon size={16} />
                            </a>
                         ) : (
                           <span className="p-2 text-slate-600 cursor-not-allowed"><LinkIcon size={16} /></span>
                         )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};