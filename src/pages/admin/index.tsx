import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Shield, Key, FileSpreadsheet, Settings, Newspaper, Database, MessageSquare } from 'lucide-react';

// Import Layout
import { TestPageLayout } from '@/components/TestPageLayout';

// Import Komponen Manajemen
import { AdminContentManager } from '@/components/admin/AdminContentManager'; 
import { ReferenceDataManager } from '@/components/admin/ReferenceDataManager'; // IMPORT BARU
import { EmployeeManagement } from '@/components/admin/EmployeeManagement';
import { UserManagement } from '@/components/admin/UserManagement';
import { RoleManagement } from '@/components/admin/RoleManagement';
import { PermissionManagement } from '@/components/admin/PermissionManagement';
import { WhatsAppManager } from '@/components/admin/WhatsAppManager';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('content');

  return (
    <TestPageLayout
      title="Admin Panel"
      description="Pusat manajemen konten, data pegawai, user, role, dan hak akses aplikasi."
      icon={<Settings className="w-6 h-6 text-slate-700" />}
      permissionCode="access_admin"
    >
      <div className="space-y-6 animate-in fade-in duration-500">
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          
          {/* Header Tab Responsive */}
          <div className="overflow-x-auto pb-1">
            <TabsList className="w-full justify-start h-auto p-1 bg-slate-100/50 border">
                <TabsTrigger value="content" className="data-[state=active]:bg-white data-[state=active]:shadow-sm py-2 px-4 gap-2">
                    <Newspaper className="w-4 h-4 text-blue-600"/>
                    <span>Berita & Kegiatan</span>
                </TabsTrigger>
                {/* MENU BARU: DATA REFERENSI */}
                <TabsTrigger value="references" className="data-[state=active]:bg-white data-[state=active]:shadow-sm py-2 px-4 gap-2">
                    <Database className="w-4 h-4 text-cyan-600"/>
                    <span>Data Referensi</span>
                </TabsTrigger>
                <TabsTrigger value="employees" className="data-[state=active]:bg-white data-[state=active]:shadow-sm py-2 px-4 gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-green-600"/>
                    <span>Pegawai</span>
                </TabsTrigger>
                <TabsTrigger value="users" className="data-[state=active]:bg-white data-[state=active]:shadow-sm py-2 px-4 gap-2">
                    <Users className="w-4 h-4 text-orange-600"/>
                    <span>Users</span>
                </TabsTrigger>
                <TabsTrigger value="roles" className="data-[state=active]:bg-white data-[state=active]:shadow-sm py-2 px-4 gap-2">
                    <Shield className="w-4 h-4 text-purple-600"/>
                    <span>Roles</span>
                </TabsTrigger>
                <TabsTrigger value="permissions" className="data-[state=active]:bg-white data-[state=active]:shadow-sm py-2 px-4 gap-2">
                    <Key className="w-4 h-4 text-slate-600"/>
                    <span>Permissions</span>
                </TabsTrigger>
                <TabsTrigger value="whatsapp" className="data-[state=active]:bg-white data-[state=active]:shadow-sm py-2 px-4 gap-2">
                    <MessageSquare className="w-4 h-4 text-emerald-600"/>
                    <span>WhatsApp (Fonnte)</span>
                </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="content" className="focus-visible:outline-none mt-0">
             <AdminContentManager />
          </TabsContent>

          {/* CONTENT BARU: REFERENCE DATA */}
          <TabsContent value="references" className="focus-visible:outline-none mt-0">
             <ReferenceDataManager />
          </TabsContent>

          <TabsContent value="employees" className="focus-visible:outline-none mt-0">
            <EmployeeManagement />
          </TabsContent>

          <TabsContent value="users" className="focus-visible:outline-none mt-0">
            <UserManagement />
          </TabsContent>

          <TabsContent value="roles" className="focus-visible:outline-none mt-0">
            <RoleManagement />
          </TabsContent>

          <TabsContent value="permissions" className="focus-visible:outline-none mt-0">
            <PermissionManagement />
          </TabsContent>

          <TabsContent value="whatsapp" className="focus-visible:outline-none mt-0">
            <WhatsAppManager />
          </TabsContent>

        </Tabs>

      </div>
    </TestPageLayout>
  );
}