"use client";

import { useEffect, useState } from "react";

interface Session {
    _id: string;
    exerciseId: string;
    count: number;
    qualityScore: number;
    duration: number;
    timestamp: string;
}

export default function Dashboard() {
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSessions();
    }, []);

    const fetchSessions = async () => {
        try {
            const resp = await fetch("http://localhost:5000/api/sessions");
            const data = await resp.json();
            setSessions(data);
        } catch (err) {
            console.error("Dashboard load error:", err);
        } finally {
            setLoading(false);
        }
    };

    const totalReps = sessions.reduce((sum, s) => sum + s.count, 0);
    const avgQuality = sessions.length > 0
        ? Math.round(sessions.reduce((sum, s) => sum + s.qualityScore, 0) / sessions.length)
        : 0;

    if (loading) return <div className="text-zinc-500 text-sm animate-pulse">Loading Analytics...</div>;

    return (
        <div className="w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl backdrop-blur-sm">
                    <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1">Total volume</p>
                    <p className="text-4xl font-black text-white">{totalReps} <span className="text-lg text-zinc-600 font-medium">REPS</span></p>
                </div>
                <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl backdrop-blur-sm">
                    <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1">Avg Form Quality</p>
                    <p className={`text-4xl font-black ${avgQuality > 80 ? 'text-emerald-500' : 'text-amber-500'}`}>{avgQuality}%</p>
                </div>
            </div>

            {/* History Table */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden backdrop-blur-sm">
                <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
                    <h3 className="font-bold text-zinc-200 uppercase tracking-wider text-xs">Recent Activity</h3>
                    <button onClick={fetchSessions} className="text-zinc-500 hover:text-white transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    </button>
                </div>
                <div className="max-h-64 overflow-y-auto custom-scrollbar">
                    {sessions.length === 0 ? (
                        <div className="p-8 text-center text-zinc-600 text-sm italic">No data yet. Complete a workout to see history.</div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead className="text-[10px] text-zinc-500 uppercase font-black tracking-widest bg-black/20">
                                <tr>
                                    <th className="px-6 py-3">Exercise</th>
                                    <th className="px-6 py-3">Reps</th>
                                    <th className="px-6 py-3 text-right">Score</th>
                                </tr>
                            </thead>
                            <tbody className="text-xs text-zinc-300 divide-y divide-zinc-800/50">
                                {sessions.map((s) => (
                                    <tr key={s._id} className="hover:bg-white/5 transition-colors group">
                                        <td className="px-6 py-4 capitalize font-medium text-zinc-200">{s.exerciseId}</td>
                                        <td className="px-6 py-4">{s.count}</td>
                                        <td className={`px-6 py-4 text-right font-bold ${s.qualityScore > 80 ? 'text-emerald-500' : 'text-amber-500'}`}>{s.qualityScore}%</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}
