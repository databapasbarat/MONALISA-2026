import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  MessageSquare, 
  Send, 
  Smartphone, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ShieldCheck, 
  Layers, 
  Sparkles 
} from 'lucide-react';
import { 
  getFonnteDeviceStatus, 
  sendWhatsAppMessage, 
  FonnteDeviceStatus,
  buildLitmasAssignmentTemplate,
  buildWajibLaporReminderTemplate 
} from '@/services/fonnte';

export function WhatsAppManager() {
  const { toast } = useToast();
  const [deviceInfo, setDeviceInfo] = useState<FonnteDeviceStatus | null>(null);
  const [loadingDevice, setLoadingDevice] = useState(false);

  // Form kirim pesan
  const [targetNumber, setTargetNumber] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const fetchDeviceStatus = async () => {
    setLoadingDevice(true);
    try {
      const data = await getFonnteDeviceStatus();
      setDeviceInfo(data);
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Gagal Memeriksa Device',
        description: err?.message || 'Tidak dapat terhubung ke server Fonnte.'
      });
    } finally {
      setLoadingDevice(false);
    }
  };

  useEffect(() => {
    fetchDeviceStatus();
  }, []);

  const handleSendTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetNumber) {
      return toast({
        variant: 'destructive',
        title: 'Nomor Belum Diisi',
        description: 'Silakan masukkan nomor WhatsApp tujuan.'
      });
    }
    if (!message) {
      return toast({
        variant: 'destructive',
        title: 'Pesan Kosong',
        description: 'Silakan ketik pesan yang ingin dikirim.'
      });
    }

    setSending(true);
    try {
      const res = await sendWhatsAppMessage({
        target: targetNumber,
        message: message
      });

      if (res.status) {
        toast({
          title: 'Pesan Berhasil Terkirim! 🚀',
          description: `Pesan WhatsApp berhasil dikirim ke ${targetNumber}.`
        });
        // Refresh device info untuk update kuota
        fetchDeviceStatus();
      } else {
        toast({
          variant: 'destructive',
          title: 'Gagal Mengirim Pesan',
          description: res.reason || res.detail || 'Terjadi kesalahan dari API Fonnte.'
        });
      }
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err?.message || 'Gagal mengirim pesan.'
      });
    } finally {
      setSending(false);
    }
  };

  const applyTemplate = (type: 'test' | 'litmas' | 'wajibLapor') => {
    if (type === 'test') {
      setMessage('Halo! Ini adalah pesan uji coba integrasi WhatsApp API Fonnte dengan Sistem MONALISA Bapas. Sistem bekerja secara normal.');
    } else if (type === 'litmas') {
      setMessage(
        buildLitmasAssignmentTemplate({
          namaPK: 'Ahmad Fauzi, S.H.',
          namaKlien: 'Budi Santoso',
          jenisLitmas: 'Pembebasan Bersyarat (PB)',
          nomorSurat: 'W10.PAS.PAS.1-PK.01.04-1234',
          tenggatWaktu: '7 Hari Kerja'
        })
      );
    } else if (type === 'wajibLapor') {
      setMessage(
        buildWajibLaporReminderTemplate({
          namaKlien: 'Budi Santoso',
          tanggalLapor: '15 November 2026',
          namaPK: 'Ahmad Fauzi, S.H.'
        })
      );
    }
  };

  const isConnected = deviceInfo?.device_status === 'connect';

  return (
    <div className="space-y-6">
      {/* STATUS PERANGKAT FONNTE */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold flex items-center gap-2 text-slate-800">
              <Smartphone className="w-5 h-5 text-emerald-600" />
              Status Gateway WhatsApp (Fonnte API)
            </CardTitle>
            <CardDescription>
              Status koneksi perangkat WhatsApp dan sisa kuota pengiriman pesan notifikasi sistem.
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchDeviceStatus}
            disabled={loadingDevice}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loadingDevice ? 'animate-spin' : ''}`} />
            Perbarui Status
          </Button>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
            
            {/* Status Koneksi */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
              <span className="text-xs font-medium text-slate-500 uppercase">Status Koneksi</span>
              <div className="flex items-center gap-2 mt-2">
                {isConnected ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                      Terhubung (Online)
                    </Badge>
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5 text-red-500" />
                    <Badge variant="destructive">
                      {deviceInfo?.device_status || 'Terputus'}
                    </Badge>
                  </>
                )}
              </div>
            </div>

            {/* Nama & Nomor Perangkat */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
              <span className="text-xs font-medium text-slate-500 uppercase">Perangkat & Nomor</span>
              <div className="mt-2">
                <p className="font-semibold text-slate-800">{deviceInfo?.name || 'Monalisa'}</p>
                <p className="text-xs text-slate-500 font-mono">+{deviceInfo?.device || '-'}</p>
              </div>
            </div>

            {/* Sisa Kuota Pesan */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
              <span className="text-xs font-medium text-slate-500 uppercase">Sisa Kuota Pesan</span>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-2xl font-bold text-emerald-600">
                  {typeof deviceInfo?.quota === 'number'
                    ? deviceInfo.quota.toLocaleString('id-ID')
                    : deviceInfo?.quota || '-'}
                </span>
                <span className="text-xs text-slate-500">pesan</span>
              </div>
            </div>

            {/* Masa Berlaku */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
              <span className="text-xs font-medium text-slate-500 uppercase">Masa Aktif Paket</span>
              <div className="mt-2 flex items-center gap-1.5 text-slate-700 text-sm font-medium">
                <Clock className="w-4 h-4 text-slate-400" />
                <span>{deviceInfo?.expired || 'Paket Aktif'}</span>
              </div>
            </div>

          </div>
        </CardContent>
      </Card>

      {/* FORM UJI COBA PENGIRIMAN PESAN */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Kolom Kiri: Form Kirim */}
        <div className="lg:col-span-2">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2 text-slate-800">
                <Send className="w-4 h-4 text-emerald-600" />
                Kirim Pesan WhatsApp Langsung
              </CardTitle>
              <CardDescription>
                Kirim pesan uji coba atau notifikasi manual ke nomor tujuan via gateway Fonnte.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSendTest} className="space-y-4">
                
                {/* Pilihan Template Cepat */}
                <div>
                  <Label className="text-xs text-slate-500 mb-1.5 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    Pilih Format Cepat:
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => applyTemplate('test')}
                      className="text-xs h-7"
                    >
                      Pesan Tes
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => applyTemplate('litmas')}
                      className="text-xs h-7"
                    >
                      Notifikasi Tugas Litmas
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => applyTemplate('wajibLapor')}
                      className="text-xs h-7"
                    >
                      Pengingat Wajib Lapor
                    </Button>
                  </div>
                </div>

                {/* Input Nomor Tujuan */}
                <div className="space-y-1.5">
                  <Label htmlFor="targetNumber" className="text-sm font-medium text-slate-700">
                    Nomor WhatsApp Tujuan
                  </Label>
                  <Input
                    id="targetNumber"
                    type="text"
                    placeholder="Contoh: 08123456789 atau 628123456789"
                    value={targetNumber}
                    onChange={(e) => setTargetNumber(e.target.value)}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-slate-400">
                    Bisa format 08xxx, 628xxx, atau +628xxx. Otomatis diformat standar Fonnte.
                  </p>
                </div>

                {/* Input Isi Pesan */}
                <div className="space-y-1.5">
                  <Label htmlFor="message" className="text-sm font-medium text-slate-700">
                    Isi Pesan WhatsApp
                  </Label>
                  <Textarea
                    id="message"
                    rows={6}
                    placeholder="Tulis pesan Anda di sini... (Mendukung format WhatsApp seperti *tebal*, _miring_, ~coret~)"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="text-sm"
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <Button
                    type="submit"
                    disabled={sending || !isConnected}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                  >
                    <Send className={`w-4 h-4 ${sending ? 'animate-pulse' : ''}`} />
                    {sending ? 'Mengirim Pesan...' : 'Kirim Pesan WhatsApp'}
                  </Button>
                </div>

              </form>
            </CardContent>
          </Card>
        </div>

        {/* Kolom Kanan: Panduan & Penggunaan Kode */}
        <div>
          <Card className="border-slate-200 shadow-sm h-full flex flex-col justify-between">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2 text-slate-800">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                Penggunaan di Modul Lain
              </CardTitle>
              <CardDescription>
                Fonnte service siap dipanggil dari komponen manapun di aplikasi.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 text-xs text-slate-600">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-1">
                <p className="font-semibold text-slate-700 flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-emerald-600" />
                  Import Service:
                </p>
                <pre className="p-2 bg-slate-900 text-slate-100 rounded text-[11px] overflow-x-auto">
{`import { 
  sendWhatsAppMessage 
} from '@/services/fonnte';`}
                </pre>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-1">
                <p className="font-semibold text-slate-700">Contoh Kirim Pesan:</p>
                <pre className="p-2 bg-slate-900 text-slate-100 rounded text-[11px] overflow-x-auto">
{`await sendWhatsAppMessage({
  target: '08123456789',
  message: 'Halo dari MONALISA!'
});`}
                </pre>
              </div>

              <div className="p-3 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-100">
                <p className="font-semibold mb-1">Status Keamanan:</p>
                <p className="text-[11px] leading-relaxed">
                  Token disimpan dengan aman di file <code>.env</code> dan tidak diexpose secara publik ke git repository.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}

