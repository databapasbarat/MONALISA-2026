/**
 * Service integrasi WhatsApp API Fonnte untuk Sistem MONALISA Bapas
 */

const FONNTE_API_URL = import.meta.env.VITE_FONNTE_API_URL || 'https://api.fonnte.com';
const FONNTE_TOKEN = import.meta.env.VITE_FONNTE_TOKEN || '';

export interface FonnteDeviceStatus {
  status: boolean;
  name?: string;
  device?: string;
  device_status?: 'connect' | 'disconnect' | string;
  expired?: string;
  messages?: number;
  quota?: string | number;
  package?: string;
  reason?: string;
}

export interface SendWhatsAppParams {
  /** Nomor tujuan, bisa diawali 08, 628, atau +628. Pisahkan koma untuk banyak nomor */
  target: string;
  /** Isi pesan teks WhatsApp */
  message: string;
  /** Kode negara (default: '62') */
  countryCode?: string;
  /** URL file jika ingin melampirkan gambar/dokumen/PDF */
  url?: string;
  /** Nama file lampiran (misal: Surat_Tugas.pdf) */
  filename?: string;
  /** Delay pengiriman dalam detik */
  delay?: number;
}

export interface FonnteResponse {
  status: boolean;
  target?: string[];
  id?: string[];
  detail?: string;
  reason?: string;
  process?: string;
}

/**
 * Format nomor telepon Indonesia menjadi format internasional standar WhatsApp (628xxx)
 */
export function formatWhatsAppNumber(phone: string): string {
  if (!phone) return '';
  // Hapus karakter non-digit kecuali koma (untuk pemisah target multiple)
  let cleaned = phone.replace(/[^\d,]/g, '');

  // Jika terdapat koma (multiple numbers), format masing-masing
  if (cleaned.includes(',')) {
    return cleaned
      .split(',')
      .map((p) => formatWhatsAppNumber(p.trim()))
      .filter(Boolean)
      .join(',');
  }

  // Jika diawali 08, ganti jadi 628
  if (cleaned.startsWith('08')) {
    cleaned = '62' + cleaned.slice(1);
  }
  // Jika diawali 8 tanpa 0 atau 62, tambahkan 62
  else if (cleaned.startsWith('8')) {
    cleaned = '62' + cleaned;
  }

  return cleaned;
}

/**
 * Mendapatkan status perangkat WhatsApp yang terhubung di Fonnte
 */
export async function getFonnteDeviceStatus(token = FONNTE_TOKEN): Promise<FonnteDeviceStatus> {
  if (!token) {
    return {
      status: false,
      reason: 'Token Fonnte belum dikonfigurasi (VITE_FONNTE_TOKEN).'
    };
  }

  try {
    const response = await fetch(`${FONNTE_API_URL}/device`, {
      method: 'POST',
      headers: {
        Authorization: token
      }
    });

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error('Error checking Fonnte device status:', error);
    return {
      status: false,
      reason: error?.message || 'Gagal terhubung ke server Fonnte.'
    };
  }
}

/**
 * Mengirim pesan WhatsApp melalui API Fonnte
 */
export async function sendWhatsAppMessage({
  target,
  message,
  countryCode = '62',
  url,
  filename,
  delay = 0
}: SendWhatsAppParams): Promise<FonnteResponse> {
  const token = FONNTE_TOKEN;
  if (!token) {
    throw new Error('VITE_FONNTE_TOKEN belum dikonfigurasi di file .env');
  }

  const formattedTarget = formatWhatsAppNumber(target);
  if (!formattedTarget) {
    throw new Error('Nomor telepon tujuan tidak valid.');
  }

  const formData = new FormData();
  formData.append('target', formattedTarget);
  formData.append('message', message);
  formData.append('countryCode', countryCode);

  if (url) {
    formData.append('url', url);
  }
  if (filename) {
    formData.append('filename', filename);
  }
  if (delay > 0) {
    formData.append('delay', String(delay));
  }

  try {
    const response = await fetch(`${FONNTE_API_URL}/send`, {
      method: 'POST',
      headers: {
        Authorization: token
      },
      body: formData
    });

    const result = await response.json();
    return result;
  } catch (error: any) {
    console.error('Error sending WhatsApp via Fonnte:', error);
    return {
      status: false,
      reason: error?.message || 'Gagal mengirim pesan WhatsApp.'
    };
  }
}

/**
 * Template notifikasi penunjukan PK untuk Litmas
 */
export function buildLitmasAssignmentTemplate({
  namaPK,
  namaKlien,
  jenisLitmas,
  nomorSurat,
  tenggatWaktu
}: {
  namaPK: string;
  namaKlien: string;
  jenisLitmas: string;
  nomorSurat: string;
  tenggatWaktu?: string;
}): string {
  return `*PEMBERITAHUAN TUGAS LITMAS - BAPAS* 📋
Halo Bapak/Ibu *${namaPK}*,

Anda telah ditugaskan untuk melaksanakan Penelitian Kemasyarakatan (Litmas) dengan rincian:
• *Nama Klien*: ${namaKlien}
• *Jenis Litmas*: ${jenisLitmas}
• *No. Surat Permintaan*: ${nomorSurat}
${tenggatWaktu ? `• *Tenggat Waktu*: ${tenggatWaktu}\n` : ''}
Silakan login ke aplikasi MONALISA untuk mengunduh surat tugas dan memperbarui status pelaksanaan tugas.

Terima kasih.
_Sistem Informasi Manajemen Bapas (MONALISA)_`;
}

/**
 * Template pengingat wajib lapor untuk klien
 */
export function buildWajibLaporReminderTemplate({
  namaKlien,
  tanggalLapor,
  namaPK
}: {
  namaKlien: string;
  tanggalLapor: string;
  namaPK?: string;
}): string {
  return `*PENGINGAT WAJIB LAPOR BAPAS* 🏛️
Halo Saudara/i *${namaKlien}*,

Kami mengingatkan jadwal Wajib Lapor berkala Anda pada:
📅 *Tanggal*: ${tanggalLapor}
${namaPK ? `👤 *Pembimbing Kemasyarakatan*: ${namaPK}\n` : ''}
Harap melakukan pelaporan tepat waktu melalui aplikasi atau hadir langsung di kantor Bapas.

Tetap semangat dan jaga kepatuhan hukum.
_Sistem Informasi Manajemen Bapas (MONALISA)_`;
}

