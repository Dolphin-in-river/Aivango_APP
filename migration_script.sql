-- Очистка всех таблиц (для теста с нуля)
DELETE FROM votes;
DELETE FROM prize_distributions;
DELETE FROM fight_histories;
DELETE FROM tickets;
DELETE FROM sponsorships;
DELETE FROM user_tournament_roles;
DELETE FROM application;
DELETE FROM location_tournament;
DELETE FROM tournament;
DELETE FROM location;
DELETE FROM user_profiles;
DELETE FROM email;
DELETE FROM user_account;

-- 1. Заполнение user_account (пользователи)
INSERT INTO user_account (id, email, name, second_name, is_organizer) VALUES (1, 'sputnik5761@gmail.com', 'Админ', 'Организатор', true);
INSERT INTO user_account (id, email, name, second_name, is_organizer) VALUES (2, 'wiw098765@gmail.com', 'Рыцарь', 'Один', false);
INSERT INTO user_account (id, email, name, second_name, is_organizer) VALUES (3, 'knight2@gmail.com', 'Рыцарь', 'Два',  false);
INSERT INTO user_account (id, email, name, second_name, is_organizer) VALUES (4, 'knight3@gmail.com', 'Рыцарь', 'Три', false);
INSERT INTO user_account (id, email, name, second_name, is_organizer) VALUES (5, 'knight4@gmail.com', 'Рыцарь', 'Четыре', false);
INSERT INTO user_account (id, email, name, second_name, is_organizer) VALUES (6, 'ivan.hryakow@gmail.com', 'Зритель', 'Один', false);
INSERT INTO user_account (id, email, name, second_name, is_organizer) VALUES (7, 'spectator2@gmail.com', 'Зритель', 'Два', false);
INSERT INTO user_account (id, email, name, second_name, is_organizer) VALUES (8, 'owenua3@gmail.com', 'Спонсор', 'Компания', false);
INSERT INTO user_account (id, email, name, second_name, is_organizer) VALUES (9, 'mixed@gmail.com', 'Микс', 'Роли', false); -- пользователь с несколькими ролями

-- 2. Заполнение user_profiles (профили для всех пользователей)
INSERT INTO user_profiles (id, birth_date, coat_of_arms_path, first_name, height, last_name, motivation, weight, user_id) VALUES (1, '1980-01-01', null, 'Админ', null, 'Организатор', null, null, 1);
INSERT INTO user_profiles (id, birth_date, coat_of_arms_path, first_name, height, last_name, motivation, weight, user_id) VALUES (2, '1990-02-02', '/uploads/coa/knight1.png', 'Рыцарь', 180, 'Один', 'Победа любой ценой', 85, 2);
INSERT INTO user_profiles (id, birth_date, coat_of_arms_path, first_name, height, last_name, motivation, weight, user_id) VALUES (3, '1992-03-03', '/uploads/coa/knight2.png', 'Рыцарь', 175, 'Два', 'За честь и славу', 80, 3);
INSERT INTO user_profiles (id, birth_date, coat_of_arms_path, first_name, height, last_name, motivation, weight, user_id) VALUES (4, '1988-04-04', '/uploads/coa/knight3.png', 'Рыцарь', 190, 'Три', 'Тестирование силы', 95, 4);
INSERT INTO user_profiles (id, birth_date, coat_of_arms_path, first_name, height, last_name, motivation, weight, user_id) VALUES (5, '1995-05-05', '/uploads/coa/knight4.png', 'Рыцарь', 185, 'Четыре', 'Для опыта', 90, 5);
INSERT INTO user_profiles (id, birth_date, coat_of_arms_path, first_name, height, last_name, motivation, weight, user_id) VALUES (6, '2000-06-06', null, 'Зритель', null, 'Один', null, null, 6);
INSERT INTO user_profiles (id, birth_date, coat_of_arms_path, first_name, height, last_name, motivation, weight, user_id) VALUES (7, '1998-07-07', null, 'Зритель', null, 'Два', null, null, 7);
INSERT INTO user_profiles (id, birth_date, coat_of_arms_path, first_name, height, last_name, motivation, weight, user_id) VALUES (8, '1985-08-08', null, 'Спонсор', null, 'Компания', null, null, 8);
INSERT INTO user_profiles (id, birth_date, coat_of_arms_path, first_name, height, last_name, motivation, weight, user_id) VALUES (9, '1993-09-09', '/uploads/coa/mixed.png', 'Микс', 178, 'Роли', 'Разнообразие', 82, 9);

-- 3. Заполнение location (локации)
INSERT INTO location (id, address, name) VALUES (1, 'London, 1', 'London');
INSERT INTO location (id, address, name) VALUES (2, 'New York, 1', 'New York');
INSERT INTO location (id, address, name) VALUES (3, 'Paris, 1', 'Paris');
INSERT INTO location (id, address, name) VALUES (4, 'Tokyo, 1', 'Tokyo');
INSERT INTO location (id, address, name) VALUES (5, 'Sydney, 1', 'Sydney');
INSERT INTO location (id, address, name) VALUES (6, 'Berlin, 1', 'Berlin');
INSERT INTO location (id, address, name) VALUES (7, 'Moscow, 1', 'Moscow');
INSERT INTO location (id, address, name) VALUES (8, 'Rio de Janeiro, 1', 'Rio de Janeiro');
INSERT INTO location (id, address, name) VALUES (9, 'Cape Town, 1', 'Cape Town');
INSERT INTO location (id, address, name) VALUES (10, 'Toronto, 1', 'Toronto');

-- 4. Заполнение tournament (турниры в разных статусах)
INSERT INTO tournament (id, description, name, prize_percent_num, required_amount, tournament_status, final_location_id, user_account_id, total_seats, event_date, required_knights) VALUES (1, 'Турнир в ожидании спонсоров', 'Ожидающий', 50, 10000, 0, null, 1, 100, '2026-01-10', 4);
INSERT INTO tournament (id, description, name, prize_percent_num, required_amount, tournament_status, final_location_id, user_account_id, total_seats, event_date, required_knights) VALUES (2, 'Регистрация рыцарей', 'Регистрация', 40, 15000, 1, null, 1, 150, '2026-01-15', 8);
INSERT INTO tournament (id, description, name, prize_percent_num, required_amount, tournament_status, final_location_id, user_account_id, total_seats, event_date, required_knights) VALUES (3, 'Продажа билетов', 'Продажа', 60, 20000, 2, 3, 1, 200, '2026-01-20', 4);
INSERT INTO tournament (id, description, name, prize_percent_num, required_amount, tournament_status, final_location_id, user_account_id, total_seats, event_date, required_knights) VALUES (4, 'Активный турнир с 4 рыцарями', 'Активный', 55, 25000, 3, 4, 1, 250, '2026-01-25', 4);
INSERT INTO tournament (id, description, name, prize_percent_num, required_amount, tournament_status, final_location_id, user_account_id, total_seats, event_date, required_knights) VALUES (5, 'Завершённый турнир', 'Завершённый', 45, 30000, 4, 5, 1, 300, '2026-01-30', 8);

-- 5. Заполнение location_tournament (связи локаций)
INSERT INTO location_tournament (id, location_id, tournament_id) VALUES (1, 1, 1);
INSERT INTO location_tournament (id, location_id, tournament_id) VALUES (2, 2, 1);
INSERT INTO location_tournament (id, location_id, tournament_id) VALUES (3, 3, 2);
INSERT INTO location_tournament (id, location_id, tournament_id) VALUES (4, 4, 2);
INSERT INTO location_tournament (id, location_id, tournament_id) VALUES (5, 5, 3);
INSERT INTO location_tournament (id, location_id, tournament_id) VALUES (6, 6, 3);
INSERT INTO location_tournament (id, location_id, tournament_id) VALUES (7, 7, 4);
INSERT INTO location_tournament (id, location_id, tournament_id) VALUES (8, 8, 4);
INSERT INTO location_tournament (id, location_id, tournament_id) VALUES (9, 9, 5);
INSERT INTO location_tournament (id, location_id, tournament_id) VALUES (10, 10, 5);

-- 6. Заполнение application (заявки рыцарей)
INSERT INTO application (id, created_at, status, knight_id, tournament_id, comment) VALUES (1, '2026-01-01 12:00:00', 0, 2, 4, 'Одобрено');
INSERT INTO application (id, created_at, status, knight_id, tournament_id, comment) VALUES (2, '2026-01-02 12:00:00', 0, 3, 4, 'Одобрено');
INSERT INTO application (id, created_at, status, knight_id, tournament_id, comment) VALUES (3, '2026-01-03 12:00:00', 0, 4, 4, 'Одобрено');
INSERT INTO application (id, created_at, status, knight_id, tournament_id, comment) VALUES (4, '2026-01-04 12:00:00', 0, 5, 4, 'Одобрено');
INSERT INTO application (id, created_at, status, knight_id, tournament_id, comment) VALUES (5, '2026-01-05 12:00:00', 2, 2, 2, 'В обработке');
INSERT INTO application (id, created_at, status, knight_id, tournament_id, comment) VALUES (6, '2026-01-06 12:00:00', 1, 3, 5, 'Отклонено');

-- 7. Заполнение user_tournament_roles (роли)
INSERT INTO user_tournament_roles (id, role, tournament_id, user_id) VALUES (1, 'ORGANIZER', 1, 1);
INSERT INTO user_tournament_roles (id, role, tournament_id, user_id) VALUES (2, 'ORGANIZER', 2, 1);
INSERT INTO user_tournament_roles (id, role, tournament_id, user_id) VALUES (3, 'ORGANIZER', 3, 1);
INSERT INTO user_tournament_roles (id, role, tournament_id, user_id) VALUES (4, 'ORGANIZER', 4, 1);
INSERT INTO user_tournament_roles (id, role, tournament_id, user_id) VALUES (5, 'ORGANIZER', 5, 1);
INSERT INTO user_tournament_roles (id, role, tournament_id, user_id) VALUES (6, 'KNIGHT', 4, 2);
INSERT INTO user_tournament_roles (id, role, tournament_id, user_id) VALUES (7, 'KNIGHT', 4, 3);
INSERT INTO user_tournament_roles (id, role, tournament_id, user_id) VALUES (8, 'KNIGHT', 4, 4);
INSERT INTO user_tournament_roles (id, role, tournament_id, user_id) VALUES (9, 'KNIGHT', 4, 5);
INSERT INTO user_tournament_roles (id, role, tournament_id, user_id) VALUES (10, 'SPECTATOR', 3, 6);
INSERT INTO user_tournament_roles (id, role, tournament_id, user_id) VALUES (11, 'SPECTATOR', 3, 7);
INSERT INTO user_tournament_roles (id, role, tournament_id, user_id) VALUES (13, 'KNIGHT', 5, 9);
INSERT INTO user_tournament_roles (id, role, tournament_id, user_id) VALUES (14, 'SPECTATOR', 5, 9); -- смешанная роль
INSERT INTO user_tournament_roles (id, role, tournament_id, user_id) VALUES (15, 'SPONSOR', 1, 8);
INSERT INTO user_tournament_roles (id, role, tournament_id, user_id) VALUES (16, 'SPONSOR', 4, 9);
INSERT INTO user_tournament_roles (id, role, tournament_id, user_id) VALUES (17, 'SPONSOR', 4, 8);
INSERT INTO user_tournament_roles (id, role, tournament_id, user_id) VALUES (18, 'SPONSOR', 5, 8);
INSERT INTO user_tournament_roles (id, role, tournament_id, user_id) VALUES (19, 'SPECTATOR', 4, 7);

-- 8. Заполнение tickets (билеты для зрителей)
INSERT INTO tickets (id, booking_code, confirmed, created_at, seats_count, tournament_id, user_id) VALUES (1, 'BOOK-001', true, '2026-01-10 12:00:00', 2, 3, 6);
INSERT INTO tickets (id, booking_code, confirmed, created_at, seats_count, tournament_id, user_id) VALUES (2, 'BOOK-002', true, '2026-01-11 12:00:00', 1, 3, 7);
INSERT INTO tickets (id, booking_code, confirmed, created_at, seats_count, tournament_id, user_id) VALUES (3, 'BOOK-001', true, '2026-01-10 12:00:00', 2, 4, 6);
INSERT INTO tickets (id, booking_code, confirmed, created_at, seats_count, tournament_id, user_id) VALUES (4, 'BOOK-002', true, '2026-01-11 12:00:00', 1, 4, 7);
INSERT INTO tickets (id, booking_code, confirmed, created_at, seats_count, tournament_id, user_id) VALUES (5, 'BOOK-003', false, '2026-01-12 12:00:00', 3, 5, 9);

-- 9. Заполнение sponsorships (взносы спонсоров)
INSERT INTO sponsorships (id, amount, company_name, created_at, logo_path, package_type, status, sponsor_id, tournament_id) VALUES (1, 10000.0, 'Спонсор Corp', '2026-01-05 12:00:00', null, 'GOLD', 'CONFIRMED', 8, 1);
INSERT INTO sponsorships (id, amount, company_name, created_at, logo_path, package_type, status, sponsor_id, tournament_id) VALUES (2, 15000.0, 'Микс Corp', '2026-01-06 12:00:00', null, 'PLATINUM', 'CONFIRMED', 9, 5);
INSERT INTO sponsorships (id, amount, company_name, created_at, logo_path, package_type, status, sponsor_id, tournament_id) VALUES (3, 10000.0, 'Andrew Corp', '2026-01-05 12:00:00', null, 'GOLD', 'CONFIRMED', 8, 4);
INSERT INTO sponsorships (id, amount, company_name, created_at, logo_path, package_type, status, sponsor_id, tournament_id) VALUES (4, 15000.0, 'George Corp', '2026-01-06 12:00:00', null, 'PLATINUM', 'CONFIRMED', 9, 4);

-- 10. Заполнение votes (голоса для активного турнира)
INSERT INTO votes (id, vote_date, tournament_id, voted_for_id, voter_id) VALUES (1, '2026-01-21 12:00:00', 4, 2, 7);

-- 11. Заполнение fight_histories (сетка для активного турнира ID 4 с 4 рыцарями)
-- 1/2 (семифинал)
INSERT INTO fight_histories (id, comment, fight_date, next_match_id, round, fighter1_id, fighter2_id, tournament_id, winner_id) VALUES (1, null, '2026-01-25 14:00:00', 4, 'SEMIFINAL', 2, 3, 4, null);
INSERT INTO fight_histories (id, comment, fight_date, next_match_id, round, fighter1_id, fighter2_id, tournament_id, winner_id) VALUES (2, null, '2026-01-25 15:00:00', 4, 'SEMIFINAL', 4, 5, 4, null);
-- Бронза
INSERT INTO fight_histories (id, comment, fight_date, next_match_id, round, fighter1_id, fighter2_id, tournament_id, winner_id) VALUES (3, 'Бой за 3-е место', '2026-01-26 14:00:00', null, 'BRONZE', null, null, 4, null);
-- Финал
INSERT INTO fight_histories (id, comment, fight_date, next_match_id, round, fighter1_id, fighter2_id, tournament_id, winner_id) VALUES (4, null, '2026-01-26 16:00:00', null, 'FINAL', null, null, 4, null);

-- 12. Заполнение prize_distributions (призы для завершённого турнира ID 5)
INSERT INTO public.prize_distributions (id, amount, calculated_at, place, knight_id, tournament_id) VALUES (1, 10000.00, '2026-01-30 18:00:00', '1st', 2, 5);
INSERT INTO public.prize_distributions (id, amount, calculated_at, place, knight_id, tournament_id) VALUES (2, 5000.00, '2026-01-30 18:00:00', '2nd', 3, 5);
INSERT INTO public.prize_distributions (id, amount, calculated_at, place, knight_id, tournament_id) VALUES (3, 3000.00, '2026-01-30 18:00:00', '3rd', 4, 5);
INSERT INTO public.prize_distributions (id, amount, calculated_at, place, knight_id, tournament_id) VALUES (4, 2000.00, '2026-01-30 18:00:00', 'sympathy', 5, 5);

-- 13. Заполнение email (хэшированные emails)
INSERT INTO email (id, hashed_email, hashed_token, local_date_time) VALUES (1, 'sputnik5761@gmail.com', '$2a$10$exampleHash1', '2026-01-01 12:00:00');
INSERT INTO email (id, hashed_email, hashed_token, local_date_time) VALUES (2, 'wiw098765@gmail.com', '$2a$10$exampleHash2', '2026-01-02 12:00:00');
INSERT INTO email (id, hashed_email, hashed_token, local_date_time) VALUES (3, 'knight2@gmail.com', '$2a$10$exampleHash3', '2026-01-03 12:00:00');
INSERT INTO email (id, hashed_email, hashed_token, local_date_time) VALUES (4, 'knight3@gmail.com', '$2a$10$exampleHash4', '2026-01-04 12:00:00');
INSERT INTO email (id, hashed_email, hashed_token, local_date_time) VALUES (5, 'knight4@gmail.com', '$2a$10$exampleHash5', '2026-01-05 12:00:00');
INSERT INTO email (id, hashed_email, hashed_token, local_date_time) VALUES (6, 'ivan.hryakow@gmail.com', '$2a$10$exampleHash6', '2026-01-06 12:00:00');
INSERT INTO email (id, hashed_email, hashed_token, local_date_time) VALUES (7, 'spectator2@gmail.com', '$2a$10$exampleHash7', '2026-01-07 12:00:00');
INSERT INTO email (id, hashed_email, hashed_token, local_date_time) VALUES (8, 'owenua3@gmail.com', '$2a$10$exampleHash8', '2026-01-08 12:00:00');
INSERT INTO email (id, hashed_email, hashed_token, local_date_time) VALUES (9, 'mixed@gmail.com', '$2a$10$exampleHash9', '2026-01-09 12:00:00');

SELECT setval('user_account_id_seq', (SELECT COALESCE(MAX(id), 1) FROM user_account));
SELECT setval('tournament_id_seq', (SELECT COALESCE(MAX(id), 1) FROM tournament));
SELECT setval('location_id_seq', (SELECT COALESCE(MAX(id), 1) FROM location));
SELECT setval('location_tournament_id_seq', (SELECT COALESCE(MAX(id), 1) FROM location_tournament));
SELECT setval('application_id_seq', (SELECT COALESCE(MAX(id), 1) FROM application));
SELECT setval('user_tournament_roles_id_seq', (SELECT COALESCE(MAX(id), 1) FROM user_tournament_roles));
SELECT setval('tickets_id_seq', (SELECT COALESCE(MAX(id), 1) FROM tickets));
SELECT setval('sponsorships_id_seq', (SELECT COALESCE(MAX(id), 1) FROM sponsorships));
SELECT setval('fight_histories_id_seq', (SELECT COALESCE(MAX(id), 1) FROM fight_histories));
SELECT setval('prize_distributions_id_seq', (SELECT COALESCE(MAX(id), 1) FROM prize_distributions));
SELECT setval('user_profiles_id_seq', (SELECT COALESCE(MAX(id), 1) FROM user_profiles));
SELECT setval('email_id_seq', (SELECT COALESCE(MAX(id), 1) FROM email));
SELECT setval('votes_id_seq', (SELECT COALESCE(MAX(id), 1) FROM votes));