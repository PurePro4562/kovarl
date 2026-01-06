import React, { useState, useEffect, useMemo } from 'react';
import { Search, Calculator, DollarSign, Users, Clock, Youtube, Info, ChevronRight, TrendingUp, AlertCircle, ShoppingBag, CreditCard } from 'lucide-react';

const App = () => {
  // Input States
  const [method, setMethod] = useState('manual'); // 'manual', 'youtube', or 'code'
  const [ccu, setCcu] = useState(100);
  const [avgPlaytime, setAvgPlaytime] = useState(20);
  const [retention, setRetention] = useState(15);
  
  // YouTube States
  const [channelInput, setChannelInput] = useState('');
  const [youtubeData, setYoutubeData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Creator Code States
  const [supporters, setSupporters] = useState(500);
  const [avgVbucks, setAvgVbucks] = useState(2000); // Monthly spend per user

  // Constants
  const PAYER_RATIO = 0.62; 
  const POOL_RATE_PER_1K_MINS = 0.08; 
  const SAC_PAYOUT_RATE = 0.05; // 5% ($5 per $100 spent)
  const VBUCK_TO_USD = 0.009; // Approx $9 per 1000 V-Bucks
  
  // API KEY INTEGRATED
  const apiKey = "AIzaSyCD59K7Kqq38ISsTvmyrvqPWuOYE52nPBc"; 

  /**
   * Enhanced Fetch with Exponential Backoff
   */
  const fetchWithBackoff = async (url, retries = 5) => {
    let delay = 1000;
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(url);
        if (response.ok) return await response.json();
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 403 || response.status === 429) {
          if (i < retries - 1) {
            await new Promise(resolve => setTimeout(resolve, delay));
            delay *= 2;
            continue;
          }
        }
        throw new Error(errorData?.error?.message || `API Error: ${response.status}`);
      } catch (err) {
        if (i === retries - 1) throw err;
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2;
      }
    }
  };

  /**
   * YouTube API Integration
   */
  const fetchYoutubeStats = async () => {
    if (!channelInput.trim()) return;
    setLoading(true);
    setError('');
    setYoutubeData(null);
    try {
      const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(channelInput)}&maxResults=1&key=${apiKey}`;
      const searchData = await fetchWithBackoff(searchUrl);
      if (!searchData.items || searchData.items.length === 0) throw new Error("No channel found.");
      const channelId = searchData.items[0].id.channelId;
      const statsUrl = `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${channelId}&key=${apiKey}`;
      const statsData = await fetchWithBackoff(statsUrl);
      const stats = statsData.items[0].statistics;
      const subs = parseInt(stats.subscriberCount);
      const projectedCcu = Math.max(1, Math.round(subs * 0.0018));
      setYoutubeData({
        title: searchData.items[0].snippet.title,
        subs: subs,
        thumbnail: searchData.items[0].snippet.thumbnails.high?.url,
        projectedCcu: projectedCcu
      });
      setCcu(projectedCcu);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Payout Calculations
  const results = useMemo(() => {
    if (method === 'code') {
      const totalVbucksSpent = supporters * avgVbucks;
      const totalUsdSpent = totalVbucksSpent * VBUCK_TO_USD;
      const earnings = totalUsdSpent * SAC_PAYOUT_RATE;
      return {
        monthly: earnings,
        yearly: earnings * 12,
        isSac: true,
        vbucks: totalVbucksSpent,
        spending: totalUsdSpent
      };
    }

    const dailyActivePlayers = ccu * 24; 
    const monthlyActivePlayers = dailyActivePlayers * 30;
    const payingPlayers = monthlyActivePlayers * PAYER_RATIO;
    const totalMinutes = payingPlayers * avgPlaytime;
    let earnings = (totalMinutes / 1000) * POOL_RATE_PER_1K_MINS;
    if (retention > 20) earnings *= 1.35;
    else if (retention > 10) earnings *= 1.15;

    return {
      monthly: earnings,
      yearly: earnings * 12,
      minutes: totalMinutes,
      payingUsers: payingPlayers,
      isSac: false
    };
  }, [ccu, avgPlaytime, retention, supporters, avgVbucks, method]);

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-900">
      <div className="max-w-5xl mx-auto">
        <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
              Fortnite Revenue Calculator
            </h1>
            <p className="text-slate-500 mt-1">Creator Payout estimates for Maps & SAC Codes</p>
          </div>
          <div className="bg-white px-4 py-2 rounded-full shadow-sm border border-slate-200 flex items-center gap-2 text-sm font-semibold text-slate-600">
            <CreditCard className="w-4 h-4 text-indigo-600" />
            SAC 2.0 Enabled
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
              <div className="flex bg-slate-100 p-1 rounded-2xl mb-6">
                <button 
                  onClick={() => setMethod('manual')}
                  className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${method === 'manual' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Map Stats
                </button>
                <button 
                  onClick={() => setMethod('youtube')}
                  className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${method === 'youtube' ? 'bg-white shadow-sm text-red-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  YouTube
                </button>
                <button 
                  onClick={() => setMethod('code')}
                  className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${method === 'code' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  SAC Code
                </button>
              </div>

              {method === 'youtube' && (
                <div className="space-y-4">
                  <div className="relative">
                    <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest">Channel Search</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        placeholder="Search @Handle"
                        className="w-full pl-10 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-red-500 transition-all font-medium"
                        value={channelInput}
                        onChange={(e) => setChannelInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && fetchYoutubeStats()}
                      />
                      <Search className="absolute left-3.5 top-4 text-slate-400 w-4 h-4" />
                    </div>
                  </div>
                  <button onClick={fetchYoutubeStats} disabled={loading || !channelInput} className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold py-4 rounded-2xl transition-all shadow-xl shadow-red-100 flex items-center justify-center gap-2">
                    {loading ? "Syncing..." : "Get Channel Data"}
                  </button>
                  {error && <div className="text-red-600 bg-red-50 p-4 rounded-2xl text-xs font-semibold border border-red-100 flex items-center gap-2"><AlertCircle className="w-4 h-4" /> {error}</div>}
                  {youtubeData && (
                    <div className="p-4 bg-slate-900 rounded-2xl text-white">
                      <div className="flex items-center gap-4">
                        <img src={youtubeData.thumbnail} alt="" className="w-10 h-10 rounded-full" />
                        <div><p className="text-sm font-bold truncate">{youtubeData.title}</p><p className="text-[10px] text-slate-400 uppercase">{youtubeData.subs.toLocaleString()} Subs</p></div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {method === 'code' && (
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between mb-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Supporters</label>
                      <span className="text-indigo-600 font-black">{supporters.toLocaleString()}</span>
                    </div>
                    <input type="range" min="10" max="10000" step="10" className="w-full h-2 accent-indigo-600 appearance-none bg-slate-100 rounded-full cursor-pointer" value={supporters} onChange={(e) => setSupporters(Number(e.target.value))} />
                  </div>
                  <div>
                    <div className="flex justify-between mb-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Avg Monthly V-Bucks</label>
                      <span className="text-indigo-600 font-black">{avgVbucks.toLocaleString()}</span>
                    </div>
                    <input type="range" min="500" max="20000" step="100" className="w-full h-2 accent-indigo-600 appearance-none bg-slate-100 rounded-full cursor-pointer" value={avgVbucks} onChange={(e) => setAvgVbucks(Number(e.target.value))} />
                  </div>
                </div>
              )}

              {(method === 'manual') && (
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between mb-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Avg Players (CCU)</label>
                      <span className="text-blue-600 font-black">{ccu.toLocaleString()}</span>
                    </div>
                    <input type="range" min="1" max="5000" step="10" className="w-full h-2 accent-blue-600 appearance-none bg-slate-100 rounded-full cursor-pointer" value={ccu} onChange={(e) => setCcu(Number(e.target.value))} />
                  </div>
                  <div>
                    <div className="flex justify-between mb-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Avg Session</label>
                      <span className="text-blue-600 font-black">{avgPlaytime}m</span>
                    </div>
                    <input type="range" min="5" max="60" step="1" className="w-full h-2 accent-blue-600 appearance-none bg-slate-100 rounded-full cursor-pointer" value={avgPlaytime} onChange={(e) => setAvgPlaytime(Number(e.target.value))} />
                  </div>
                </div>
              )}

              <div className="mt-8 p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                <div className="flex items-center gap-2 mb-2 text-blue-700">
                  <Info className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Info</span>
                </div>
                <p className="text-[11px] text-blue-600 leading-normal font-medium">
                  {method === 'code' ? "SAC 2.0 pays $5 for every 10,000 V-Bucks spent in the shop using your code." : "Calculated using the Engagement Pool rate of $0.08 per 1k payer minutes."}
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group">
                <div className="absolute -top-4 -right-4 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-all duration-700"></div>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Monthly Payout</p>
                <div className="text-6xl font-black tracking-tighter flex items-start gap-1">
                  <span className="text-2xl mt-2 text-green-400 font-bold">$</span>
                  {Math.round(results.monthly).toLocaleString()}
                </div>
                <div className="mt-8 flex items-center gap-3">
                  <div className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-[11px] font-bold text-slate-300">
                    Yearly Projection: ${Math.round(results.yearly).toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col justify-between">
                <div>
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-2">
                    {results.isSac ? "Total Shop Volume" : "Engagement Minutes"}
                  </p>
                  <div className="text-4xl font-black text-slate-800 tracking-tight">
                    {results.isSac ? (
                      <span className="flex items-center gap-1">{(results.vbucks / 1000).toFixed(1)}k <ShoppingBag className="w-6 h-6 text-slate-400" /></span>
                    ) : (
                      <span>{(results.minutes / 1000000).toFixed(2)}M <span className="text-sm font-bold text-slate-400">MINS</span></span>
                    )}
                  </div>
                </div>
                <div className="mt-8 flex justify-between items-end border-t pt-6 border-slate-50">
                  <div className="flex-1">
                    <p className="text-[9px] font-black text-slate-400 uppercase mb-1 tracking-widest">
                      {results.isSac ? "Gross Sales" : "Payer Reach"}
                    </p>
                    <p className="text-xl font-black text-slate-700">
                      {results.isSac ? `$${Math.round(results.spending).toLocaleString()}` : Math.round(results.payingUsers).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right flex-1">
                    <p className="text-[9px] font-black text-slate-400 uppercase mb-1 tracking-widest">
                      {results.isSac ? "Commission" : "Payer Ratio"}
                    </p>
                    <p className={`text-xl font-black ${results.isSac ? 'text-indigo-600' : 'text-blue-600'}`}>
                      {results.isSac ? '5%' : `${PAYER_RATIO * 100}%`}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-8 py-5 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Revenue Components</h3>
              </div>
              <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
                {results.isSac ? (
                  <>
                    <div className="space-y-3">
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Skins & Outfits</p>
                      <p className="text-2xl font-black">${Math.round(results.monthly * 0.6).toLocaleString()}</p>
                      <div className="w-full h-1.5 bg-indigo-100 rounded-full overflow-hidden"><div className="w-[60%] h-full bg-indigo-500"></div></div>
                    </div>
                    <div className="space-y-3">
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Battle Passes</p>
                      <p className="text-2xl font-black text-purple-600">${Math.round(results.monthly * 0.25).toLocaleString()}</p>
                      <div className="w-full h-1.5 bg-purple-100 rounded-full overflow-hidden"><div className="w-[25%] h-full bg-purple-500"></div></div>
                    </div>
                    <div className="space-y-3">
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Emotes & Misc</p>
                      <p className="text-2xl font-black text-pink-500">${Math.round(results.monthly * 0.15).toLocaleString()}</p>
                      <div className="w-full h-1.5 bg-pink-100 rounded-full overflow-hidden"><div className="w-[15%] h-full bg-pink-500"></div></div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-3">
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Core Engagement</p>
                      <p className="text-2xl font-black">${Math.round(results.monthly * 0.7).toLocaleString()}</p>
                      <div className="w-full h-1.5 bg-blue-100 rounded-full overflow-hidden"><div className="w-[70%] h-full bg-blue-500"></div></div>
                    </div>
                    <div className="space-y-3">
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Loyalty Multiplier</p>
                      <p className="text-2xl font-black text-purple-600">+${Math.round(results.monthly * 0.2).toLocaleString()}</p>
                      <div className="w-full h-1.5 bg-purple-100 rounded-full overflow-hidden"><div className="w-[20%] h-full bg-purple-500"></div></div>
                    </div>
                    <div className="space-y-3">
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Discovery Bonus</p>
                      <p className="text-2xl font-black text-orange-500">+${Math.round(results.monthly * 0.1).toLocaleString()}</p>
                      <div className="w-full h-1.5 bg-orange-100 rounded-full overflow-hidden"><div className="w-[10%] h-full bg-orange-500"></div></div>
                    </div>
                  </>
                )}
              </div>
            </div>
            
            <div className="p-8 bg-gradient-to-br from-indigo-600 to-blue-700 rounded-[2.5rem] text-white flex gap-6 items-center">
              <ShoppingBag className="w-12 h-12 opacity-50 shrink-0" />
              <p className="text-sm font-medium leading-relaxed">
                <b>Pro Tip:</b> Combining a viral Creative map with an active SAC code is the "Golden Ratio". Your map generates engagement payouts, while your code captures revenue from players you've brought into the Fortnite ecosystem.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;