
"use client";

import { useState } from "react";
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc, setDoc } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Trash2, Save, Clock, GraduationCap, ClipboardList } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DEFAULT_PURPOSES } from "@/lib/constants";

export function SystemSettings() {
  const db = useFirestore();
  const { toast } = useToast();
  
  const settingsRef = useMemoFirebase(() => {
    if (!db) return null;
    return doc(db, "settings", "library");
  }, [db]);

  const { data: settings, isLoading } = useDoc(settingsRef);

  const [newPurpose, setNewPurpose] = useState("");
  const [saving, setSaving] = useState(false);

  const handleUpdateSettings = async (updates: any) => {
    if (!db || !settingsRef) return;
    setSaving(true);
    try {
      await setDoc(settingsRef, { ...settings, ...updates }, { merge: true });
      toast({ title: "Settings Updated", description: "System configuration saved successfully." });
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Failed to update settings." });
    } finally {
      setSaving(false);
    }
  };

  const addPurpose = () => {
    if (!newPurpose.trim()) return;
    const currentPurposes = settings?.purposes || Array.from(DEFAULT_PURPOSES);
    handleUpdateSettings({ purposes: [...currentPurposes, newPurpose.trim()] });
    setNewPurpose("");
  };

  const removePurpose = (p: string) => {
    const currentPurposes = settings?.purposes || Array.from(DEFAULT_PURPOSES);
    handleUpdateSettings({ purposes: currentPurposes.filter((item: string) => item !== p) });
  };

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center p-20 gap-4">
      <Loader2 className="animate-spin text-primary w-10 h-10" />
      <p className="text-muted-foreground animate-pulse">Loading settings...</p>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header>
        <h1 className="text-3xl font-bold font-headline">Library Configuration</h1>
        <p className="text-muted-foreground">Adjust global system parameters and visitor workflows.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="border-none shadow-sm overflow-hidden">
          <CardHeader className="bg-primary/5">
            <div className="flex items-center gap-3">
              <ClipboardList className="w-5 h-5 text-primary" />
              <div>
                <CardTitle className="text-lg">Visitor Purposes</CardTitle>
                <CardDescription>Manage options for the Visitor Terminal.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="flex gap-2">
              <Input 
                placeholder="New purpose (e.g. Clearance)" 
                value={newPurpose}
                onChange={(e) => setNewPurpose(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addPurpose()}
              />
              <Button onClick={addPurpose} size="icon" disabled={saving}><Plus className="w-4 h-4" /></Button>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {(settings?.purposes || DEFAULT_PURPOSES).map((p: string) => (
                <div key={p} className="flex items-center justify-between p-3 bg-muted/30 rounded-xl group hover:bg-muted/50 transition-colors">
                  <span className="text-sm font-medium">{p}</span>
                  <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 h-8 w-8 text-destructive" onClick={() => removePurpose(p)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-8">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-accent" />
                <CardTitle className="text-lg">Library Operating Hours</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Opening Time</Label>
                <Input 
                  type="time" 
                  defaultValue={settings?.openingTime || "08:00"} 
                  onBlur={(e) => handleUpdateSettings({ openingTime: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Closing Time</Label>
                <Input 
                  type="time" 
                  defaultValue={settings?.closingTime || "21:00"}
                  onBlur={(e) => handleUpdateSettings({ closingTime: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-3">
                <GraduationCap className="w-5 h-5 text-primary" />
                <CardTitle className="text-lg">Academic Term</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>School Year</Label>
                <Input 
                  placeholder="e.g. 2024-2025" 
                  defaultValue={settings?.schoolYear}
                  onBlur={(e) => handleUpdateSettings({ schoolYear: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Current Semester</Label>
                <Select 
                  defaultValue={settings?.semester || "1st"} 
                  onValueChange={(v) => handleUpdateSettings({ semester: v })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1st">1st Semester</SelectItem>
                    <SelectItem value="2nd">2nd Semester</SelectItem>
                    <SelectItem value="Midyear">Midyear</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
