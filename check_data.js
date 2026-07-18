const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://btipqnqhqasayaigjbja.supabase.co';
const supabaseKey = 'sb_publishable_QPObDIguhCyUghEFJUCKIg_lhJuOVMV';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
  const { data: events, error } = await supabase
    .from('events')
    .select('*')
    .eq('event_type', 'guess_submitted')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('Error fetching events:', error);
    return;
  }

  const { data: sessions, error: sessionsError } = await supabase
    .from('game_sessions')
    .select('*');

  console.log(`\n--- PROOF OF ENGAGEMENT ---`);
  console.log(`Total full games finished (won/lost): ${sessions ? sessions.length : 0}`);
  
  if (events && events.length > 0) {
    console.log(`\nHere are some of the exact guesses your friends typed into the app:`);
    events.forEach(e => {
      if (e.metadata && e.metadata.guess) {
        const resultIcon = e.metadata.result === 'correct' ? '✅' : e.metadata.result === 'proche' ? '⚠️' : '❌';
        console.log(`${resultIcon} Guessed: "${e.metadata.guess}"`);
      }
    });
  } else {
    console.log('No guesses found yet.');
  }
}

checkData();
