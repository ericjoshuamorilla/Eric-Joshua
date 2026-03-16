"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { useFirestore, useCollection, useUser, useMemoFirebase, useAuth } from "@/firebase";
import { collection, query, orderBy, limit } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { AdminStats } from "@/components/admin/stats";
import { AIInsights } from "@/components/admin/ai-insights";
import { UserManagement } from "@/components/admin/user-management";
import { SystemSettings } from "@/components/admin/system-settings";
import { Card } from "@/components/ui/card";
import { 
  BarChart3, 
  Users, 
  Settings, 
  FileDown, 
  Calendar as CalendarIcon, 
  Search,
  Filter,
  ShieldAlert,
  Loader2,
  School,
  LayoutDashboard,
  LogOut,
  FileText
} from "lucide-react";
import Link from "next/link";
import { format, subDays, startOfDay, endOfDay, isWithinInterval } from "date-fns";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger 
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { COLLEGES, DEFAULT_PURPOSES, USER_TYPES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { PlaceHolderImages } from "@/lib/placeholder-images";

type AdminSection = 'stats' | 'users' | 'settings';

export default function AdminDashboard() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const auth = useAuth();
  
  const [activeSection, setActiveSection] = useState<AdminSection>('stats');
  
  const ADMIN_EMAILS = ["jcesperanza@neu.edu.ph", "ericjoshua.morilla@neu.edu.ph"];
  const isSpecialUser = user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase());

  const neuLogo = PlaceHolderImages.find(img => img.id === "neu-logo");

  const [dateRange, setDateRange] = useState<'day' | 'week' | 'custom'>('day');
  const [customDate, setCustomDate] = useState<Date | undefined>(new Date());
  const [filterPurpose, setFilterPurpose] = useState<string>("all");
  const [filterCollege, setFilterCollege] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");

  const logsQuery = useMemoFirebase(() => {
    if (!db || !user || !isSpecialUser) return null;
    return query(collection(db, "visit_logs"), orderBy("timestamp", "desc"), limit(1000));
  }, [db, user, isSpecialUser]);

  const { data: allLogs, isLoading: logsLoading } = useCollection(logsQuery);

  const filteredLogs = useMemo(() => {
    if (!allLogs) return [];
    
    return allLogs.filter(log => {
      const logDate = new Date(log.timestamp);
      
      if (dateRange === 'day') {
        if (!customDate) return true;
        const start = startOfDay(customDate);
        const end = endOfDay(customDate);
        if (!isWithinInterval(logDate, { start, end })) return false;
      } else if (dateRange === 'week') {
        const start = startOfDay(subDays(new Date(), 7));
        const end = endOfDay(new Date());
        if (!isWithinInterval(logDate, { start, end })) return false;
      }

      if (filterPurpose !== "all" && log.purposeOfVisit !== filterPurpose) return false;
      if (filterCollege !== "all" && log.userAffiliation !== filterCollege) return false;
      if (filterType !== "all" && log.userType !== filterType) return false;

      return true;
    });
  }, [allLogs, dateRange, customDate, filterPurpose, filterCollege, filterType]);

  const handleSignOut = () => signOut(auth);

  if (isUserLoading || (user && logsLoading && isSpecialUser)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Accessing secure NEU records...</p>
        </div>
      </div>
    );
  }

  if (!user || !isSpecialUser) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center p-8 space-y-6">
          <ShieldAlert className="w-16 h-16 text-destructive mx-auto" />
          <h2 className="text-2xl font-bold font-headline">Unauthorized</h2>
          <p className="text-muted-foreground">Admin access is restricted. Please contact IT.</p>
          <Button asChild className="w-full rounded-full">
            <Link href="/">Back to Home</Link>
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[#F8FAFC]">
      <aside className="w-64 border-r bg-white flex flex-col no-print hidden lg:flex">
        <div className="p-6">
          <Link href="/" className="flex items-center gap-2 text-primary font-bold text-2xl font-headline group">
            {neuLogo && (
              <div className="w-10 h-10 relative">
                <Image src={neuLogo.imageUrl} alt="NEU" fill className="object-contain" data-ai-hint="university emblem" />
              </div>
            )}
            <span className="tracking-tighter">NEU</span>
          </Link>
        </div>
        <nav className="flex-1 px-4 py-4 space-y-1">
          <Button 
            variant="ghost" 
            onClick={() => setActiveSection('stats')}
            className={cn(
              "w-full justify-start gap-3 rounded-lg h-11",
              activeSection === 'stats' ? "bg-primary/10 text-primary hover:bg-primary/15" : "text-muted-foreground"
            )}
          >
            <LayoutDashboard className="w-5 h-5" />
            Dashboard
          </Button>
          <Button 
            variant="ghost" 
            onClick={() => setActiveSection('users')}
            className={cn(
              "w-full justify-start gap-3 rounded-lg h-11",
              activeSection === 'users' ? "bg-primary/10 text-primary hover:bg-primary/15" : "text-muted-foreground"
            )}
          >
            <Users className="w-5 h-5" />
            User Management
          </Button>
          <Button 
            variant="ghost" 
            onClick={() => setActiveSection('settings')}
            className={cn(
              "w-full justify-start gap-3 rounded-lg h-11",
              activeSection === 'settings' ? "bg-primary/10 text-primary hover:bg-primary/15" : "text-muted-foreground"
            )}
          >
            <Settings className="w-5 h-5" />
            System Settings
          </Button>
        </nav>
        
        <div className="p-4 border-t mt-auto">
          <div className="flex items-center justify-between gap-3 px-2 py-3 rounded-xl hover:bg-muted/50 transition-colors group">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-white font-bold overflow-hidden shrink-0">
                {user.photoURL ? (
                  <Image src={user.photoURL} alt="Admin" width={40} height={40} />
                ) : (
                  user.displayName?.[0] || 'A'
                )}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-semibold truncate">{user.displayName || "Admin"}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleSignOut}
              className="text-muted-foreground hover:text-destructive rounded-full shrink-0"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="print-only p-8 border-b-2 mb-8 bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {neuLogo && <Image src={neuLogo.imageUrl} alt="NEU" width={48} height={48} />}
              <div>
                <h1 className="text-2xl font-bold text-primary font-headline">New Era University</h1>
                <p className="text-sm text-muted-foreground">Library Visitor Activity Report</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold">{format(new Date(), "PPPP")}</p>
              <p className="text-xs text-muted-foreground">Generated by {user?.displayName || "Administrator"}</p>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto p-8 space-y-8">
          {activeSection === 'stats' && (
            <>
              <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="no-print">
                  <h1 className="text-3xl font-bold tracking-tight font-headline">Library Analytics</h1>
                  <p className="text-muted-foreground">Overview of library activity and usage patterns.</p>
                </div>
                <div className="print-only">
                   <h2 className="text-xl font-bold font-headline">Executive Summary</h2>
                   <p className="text-sm text-muted-foreground">Comprehensive logs for the period: {dateRange === 'day' ? format(customDate || new Date(), "MMMM d, yyyy") : dateRange === 'week' ? "Past 7 Days" : "Full History"}</p>
                </div>
                <div className="flex flex-wrap items-center gap-3 no-print">
                  <Select value={dateRange} onValueChange={(v: any) => setDateRange(v)}>
                    <SelectTrigger className="w-[140px] rounded-full">
                      <SelectValue placeholder="Period" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="day">Single Day</SelectItem>
                      <SelectItem value="week">Past 7 Days</SelectItem>
                      <SelectItem value="custom">All History</SelectItem>
                    </SelectContent>
                  </Select>

                  {dateRange === 'day' && (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="rounded-full gap-2 border-primary/20">
                          <CalendarIcon className="w-4 h-4 text-primary" />
                          {customDate ? format(customDate, "PPP") : "Select Date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="end">
                        <Calendar mode="single" selected={customDate} onSelect={setCustomDate} initialFocus />
                      </PopoverContent>
                    </Popover>
                  )}

                  <Button onClick={() => window.print()} className="bg-primary rounded-full gap-2">
                    <FileText className="w-4 h-4" />
                    Export Report
                  </Button>
                </div>
              </header>

              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 no-print">
                <Select value={filterPurpose} onValueChange={setFilterPurpose}>
                  <SelectTrigger className="rounded-xl bg-white border-none shadow-sm">
                    <Filter className="w-4 h-4 mr-2 opacity-50" />
                    <SelectValue placeholder="Filter Purpose" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Purposes</SelectItem>
                    {DEFAULT_PURPOSES.map(p => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="rounded-xl bg-white border-none shadow-sm">
                    <Users className="w-4 h-4 mr-2 opacity-50" />
                    <SelectValue placeholder="Classification" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Classifications</SelectItem>
                    {USER_TYPES.map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="col-span-1 lg:col-span-2">
                  <Select value={filterCollege} onValueChange={setFilterCollege}>
                    <SelectTrigger className="rounded-xl bg-white border-none shadow-sm w-full">
                      <School className="w-4 h-4 mr-2 opacity-50" />
                      <SelectValue placeholder="College/Department" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[400px]">
                      <SelectItem value="all">All Departments</SelectItem>
                      {Object.entries(COLLEGES).map(([category, list]) => (
                        <SelectGroup key={category}>
                          <SelectLabel className="text-[10px] uppercase font-bold text-primary/50 px-2 py-2">{category}</SelectLabel>
                          {list.map(college => (
                            <SelectItem key={college} value={college}>{college}</SelectItem>
                          ))}
                        </SelectGroup>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Tabs defaultValue="overview" className="space-y-6">
                <TabsList className="bg-white border p-1 rounded-xl no-print">
                  <TabsTrigger value="overview" className="rounded-lg px-8">Overview</TabsTrigger>
                  <TabsTrigger value="logs" className="rounded-lg px-8">Live Feed</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-8 animate-in fade-in duration-500">
                  <AdminStats logs={filteredLogs} />
                  <AIInsights logs={filteredLogs} />
                </TabsContent>

                <TabsContent value="logs" className="animate-in fade-in duration-500">
                  <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-muted/30 border-b">
                          <th className="px-6 py-4 text-left font-semibold">Visitor</th>
                          <th className="px-6 py-4 text-left font-semibold">Affiliation</th>
                          <th className="px-6 py-4 text-left font-semibold">Status</th>
                          <th className="px-6 py-4 text-left font-semibold">Activity</th>
                          <th className="px-6 py-4 text-right font-semibold">Timestamp</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {filteredLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-muted/5 transition-colors">
                            <td className="px-6 py-4 font-medium">{log.userName}</td>
                            <td className="px-6 py-4 text-muted-foreground">{log.userAffiliation}</td>
                            <td className="px-6 py-4">
                               <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-primary/10 text-primary">
                                 {log.userType}
                               </span>
                            </td>
                            <td className="px-6 py-4">
                               <span className="px-3 py-1 bg-accent/10 text-accent rounded-full text-xs font-medium">
                                 {log.purposeOfVisit}
                               </span>
                            </td>
                            <td className="px-6 py-4 text-right text-xs text-muted-foreground">
                              {format(new Date(log.timestamp), "MMM d, p")}
                            </td>
                          </tr>
                        ))}
                        {filteredLogs.length === 0 && (
                          <tr>
                            <td colSpan={5} className="py-24 text-center text-muted-foreground">
                              No records match your current filters.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </TabsContent>
              </Tabs>
            </>
          )}

          {activeSection === 'users' && <UserManagement />}
          {activeSection === 'settings' && <SystemSettings />}
        </div>
      </main>
    </div>
  );
}