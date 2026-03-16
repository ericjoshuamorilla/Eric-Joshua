
"use client";

import { useState } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, doc, query, orderBy, setDoc } from "firebase/firestore";
import { updateDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { 
  Search, 
  ShieldAlert, 
  ShieldCheck, 
  Loader2, 
  UserCircle, 
  UserPlus, 
  Pencil,
  Filter,
  CheckCircle2,
  XCircle
} from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ALL_COLLEGES, USER_TYPES } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";

export function UserManagement() {
  const db = useFirestore();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [collegeFilter, setCollegeFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);

  const usersQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, "users"), orderBy("name", "asc"));
  }, [db]);

  const { data: users, isLoading } = useCollection(usersQuery);

  const filteredUsers = (users || []).filter(u => {
    const matchesSearch = u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         u.schoolId?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    const matchesCollege = collegeFilter === "all" || u.affiliation === collegeFilter;
    return matchesSearch && matchesRole && matchesCollege;
  });

  const handleSaveUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!db) return;
    
    const formData = new FormData(e.currentTarget);
    const userData = {
      name: formData.get("name") as string,
      schoolId: formData.get("schoolId") as string,
      rfidTagNumber: formData.get("rfid") as string,
      institutionalEmail: formData.get("email") as string,
      userType: formData.get("userType") as string,
      affiliation: formData.get("affiliation") as string,
      role: formData.get("role") as string,
      isBlocked: formData.get("isBlocked") === "true",
      id: editingUser?.id || `user_${Date.now()}`
    };

    try {
      // Update/Create main user doc
      await setDoc(doc(db, "users", userData.id), userData);
      
      // Manage admin role sync
      if (userData.role === 'admin') {
        await setDoc(doc(db, "admin_roles", userData.id), { active: true });
      } else {
        // We would ideally delete it, but let's keep it simple for MVP
      }

      toast({ title: "Success", description: `User ${editingUser ? 'updated' : 'created'} successfully.` });
      setIsModalOpen(false);
      setEditingUser(null);
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Failed to save user." });
    }
  };

  const toggleBlock = (userId: string, currentStatus: boolean) => {
    if (!db) return;
    updateDocumentNonBlocking(doc(db, "users", userId), { isBlocked: !currentStatus });
  };

  if (isLoading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold font-headline">User Directory</h1>
          <p className="text-muted-foreground">Manage library accounts and access privileges.</p>
        </div>
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingUser(null)} className="rounded-full gap-2">
              <UserPlus className="w-4 h-4" /> Add User
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>{editingUser ? 'Edit User Profile' : 'Register New User'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSaveUser} className="grid grid-cols-2 gap-4 py-4">
              <div className="col-span-2 space-y-2">
                <Label>Full Name</Label>
                <Input name="name" defaultValue={editingUser?.name} required />
              </div>
              <div className="space-y-2">
                <Label>School ID</Label>
                <Input name="schoolId" defaultValue={editingUser?.schoolId} required />
              </div>
              <div className="space-y-2">
                <Label>RFID Tag Number</Label>
                <Input name="rfid" defaultValue={editingUser?.rfidTagNumber} />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Institutional Email (@neu.edu.ph)</Label>
                <Input name="email" type="email" defaultValue={editingUser?.institutionalEmail} required />
              </div>
              <div className="space-y-2">
                <Label>Classification</Label>
                <Select name="userType" defaultValue={editingUser?.userType || "Student"}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {USER_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select name="role" defaultValue={editingUser?.role || "visitor"}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="visitor">Regular Visitor</SelectItem>
                    <SelectItem value="admin">Administrator</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-2">
                <Label>College / Department</Label>
                <Select name="affiliation" defaultValue={editingUser?.affiliation || ALL_COLLEGES[0]}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent className="max-h-60">
                    {ALL_COLLEGES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <Label>Account Status</Label>
                <div className="flex items-center gap-2">
                   <span className="text-xs font-medium">{editingUser?.isBlocked ? "Blocked" : "Active"}</span>
                   <Switch name="isBlocked" value="false" defaultChecked={!editingUser?.isBlocked} />
                </div>
              </div>
              <DialogFooter className="col-span-2 mt-4">
                <Button type="submit" className="w-full">Save Changes</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </header>

      <div className="flex flex-wrap gap-4 bg-white p-4 rounded-2xl border shadow-sm">
        <div className="relative flex-1 min-w-[300px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search name or ID..." 
            className="pl-10 border-none bg-muted/30"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-40 border-none bg-muted/30"><SelectValue placeholder="Role" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="visitor">Visitor</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
          </SelectContent>
        </Select>
        <Select value={collegeFilter} onValueChange={setCollegeFilter}>
          <SelectTrigger className="w-60 border-none bg-muted/30"><SelectValue placeholder="College" /></SelectTrigger>
          <SelectContent className="max-h-80">
            <SelectItem value="all">All Colleges</SelectItem>
            {ALL_COLLEGES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/20">
              <TableHead>User Information</TableHead>
              <TableHead>Details</TableHead>
              <TableHead>Account Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((u) => (
              <TableRow key={u.id} className="hover:bg-muted/5 transition-colors">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                      {u.name?.[0] || 'U'}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{u.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{u.schoolId || "NO ID"}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <p className="text-xs font-medium">{u.institutionalEmail}</p>
                    <div className="flex gap-2">
                       <Badge variant="outline" className="text-[10px] py-0">{u.userType}</Badge>
                       <Badge variant="outline" className="text-[10px] py-0 border-accent text-accent">{u.role}</Badge>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={u.isBlocked ? "destructive" : "secondary"} className="rounded-full">
                    {u.isBlocked ? <XCircle className="w-3 h-3 mr-1" /> : <CheckCircle2 className="w-3 h-3 mr-1" />}
                    {u.isBlocked ? "Blocked" : "Active"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button variant="ghost" size="icon" onClick={() => { setEditingUser(u); setIsModalOpen(true); }}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className={u.isBlocked ? "text-primary" : "text-destructive"}
                    onClick={() => toggleBlock(u.id, !!u.isBlocked)}
                  >
                    {u.isBlocked ? <ShieldCheck className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
