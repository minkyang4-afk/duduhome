
import React, { useState, useEffect, useRef } from 'react';
import { Play, Globe, Terminal, Loader2, Link as LinkIcon, ShieldCheck, Wifi, Filter, ChevronDown, ChevronUp, Search as SearchIcon, Fingerprint, Ghost, CheckCircle2, Lock } from 'lucide-react';
import { extractProductsFromText, simulateUrlExtraction } from '../services/geminiService';
import { ProductData, LogEntry, FilterConfig } from '../types';
import { CRAWLER_LOGS, PRODUCT_CATEGORIES, PROXY_REGIONS } from '../constants';

interface ExtractionViewProps {
  onProductsExtracted: (products: ProductData[]) => void;
}

export const ExtractionView: React.FC<ExtractionViewProps> = ({ onProductsExtracted }) => {
  const [mode, setMode] = useState<'url' | 'text'>('url');
  const [url, setUrl] = useState('');
  const [inputText, setInputText] = useState('');
  const [isCrawling, setIsCrawling] = useState(false);
  const [browserStatus, setBrowserStatus] = useState<'idle' | 'loading' | 'captcha' | 'success' | '404'>('idle');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [progress, setProgress] = useState(0);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Filter State
  const [showFilters, setShowFilters] = useState(true);
  const [filters, setFilters] = useState<FilterConfig>({
    category: '所有类目',
    minPrice: '',
    maxPrice: '',
    minSales: ''
  });

  // Anti-Crawler Config
  const [stealthMode, setStealthMode] = useState(true);
  const [useResidentialProxy, setUseResidentialProxy] = useState(true);
  const [proxyRegion, setProxyRegion] = useState('美国 (US - Residential)');
  const [autoCaptcha, setAutoCaptcha] = useState(true);

  // Auto-scroll logs
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const addLog = (message: string, type: LogEntry['type'] = 'info') => {
    setLogs(prev => [...prev, {
      id: crypto.randomUUID(),
      timestamp: new Date().toLocaleTimeString(),
      message,
      type
    }]);
  };

  const handleCrawl = async () => {
    if (!url.trim()) {
      addLog("错误: 请输入有效的目标 URL", "error");
      return;
    }
    
    // Reset state
    setIsCrawling(true);
    setBrowserStatus('loading');
    setLogs([]);
    setProgress(0);
    
    // 1. Init
    addLog(`启动任务: ${url}`, 'info');
    if (stealthMode) addLog(">>> 隐身模式已激活 (Stealth Mode ON)", "warning");
    if (useResidentialProxy) addLog(`>>> 连接住宅代理池: ${proxyRegion}`, "warning");

    const shouldFail = url.includes('404') || url.includes('error');
    
    // 2. Simulate Loading Steps
    setTimeout(() => {
        addLog("正在进行 TLS 指纹握手...", "info");
        setProgress(10);
    }, 800);

    setTimeout(() => {
        // Trigger Captcha Visual
        if (autoCaptcha) {
            setBrowserStatus('captcha');
            addLog("检测到安全盾 (Cloudflare/Akamai)...", "warning");
            addLog("正在尝试自动突破验证码...", "info");
        } else {
             addLog("检测到安全盾...", "info");
        }
        setProgress(30);
    }, 2000);

    // 3. Solve Captcha & Render
    setTimeout(() => {
         if (autoCaptcha) {
             addLog("验证码突破成功！Access Granted.", "success");
         }
         if (!shouldFail) {
             setBrowserStatus('loading'); // Back to loading specific content
             addLog("页面 DOM 渲染中...", "info");
             if (stealthMode) addLog("模拟鼠标随机轨迹中...", "info");
         }
         setProgress(60);
    }, 4500);

    // 4. Data Extraction Loop (Simulated)
    const extractionTimeout = setTimeout(async () => {
        try {
            if (shouldFail) {
                throw new Error("Simulated 404");
            }
            addLog("开始提取 JSON-LD 结构化数据...", "info");
            
            // AI Call
            const products = await simulateUrlExtraction(url, filters);
            
            setProgress(100);
            setBrowserStatus('success');
            addLog(`成功采集: 获取到 ${products.length} 条数据`, 'success');
            
            setTimeout(() => {
                setIsCrawling(false);
                onProductsExtracted(products);
                setBrowserStatus('idle'); 
            }, 1500);

        } catch (err) {
            setBrowserStatus('404');
            setIsCrawling(false);
            setProgress(0);
            addLog("错误: 目标页面返回 404 或链接已失效", "error");
        }
    }, 6000);
  };

  const handleTextExtract = async () => {
     if (!inputText.trim()) return;
     setIsCrawling(true);
     try {
       const products = await extractProductsFromText(inputText, filters.category);
       onProductsExtracted(products);
       setInputText("");
     } catch(e) {
       addLog("文本解析失败", "error");
     } finally {
       setIsCrawling(false);
     }
  };

  return (
    <div className="h-full flex flex-col space-y-6 animate-in fade-in duration-500">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Globe className="text-blue-500" /> 智能爬虫控制台
          </h2>
          <p className="text-slate-400 text-sm">全自动反爬虫对抗引擎 (Anti-Bot Bypass Engine)</p>
        </div>
        
        <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-800">
          <button 
            onClick={() => setMode('url')}
            className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${mode === 'url' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
          >
            URL 自动采集
          </button>
          <button 
            onClick={() => setMode('text')}
            className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${mode === 'text' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
          >
            文本手动导入
          </button>
        </div>
      </div>

      {mode === 'url' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
          
          {/* Left Panel: Configuration & Logs */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            
            {/* Input Box */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg">
              <label className="text-sm font-semibold text-slate-300 mb-3 block">目标链接 / 关键词 (Target URL)</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                    <LinkIcon size={18} />
                  </div>
                  <input 
                    type="text" 
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://www.tiktok.com/@username"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-10 pr-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
                    disabled={isCrawling}
                  />
                </div>
                <button
                  onClick={handleCrawl}
                  disabled={isCrawling}
                  className={`px-6 py-2 rounded-lg font-bold text-white shadow-lg flex items-center gap-2 transition-all whitespace-nowrap min-w-[140px] justify-center
                    ${isCrawling 
                      ? 'bg-red-600/20 text-red-400 border border-red-600/50 cursor-not-allowed' 
                      : 'bg-blue-600 hover:bg-blue-500 shadow-blue-500/25'
                    }`}
                >
                  {isCrawling ? <><Loader2 className="animate-spin" size={18} /> 采集中</> : <><Play size={18} /> 开始采集</>}
                </button>
              </div>

              {/* Advanced Config Section */}
              <div className="mt-4 border-t border-slate-800 pt-3">
                 <button 
                   onClick={() => setShowFilters(!showFilters)}
                   className="flex items-center gap-2 text-xs text-slate-400 hover:text-blue-400 transition-colors mb-3"
                 >
                    <Filter size={12} />
                    {showFilters ? '收起配置' : '展开筛选与反爬配置'}
                    {showFilters ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                 </button>
                 
                 {showFilters && (
                   <div className="space-y-4 bg-slate-950/50 p-4 rounded-lg border border-slate-800/50">
                      
                      {/* Anti-Bot Settings */}
                      <div>
                        <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-emerald-400">
                           <ShieldCheck size={14} />
                           <span>反爬虫对抗策略 (Anti-Bot Bypass)</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                           <label className="flex items-center justify-between bg-slate-900 border border-slate-800 p-2 rounded cursor-pointer hover:border-slate-700">
                              <div className="flex items-center gap-2">
                                 <Ghost size={14} className="text-purple-400"/>
                                 <span className="text-xs text-slate-300">高匿隐身模式 (Stealth)</span>
                              </div>
                              <input type="checkbox" checked={stealthMode} onChange={e => setStealthMode(e.target.checked)} className="accent-blue-500"/>
                           </label>
                           
                           <label className="flex items-center justify-between bg-slate-900 border border-slate-800 p-2 rounded cursor-pointer hover:border-slate-700">
                              <div className="flex items-center gap-2">
                                 <CheckCircle2 size={14} className="text-blue-400"/>
                                 <span className="text-xs text-slate-300">自动过验证码 (Auto-Captcha)</span>
                              </div>
                              <input type="checkbox" checked={autoCaptcha} onChange={e => setAutoCaptcha(e.target.checked)} className="accent-blue-500"/>
                           </label>

                           <div className="md:col-span-2 flex items-center gap-2 bg-slate-900 border border-slate-800 p-2 rounded">
                               <Wifi size={14} className="text-amber-400"/>
                               <span className="text-xs text-slate-300 whitespace-nowrap">代理节点:</span>
                               <select 
                                 value={proxyRegion}
                                 onChange={(e) => setProxyRegion(e.target.value)}
                                 className="flex-1 bg-transparent text-xs text-slate-300 outline-none"
                               >
                                 {PROXY_REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                               </select>
                               <div className="flex items-center gap-1">
                                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                 <span className="text-[10px] text-emerald-500">Live</span>
                               </div>
                           </div>
                        </div>
                      </div>

                      {/* Data Filters */}
                      <div className="pt-2 border-t border-slate-800/50">
                        <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-blue-400">
                           <Filter size={14} />
                           <span>数据筛选条件</span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            <div>
                                <select 
                                value={filters.category}
                                onChange={(e) => setFilters({...filters, category: e.target.value})}
                                className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-xs text-slate-300 focus:border-blue-500 outline-none"
                                >
                                {PRODUCT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <input 
                                type="number" placeholder="Min Price ($)"
                                value={filters.minPrice}
                                onChange={(e) => setFilters({...filters, minPrice: e.target.value})}
                                className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-xs text-slate-300 focus:border-blue-500 outline-none"
                            />
                            <input 
                                type="number" placeholder="Max Price ($)"
                                value={filters.maxPrice}
                                onChange={(e) => setFilters({...filters, maxPrice: e.target.value})}
                                className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-xs text-slate-300 focus:border-blue-500 outline-none"
                            />
                            <input 
                                type="number" placeholder="Min Sales"
                                value={filters.minSales}
                                onChange={(e) => setFilters({...filters, minSales: e.target.value})}
                                className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-xs text-slate-300 focus:border-blue-500 outline-none"
                            />
                        </div>
                      </div>
                   </div>
                 )}
              </div>
            </div>

            {/* Terminal / Logs */}
            <div className="flex-1 bg-black border border-slate-800 rounded-xl p-4 shadow-lg font-mono text-xs overflow-hidden flex flex-col relative min-h-[220px]">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
                 <div className="flex items-center gap-2 text-slate-400">
                   <Terminal size={14} /> 
                   <span>System Output</span>
                 </div>
                 {isCrawling && <div className="text-emerald-500 animate-pulse text-[10px] flex items-center gap-1">● PROCESSING</div>}
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-1 pr-2">
                {logs.length === 0 && !isCrawling && (
                  <div className="text-slate-600 italic opacity-50 pt-10 text-center">
                    等待任务指令...
                    <br/>System ready.
                  </div>
                )}
                {logs.map((log) => (
                  <div key={log.id} className="flex gap-3">
                    <span className="text-slate-600 min-w-[65px]">{log.timestamp}</span>
                    <span className={`${
                      log.type === 'error' ? 'text-red-400' : 
                      log.type === 'success' ? 'text-emerald-400' : 
                      log.type === 'warning' ? 'text-amber-400' : 'text-slate-300'
                    }`}>
                      {log.type === 'info' && <span className="text-blue-500 mr-2">➜</span>}
                      {log.message}
                    </span>
                  </div>
                ))}
                <div ref={logsEndRef} />
              </div>
              
              {/* Progress Bar Overlay */}
              {isCrawling && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-800">
                  <div 
                    className="h-full bg-blue-500 transition-all duration-300 ease-out shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              )}
            </div>

          </div>

          {/* Visualization / Preview Column */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-1 shadow-lg flex flex-col h-full overflow-hidden min-h-[400px]">
             {/* Browser Toolbar */}
             <div className="bg-slate-800 px-3 py-2 flex items-center gap-2 rounded-t-lg shrink-0">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/50"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500/50"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/50"></div>
                </div>
                <div className="flex-1 bg-slate-950 rounded px-2 py-0.5 text-[10px] text-slate-500 flex justify-between items-center font-mono">
                  <span className="truncate max-w-[150px]">{url || "about:blank"}</span>
                  {stealthMode && <span className="text-purple-400 flex items-center gap-1"><Ghost size={8}/> Stealth</span>}
                </div>
                <div className="text-slate-500"><Lock size={10}/></div>
             </div>
             
             {/* Browser Content */}
             <div className="flex-1 relative flex flex-col bg-white">
                {browserStatus === 'captcha' ? (
                   // Captcha Simulation
                   <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 text-slate-800 p-8 space-y-6">
                      <div className="w-full max-w-sm bg-white p-6 rounded border border-slate-200 shadow-sm flex items-center gap-4">
                         <div className="w-8 h-8 rounded border-2 border-slate-200 flex items-center justify-center animate-[spin_1.5s_linear_infinite]">
                            <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full"></div>
                         </div>
                         <div className="text-sm">
                            <p className="font-semibold">Checking your browser...</p>
                            <p className="text-xs text-slate-500">Please wait while we verify you are human.</p>
                         </div>
                      </div>
                      <div className="text-xs text-slate-400 flex flex-col items-center gap-1">
                         <span>DDoS protection by Cloudflare</span>
                         <span className="text-amber-500 animate-pulse">Resolving challenge...</span>
                      </div>
                   </div>
                ) : browserStatus === '404' ? (
                  // 404 Visual
                  <div className="flex-1 flex flex-col bg-gradient-to-br from-cyan-50/50 to-pink-50/50 text-slate-900">
                    <div className="h-12 border-b border-slate-200 flex items-center px-4 justify-between bg-white">
                      <div className="font-bold text-xl tracking-tighter flex items-center gap-1"><span className="text-black">TikTok</span></div>
                      <div className="hidden sm:flex bg-slate-100 rounded-full px-3 py-1.5 items-center gap-2 w-1/3">
                        <SearchIcon size={14} className="text-slate-400"/>
                        <div className="text-xs text-slate-400">搜索</div>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs">J</div>
                    </div>
                    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                       <div className="flex items-center justify-center gap-2 mb-6 select-none">
                          <span className="text-[120px] font-bold leading-none text-slate-900">4</span>
                          <div className="w-[100px] h-[100px] rounded-full bg-yellow-300 relative shadow-inner border-2 border-yellow-400/50 mx-2">
                             <div className="absolute top-8 left-6 w-3 h-6 bg-slate-900 rounded-full"></div>
                             <div className="absolute top-8 right-6 w-3 h-6 bg-slate-900 rounded-full"></div>
                             <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-16 h-8 border-b-4 border-slate-900 rounded-full"></div>
                          </div>
                          <span className="text-[120px] font-bold leading-none text-slate-900">4</span>
                       </div>
                       <p className="text-slate-500 text-sm mb-8">找不到此页面</p>
                       <button className="bg-[#FE2C55] text-white px-10 py-2.5 rounded-sm font-semibold hover:bg-red-600 transition-colors text-sm">▶ 立即观看</button>
                    </div>
                  </div>
                ) : browserStatus === 'loading' ? (
                  // Loading Visual
                  <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center text-center space-y-6">
                    <div className="relative w-20 h-20">
                       <div className="absolute inset-0 border-4 border-slate-800 rounded-full"></div>
                       <div className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-200 animate-pulse">正在渲染页面 DOM...</p>
                      <p className="text-xs text-slate-500 mt-2 font-mono">{proxyRegion} IP: 104.28.x.x</p>
                    </div>
                  </div>
                ) : browserStatus === 'success' ? (
                   // Success Visual
                   <div className="absolute inset-0 bg-slate-50 overflow-hidden flex flex-col animate-in fade-in duration-300">
                      <div className="h-40 bg-slate-200 animate-pulse w-full"></div>
                      <div className="p-4 space-y-4">
                         <div className="h-6 bg-slate-200 rounded w-3/4"></div>
                         <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                         <div className="grid grid-cols-2 gap-2 mt-4">
                            <div className="h-32 bg-slate-200 rounded"></div>
                            <div className="h-32 bg-slate-200 rounded"></div>
                         </div>
                      </div>
                      <div className="absolute inset-0 bg-emerald-500/10 flex items-center justify-center backdrop-blur-[1px]">
                         <div className="bg-emerald-500 text-white px-4 py-3 rounded-lg shadow-xl font-bold flex flex-col items-center gap-2 transform scale-110">
                           <ShieldCheck size={32} />
                           <span>采集成功</span>
                           <span className="text-[10px] opacity-80 font-normal">WAF Firewalls Bypassed</span>
                         </div>
                      </div>
                   </div>
                ) : (
                  // Idle Visual
                  <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center text-center text-slate-600">
                    <Fingerprint size={48} className="mx-auto mb-2 opacity-20" />
                    <p className="text-xs">无头浏览器预览视窗</p>
                    <p className="text-[10px] mt-2 opacity-50 max-w-[200px]">等待任务分配...</p>
                  </div>
                )}
             </div>

             {/* Footer Stats */}
             <div className="p-3 bg-slate-900 border-t border-slate-800 shrink-0">
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span>Thread Activity</span>
                  <span>{isCrawling ? '8/12 active' : 'Idle'}</span>
                </div>
                <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                   <div className="bg-emerald-500 h-full transition-all duration-500" style={{ width: isCrawling ? '68%' : '2%' }}></div>
                </div>
                <div className="flex justify-between text-xs text-slate-500 mt-2 mb-1">
                  <span>Memory</span>
                  <span>{isCrawling ? '1.2GB / 4GB' : '120MB'}</span>
                </div>
                <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                   <div className="bg-purple-500 h-full transition-all duration-500" style={{ width: isCrawling ? '45%' : '5%' }}></div>
                </div>
             </div>
          </div>

        </div>
      ) : (
        /* Text Input Mode */
        <div className="h-full flex flex-col">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex-1 flex flex-col shadow-lg">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="请在此粘贴 HTML 源代码或文本..."
              className="flex-1 bg-slate-950/50 border border-slate-800 rounded-lg p-4 text-sm font-mono text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
            />
            <div className="pt-4 mt-4 border-t border-slate-800 text-right">
              <button
                onClick={handleTextExtract}
                disabled={isCrawling || !inputText}
                className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                {isCrawling ? "分析中..." : "开始分析文本"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
