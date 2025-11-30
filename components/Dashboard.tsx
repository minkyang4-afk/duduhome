import React from 'react';
import { ProductData } from '../types';
import { StatsCard } from './StatsCard';
import { Database, TrendingUp, ShoppingCart, DollarSign } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';

interface DashboardProps {
  leads: ProductData[]; // Kept prop name as leads to minimize App.tsx changes, but logical type is ProductData
}

export const Dashboard: React.FC<DashboardProps> = ({ leads: products }) => {
  const totalProducts = products.length;
  
  // Helper to extract numeric price for calculation
  const getPrice = (p: string) => parseFloat(p.replace(/[^0-9.]/g, '')) || 0;
  
  const totalPrice = products.reduce((acc, curr) => acc + getPrice(curr.price), 0);
  const avgPrice = totalProducts > 0 ? (totalPrice / totalProducts).toFixed(2) : "0.00";
  
  const productsWithLinks = products.filter(p => p.productLink).length;
  const linkRate = totalProducts > 0 ? ((productsWithLinks / totalProducts) * 100).toFixed(0) : "0";

  // Chart Data: Price Range Distribution
  const priceRanges = [
    { name: '< 20', max: 20 },
    { name: '20-50', max: 50 },
    { name: '50-100', max: 100 },
    { name: '> 100', max: 999999 },
  ];
  
  const priceDistribution = priceRanges.map(range => ({
    name: range.name,
    value: products.filter(p => {
      const price = getPrice(p.price);
      const min = range.max === 20 ? 0 : (range.max === 50 ? 20 : (range.max === 100 ? 50 : 100));
      return price >= min && price < range.max;
    }).length,
    color: '#3b82f6'
  }));

  // Chart Data: Top Shops by Product Count
  const shopCount = products.reduce((acc, p) => {
    const s = p.shopName || '未知店铺';
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const shopData = Object.keys(shopCount)
    .map(key => ({ name: key, count: shopCount[key] }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5); // Top 5

  const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444'];

  return (
    <div className="h-full overflow-y-auto animate-in fade-in duration-500 pb-10">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-100">电商数据大屏</h2>
        <p className="text-slate-400 text-sm">实时监控商品采集进度与价格分析。</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard 
          title="已采集商品数" 
          value={totalProducts} 
          icon={Database} 
          color="blue"
          change="实时入库"
        />
        <StatsCard 
          title="平均客单价" 
          value={`$${avgPrice}`} 
          icon={DollarSign} 
          color="emerald"
          change="基于提取价格计算"
        />
        <StatsCard 
          title="链接覆盖率" 
          value={`${linkRate}%`} 
          icon={ShoppingCart} 
          color="purple"
          change="含有效商品链接"
        />
        <StatsCard 
          title="今日预估销量" 
          value="Wait..." 
          icon={TrendingUp} 
          color="amber"
          change="数据积累中"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Price Distribution */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg min-h-[300px]">
          <h3 className="text-lg font-semibold text-slate-200 mb-6">商品价格区间分布</h3>
          {products.length > 0 ? (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={priceDistribution}>
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} allowDecimals={false} />
                  <Tooltip 
                    cursor={{fill: '#334155', opacity: 0.2}}
                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                  />
                  <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-500 text-sm">
              暂无数据
            </div>
          )}
        </div>

        {/* Top Shops */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg min-h-[300px]">
          <h3 className="text-lg font-semibold text-slate-200 mb-6">活跃店铺排行 Top 5</h3>
          {shopData.length > 0 ? (
            <div className="h-64 w-full">
               <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={shopData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="count"
                  >
                    {shopData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-4 mt-2">
                {shopData.map((d, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-slate-400">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></span>
                    {d.name} ({d.count})
                  </div>
                ))}
              </div>
            </div>
          ) : (
             <div className="h-full flex items-center justify-center text-slate-500 text-sm">
              暂无数据
            </div>
          )}
        </div>
      </div>
    </div>
  );
};