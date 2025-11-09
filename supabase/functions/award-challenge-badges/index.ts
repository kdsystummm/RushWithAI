import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.79.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('VITE_SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find challenges that have ended but haven't been processed yet
    const { data: endedChallenges, error: challengeError } = await supabase
      .from('weekly_challenges')
      .select('id, title, end_date')
      .lt('end_date', new Date().toISOString())
      .order('end_date', { ascending: false });

    if (challengeError) throw challengeError;

    if (!endedChallenges || endedChallenges.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No completed challenges to process' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const results = [];

    for (const challenge of endedChallenges) {
      // Get all entries for this challenge, sorted by likes
      const { data: entries, error: entriesError } = await supabase
        .from('challenge_entries')
        .select('user_id, likes, entry_text')
        .eq('challenge_id', challenge.id)
        .order('likes', { ascending: false })
        .limit(3);

      if (entriesError) {
        console.error(`Error fetching entries for challenge ${challenge.id}:`, entriesError);
        continue;
      }

      if (!entries || entries.length === 0) {
        results.push({ challengeId: challenge.id, message: 'No entries found' });
        continue;
      }

      // Award badges to top performers
      const badgesAwarded = [];

      for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];
        const { data: user, error: userError } = await supabase
          .from('users')
          .select('badges')
          .eq('id', entry.user_id)
          .single();

        if (userError || !user) continue;

        const currentBadges = (user.badges as string[]) || [];
        let newBadges = [...currentBadges];
        let badgesAdded = [];

        // Award weekly_winner to the top entry
        if (i === 0 && !currentBadges.includes('weekly_winner')) {
          newBadges.push('weekly_winner');
          badgesAdded.push('weekly_winner');
        }

        // Award top_contributor to top 3
        if (i < 3 && !currentBadges.includes('top_contributor')) {
          newBadges.push('top_contributor');
          badgesAdded.push('top_contributor');
        }

        // Update user badges if new badges were added
        if (badgesAdded.length > 0) {
          const { error: updateError } = await supabase
            .from('users')
            .update({ badges: newBadges })
            .eq('id', entry.user_id);

          if (!updateError) {
            badgesAwarded.push({
              userId: entry.user_id,
              badges: badgesAdded,
              position: i + 1,
            });
          }
        }
      }

      results.push({
        challengeId: challenge.id,
        challengeTitle: challenge.title,
        badgesAwarded,
      });
    }

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in award-challenge-badges:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
