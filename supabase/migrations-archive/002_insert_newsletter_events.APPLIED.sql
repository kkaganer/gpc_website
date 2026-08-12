-- Insert events from the 27 Mar 2026 newsletter into london_events
-- All events are pre-approved (approved = true) and sourced from 'newsletter'

INSERT INTO london_events (title, date, time, location, area, description, url, source, category, age_range, price, is_free, approved) VALUES

-- This Week
('Astronomers Take Over', '2026-03-27', NULL, 'National Maritime Museum, SE10 9NF', 'Greenwich', 'Brand-new interactive experience perfect for space fans', 'https://www.rmg.co.uk', 'newsletter', 'Family', '4+', 'From £8', false, true),

('Telegraph Hill Play Club Easter Funday', '2026-03-27', '9:15am-12:30pm', 'Telegraph Hill, SE14 5JT', 'Lewisham', 'Free entry, Easter Bunny, bouncy castle, cakes, face painting. £3.50 for egg hunt.', NULL, 'newsletter', 'Family', NULL, 'Free entry, £3.50 egg hunt', false, true),

('Easter Egg Hunt - The Working Mums Club', '2026-03-27', '10am (0-3 years), 3:45pm (4-8 years)', 'Unit B, 60-66 Crossfield St', 'Greenwich', 'Purchase a hot drink to receive a basket', NULL, 'newsletter', 'Family', '0-8', NULL, false, true),

('Bring Baby Drag Bingo', '2026-03-27', '12:45pm', 'Old Brewery Greenwich', 'Greenwich', 'Bunny girl! Pre-walkers welcome.', NULL, 'newsletter', 'Music', 'Pre-walkers', '£16.50', false, true),

('How to Tame a Mummy Monster', '2026-03-28', '10am', 'Deptford Lounge, SE8 4RH', 'Lewisham', 'Rochelle Falconer leads an interactive read-and-draw-along!', NULL, 'newsletter', 'Arts', '4-6', 'Free', true, true),

('Royal Arsenal Easter Market', '2026-03-28', '10am-3pm', 'Artillery Square, SE18 4DX', 'Greenwich', 'Free Easter Fun Trail, Stretto Jazz Band, farm animals, Boppin'' Bunnies', NULL, 'newsletter', 'Family', NULL, 'Free', true, true),

('Beatrice the Amazing Astronaut Returns', '2026-03-28', '2pm', 'Blackheath Halls, 23 Lee Rd, SE3 9RQ', 'Greenwich', 'A musical adventure for the whole family', NULL, 'newsletter', 'Music', '3-9', '£12', false, true),

('The Marvellous Myth Hunter and The Magical Market', '2026-03-28', '2:30pm', 'Deptford Lounge, SE8 4RH', 'Lewisham', '60 minute interactive show', NULL, 'newsletter', 'Arts', '6-12', 'Free', true, true),

('Easter Quest - Eltham Palace', '2026-03-28', NULL, 'Eltham Palace, Court Yard, SE9 5NP', 'Greenwich', 'Every day throughout the school holidays, 28 Mar - 19 April', NULL, 'newsletter', 'Family', NULL, '£2 with entry ticket', false, true),

('Easter Activities - National Maritime Museum', '2026-03-29', NULL, 'National Maritime Museum, SE10 9NF', 'Greenwich', 'Crafts, SEND activities, history learning, Windrush food plates and more. 29 Mar - 8 Apr.', NULL, 'newsletter', 'Arts', NULL, 'Free', true, true),

('Easter Trail 2026 - Charlton House', '2026-03-29', '11am-3pm', 'Charlton House, SE7 8RE', 'Greenwich', 'Games and activities inspired by Alice in Wonderland', NULL, 'newsletter', 'Family', NULL, '£3 suggested donation', false, true),

('The Cat in the Hat - Greenwich Theatre', '2026-03-28', NULL, 'Greenwich Theatre, Crooms Hill, SE10 8ES', 'Greenwich', 'Stage adaptation of Dr Seuss'' The Cat In The Hat. 28 & 29 Mar.', NULL, 'newsletter', 'Arts', '3+', 'From £15.50', false, true),

('The Wiggles - Tree of Wisdom', '2026-03-28', '4pm', 'ExCel London', 'Greenwich', 'Big show arena spectacular. 28 & 29 Mar.', NULL, 'newsletter', 'Music', NULL, 'From £29', false, true),

('Arts & Crafts Easter Party - The Forum', '2026-03-31', '10am-12:30pm', 'The Forum, Trafalgar Rd, SE10 9EQ', 'Greenwich', 'Lunch box, bouncy castle, scavenger hunt', NULL, 'newsletter', 'Arts', NULL, '£12', false, true),

('Boppin'' Bunnies Music Across the Generations', '2026-04-01', '10am', 'Prince George Duke of Kent Court, Chislehurst', 'Bromley', 'Music connects all ages', NULL, 'newsletter', 'Music', '0-5', '£6-12', false, true),

('Quaggy Stay & Play', '2026-04-01', '1:30-3pm', 'Orchard Hill, SE13 7QZ', 'Lewisham', 'Drop-in stay and play session', NULL, 'newsletter', 'Family', '0-4', '£1', false, true),

('Zippos Circus - Blackheath', '2026-04-01', NULL, 'Blackheath, SE3 0UA', 'Greenwich', 'Zippos Circus. 1-13 Apr.', NULL, 'newsletter', 'Arts', NULL, 'From £9.99', false, true),

('Easter Event - Charlton Family Centre', '2026-04-02', '9:30am & 10:45am', '41-43 Shirley House Drive', 'Greenwich', 'Laugh, sing and play will return for an Easter Celebration', NULL, 'newsletter', 'Family', NULL, '£1', false, true),

('Luminarium - Woolwich Works', '2026-04-02', NULL, 'Woolwich Works, SE18 6HD', 'Greenwich', 'Myriad, a spectacular walk-through installation of light, colour, and calm. 2-6 Apr.', NULL, 'newsletter', 'Arts', NULL, 'From £8', false, true),

('Out of the Box - Woolwich Works', '2026-04-02', NULL, 'Woolwich Works, SE18 6HD', 'Greenwich', 'Award-winning family comedy show held inside the Luminarium', NULL, 'newsletter', 'Arts', '3+', '£15.50', false, true),

-- Coming up
('Easter Egg Hunt - Your Balloon Buddy & GPC', '2026-04-04', '11:30am-2:30pm', 'Blackheath Wanderers Sports Club, 63 Eltham Rd, SE12 8HQ', 'Greenwich', 'Stalls, games, bouncy castle, soft play, and the Easter Bunny! Every child goes home with an Easter egg. Raising funds for BPAN.', NULL, 'newsletter', 'Family', NULL, '£2 Child', false, true),

('Easter Festival - Davy''s of Greenwich', '2026-04-04', NULL, '161 Greenwich High Rd, SE10 8JA', 'Greenwich', 'Live music, artisan pizzas, face painting, kids eat free. 4-6 Apr.', NULL, 'newsletter', 'Food', NULL, NULL, false, true),

('Easter Egg Hunt - Mycenae House', '2026-04-04', '1:30-3:30pm', 'Mycenae House, 90 Mycenae Road, SE3 7SE', 'Greenwich', 'The Westcombe Society''s annual egg hunt returns', NULL, 'newsletter', 'Family', NULL, '£2.50', false, true),

('Baby Yoga - Woolwich Works', '2026-04-06', NULL, 'Woolwich Works, SE18 6HD', 'Greenwich', 'Inside the meditative, transformative world of the Luminarium', NULL, 'newsletter', 'Family', 'Pre-Crawlers', '£18.50', false, true),

('Greenwich Park - Family Nature Discovery Day', '2026-04-07', '10am-3pm', 'Greenwich Park', 'Greenwich', 'Join our expert learning team in exciting nature-inspired activities', NULL, 'newsletter', 'Outdoor', NULL, '£5', false, true),

('All Saints Church Blackheath - Children''s Choir', '2026-04-01', '5:15-6:15pm', 'All Saints Dr, SE3 0TY', 'Greenwich', 'Does your child like to sing? Join the choir! Wednesdays.', NULL, 'newsletter', 'Music', '3-7', 'Free', true, true),

('Boppin'' Bunnies Easter Music Party - Eltham', '2026-04-11', '10:15am', 'The Sky Bar, SE9 1BJ', 'Greenwich', 'Songs, giggles and plenty of music', NULL, 'newsletter', 'Music', '0-5', '£6-12', false, true),

('Tiny Tides Peninsula - Under 5 Social Club', '2026-04-17', '10:30am', 'Firepit Art Gallery', 'Greenwich', 'Relaxed welcoming space for babies, toddlers and their grown ups. Also 24 Apr.', NULL, 'newsletter', 'Family', 'Under 5', 'Free', true, true),

('The Princess and the Pea', '2026-04-10', '1pm & 3pm', 'Mycenae House', 'Greenwich', 'The Let''s All Dance Ballet Company is back with this fresh, funny show. Great for 2-12 year olds and families. Photo opportunity with the dancers after both performances!', NULL, 'newsletter', 'Arts', '2-12', NULL, false, true),

-- Further to travel
('Eggstravaganza: Easter Family Festival', '2026-03-29', '9am-4pm', 'Dulwich Picture Gallery, SE21 7AD', 'Southwark', 'Free event with ticketed special activities', NULL, 'newsletter', 'Family', NULL, 'Free', true, true),

('POP-KID Family Dance Party', '2026-03-29', '12pm', 'Somerset House, WC2R 1LA', 'Central London', 'Mascots, face painting, and dance games!', NULL, 'newsletter', 'Music', NULL, '£8 Child, £14 Adult', false, true),

('Lego Easter Fun - Battersea Power Station', '2026-04-01', NULL, 'Battersea Power Station, SW11 8DD', 'Central London', 'Create an Easter design to fit on the LEGO mural within the pop-up. 1-4 Apr.', NULL, 'newsletter', 'Arts', NULL, 'Free', true, true),

('Your Toys - Unicorn Theatre', '2026-04-01', NULL, 'Unicorn Theatre, 147 Tooley St, SE1 2HZ', 'Southwark', 'Your toy becomes part of the show! Until 12 Apr.', NULL, 'newsletter', 'Arts', '5-9', 'From £15.50', false, true),

('UNIQLO Tate Play Make Studio: Memory', '2026-03-28', NULL, 'Tate Modern, Bankside, SE1 9TG', 'Southwark', 'Explore memories through playing and creating. Weds, Sat & Sun until 22 July.', NULL, 'newsletter', 'Arts', NULL, 'Free', true, true),

('Cleopatra: The Experience', '2026-03-28', NULL, 'Immerse LDN, ExCel, E16 1XL', 'Greenwich', 'Journey through the life of Egypt''s last great queen. Until 12 Jul.', NULL, 'newsletter', 'Family', NULL, 'Under 4 Free, From £24', false, true),

-- Regular activities
('Telegraph Hill Playclub', '2026-03-27', '9:15am', 'Telegraph Hill, SE14 5JT', 'Lewisham', 'Free weekday playclub. Term-time only, please check before travelling.', NULL, 'newsletter', 'Family', NULL, 'Free', true, true),

('Exercise to Music - Feel Good Fridays', '2026-03-27', '1-2pm', 'Charlton', 'Greenwich', 'Free exercise to music session', NULL, 'newsletter', 'Sports', NULL, 'Free', true, true),

('Rhyme Time - Age Exchange Blackheath', '2026-03-30', '2pm', 'Age Exchange, Blackheath', 'Greenwich', 'Free rhyme time session. Mondays.', NULL, 'newsletter', 'Music', NULL, 'Free', true, true),

('GPC Monday Coffee Meet-up', '2026-03-30', '2pm', 'National Maritime Museum, SE10 9NF', 'Greenwich', 'Bring your little ones and join us for a friendly meet-up', NULL, 'newsletter', 'Family', NULL, 'Free', true, true),

('GPC Blackheath Parents/Carers Meet-up', '2026-03-27', '1:45pm', 'Prince of Wales Pub, Blackheath', 'Greenwich', 'Come for a friendly chat. Fridays. Contact Sharon 07930524747', NULL, 'newsletter', 'Family', NULL, 'Free', true, true);
