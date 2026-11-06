import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

function cleanPhoneNumber(phone: string): string {
  if (!phone) return "";
  let digits = phone.replace(/[^\d]/g, "");
  if (digits.startsWith("08")) {
    digits = "628" + digits.slice(2);
  } else if (digits.startsWith("8")) {
    digits = "628" + digits.slice(1);
  }
  return digits;
}

serve(async (req) => {
  // Tangani preflight CORS request
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { nip, email, whatsapp } = await req.json();

    if (!nip || !email || !whatsapp) {
      return new Response(
        JSON.stringify({ error: "NIP, Email, dan nomor WhatsApp wajib diisi." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const fonnteToken = Deno.env.get("FONNTE_TOKEN") || "EsMBr8UNj12hDSdwQNXP";

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: "Konfigurasi server Supabase belum lengkap." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Cari data pegawai berdasarkan NIP
    const { data: employee, error: empError } = await supabaseAdmin
      .from("employees")
      .select("id, nip, nama, email, telepon, telepon_khusus")
      .eq("nip", nip.trim())
      .single();

    if (empError || !employee) {
      return new Response(
        JSON.stringify({ error: "Pegawai dengan NIP tersebut tidak ditemukan." }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Validasi kecocokan Email (case-insensitive)
    const empEmail = (employee.email || "").toLowerCase().trim();
    const inputEmail = email.toLowerCase().trim();
    if (empEmail !== inputEmail) {
      return new Response(
        JSON.stringify({ error: "Email tidak sesuai dengan data pegawai terdaftar." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Validasi nomor telepon
    const inputCleanPhone = cleanPhoneNumber(whatsapp);
    const empPhone1 = cleanPhoneNumber(employee.telepon || "");
    const empPhone2 = cleanPhoneNumber(employee.telepon_khusus || "");

    // Cek apakah nomor cocok dengan telepon atau telepon_khusus (atau 9 digit terakhir)
    const isPhoneMatch =
      inputCleanPhone === empPhone1 ||
      inputCleanPhone === empPhone2 ||
      (empPhone1 && inputCleanPhone.endsWith(empPhone1.slice(-9))) ||
      (empPhone2 && inputCleanPhone.endsWith(empPhone2.slice(-9)));

    if (!isPhoneMatch) {
      return new Response(
        JSON.stringify({ error: "Nomor WhatsApp tidak cocok dengan nomor telepon yang terdaftar pada sistem." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. Pastikan akun user login sudah dibuat untuk pegawai ini
    const { data: userMapping, error: userError } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("employee_id", employee.id)
      .single();

    if (userError || !userMapping) {
      return new Response(
        JSON.stringify({ error: "Akun pengguna untuk pegawai ini belum dibuat oleh Admin." }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 5. Generate 6 digit angka OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // 6. Kirim OTP via Fonnte WhatsApp API
    const message = `*MONALISA - VERIFIKASI LUPA PASSWORD* 🔐\n\nHalo *${employee.nama}*,\n\nKode OTP untuk mengatur ulang password akun Anda adalah:\n*${otp}*\n\nKode ini berlaku selama 5 menit. Jangan bagikan kode ini kepada siapa pun.\n\n_Sistem Informasi Manajemen Bapas (MONALISA)_`;

    const formData = new FormData();
    formData.append("target", inputCleanPhone);
    formData.append("message", message);
    formData.append("countryCode", "62");

    const fonnteRes = await fetch("https://api.fonnte.com/send", {
      method: "POST",
      headers: {
        Authorization: fonnteToken,
      },
      body: formData,
    });

    const fonnteData = await fonnteRes.json();

    if (!fonnteData.status) {
      console.error("Fonnte Send Error:", fonnteData);
      return new Response(
        JSON.stringify({
          error: "Gagal mengirim pesan WhatsApp via Fonnte: " + (fonnteData.reason || fonnteData.detail || "Kesalahan jaringan."),
        }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 7. Berhasil kirim OTP
    return new Response(
      JSON.stringify({
        success: true,
        otp: otp,
        message: "Kode OTP berhasil dikirim ke nomor WhatsApp Anda.",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Function error:", error);
    return new Response(
      JSON.stringify({ error: error?.message || "Terjadi kesalahan internal server." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

