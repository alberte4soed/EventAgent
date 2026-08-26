-- Milestones join the checklist: each one now names the area it belongs to, so
-- it heads that area's block on the Tjekliste tab. Changing defaultMilestones()
-- only affects couples who seed from here on, so backfill the ones already
-- seeded. Titles are the Danish source strings and are what is stored.
--
-- Scoped to `category is null`: the wedding-day row carries the 'wedding_day'
-- sentinel and must keep it (it drives the "Dagen" status), and a milestone the
-- couple or Ava has already categorised is theirs, not ours.
--
-- Mirrors MILESTONE_AREA in src/kalas/screens/planning/TimelineTab.tsx.

update public.timeline_tasks
set category = case title
  when 'Sæt budget & gæsteliste'        then 'okonomi'
  when 'Book venue'                     then 'venue'
  when 'Save-the-dates'                 then 'papir'
  when 'Book fotograf'                  then 'foto'
  when 'Brudekjole & jakkesæt'          then 'stil'
  when 'Florist & dekoration'           then 'stil'
  when 'Musik / DJ / band'              then 'dagen'
  when 'Kage & dessert'                 then 'mad'
  when 'Vielsesattest & jura'           then 'jura'
  when 'Endelig prøvepasning'           then 'stil'
  when 'Bordplan & menu låst'           then 'gaester'
  when 'Invitationer sendt'             then 'papir'
  when 'Koordinering med leverandører'  then 'optil'
end
where kind = 'milestone'
  and category is null
  and title in (
    'Sæt budget & gæsteliste', 'Book venue', 'Save-the-dates', 'Book fotograf',
    'Brudekjole & jakkesæt', 'Florist & dekoration', 'Musik / DJ / band',
    'Kage & dessert', 'Vielsesattest & jura', 'Endelig prøvepasning',
    'Bordplan & menu låst', 'Invitationer sendt', 'Koordinering med leverandører'
  );
