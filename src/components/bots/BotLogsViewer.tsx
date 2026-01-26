import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Terminal, Trash2, Calendar, Search, ArrowDownCircle, PauseCircle, PlayCircle } from "lucide-react";
import { LogEntry } from '@/contexts/BotContext';
import { useLanguage } from '@/contexts/LanguageContext';

interface BotLogsViewerProps {
    logs: LogEntry[];
    onClear: () => void;
}

const BotLogsViewer = ({ logs = [], onClear }: BotLogsViewerProps) => {
    const { t } = useLanguage();
    const [filterText, setFilterText] = useState('');
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [autoScroll, setAutoScroll] = useState(true);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Filter Logic - ensure logs is always an array
    const safeLogs = Array.isArray(logs) ? logs : [];
    const filteredLogs = safeLogs.filter(log => {
        const matchesText = log.message.toLowerCase().includes(filterText.toLowerCase());
        const logDate = new Date(log.timestamp).toISOString().split('T')[0];
        const matchesDate = logDate === selectedDate;
        return matchesText && matchesDate;
    });

    // Auto-scroll effect
    useEffect(() => {
        if (autoScroll && scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [filteredLogs, autoScroll]);

    const getLevelColor = (level: LogEntry['level']) => {
        switch (level) {
            case 'error': return 'text-red-400';
            case 'warn': return 'text-yellow-400';
            case 'debug': return 'text-blue-400';
            default: return 'text-emerald-400';
        }
    };

    return (
        <Card className="h-[600px] flex flex-col bg-slate-950 border-slate-800 text-slate-100">
            <CardHeader className="py-3 px-4 flex flex-row items-center justify-between border-b border-slate-800">
                <div className="flex items-center gap-2">
                    <Terminal className="h-5 w-5 text-emerald-500" />
                    <CardTitle className="text-base font-mono">Live Console Output</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Calendar className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                        <Input 
                            type="date" 
                            className="w-40 pl-9 h-9 bg-slate-900 border-slate-700 text-slate-200"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                        />
                    </div>
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                        <Input 
                            placeholder="Filter logs..." 
                            className="w-48 pl-9 h-9 bg-slate-900 border-slate-700 text-slate-200"
                            value={filterText}
                            onChange={(e) => setFilterText(e.target.value)}
                        />
                    </div>
                    <div className="h-6 w-px bg-slate-800 mx-1" />
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-9 w-9 text-slate-400 hover:text-white hover:bg-slate-800"
                        onClick={() => setAutoScroll(!autoScroll)}
                        title={autoScroll ? "Pause Auto-scroll" : "Resume Auto-scroll"}
                    >
                        {autoScroll ? <PauseCircle size={18} /> : <PlayCircle size={18} />}
                    </Button>
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-9 w-9 text-slate-400 hover:text-red-400 hover:bg-red-950/20"
                        onClick={onClear}
                        title="Clear Logs"
                    >
                        <Trash2 size={18} />
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="flex-1 p-0 overflow-hidden relative">
                <div 
                    ref={scrollRef}
                    className="h-full overflow-y-auto p-4 font-mono text-sm space-y-1 scroll-smooth"
                >
                    {filteredLogs.length > 0 ? (
                        filteredLogs.map((log) => (
                            <div key={log.id} className="flex gap-3 hover:bg-slate-900/50 px-2 py-0.5 rounded">
                                <span className="text-slate-500 shrink-0 select-none w-24">
                                    {new Date(log.timestamp).toLocaleTimeString()}
                                </span>
                                <span className={`uppercase font-bold text-[10px] w-12 shrink-0 pt-0.5 ${getLevelColor(log.level)}`}>
                                    [{log.level}]
                                </span>
                                <span className="text-slate-300 break-all whitespace-pre-wrap">
                                    {log.message}
                                </span>
                            </div>
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-slate-600 gap-2">
                            <Terminal size={32} />
                            <p>No logs found for this filter</p>
                        </div>
                    )}
                </div>
                
                {/* Auto-scroll Indicator */}
                {!autoScroll && (
                    <div className="absolute bottom-4 right-4 animate-bounce">
                        <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-lg cursor-pointer" onClick={() => setAutoScroll(true)}>
                            <ArrowDownCircle className="w-3 h-3 mr-1" />
                            Auto-scroll Paused
                        </Badge>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default BotLogsViewer;
