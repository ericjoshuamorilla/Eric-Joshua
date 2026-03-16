"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  LayoutDashboard, 
  Monitor, 
  LogIn, 
  LogOut, 
  Loader2, 
  ShieldCheck, 
  Fingerprint, 
  Wifi 
} from "lucide-react";
import { useAuth, useUser } from "@/firebase";
import { signOut } from "firebase/auth";
import { doc, getDoc, query, collection, where, getDocs, limit } from "firebase/firestore";
import { useFirestore } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { initiateGoogleSignIn } from "@/firebase/non-blocking-login";
import { useRouter } from "next/navigation";

export default function Home() {
  const auth = useAuth();
  const db = useFirestore();
  const { user, isUserLoading, userError } = useUser();
  const { toast } = useToast();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(false);

  const neuLogo = PlaceHolderImages.find(img => img.id === "neu-logo");

  // RFID Scanner Logic
  const rfidBuffer = useRef<string>("");
  const lastKeyTime = useRef<number>(0);

  // Authorized administrator emails
  const ADMIN_EMAILS = ["jcesperanza@neu.edu.ph", "ericjoshua.morilla@neu.edu.ph"];
  const isSpecialUser = user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase());

  useEffect(() => {
    async function checkAdmin() {
      if (user && db) {
        try {
          const adminRef = doc(db, "admin_roles", user.uid);
          const adminSnap = await getDoc(adminRef);
          setIsAdmin(adminSnap.exists() || isSpecialUser);
        } catch (e) {
          setIsAdmin(!!isSpecialUser);
        }
      } else {
        setIsAdmin(false);
      }
    }
    checkAdmin();
  }, [user, db, isSpecialUser]);

  // Show error if user attempts to login with non-institutional email
  useEffect(() => {
    if (userError) {
      toast({
        variant: "destructive",
        title: "Access Denied",
        description: userError.message,
      });
      setLoading(false);
    }
  }, [userError, toast]);

  // Global RFID Keydown Listener
  useEffect(() => {
    const handleGlobalKeydown = (e: KeyboardEvent) => {
      // Ignore if currently focused on an input
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
  }, [db]);

  const processRfidScan = async (code: string) => {
    if (!db) return;
    setLoading(true);

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
        return;
      }

      const userData = querySnapshot.docs[0].data();
      if (userData.isBlocked) {
        toast({
          variant: "destructive",
          title: "Access Denied",
          description: "Account blocked. Contact Admin.",
        });
        setLoading(false);
        return;
      }

      toast({
        title: "Welcome back!",
        description: `Recognized: ${userData.name}. Opening terminal...`,
      });
      
      // Redirect to terminal with pre-scanned RFID
      router.push(`/terminal?rfid=${code}`);
    } catch (error) {
      console.error("Home RFID Error:", error);
      toast({
        variant: "destructive",
        title: "System Error",
        description: "Failed to process RFID tap.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = () => {
    setLoading(true);
    initiateGoogleSignIn(auth);
  };

  useEffect(() => {
    if (user) {
      setLoading(false);
    }
  }, [user]);

  const handleSignOut = () => signOut(auth);

  if (isUserLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div className="flex flex-col justify-center space-y-6">
          <div className="flex flex-col items-start gap-4">
            <div className="flex items-center gap-6">
              {neuLogo && (
                <div className="w-24 h-24 relative shrink-0">
                  <Image 
                    src={neuLogo.imageUrl} 
                    alt="NEU Logo" 
                    fill
                    className="object-contain"
                    data-ai-hint="university emblem"
                  />
                </div>
              )}
              <div className="space-y-1">
                <h1 className="text-7xl font-bold tracking-tighter text-primary font-headline leading-none">
                  NEU
                </h1>
                <p className="text-xl text-muted-foreground font-medium">
                  Library Visitor Log
                </p>
              </div>
            </div>
            <p className="text-base text-muted-foreground max-w-sm mt-2">
              Streamlined visitor management and usage analytics for New Era University.
            </p>
          </div>
          
          <div className="flex flex-col gap-4">
            {!user ? (
              <div className="flex flex-col gap-6">
                <div className="space-y-4">
                  <Button onClick={handleSignIn} disabled={loading} size="lg" className="rounded-full px-8 text-lg bg-primary hover:bg-primary/90 gap-2 shadow-lg w-fit">
                    {loading ? <Loader2 className="animate-spin" /> : <LogIn className="w-5 h-5" />}
                    Sign in with NEU Email
                  </Button>
                  <p className="text-xs text-muted-foreground px-2">
                    Use your <span className="font-bold">@neu.edu.ph</span> account only.
                  </p>
                </div>

                <div className="flex flex-col gap-3 p-6 bg-primary/5 rounded-3xl border-2 border-dashed border-primary/20 animate-pulse w-full max-w-sm">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Fingerprint className="w-7 h-7 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-primary">Tap your ID to enter</p>
                        <p className="text-xs text-muted-foreground">RFID Scanning Enabled</p>
                      </div>
                      <Wifi className="w-5 h-5 text-primary opacity-50 rotate-90" />
                   </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-6 w-full">
                <div className="flex flex-wrap gap-4">
                  <Button asChild size="lg" className="rounded-full px-8 text-lg bg-primary hover:bg-primary/90 shadow-md">
                    <Link href="/terminal">Visitor Terminal</Link>
                  </Button>
                  {(isAdmin || isSpecialUser) && (
                    <Button asChild variant="outline" size="lg" className="rounded-full px-8 text-lg border-primary text-primary hover:bg-primary/5 shadow-sm gap-2">
                      <Link href="/admin">
                        <ShieldCheck className="w-5 h-5" />
                        Admin Dashboard
                      </Link>
                    </Button>
                  )}
                </div>
                
                <div className="flex items-center gap-4 p-4 bg-white rounded-2xl shadow-sm border">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl overflow-hidden">
                    {user.photoURL ? (
                      <Image src={user.photoURL} alt="Avatar" width={48} height={48} className="object-cover" />
                    ) : (
                      user.displayName?.[0] || 'U'
                    )}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="text-sm font-bold truncate">{user.displayName || "Institutional User"}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    {isSpecialUser && <p className="text-[10px] font-bold text-primary uppercase mt-1">Authorized Administrator</p>}
                  </div>
                  <Button variant="ghost" size="icon" onClick={handleSignOut} className="text-muted-foreground hover:text-destructive rounded-full">
                    <LogOut className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-4">
          <Card className="border-none bg-white/50 backdrop-blur shadow-xl shadow-primary/5">
            <CardHeader className="pb-2">
              <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center mb-4">
                <Monitor className="text-accent w-6 h-6" />
              </div>
              <CardTitle className="font-headline">Smart Check-in</CardTitle>
              <CardDescription>
                Fast check-in for students and faculty using School ID or Google accounts.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-none bg-white/50 backdrop-blur shadow-xl shadow-primary/5">
            <CardHeader className="pb-2">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center mb-4">
                <LayoutDashboard className="text-primary w-6 h-6" />
              </div>
              <CardTitle className="font-headline">Insights & Data</CardTitle>
              <CardDescription>
                AI-powered statistics and detailed reports for administrators.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  );
}
