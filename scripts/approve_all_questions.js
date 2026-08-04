const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');

// Read .env.local
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    envVars[match[1].trim()] = match[2].trim();
  }
});

const url = envVars.NEXT_PUBLIC_SUPABASE_URL;
const key = envVars.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(url, key);

async function main() {
  console.log("Approve pending questions script running...");

  // 1. Check current count of ChoDuyet questions
  const { count: pendingCount, error: countErr } = await supabase
    .from('cau_hoi')
    .select('*', { count: 'exact', head: true })
    .eq('trang_thai_duyet', 'ChoDuyet');

  if (countErr) {
    console.error("Error counting pending questions:", countErr);
  } else {
    console.log(`Found ${pendingCount} questions in ChoDuyet status.`);
  }

  // 2. Update all ChoDuyet -> DaDuyet in cau_hoi
  const { data: updatedQuestions, error: updateErr } = await supabase
    .from('cau_hoi')
    .update({ trang_thai_duyet: 'DaDuyet' })
    .eq('trang_thai_duyet', 'ChoDuyet')
    .select('cau_hoi_id');

  if (updateErr) {
    console.error("Error updating cau_hoi:", updateErr);
  } else {
    console.log(`Successfully approved ${updatedQuestions ? updatedQuestions.length : 0} questions!`);
  }

  // 3. Update any pending yeu_cau_chinh_sua -> DaDuyet
  const { data: updatedReqs, error: reqErr } = await supabase
    .from('yeu_cau_chinh_sua')
    .update({ trang_thai: 'DaDuyet' })
    .eq('trang_thai', 'ChoDuyet')
    .select('yc_id');

  if (reqErr) {
    console.error("Error updating yeu_cau_chinh_sua:", reqErr);
  } else {
    console.log(`Successfully approved ${updatedReqs ? updatedReqs.length : 0} edit requests!`);
  }

  // 4. Verify total approved count in database
  const { count: approvedCount } = await supabase
    .from('cau_hoi')
    .select('*', { count: 'exact', head: true })
    .eq('trang_thai_duyet', 'DaDuyet');

  console.log(`Current Total Approved Questions in DB: ${approvedCount}`);
}

main();
