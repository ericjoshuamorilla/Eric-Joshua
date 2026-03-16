"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Loader2, 
  Fingerprint, 
  LogIn, 
  CheckCircle2, 
  ArrowLeft, 
  GraduationCap, 
  Users, 
  UserRound, 
  CreditCard, 
  LayoutDashboard, 
  Home, 
  Search, 
  BookOpen, 
  School, 
  GraduationCap as AlumniIcon,
  ShieldAlert,
  Zap,
  Wifi
} from "lucide-react";
import Link from "next/link";
import { useUser, useFirestore, useAuth, useDoc, useMemoFirebase } from "@/firebase";
import { collection, serverTimestamp, doc, query, where, getDocs, limit } from "firebase/firestore";
import { addDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { initiateGoogleSignIn } from "@/firebase/non-blocking-login";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useRouter, useSearchParams } from "next/navigation";
import { ScrollArea } from "@/components/ui/scroll-area";
import { COLLEGES, DEFAULT_PURPOSES } from "@/lib/constants";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { cn } from "@/lib/utils";

export default function VisitorTerminal() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const auth = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const neuLogo = PlaceHolderImages.find(img => img.id === "neu-logo");

  const settingsRef = useMemoFirebase(() => {
    if (!db) return null;
    return doc(db, "settings", "library");
  }, [db]);

  const { data: settings } = useDoc(settingsRef);

  const [step, setStep] = useState<'welcome' | 'rfid' | 'type' | 'affiliation' | 'purpose' | 'success' | 'blocked'>('welcome');
  const [userType, setUserType] = useState<string | null>(null);
  const [affiliation, setAffiliation] = useState("");
  const [userName, setUserName] = useState("");
  const [rfid, setRfid] = useState("");
  const [loading, setLoading] = useState(false);
  const [justFinished, setJustFinished] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const rfidBuffer = useRef<string>("");
  const lastKeyTime = useRef<number>(0);

  const ADMIN_EMAILS = ["jcesperanza@neu.edu.ph", "ericjoshua.morilla@neu.edu.ph"];
  const isAdmin = user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase());

  // Handle RFID passed from Home page via search params
  const preScannedRfid = searchParams.get('rfid');

  useEffect(() => {
    if (preScannedRfid && db && step === 'welcome' && !loading) {
      processRfidScan(preScannedRfid);
    }
  }, [preScannedRfid, db, step, loading]);

  useEffect(() => {
    const handleGlobalKeydown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const now = Date.now();
      if (now - lastKeyTime.current > 50) {
        rfidBuffer.current = "";
      }
      lastKeyTime.current = now;

      if (e.key === "Enter") {
        if (rfidBuffer.current.length >= 4) {
          processRfidScan(rfidBuffer.current);
        }
        rfidBuffer.current = "";
      } else if (e.key.length === 1) {
        rfidBuffer.current += e.key;
      }
    };

    window.addEventListener("keydown", handleGlobalKeydown);
    return () => window.removeEventListener("keydown", handleGlobalKeydown);
  }, [db, step, loading]);

  const processRfidScan = async (code: string) => {
    if (!db || step === 'success' || loading) return;

    setLoading(true);
    setRfid(code);

    try {
      const q = query(collection(db, "users"), where("rfidTagNumber", "==", code), limit(1));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        toast({
          variant: "destructive",
          title: "Unrecognized ID",
          description: "ID not found. Please register with Admin.",
        });
        setLoading(false);
        setRfid("");
        return;
      }

      const userData = querySnapshot.docs[0].data();

      if (userData.isBlocked) {
        setStep('blocked');
        setLoading(false);
        return;
      }

      setUserName(userData.name);
      setAffiliation(userData.affiliation);
      setUserType(userData.userType);
      
      setStep('purpose');
      toast({
        title: "ID Verified",
        description: `Welcome, ${userData.name}!`,
      });
    } catch (error) {
      console.error("RFID Scan Error:", error);
      toast({
        variant: "destructive",
        title: "System Error",
        description: "Failed to verify ID.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && step === 'welcome' && !justFinished && !preScannedRfid) {
      setStep('type');
      setUserName(user.displayName || "");
    }
    if (user) {
      setLoading(false);
    }
  }, [user, step, justFinished, preScannedRfid]);

  const handleGoogleSignIn = () => {
    setLoading(true);
    initiateGoogleSignIn(auth);
  };

  const handleManualRfidSubmit = () => {
    if (rfid) processRfidScan(rfid);
  };

  const submitLog = (purpose: string) => {
    if (!db || !userType) return;
    
    setLoading(true);
    const logRef = collection(db, 'visit_logs');
    
    addDocumentNonBlocking(logRef, {
      userId: user?.uid || `rfid_${rfid}`,
      userName: userName || (rfid ? `ID: ${rfid}` : 'Visitor'),
      userAffiliation: affiliation,
      userType: userType,
      rfidTagNumber: rfid || null,
      timestamp: new Date().toISOString(),
      purposeOfVisit: purpose,
      schoolYear: settings?.schoolYear || "N/A",
      semester: settings?.semester || "N/A",
      createdAt: serverTimestamp(),
    });

    setJustFinished(true);
    setStep('success');
    
    setTimeout(() => {
      resetTerminal();
    }, 10000);
  };

  const resetTerminal = () => {
    setStep('welcome');
    setUserType(null);
    setAffiliation("");
    setUserName("");
    setRfid("");
    setSearchQuery("");
    setLoading(false);
    setJustFinished(false);
    // Clear URL params if present
    if (preScannedRfid) {
      router.replace('/terminal');
    }
  };

  if (isUserLoading) return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="animate-spin text-primary" /></div>;

  const currentPurposes = settings?.purposes || Array.from(DEFAULT_PURPOSES);

  return (
    <div className="min-h-screen bg-[#F1F5F9] flex flex-col font-body">
      <header className="p-6 flex items-center justify-between no-print">
        <div className="flex items-center gap-3">
          {neuLogo && (
            <div className="w-12 h-12 relative">
              <Image src={neuLogo.imageUrl} alt="NEU Logo" fill className="object-contain" data-ai-hint="university emblem" />
            </div>
          )}
          <h1 className="text-3xl font-bold font-headline text-primary tracking-tighter">NEU</h1>
        </div>
        <div className="flex items-center gap-3">
          {isAdmin && (
             <Button asChild variant="ghost" size="sm" className="rounded-full">
               <Link href="/admin"><LayoutDashboard className="w-4 h-4 mr-2" /> Admin</Link>
             </Button>
          )}
          <div className="px-4 py-1.5 bg-white rounded-full text-xs font-bold text-muted-foreground shadow-sm border">
            {settings?.schoolYear || "2024-2025"} • {settings?.semester || "1st"} Sem
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-xl w-full">
          {step === 'welcome' && (
            <Card className="shadow-2xl border-none rounded-3xl overflow-hidden relative">
              <div className="h-2 bg-gradient-to-r from-primary to-accent" />
              <CardHeader className="text-center space-y-4 pt-10">
                <div className="mx-auto w-32 h-32 relative flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full bg-primary/5 animate-ping opacity-20" />
                  <div className="absolute inset-2 rounded-full bg-primary/10 animate-pulse" />
                  <div className="relative w-24 h-24 rounded-3xl bg-white shadow-xl flex items-center justify-center border-2 border-primary/20">
                    <Wifi className="w-12 h-12 text-primary rotate-90" />
                  </div>
                </div>
                <div className="space-y-2">
                  <CardTitle className="text-4xl font-headline font-bold text-slate-900">Tap to Enter</CardTitle>
                  <CardDescription className="text-lg text-slate-500">
                    Place your NEU School ID on the scanner.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="grid gap-6 pb-12 pt-6">
                <div className="flex flex-col items-center gap-2 p-6 bg-primary/5 rounded-2xl border-2 border-dashed border-primary/20 animate-pulse">
                  <Fingerprint className="w-8 h-8 text-primary mb-2" />
                  <p className="text-sm font-bold text-primary tracking-wide">Ready to Scan...</p>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-200" /></div>
                  <div className="relative flex justify-center text-[10px] uppercase tracking-widest font-bold text-slate-400"><span className="bg-white px-4">Other Methods</span></div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Button
                    variant="outline"
                    className="h-16 rounded-2xl flex flex-col gap-1 border-2"
                    onClick={() => setStep('rfid')}
                  >
                    <Search className="w-5 h-5 text-primary" />
                    <span className="text-xs font-bold">Manual ID</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-16 rounded-2xl flex flex-col gap-1 border-2"
                    onClick={handleGoogleSignIn}
                    disabled={loading}
                  >
                    {loading ? <Loader2 className="animate-spin text-primary" /> : <LogIn className="w-5 h-5 text-primary" />}
                    <span className="text-xs font-bold">Google Mail</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 'rfid' && (
            <Card className="shadow-2xl border-none rounded-3xl p-4 animate-in zoom-in-95 duration-300">
              <CardHeader className="text-center">
                <CardTitle className="text-3xl font-headline font-bold">Manual Entry</CardTitle>
                <CardDescription className="text-lg">Enter your NEU School ID number</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Input 
                  autoFocus
                  className="h-20 text-center text-4xl font-mono tracking-wider border-none bg-slate-100 rounded-2xl focus-visible:ring-primary"
                  placeholder="00-0000"
                  value={rfid}
                  onChange={(e) => setRfid(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleManualRfidSubmit()}
                />
                <div className="flex gap-4">
                  <Button variant="ghost" className="flex-1 h-14 rounded-2xl" onClick={() => setStep('welcome')}>Cancel</Button>
                  <Button className="flex-1 h-14 rounded-2xl text-lg font-bold" onClick={handleManualRfidSubmit} disabled={!rfid || loading}>
                    {loading ? <Loader2 className="animate-spin" /> : "Verify ID"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 'blocked' && (
            <Card className="shadow-2xl border-none rounded-3xl p-8 text-center bg-destructive/5 animate-in zoom-in-95 duration-300">
              <div className="mx-auto w-24 h-24 rounded-full bg-destructive flex items-center justify-center mb-6 shadow-xl shadow-destructive/20">
                <ShieldAlert className="w-12 h-12 text-white" />
              </div>
              <CardHeader>
                <CardTitle className="text-3xl font-headline font-bold text-destructive">Access Denied</CardTitle>
                <CardDescription className="text-lg text-slate-700 font-medium">
                  Your account has been blocked. Please proceed to the Admin Desk for assistance.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <Button className="w-full h-14 rounded-2xl" variant="outline" onClick={resetTerminal}>
                  Back to Terminal
                </Button>
              </CardContent>
            </Card>
          )}

          {step === 'type' && (
            <Card className="shadow-2xl border-none rounded-3xl animate-in zoom-in-95 duration-300">
              <CardHeader className="text-center">
                <CardTitle className="text-3xl font-headline font-bold">Who are you?</CardTitle>
                <CardDescription className="text-lg">Select your institutional role</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4 pb-10">
                {[
                  { id: 'Student', icon: GraduationCap, color: 'text-primary' },
                  { id: 'Faculty', icon: Users, color: 'text-accent' },
                  { id: 'Staff', icon: UserRound, color: 'text-slate-500' },
                  { id: 'Alumni', icon: AlumniIcon, color: 'text-orange-500' }
                ].map(item => (
                  <Button key={item.id} variant="outline" className="h-32 rounded-2xl flex flex-col gap-3 text-lg font-bold hover:border-primary transition-all" onClick={() => { setUserType(item.id); setStep('affiliation'); }}>
                    <item.icon className={`w-8 h-8 ${item.color}`} />
                    {item.id}
                  </Button>
                ))}
              </CardContent>
            </Card>
          )}

          {step === 'affiliation' && (
            <Card className="shadow-2xl border-none rounded-3xl animate-in zoom-in-95 duration-300 overflow-hidden">
              <CardHeader className="text-center bg-white">
                <CardTitle className="text-3xl font-headline font-bold">Your Department</CardTitle>
                <CardDescription className="text-lg">Choose your NEU College or Office</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 p-6 pt-0">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input 
                    className="pl-12 h-14 rounded-2xl border-none bg-slate-100"
                    placeholder="Search department..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                
                <ScrollArea className="h-[350px] pr-4">
                  <div className="space-y-8">
                    {Object.entries(COLLEGES).map(([category, list]) => {
                      const filtered = list.filter(c => c.toLowerCase().includes(searchQuery.toLowerCase()));
                      if (filtered.length === 0) return null;
                      
                      return (
                        <div key={category} className="space-y-3">
                          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2">{category}</h3>
                          <div className="grid grid-cols-1 gap-2">
                            {filtered.map((college) => (
                              <Button
                                key={college}
                                variant="outline"
                                className={`h-auto py-5 px-6 justify-start text-left whitespace-normal text-base font-semibold rounded-2xl border-slate-100 hover:border-primary hover:bg-primary/5 transition-all ${affiliation === college ? 'border-primary bg-primary/10 ring-2 ring-primary/20' : ''}`}
                                onClick={() => {
                                  setAffiliation(college);
                                  setStep('purpose');
                                }}
                              >
                                {college.includes('School') ? <School className="w-5 h-5 mr-4 shrink-0 text-primary" /> : <BookOpen className="w-5 h-5 mr-4 shrink-0 text-primary" />}
                                {college}
                              </Button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
                <Button variant="ghost" className="w-full h-12 rounded-xl mt-2" onClick={() => setStep('type')}>
                  <ArrowLeft className="w-4 h-4 mr-2" /> Change Role
                </Button>
              </CardContent>
            </Card>
          )}

          {step === 'purpose' && (
            <Card className="shadow-2xl border-none rounded-3xl animate-in zoom-in-95 duration-300">
              <CardHeader className="text-center bg-primary/5 pb-8">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xl">
                    {userName?.[0] || 'V'}
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-headline font-bold">{userName || "Visitor"}</CardTitle>
                    <CardDescription className="text-sm font-medium">{affiliation} • {userType}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-8 pb-10">
                {currentPurposes.map((p: string) => (
                  <Button
                    key={p}
                    variant="outline"
                    className="h-28 text-xl border-2 hover:border-primary hover:bg-primary/5 font-bold rounded-2xl flex flex-col gap-2 transition-all"
                    onClick={() => submitLog(p)}
                    disabled={loading}
                  >
                    <span className="text-[10px] uppercase text-primary/60 font-black tracking-widest">Library Activity</span>
                    {p}
                  </Button>
                ))}
              </CardContent>
              <div className="px-6 pb-6">
                 <Button variant="ghost" className="w-full h-12 rounded-xl" onClick={resetTerminal}>
                  <ArrowLeft className="w-4 h-4 mr-2" /> Not You? Reset
                </Button>
              </div>
            </Card>
          )}

          {step === 'success' && (
            <Card className="shadow-2xl border-none bg-emerald-50 text-center py-20 rounded-3xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-emerald-500" />
              <CardContent className="space-y-10">
                <div className="space-y-6">
                  <div className="mx-auto w-32 h-32 rounded-full bg-emerald-500 flex items-center justify-center shadow-2xl shadow-emerald-500/30 animate-in zoom-in-50 duration-500">
                    <CheckCircle2 className="w-20 h-20 text-white" />
                  </div>
                  <div className="space-y-3">
                    <h2 className="text-4xl font-bold text-emerald-950 font-headline">Welcome to NEU Library!</h2>
                    <p className="text-xl text-emerald-700 font-medium">Your check-in has been recorded.</p>
                  </div>
                </div>

                <div className="flex flex-col gap-4 max-w-sm mx-auto">
                  {isAdmin ? (
                    <Button asChild size="lg" className="h-16 rounded-2xl bg-primary text-lg font-bold gap-3 shadow-xl shadow-primary/20">
                      <Link href="/admin"><LayoutDashboard className="w-6 h-6" /> Open Dashboard</Link>
                    </Button>
                  ) : (
                    <Button onClick={() => router.push('/')} size="lg" variant="outline" className="h-16 rounded-2xl gap-3 text-lg border-emerald-200 text-emerald-900 bg-white shadow-sm">
                      <Home className="w-6 h-6" /> Finish
                    </Button>
                  )}
                  
                  <Button variant="ghost" onClick={resetTerminal} className="text-emerald-600/60 hover:text-emerald-600">
                    Exit & Reset (10s)
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}