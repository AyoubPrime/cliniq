const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://btipqnqhqasayaigjbja.supabase.co';
const supabaseKey = 'sb_publishable_QPObDIguhCyUghEFJUCKIg_lhJuOVMV';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
  const { data, error } = await supabase
    .from('game_sessions')
    .select('*')
    .limit(1);
    
  console.log('sessions data:', data);
  console.log('error:', error);
}

checkData();
