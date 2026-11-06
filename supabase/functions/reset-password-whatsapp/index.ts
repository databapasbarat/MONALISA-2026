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
    const { nip, newPassword } = await req.json();

    if (!nip || !newPassword) {
      return new Response(
        JSON.stringify({ error: "NIP dan password baru wajib diisi." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (newPassword.length < 6) {
      return new Response(
        JSON.stringify({ error: "Password minimal terdiri dari 6 karakter." }),
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

    // 1. Ambil data pegawai berdasarkan NIP
    const { data: employee, error: empError } = await supabaseAdmin
      .from("employees")
      .select("id, nip, nama, email, telepon, telepon_khusus")
      .eq("nip", nip.trim())
      .single();

    if (empError || !employee) {
      return new Response(
        JSON.stringify({ error: "Data pegawai tidak ditemukan." }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Ambil user mapping (relasi ke auth.users)
    const { data: userMapping, error: userError } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("employee_id", employee.id)
      .single();

    if (userError || !userMapping) {
      return new Response(
        JSON.stringify({ error: "Akun login pengguna belum dibuat untuk pegawai ini." }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Perbarui password pada auth.users menggunakan Supabase Admin API
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      userMapping.id,
      { password: newPassword }
    );

    if (updateError) {
      console.error("Gagal update password user:", updateError);
      return new Response(
        JSON.stringify({ error: "Gagal memperbarui password: " + updateError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. (Opsional) Kirim notifikasi konfirmasi ke WhatsApp pegawai bahwa password telah diganti
    const targetPhone = cleanPhoneNumber(employee.telepon || employee.telepon_khusus || "");
    if (targetPhone && fonnteToken) {
      try {
        const formData = new FormData();
        formData.append("target", targetPhone);
        formData.append(
          "message",
          `*PEMBERITAHUAN KEAMANAN AKUN - MONALISA* 🛡️\n\nHalo *${employee.nama}*,\n\nPassword akun Anda berhasil diperbarui. Anda sekarang dapat login menggunakan password baru.\n\nJika Anda tidak merasa melakukan perubahan ini, segera hubungi Administrator Bapas.\n\n_Sistem Informasi Manajemen Bapas (MONALISA)_`
        );
        formData.append("countryCode", "62");

        await fetch("https://api.fonnte.com/send", {
          method: "POST",
          headers: { Authorization: fonnteToken },
          body: formData,
        });
      } catch (waErr) {
        // Jangan gagalkan respon jika hanya notifikasi konfirmasi yang gagal
        console.warn("Gagal mengirim pesan konfirmasi WhatsApp:", waErr);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Password Anda berhasil diperbarui.",
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

