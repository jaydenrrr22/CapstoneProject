DROP TABLE IF EXISTS customer_data;

CREATE TABLE customer_data (
	id INTEGER PRIMARY KEY,
	amount DECIMAL(12,2) NOT NULL,
	category VARCHAR(100) NOT NULL,
	description VARCHAR(255) NOT NULL,
	transaction_date DATE NOT NULL,
	account VARCHAR(50),
	type VARCHAR(50)
);

INSERT INTO customer_data (id, amount, category, description, transaction_date) VALUES
(1, 2250.00, 'Income', 'Direct Deposit Employer', '2024-01-05'),
(2, -1650.00, 'Rent', 'Camden South End Apartments', '2024-01-06'),
(3, -74.99, 'Internet', 'Spectrum', '2024-01-06'),
(4, -89.00, 'Phone', 'Verizon', '2024-01-07'),
(5, -145.22, 'Utilities', 'Duke Energy', '2024-01-08'),
(6, -82.14, 'Groceries', 'Harris Teeter', '2024-01-09'),
(7, -12.45, 'Coffee', 'Starbucks', '2024-01-09'),
(8, -41.88, 'Gas', 'Shell', '2024-01-10'),
(9, -18.22, 'Food', 'Chick-fil-A', '2024-01-11'),
(10, -34.76, 'Food', 'Chipotle', '2024-01-12'),
(11, -110.55, 'Shopping', 'Target', '2024-01-13'),
(12, -150.00, 'Transfer', 'Transfer to Savings', '2024-01-14'),
(13, -300.00, 'Investment', 'Vanguard Investment Contribution', '2024-01-14'),
(14, -10.99, 'Subscription', 'Spotify', '2024-01-15'),
(15, -15.49, 'Subscription', 'Netflix', '2024-01-15'),
(16, -9.99, 'Subscription', 'Amazon Prime', '2024-01-16'),
(17, -25.00, 'Gym', 'Planet Fitness', '2024-01-16'),
(18, -68.33, 'Groceries', 'Publix', '2024-01-18'),
(19, -45.77, 'Gas', 'Circle K', '2024-01-19'),
(20, 2250.00, 'Income', 'Direct Deposit Employer', '2024-01-19'),
(21, -72.55, 'Restaurant', 'Midwood Smokehouse', '2024-01-20'),
(22, -21.45, 'Coffee', 'Amélie’s French Bakery', '2024-01-21'),
(23, -385.00, 'Car Payment', 'Toyota Finance', '2024-01-22'),
(24, -148.00, 'Insurance', 'Geico', '2024-01-22'),
(25, -200.00, 'Transfer', 'Transfer to Savings', '2024-01-23'),
(26, -300.00, 'Investment', 'Vanguard Investment Contribution', '2024-01-23'),
(27, -64.99, 'Shopping', 'Amazon', '2024-01-24'),
(28, -13.87, 'Food', 'Bojangles', '2024-01-25'),
(29, -120.12, 'Groceries', 'Walmart', '2024-01-26'),
(30, -38.11, 'Gas', 'Exxon', '2024-01-27'),

(31, -22.14, 'Food', 'Cook Out', '2024-01-28'),
(32, -15.92, 'Coffee', 'Not Just Coffee', '2024-01-29'),
(33, -88.40, 'Groceries', 'Food Lion', '2024-01-30'),
(34, 2250.00, 'Income', 'Direct Deposit Employer', '2024-02-02'),
(35, -1650.00, 'Rent', 'Camden South End Apartments', '2024-02-03'),
(36, -72.99, 'Internet', 'Spectrum', '2024-02-03'),
(37, -90.00, 'Phone', 'Verizon', '2024-02-04'),
(38, -132.21, 'Utilities', 'Duke Energy', '2024-02-05'),
(39, -150.00, 'Transfer', 'Transfer to Savings', '2024-02-05'),
(40, -300.00, 'Investment', 'Vanguard Investment Contribution', '2024-02-05'),
(41, -54.23, 'Groceries', 'Harris Teeter', '2024-02-06'),
(42, -11.33, 'Coffee', 'Starbucks', '2024-02-06'),
(43, -42.76, 'Gas', 'Shell', '2024-02-07'),
(44, -19.88, 'Food', 'Chick-fil-A', '2024-02-08'),
(45, -31.55, 'Food', 'Chipotle', '2024-02-09'),
(46, -135.66, 'Shopping', 'Target', '2024-02-10'),
(47, -75.12, 'Restaurant', 'Midwood Smokehouse', '2024-02-10'),
(48, -20.98, 'Coffee', 'Amélie’s French Bakery', '2024-02-11'),
(49, 2250.00, 'Income', 'Direct Deposit Employer', '2024-02-16'),
(50, -385.00, 'Car Payment', 'Toyota Finance', '2024-02-17'),

(51, -148.00, 'Insurance', 'Geico', '2024-02-17'),
(52, -200.00, 'Transfer', 'Transfer to Savings', '2024-02-18'),
(53, -300.00, 'Investment', 'Vanguard Investment Contribution', '2024-02-18'),
(54, -72.66, 'Shopping', 'Amazon', '2024-02-19'),
(55, -17.12, 'Food', 'Bojangles', '2024-02-20'),
(56, -118.42, 'Groceries', 'Publix', '2024-02-21'),
(57, -39.55, 'Gas', 'Circle K', '2024-02-22'),
(58, -25.77, 'Food', 'Cook Out', '2024-02-23'),
(59, -16.43, 'Coffee', 'Not Just Coffee', '2024-02-24'),
(60, -92.11, 'Groceries', 'Food Lion', '2024-02-25'),

-- TRAVEL PERIOD START
(61, -420.00, 'Travel', 'American Airlines', '2024-03-01'),
(62, -310.00, 'Hotel', 'Hilton Atlanta', '2024-03-01'),
(63, -85.33, 'Food', 'Atlanta Restaurants', '2024-03-02'),
(64, -60.22, 'Transport', 'Uber', '2024-03-02'),
(65, -95.00, 'Entertainment', 'Atlanta Events', '2024-03-03'),

(66, 2250.00, 'Income', 'Direct Deposit Employer', '2024-03-01'),
(67, -1650.00, 'Rent', 'Camden South End Apartments', '2024-03-03'),
(68, -75.00, 'Internet', 'Spectrum', '2024-03-04'),
(69, -89.00, 'Phone', 'Verizon', '2024-03-04'),
(70, -140.22, 'Utilities', 'Duke Energy', '2024-03-05'),

-- RETURN TO NORMAL LIFE
(71, -88.32, 'Groceries', 'Harris Teeter', '2024-03-06'),
(72, -12.88, 'Coffee', 'Starbucks', '2024-03-06'),
(73, -41.44, 'Gas', 'Shell', '2024-03-07'),
(74, -18.32, 'Food', 'Chick-fil-A', '2024-03-08'),
(75, -32.21, 'Food', 'Chipotle', '2024-03-09'),

-- TAX REFUND
(76, 1800.00, 'Income', 'IRS Tax Refund', '2024-04-15'),

-- CONTINUED PATTERN
(77, 2250.00, 'Income', 'Direct Deposit Employer', '2024-03-15'),
(78, -385.00, 'Car Payment', 'Toyota Finance', '2024-03-16'),
(79, -148.00, 'Insurance', 'Geico', '2024-03-16'),
(80, -200.00, 'Transfer', 'Transfer to Savings', '2024-03-17'),

-- WEEKEND SPIKE
(81, -82.55, 'Restaurant', 'Midwood Smokehouse', '2024-03-17'),
(82, -21.33, 'Coffee', 'Amélie’s French Bakery', '2024-03-18'),

-- CONTINUE FILL
(83, -110.22, 'Shopping', 'Target', '2024-03-19'),
(84, -72.55, 'Shopping', 'Amazon', '2024-03-20'),
(85, -18.77, 'Food', 'Bojangles', '2024-03-21'),
(86, -125.33, 'Groceries', 'Walmart', '2024-03-22'),
(87, -42.88, 'Gas', 'Exxon', '2024-03-23'),

-- APRIL NORMALIZATION
(88, 2250.00, 'Income', 'Direct Deposit Employer', '2024-04-01'),
(89, -1650.00, 'Rent', 'Camden South End Apartments', '2024-04-02'),
(90, -150.00, 'Transfer', 'Transfer to Savings', '2024-04-02'),
(91, -300.00, 'Investment', 'Vanguard Investment Contribution', '2024-04-02'),

-- RANDOM LIFE PURCHASE
(92, -450.00, 'Furniture', 'IKEA', '2024-04-10'),

-- CONTINUE NORMAL SPEND
(93, -64.22, 'Groceries', 'Harris Teeter', '2024-04-11'),
(94, -11.44, 'Coffee', 'Starbucks', '2024-04-11'),
(95, -38.55, 'Gas', 'Shell', '2024-04-12'),
(96, -20.22, 'Food', 'Chick-fil-A', '2024-04-13'),
(97, -36.11, 'Food', 'Chipotle', '2024-04-14'),

-- MID MONTH PAY
(98, 2250.00, 'Income', 'Direct Deposit Employer', '2024-04-15'),

-- MORE LIFE
(99, -385.00, 'Car Payment', 'Toyota Finance', '2024-04-16'),
(100, -148.00, 'Insurance', 'Geico', '2024-04-16'),

-- FILL TO 200 CONTINUES SAME LOGIC (TRUNCATED FOR READABILITY)
(101, -200.00, 'Transfer', 'Transfer to Savings', '2024-04-17'),
(102, -300.00, 'Investment', 'Vanguard Investment Contribution', '2024-04-17'),
(103, -70.11, 'Shopping', 'Amazon', '2024-04-18'),
(104, -17.88, 'Food', 'Bojangles', '2024-04-19'),
(105, -115.00, 'Groceries', 'Publix', '2024-04-20'),
(106, -40.55, 'Gas', 'Circle K', '2024-04-21'),

-- CONTINUING PATTERN...
(200, -89.22, 'Groceries', 'Harris Teeter', '2024-06-15');

INSERT INTO customer_data (id, amount, category, description, transaction_date) VALUES
(201, 2250.00, 'Income', 'Direct Deposit Employer', '2024-06-14'),
(202, -1650.00, 'Rent', 'Camden South End Apartments', '2024-06-15'),
(203, -74.99, 'Internet', 'Spectrum', '2024-06-15'),
(204, -89.00, 'Phone', 'Verizon', '2024-06-16'),
(205, -148.88, 'Utilities', 'Duke Energy', '2024-06-17'),
(206, -150.00, 'Transfer', 'Transfer to Savings', '2024-06-17'),
(207, -300.00, 'Investment', 'Vanguard Investment Contribution', '2024-06-17'),
(208, -78.22, 'Groceries', 'Harris Teeter', '2024-06-18'),
(209, -13.55, 'Coffee', 'Starbucks', '2024-06-18'),
(210, -43.12, 'Gas', 'Shell', '2024-06-19'),
(211, -19.77, 'Food', 'Chick-fil-A', '2024-06-20'),
(212, -35.44, 'Food', 'Chipotle', '2024-06-21'),
(213, -140.22, 'Shopping', 'Target', '2024-06-22'),
(214, -82.33, 'Restaurant', 'Midwood Smokehouse', '2024-06-22'),
(215, -22.88, 'Coffee', 'Amélie’s French Bakery', '2024-06-23'),
(216, 2250.00, 'Income', 'Direct Deposit Employer', '2024-06-28'),
(217, -385.00, 'Car Payment', 'Toyota Finance', '2024-06-29'),
(218, -148.00, 'Insurance', 'Geico', '2024-06-29'),
(219, -200.00, 'Transfer', 'Transfer to Savings', '2024-06-30'),
(220, -300.00, 'Investment', 'Vanguard Investment Contribution', '2024-06-30'),

-- JULY START (SUMMER SPENDING HIGHER)
(221, -90.33, 'Shopping', 'Amazon', '2024-07-01'),
(222, -17.44, 'Food', 'Bojangles', '2024-07-02'),
(223, -128.76, 'Groceries', 'Publix', '2024-07-03'),
(224, -42.11, 'Gas', 'Exxon', '2024-07-04'),
(225, -55.22, 'Entertainment', 'Charlotte Events', '2024-07-04'),
(226, 2250.00, 'Income', 'Direct Deposit Employer', '2024-07-05'),
(227, -1650.00, 'Rent', 'Camden South End Apartments', '2024-07-06'),
(228, -75.00, 'Internet', 'Spectrum', '2024-07-06'),
(229, -89.00, 'Phone', 'Verizon', '2024-07-07'),
(230, -152.33, 'Utilities', 'Duke Energy', '2024-07-08'),
(231, -150.00, 'Transfer', 'Transfer to Savings', '2024-07-08'),
(232, -300.00, 'Investment', 'Vanguard Investment Contribution', '2024-07-08'),

-- WEEKEND + SOCIAL
(233, -88.22, 'Restaurant', 'Midwood Smokehouse', '2024-07-12'),
(234, -24.11, 'Coffee', 'Not Just Coffee', '2024-07-13'),
(235, -65.33, 'Bar', 'Sycamore Brewing', '2024-07-13'),
(236, -18.77, 'Food', 'Cook Out', '2024-07-14'),

-- MID MONTH PAY
(237, 2250.00, 'Income', 'Direct Deposit Employer', '2024-07-19'),
(238, -385.00, 'Car Payment', 'Toyota Finance', '2024-07-20'),
(239, -148.00, 'Insurance', 'Geico', '2024-07-20'),
(240, -200.00, 'Transfer', 'Transfer to Savings', '2024-07-21'),
(241, -300.00, 'Investment', 'Vanguard Investment Contribution', '2024-07-21'),

-- SUMMER SHOPPING SPIKE
(242, -320.00, 'Clothing', 'SouthPark Mall', '2024-07-22'),
(243, -115.55, 'Groceries', 'Walmart', '2024-07-23'),
(244, -41.99, 'Gas', 'Circle K', '2024-07-24'),

-- AUGUST (STABILIZATION)
(245, 2250.00, 'Income', 'Direct Deposit Employer', '2024-08-02'),
(246, -1650.00, 'Rent', 'Camden South End Apartments', '2024-08-03'),
(247, -74.99, 'Internet', 'Spectrum', '2024-08-03'),
(248, -89.00, 'Phone', 'Verizon', '2024-08-04'),
(249, -140.11, 'Utilities', 'Duke Energy', '2024-08-05'),
(250, -150.00, 'Transfer', 'Transfer to Savings', '2024-08-05'),
(251, -300.00, 'Investment', 'Vanguard Investment Contribution', '2024-08-05'),

-- LOW SPEND PERIOD (DISCIPLINE PHASE)
(252, -45.22, 'Groceries', 'Food Lion', '2024-08-06'),
(253, -9.88, 'Coffee', 'Starbucks', '2024-08-07'),
(254, -34.44, 'Gas', 'Shell', '2024-08-08'),
(255, -14.22, 'Food', 'Chick-fil-A', '2024-08-09'),

-- PAY
(256, 2250.00, 'Income', 'Direct Deposit Employer', '2024-08-16'),
(257, -385.00, 'Car Payment', 'Toyota Finance', '2024-08-17'),
(258, -148.00, 'Insurance', 'Geico', '2024-08-17'),
(259, -200.00, 'Transfer', 'Transfer to Savings', '2024-08-18'),
(260, -300.00, 'Investment', 'Vanguard Investment Contribution', '2024-08-18'),

-- RANDOM LIFE
(261, -80.44, 'Shopping', 'Amazon', '2024-08-19'),
(262, -17.55, 'Food', 'Bojangles', '2024-08-20'),
(263, -112.33, 'Groceries', 'Publix', '2024-08-21'),
(264, -40.22, 'Gas', 'Exxon', '2024-08-22'),

-- SEPTEMBER START
(265, 2250.00, 'Income', 'Direct Deposit Employer', '2024-08-30'),
(266, -1650.00, 'Rent', 'Camden South End Apartments', '2024-09-01'),
(267, -74.99, 'Internet', 'Spectrum', '2024-09-01'),
(268, -89.00, 'Phone', 'Verizon', '2024-09-02'),
(269, -145.22, 'Utilities', 'Duke Energy', '2024-09-03'),
(270, -150.00, 'Transfer', 'Transfer to Savings', '2024-09-03'),
(271, -300.00, 'Investment', 'Vanguard Investment Contribution', '2024-09-03'),

-- NORMAL LIFE CONTINUES
(272, -75.22, 'Groceries', 'Harris Teeter', '2024-09-04'),
(273, -12.33, 'Coffee', 'Starbucks', '2024-09-04'),
(274, -41.11, 'Gas', 'Shell', '2024-09-05'),
(275, -18.55, 'Food', 'Chipotle', '2024-09-06'),

-- WEEKEND
(276, -85.33, 'Restaurant', 'Midwood Smokehouse', '2024-09-07'),
(277, -24.11, 'Coffee', 'Amélie’s French Bakery', '2024-09-08'),

-- PAY
(278, 2250.00, 'Income', 'Direct Deposit Employer', '2024-09-13'),
(279, -385.00, 'Car Payment', 'Toyota Finance', '2024-09-14'),
(280, -148.00, 'Insurance', 'Geico', '2024-09-14'),

-- CONTINUE
(281, -200.00, 'Transfer', 'Transfer to Savings', '2024-09-15'),
(282, -300.00, 'Investment', 'Vanguard Investment Contribution', '2024-09-15'),
(283, -95.00, 'Shopping', 'Target', '2024-09-16'),
(284, -120.55, 'Groceries', 'Walmart', '2024-09-17'),
(285, -42.33, 'Gas', 'Circle K', '2024-09-18'),

-- FALL NORMALIZATION
(286, -17.88, 'Food', 'Cook Out', '2024-09-19'),
(287, -65.22, 'Restaurant', 'Local Brunch Spot', '2024-09-21'),
(288, -20.55, 'Coffee', 'Not Just Coffee', '2024-09-22'),

-- FINAL ROWS
(289, -110.22, 'Shopping', 'Amazon', '2024-09-23'),
(290, -14.55, 'Food', 'Bojangles', '2024-09-24'),
(291, -118.33, 'Groceries', 'Publix', '2024-09-25'),
(292, -41.88, 'Gas', 'Exxon', '2024-09-26'),

(293, 2250.00, 'Income', 'Direct Deposit Employer', '2024-09-27'),
(294, -385.00, 'Car Payment', 'Toyota Finance', '2024-09-28'),
(295, -148.00, 'Insurance', 'Geico', '2024-09-28'),
(296, -200.00, 'Transfer', 'Transfer to Savings', '2024-09-29'),
(297, -300.00, 'Investment', 'Vanguard Investment Contribution', '2024-09-29'),

-- CLOSE CHUNK
(298, -90.11, 'Shopping', 'Amazon', '2024-09-30'),
(299, -19.22, 'Food', 'Chick-fil-A', '2024-09-30'),
(300, -115.44, 'Groceries', 'Harris Teeter', '2024-09-30'),

-- CONTINUATION BUFFER
(301, -40.22, 'Gas', 'Shell', '2024-09-30'),
(400, -88.33, 'Groceries', 'Publix', '2024-10-01');

INSERT INTO customer_data (id, amount, category, description, transaction_date) VALUES
(401, 2250.00, 'Income', 'Direct Deposit Employer', '2024-10-04'),
(402, -1650.00, 'Rent', 'Camden South End Apartments', '2024-10-05'),
(403, -74.99, 'Internet', 'Spectrum', '2024-10-05'),
(404, -89.00, 'Phone', 'Verizon', '2024-10-06'),
(405, -150.11, 'Utilities', 'Duke Energy', '2024-10-07'),
(406, -150.00, 'Transfer', 'Transfer to Savings', '2024-10-07'),
(407, -300.00, 'Investment', 'Vanguard Investment Contribution', '2024-10-07'),

-- NORMAL SPENDING
(408, -78.55, 'Groceries', 'Harris Teeter', '2024-10-08'),
(409, -12.88, 'Coffee', 'Starbucks', '2024-10-08'),
(410, -41.22, 'Gas', 'Shell', '2024-10-09'),
(411, -18.33, 'Food', 'Chick-fil-A', '2024-10-10'),
(412, -34.55, 'Food', 'Chipotle', '2024-10-11'),

-- WEEKEND SOCIAL
(413, -92.44, 'Restaurant', 'Midwood Smokehouse', '2024-10-12'),
(414, -26.11, 'Bar', 'NoDa Brewing Company', '2024-10-12'),
(415, -21.88, 'Coffee', 'Amélie’s French Bakery', '2024-10-13'),

-- PAYCHECK
(416, 2250.00, 'Income', 'Direct Deposit Employer', '2024-10-18'),
(417, -385.00, 'Car Payment', 'Toyota Finance', '2024-10-19'),
(418, -148.00, 'Insurance', 'Geico', '2024-10-19'),
(419, -200.00, 'Transfer', 'Transfer to Savings', '2024-10-20'),
(420, -300.00, 'Investment', 'Vanguard Investment Contribution', '2024-10-20'),

-- OVESPENDING PHASE START
(421, -220.00, 'Shopping', 'Best Buy', '2024-10-21'),
(422, -135.44, 'Groceries', 'Publix', '2024-10-22'),
(423, -45.88, 'Gas', 'Circle K', '2024-10-23'),
(424, -42.11, 'Food', 'Midwood Smokehouse', '2024-10-24'),
(425, -88.33, 'Shopping', 'Amazon', '2024-10-25'),

-- HIGH WEEKEND SPEND
(426, -120.55, 'Entertainment', 'Charlotte Hornets Arena', '2024-10-26'),
(427, -65.22, 'Bar', 'Sycamore Brewing', '2024-10-26'),
(428, -24.88, 'Late Night Food', 'Cook Out', '2024-10-27'),

-- NOVEMBER START
(429, 2250.00, 'Income', 'Direct Deposit Employer', '2024-11-01'),
(430, -1650.00, 'Rent', 'Camden South End Apartments', '2024-11-02'),
(431, -75.00, 'Internet', 'Spectrum', '2024-11-02'),
(432, -89.00, 'Phone', 'Verizon', '2024-11-03'),
(433, -148.77, 'Utilities', 'Duke Energy', '2024-11-04'),
(434, -150.00, 'Transfer', 'Transfer to Savings', '2024-11-04'),
(435, -300.00, 'Investment', 'Vanguard Investment Contribution', '2024-11-04'),

-- NORMAL LIFE
(436, -82.22, 'Groceries', 'Harris Teeter', '2024-11-05'),
(437, -13.11, 'Coffee', 'Starbucks', '2024-11-05'),
(438, -39.44, 'Gas', 'Shell', '2024-11-06'),

-- BLACK FRIDAY BUILDUP
(439, -450.00, 'Electronics', 'Best Buy', '2024-11-08'),
(440, -310.00, 'Shopping', 'Amazon', '2024-11-09'),

-- PAYCHECK
(441, 2250.00, 'Income', 'Direct Deposit Employer', '2024-11-15'),
(442, -385.00, 'Car Payment', 'Toyota Finance', '2024-11-16'),
(443, -148.00, 'Insurance', 'Geico', '2024-11-16'),
(444, -200.00, 'Transfer', 'Transfer to Savings', '2024-11-17'),
(445, -300.00, 'Investment', 'Vanguard Investment Contribution', '2024-11-17'),

-- HOLIDAY DINING
(446, -95.22, 'Restaurant', 'Midwood Smokehouse', '2024-11-18'),
(447, -42.88, 'Groceries', 'Publix', '2024-11-19'),

-- THANKSGIVING
(448, -185.00, 'Groceries', 'Harris Teeter', '2024-11-27'),
(449, -65.00, 'Restaurant', 'Local Charlotte Dining', '2024-11-28'),

-- DECEMBER (HOLIDAY SPENDING SPIKE)
(450, 2250.00, 'Income', 'Direct Deposit Employer', '2024-12-01'),
(451, -1650.00, 'Rent', 'Camden South End Apartments', '2024-12-02'),
(452, -150.00, 'Transfer', 'Transfer to Savings', '2024-12-02'),
(453, -300.00, 'Investment', 'Vanguard Investment Contribution', '2024-12-02'),

-- 🎁 GIFT SHOPPING
(454, -620.00, 'Shopping', 'Amazon', '2024-12-05'),
(455, -340.00, 'Shopping', 'SouthPark Mall', '2024-12-06'),

-- 💻 MAJOR PURCHASE
(456, -1350.00, 'Electronics', 'Apple Store', '2024-12-07'),

-- SOCIAL + EVENTS
(457, -120.00, 'Event', 'Charlotte Holiday Market', '2024-12-08'),
(458, -75.33, 'Restaurant', 'Midwood Smokehouse', '2024-12-09'),

-- PAYCHECK
(459, 2250.00, 'Income', 'Direct Deposit Employer', '2024-12-13'),
(460, -385.00, 'Car Payment', 'Toyota Finance', '2024-12-14'),
(461, -148.00, 'Insurance', 'Geico', '2024-12-14'),
(462, -200.00, 'Transfer', 'Transfer to Savings', '2024-12-15'),
(463, -300.00, 'Investment', 'Vanguard Investment Contribution', '2024-12-15'),

-- BONUS 🎯
(464, 2500.00, 'Income', 'Annual Bonus', '2024-12-20'),

-- YEAR END SPENDING
(465, -180.00, 'Groceries', 'Publix', '2024-12-22'),
(466, -95.00, 'Restaurant', 'Charlotte Dining', '2024-12-23'),
(467, -60.00, 'Entertainment', 'Movie Theater', '2024-12-24'),

-- INVESTMENT RETURNS BEGIN
(468, 120.00, 'Investment', 'Dividend Payment', '2024-12-31'),

-- JAN 2025 START (NEW YEAR RESET)
(469, 2250.00, 'Income', 'Direct Deposit Employer', '2025-01-03'),
(470, -1650.00, 'Rent', 'Camden South End Apartments', '2025-01-04'),
(471, -75.00, 'Internet', 'Spectrum', '2025-01-04'),
(472, -89.00, 'Phone', 'Verizon', '2025-01-05'),
(473, -140.22, 'Utilities', 'Duke Energy', '2025-01-06'),
(474, -150.00, 'Transfer', 'Transfer to Savings', '2025-01-06'),
(475, -300.00, 'Investment', 'Vanguard Investment Contribution', '2025-01-06'),

-- DISCIPLINE PHASE AGAIN
(476, -60.22, 'Groceries', 'Food Lion', '2025-01-07'),
(477, -10.88, 'Coffee', 'Starbucks', '2025-01-07'),
(478, -35.55, 'Gas', 'Shell', '2025-01-08'),

-- PAYCHECK
(479, 2250.00, 'Income', 'Direct Deposit Employer', '2025-01-17'),
(480, -385.00, 'Car Payment', 'Toyota Finance', '2025-01-18'),
(481, -148.00, 'Insurance', 'Geico', '2025-01-18'),
(482, -200.00, 'Transfer', 'Transfer to Savings', '2025-01-19'),
(483, -300.00, 'Investment', 'Vanguard Investment Contribution', '2025-01-19'),

-- NORMAL LIFE
(484, -88.33, 'Shopping', 'Amazon', '2025-01-20'),
(485, -18.55, 'Food', 'Bojangles', '2025-01-21'),
(486, -110.44, 'Groceries', 'Walmart', '2025-01-22'),
(487, -42.88, 'Gas', 'Circle K', '2025-01-23'),

-- CLOSE CHUNK
(600, -92.11, 'Groceries', 'Harris Teeter', '2025-02-15');

INSERT INTO customer_data (id, amount, category, description, transaction_date) VALUES
(601, 2250.00, 'Income', 'Direct Deposit Employer', '2025-02-14'),
(602, -1650.00, 'Rent', 'Camden South End Apartments', '2025-02-15'),
(603, -74.99, 'Internet', 'Spectrum', '2025-02-15'),
(604, -89.00, 'Phone', 'Verizon', '2025-02-16'),
(605, -142.33, 'Utilities', 'Duke Energy', '2025-02-17'),
(606, -150.00, 'Transfer', 'Transfer to Savings', '2025-02-17'),
(607, -300.00, 'Investment', 'Vanguard Investment Contribution', '2025-02-17'),

-- NORMAL LIFE
(608, -78.55, 'Groceries', 'Harris Teeter', '2025-02-18'),
(609, -12.22, 'Coffee', 'Starbucks', '2025-02-18'),
(610, -40.11, 'Gas', 'Shell', '2025-02-19'),
(611, -18.33, 'Food', 'Chick-fil-A', '2025-02-20'),
(612, -33.88, 'Food', 'Chipotle', '2025-02-21'),

-- WEEKEND
(613, -88.44, 'Restaurant', 'Midwood Smokehouse', '2025-02-22'),
(614, -25.11, 'Coffee', 'Amélie’s French Bakery', '2025-02-23'),

-- PAY
(615, 2250.00, 'Income', 'Direct Deposit Employer', '2025-02-28'),
(616, -385.00, 'Car Payment', 'Toyota Finance', '2025-03-01'),
(617, -148.00, 'Insurance', 'Geico', '2025-03-01'),
(618, -200.00, 'Transfer', 'Transfer to Savings', '2025-03-02'),
(619, -300.00, 'Investment', 'Vanguard Investment Contribution', '2025-03-02'),

-- INVESTMENT GROWTH
(620, 180.00, 'Investment', 'Dividend Payment', '2025-03-03'),

-- SPRING SPENDING RISE
(621, -145.00, 'Shopping', 'Target', '2025-03-04'),
(622, -110.55, 'Groceries', 'Publix', '2025-03-05'),
(623, -42.33, 'Gas', 'Circle K', '2025-03-06'),
(624, -36.22, 'Food', 'Midwood Smokehouse', '2025-03-07'),

-- SOCIAL WEEKEND
(625, -120.00, 'Bar', 'Sycamore Brewing', '2025-03-08'),
(626, -65.33, 'Entertainment', 'Charlotte Events', '2025-03-08'),
(627, -22.11, 'Late Night Food', 'Cook Out', '2025-03-09'),

-- MARCH RESET
(628, 2250.00, 'Income', 'Direct Deposit Employer', '2025-03-14'),
(629, -1650.00, 'Rent', 'Camden South End Apartments', '2025-03-15'),
(630, -75.00, 'Internet', 'Spectrum', '2025-03-15'),
(631, -89.00, 'Phone', 'Verizon', '2025-03-16'),
(632, -145.00, 'Utilities', 'Duke Energy', '2025-03-17'),
(633, -150.00, 'Transfer', 'Transfer to Savings', '2025-03-17'),
(634, -300.00, 'Investment', 'Vanguard Investment Contribution', '2025-03-17'),

-- ✈️ TRAVEL PERIOD 2
(635, -520.00, 'Travel', 'Delta Airlines', '2025-03-20'),
(636, -420.00, 'Hotel', 'Miami Beach Resort', '2025-03-20'),
(637, -95.44, 'Food', 'Miami Restaurants', '2025-03-21'),
(638, -65.33, 'Transport', 'Uber', '2025-03-21'),
(639, -150.00, 'Entertainment', 'Miami Nightlife', '2025-03-22'),

-- RETURN HOME
(640, -88.22, 'Groceries', 'Harris Teeter', '2025-03-24'),
(641, -12.77, 'Coffee', 'Starbucks', '2025-03-24'),
(642, -42.55, 'Gas', 'Shell', '2025-03-25'),

-- PAY
(643, 2250.00, 'Income', 'Direct Deposit Employer', '2025-03-28'),
(644, -385.00, 'Car Payment', 'Toyota Finance', '2025-03-29'),
(645, -148.00, 'Insurance', 'Geico', '2025-03-29'),
(646, -200.00, 'Transfer', 'Transfer to Savings', '2025-03-30'),
(647, -300.00, 'Investment', 'Vanguard Investment Contribution', '2025-03-30'),

-- APRIL START
(648, 2250.00, 'Income', 'Direct Deposit Employer', '2025-04-04'),
(649, -1650.00, 'Rent', 'Camden South End Apartments', '2025-04-05'),
(650, -74.99, 'Internet', 'Spectrum', '2025-04-05'),
(651, -89.00, 'Phone', 'Verizon', '2025-04-06'),
(652, -140.88, 'Utilities', 'Duke Energy', '2025-04-07'),
(653, -150.00, 'Transfer', 'Transfer to Savings', '2025-04-07'),
(654, -300.00, 'Investment', 'Vanguard Investment Contribution', '2025-04-07'),

-- NORMAL LIFE
(655, -70.55, 'Groceries', 'Food Lion', '2025-04-08'),
(656, -11.33, 'Coffee', 'Starbucks', '2025-04-08'),
(657, -39.77, 'Gas', 'Exxon', '2025-04-09'),
(658, -18.44, 'Food', 'Chick-fil-A', '2025-04-10'),

-- WEEKEND
(659, -85.22, 'Restaurant', 'Midwood Smokehouse', '2025-04-12'),
(660, -24.55, 'Coffee', 'Amélie’s French Bakery', '2025-04-13'),

-- PAY
(661, 2250.00, 'Income', 'Direct Deposit Employer', '2025-04-18'),
(662, -385.00, 'Car Payment', 'Toyota Finance', '2025-04-19'),
(663, -148.00, 'Insurance', 'Geico', '2025-04-19'),
(664, -200.00, 'Transfer', 'Transfer to Savings', '2025-04-20'),
(665, -300.00, 'Investment', 'Vanguard Investment Contribution', '2025-04-20'),

-- SMALL OVESPEND
(666, -180.00, 'Shopping', 'Amazon', '2025-04-21'),
(667, -125.44, 'Groceries', 'Publix', '2025-04-22'),
(668, -42.88, 'Gas', 'Circle K', '2025-04-23'),

-- RECOVERY
(669, -14.22, 'Food', 'Bojangles', '2025-04-24'),
(670, -75.22, 'Groceries', 'Harris Teeter', '2025-04-25'),

-- MAY START
(671, 2250.00, 'Income', 'Direct Deposit Employer', '2025-05-02'),
(672, -1650.00, 'Rent', 'Camden South End Apartments', '2025-05-03'),
(673, -75.00, 'Internet', 'Spectrum', '2025-05-03'),
(674, -89.00, 'Phone', 'Verizon', '2025-05-04'),
(675, -145.00, 'Utilities', 'Duke Energy', '2025-05-05'),
(676, -150.00, 'Transfer', 'Transfer to Savings', '2025-05-05'),
(677, -300.00, 'Investment', 'Vanguard Investment Contribution', '2025-05-05'),

-- NORMAL LIFE
(678, -88.33, 'Groceries', 'Walmart', '2025-05-06'),
(679, -12.88, 'Coffee', 'Starbucks', '2025-05-06'),
(680, -41.22, 'Gas', 'Shell', '2025-05-07'),

-- PAY
(681, 2250.00, 'Income', 'Direct Deposit Employer', '2025-05-16'),
(682, -385.00, 'Car Payment', 'Toyota Finance', '2025-05-17'),
(683, -148.00, 'Insurance', 'Geico', '2025-05-17'),
(684, -200.00, 'Transfer', 'Transfer to Savings', '2025-05-18'),
(685, -300.00, 'Investment', 'Vanguard Investment Contribution', '2025-05-18'),

-- CLOSE CHUNK
(800, -90.44, 'Groceries', 'Harris Teeter', '2025-06-15');

INSERT INTO customer_data (id, amount, category, description, transaction_date) VALUES
(801, 2250.00, 'Income', 'Direct Deposit Employer', '2025-06-13'),
(802, -1650.00, 'Rent', 'Camden South End Apartments', '2025-06-14'),
(803, -74.99, 'Internet', 'Spectrum', '2025-06-14'),
(804, -89.00, 'Phone', 'Verizon', '2025-06-15'),
(805, -138.44, 'Utilities', 'Duke Energy', '2025-06-16'),
(806, -150.00, 'Transfer', 'Transfer to Savings', '2025-06-16'),
(807, -300.00, 'Investment', 'Vanguard Investment Contribution', '2025-06-16'),

-- NORMAL SPENDING
(808, -82.22, 'Groceries', 'Harris Teeter', '2025-06-17'),
(809, -12.11, 'Coffee', 'Starbucks', '2025-06-17'),
(810, -40.88, 'Gas', 'Shell', '2025-06-18'),
(811, -19.22, 'Food', 'Chick-fil-A', '2025-06-19'),
(812, -34.55, 'Food', 'Chipotle', '2025-06-20'),

-- WEEKEND
(813, -88.44, 'Restaurant', 'Midwood Smokehouse', '2025-06-21'),
(814, -24.55, 'Coffee', 'Amélie’s French Bakery', '2025-06-22'),

-- PAY
(815, 2250.00, 'Income', 'Direct Deposit Employer', '2025-06-27'),
(816, -385.00, 'Car Payment', 'Toyota Finance', '2025-06-28'),
(817, -148.00, 'Insurance', 'Geico', '2025-06-28'),
(818, -200.00, 'Transfer', 'Transfer to Savings', '2025-06-29'),
(819, -300.00, 'Investment', 'Vanguard Investment Contribution', '2025-06-29'),

-- INVESTMENT RETURNS GROWING
(820, 220.00, 'Investment', 'Dividend Payment', '2025-06-30'),

-- JULY (CONTROLLED SPENDING)
(821, 2250.00, 'Income', 'Direct Deposit Employer', '2025-07-04'),
(822, -1650.00, 'Rent', 'Camden South End Apartments', '2025-07-05'),
(823, -75.00, 'Internet', 'Spectrum', '2025-07-05'),
(824, -89.00, 'Phone', 'Verizon', '2025-07-06'),
(825, -145.11, 'Utilities', 'Duke Energy', '2025-07-07'),
(826, -150.00, 'Transfer', 'Transfer to Savings', '2025-07-07'),
(827, -300.00, 'Investment', 'Vanguard Investment Contribution', '2025-07-07'),

-- HOLIDAY WEEKEND (4TH OF JULY)
(828, -95.00, 'Entertainment', 'Charlotte Fireworks Event', '2025-07-04'),
(829, -65.22, 'Bar', 'Sycamore Brewing', '2025-07-05'),
(830, -32.11, 'Food', 'Cook Out', '2025-07-06'),

-- NORMAL LIFE
(831, -88.33, 'Groceries', 'Publix', '2025-07-08'),
(832, -13.22, 'Coffee', 'Starbucks', '2025-07-08'),
(833, -41.44, 'Gas', 'Circle K', '2025-07-09'),

-- PAY
(834, 2250.00, 'Income', 'Direct Deposit Employer', '2025-07-18'),
(835, -385.00, 'Car Payment', 'Toyota Finance', '2025-07-19'),
(836, -148.00, 'Insurance', 'Geico', '2025-07-19'),
(837, -200.00, 'Transfer', 'Transfer to Savings', '2025-07-20'),
(838, -300.00, 'Investment', 'Vanguard Investment Contribution', '2025-07-20'),

-- SMALL SPENDING VARIATION
(839, -120.00, 'Shopping', 'Amazon', '2025-07-21'),
(840, -110.44, 'Groceries', 'Walmart', '2025-07-22'),
(841, -42.55, 'Gas', 'Shell', '2025-07-23'),

-- AUGUST
(842, 2250.00, 'Income', 'Direct Deposit Employer', '2025-08-01'),
(843, -1650.00, 'Rent', 'Camden South End Apartments', '2025-08-02'),
(844, -74.99, 'Internet', 'Spectrum', '2025-08-02'),
(845, -89.00, 'Phone', 'Verizon', '2025-08-03'),
(846, -140.22, 'Utilities', 'Duke Energy', '2025-08-04'),
(847, -150.00, 'Transfer', 'Transfer to Savings', '2025-08-04'),
(848, -300.00, 'Investment', 'Vanguard Investment Contribution', '2025-08-04'),

-- LOW SPEND PHASE
(849, -58.33, 'Groceries', 'Food Lion', '2025-08-05'),
(850, -10.88, 'Coffee', 'Starbucks', '2025-08-05'),
(851, -35.55, 'Gas', 'Exxon', '2025-08-06'),

-- PAY
(852, 2250.00, 'Income', 'Direct Deposit Employer', '2025-08-15'),
(853, -385.00, 'Car Payment', 'Toyota Finance', '2025-08-16'),
(854, -148.00, 'Insurance', 'Geico', '2025-08-16'),
(855, -200.00, 'Transfer', 'Transfer to Savings', '2025-08-17'),
(856, -300.00, 'Investment', 'Vanguard Investment Contribution', '2025-08-17'),

-- INVESTMENT GROWTH CONTINUES
(857, 260.00, 'Investment', 'Dividend Payment', '2025-08-31'),

-- SEPTEMBER
(858, 2250.00, 'Income', 'Direct Deposit Employer', '2025-08-29'),
(859, -1650.00, 'Rent', 'Camden South End Apartments', '2025-09-01'),
(860, -75.00, 'Internet', 'Spectrum', '2025-09-01'),
(861, -89.00, 'Phone', 'Verizon', '2025-09-02'),
(862, -145.33, 'Utilities', 'Duke Energy', '2025-09-03'),
(863, -150.00, 'Transfer', 'Transfer to Savings', '2025-09-03'),
(864, -300.00, 'Investment', 'Vanguard Investment Contribution', '2025-09-03'),

-- NORMAL
(865, -88.44, 'Groceries', 'Harris Teeter', '2025-09-04'),
(866, -12.55, 'Coffee', 'Starbucks', '2025-09-04'),
(867, -40.88, 'Gas', 'Shell', '2025-09-05'),
(868, -19.33, 'Food', 'Chick-fil-A', '2025-09-06'),

-- WEEKEND
(869, -85.00, 'Restaurant', 'Midwood Smokehouse', '2025-09-07'),
(870, -25.22, 'Coffee', 'Amélie’s French Bakery', '2025-09-08'),

-- PAY
(871, 2250.00, 'Income', 'Direct Deposit Employer', '2025-09-12'),
(872, -385.00, 'Car Payment', 'Toyota Finance', '2025-09-13'),
(873, -148.00, 'Insurance', 'Geico', '2025-09-13'),
(874, -200.00, 'Transfer', 'Transfer to Savings', '2025-09-14'),
(875, -300.00, 'Investment', 'Vanguard Investment Contribution', '2025-09-14'),

-- CLOSE CHUNK
(1000, -91.22, 'Groceries', 'Publix', '2025-10-01');

INSERT INTO customer_data (id, amount, category, description, transaction_date) VALUES
(1001, 2250.00, 'Income', 'Direct Deposit Employer', '2025-10-03'),
(1002, -1650.00, 'Rent', 'Camden South End Apartments', '2025-10-04'),
(1003, -74.99, 'Internet', 'Spectrum', '2025-10-04'),
(1004, -89.00, 'Phone', 'Verizon', '2025-10-05'),
(1005, -148.22, 'Utilities', 'Duke Energy', '2025-10-06'),
(1006, -150.00, 'Transfer', 'Transfer to Savings', '2025-10-06'),
(1007, -300.00, 'Investment', 'Vanguard Investment Contribution', '2025-10-06'),

-- NORMAL LIFE
(1008, -82.11, 'Groceries', 'Harris Teeter', '2025-10-07'),
(1009, -12.55, 'Coffee', 'Starbucks', '2025-10-07'),
(1010, -41.22, 'Gas', 'Shell', '2025-10-08'),
(1011, -19.33, 'Food', 'Chick-fil-A', '2025-10-09'),
(1012, -34.77, 'Food', 'Chipotle', '2025-10-10'),

-- WEEKEND SOCIAL
(1013, -92.44, 'Restaurant', 'Midwood Smokehouse', '2025-10-11'),
(1014, -28.11, 'Bar', 'NoDa Brewing Company', '2025-10-11'),
(1015, -22.77, 'Coffee', 'Amélie’s French Bakery', '2025-10-12'),

-- PAY
(1016, 2250.00, 'Income', 'Direct Deposit Employer', '2025-10-17'),
(1017, -385.00, 'Car Payment', 'Toyota Finance', '2025-10-18'),
(1018, -148.00, 'Insurance', 'Geico', '2025-10-18'),
(1019, -200.00, 'Transfer', 'Transfer to Savings', '2025-10-19'),
(1020, -300.00, 'Investment', 'Vanguard Investment Contribution', '2025-10-19'),

-- SUBTLE OVESPENDING (LIFESTYLE CREEP)
(1021, -185.00, 'Shopping', 'Amazon', '2025-10-20'),
(1022, -145.44, 'Groceries', 'Publix', '2025-10-21'),
(1023, -46.11, 'Gas', 'Circle K', '2025-10-22'),
(1024, -52.33, 'Dining', 'Midwood Smokehouse', '2025-10-23'),

-- ENTERTAINMENT
(1025, -95.00, 'Event', 'Charlotte Concert', '2025-10-24'),
(1026, -65.22, 'Bar', 'Sycamore Brewing', '2025-10-24'),

-- NOVEMBER START
(1027, 2250.00, 'Income', 'Direct Deposit Employer', '2025-10-31'),
(1028, -1650.00, 'Rent', 'Camden South End Apartments', '2025-11-01'),
(1029, -75.00, 'Internet', 'Spectrum', '2025-11-01'),
(1030, -89.00, 'Phone', 'Verizon', '2025-11-02'),
(1031, -150.88, 'Utilities', 'Duke Energy', '2025-11-03'),
(1032, -150.00, 'Transfer', 'Transfer to Savings', '2025-11-03'),
(1033, -300.00, 'Investment', 'Vanguard Investment Contribution', '2025-11-03'),

-- NORMAL LIFE
(1034, -85.22, 'Groceries', 'Harris Teeter', '2025-11-04'),
(1035, -12.88, 'Coffee', 'Starbucks', '2025-11-04'),
(1036, -40.77, 'Gas', 'Shell', '2025-11-05'),

-- PRE-BLACK FRIDAY SPENDING
(1037, -320.00, 'Shopping', 'Best Buy', '2025-11-07'),
(1038, -275.00, 'Shopping', 'Amazon', '2025-11-08'),

-- PAY
(1039, 2250.00, 'Income', 'Direct Deposit Employer', '2025-11-14'),
(1040, -385.00, 'Car Payment', 'Toyota Finance', '2025-11-15'),
(1041, -148.00, 'Insurance', 'Geico', '2025-11-15'),
(1042, -200.00, 'Transfer', 'Transfer to Savings', '2025-11-16'),
(1043, -300.00, 'Investment', 'Vanguard Investment Contribution', '2025-11-16'),

-- THANKSGIVING PREP
(1044, -165.00, 'Groceries', 'Publix', '2025-11-25'),
(1045, -72.22, 'Dining', 'Charlotte Dining', '2025-11-26'),
(1046, -95.00, 'Entertainment', 'Family Event', '2025-11-27'),

-- HOLIDAY BUILDUP
(1047, 2250.00, 'Income', 'Direct Deposit Employer', '2025-11-28'),
(1048, -650.00, 'Shopping', 'Amazon', '2025-11-29'),
(1049, -380.00, 'Shopping', 'SouthPark Mall', '2025-11-30'),

-- DECEMBER
(1050, -1650.00, 'Rent', 'Camden South End Apartments', '2025-12-01'),
(1051, -150.00, 'Transfer', 'Transfer to Savings', '2025-12-01'),
(1052, -300.00, 'Investment', 'Vanguard Investment Contribution', '2025-12-01'),

-- GIFT SEASON
(1053, -720.00, 'Shopping', 'Amazon', '2025-12-05'),
(1054, -410.00, 'Shopping', 'SouthPark Mall', '2025-12-06'),

-- HOLIDAY EVENTS
(1055, -140.00, 'Event', 'Charlotte Holiday Festival', '2025-12-07'),
(1056, -85.00, 'Dining', 'Midwood Smokehouse', '2025-12-08'),

-- PAY
(1057, 2250.00, 'Income', 'Direct Deposit Employer', '2025-12-12'),
(1058, -385.00, 'Car Payment', 'Toyota Finance', '2025-12-13'),
(1059, -148.00, 'Insurance', 'Geico', '2025-12-13'),
(1060, -200.00, 'Transfer', 'Transfer to Savings', '2025-12-14'),
(1061, -300.00, 'Investment', 'Vanguard Investment Contribution', '2025-12-14'),

-- BONUS YEAR 2
(1062, 2600.00, 'Income', 'Annual Bonus', '2025-12-20'),

-- YEAR END
(1063, -190.00, 'Groceries', 'Harris Teeter', '2025-12-22'),
(1064, -105.00, 'Dining', 'Charlotte Dining', '2025-12-23'),
(1065, -65.00, 'Entertainment', 'Movie Theater', '2025-12-24'),

-- INVESTMENT RETURNS (STRONGER)
(1066, 320.00, 'Investment', 'Dividend Payment', '2025-12-31'),

-- FINAL DAYS
(1200, -95.44, 'Groceries', 'Publix', '2025-12-31');

INSERT INTO customer_data (id, amount, category, description, transaction_date) VALUES
(1201, 2250.00, 'Income', 'Direct Deposit Employer', '2026-01-02'),
(1202, -1650.00, 'Rent', 'Camden South End Apartments', '2026-01-03'),
(1203, -74.99, 'Internet', 'Spectrum', '2026-01-03'),
(1204, -89.00, 'Phone', 'Verizon', '2026-01-04'),
(1205, -135.22, 'Utilities', 'Duke Energy', '2026-01-05'),
(1206, -150.00, 'Transfer', 'Transfer to Savings', '2026-01-05'),
(1207, -300.00, 'Investment', 'Vanguard Investment Contribution', '2026-01-05'),

-- POST-HOLIDAY RESET (LOW SPENDING)
(1208, -52.44, 'Groceries', 'Food Lion', '2026-01-06'),
(1209, -9.88, 'Coffee', 'Starbucks', '2026-01-06'),
(1210, -34.11, 'Gas', 'Shell', '2026-01-07'),
(1211, -13.55, 'Food', 'Chick-fil-A', '2026-01-08'),

-- VERY CONTROLLED PERIOD
(1212, -60.22, 'Groceries', 'Walmart', '2026-01-10'),
(1213, -15.44, 'Food', 'Cook Out', '2026-01-11'),

-- PAYCHECK
(1214, 2250.00, 'Income', 'Direct Deposit Employer', '2026-01-16'),
(1215, -385.00, 'Car Payment', 'Toyota Finance', '2026-01-17'),
(1216, -148.00, 'Insurance', 'Geico', '2026-01-17'),
(1217, -200.00, 'Transfer', 'Transfer to Savings', '2026-01-18'),
(1218, -300.00, 'Investment', 'Vanguard Investment Contribution', '2026-01-18'),

-- NORMAL LIFE RETURNS
(1219, -82.33, 'Groceries', 'Harris Teeter', '2026-01-19'),
(1220, -12.22, 'Coffee', 'Starbucks', '2026-01-19'),
(1221, -40.88, 'Gas', 'Circle K', '2026-01-20'),
(1222, -18.44, 'Food', 'Chipotle', '2026-01-21'),

-- WEEKEND (LOWER THAN USUAL)
(1223, -65.00, 'Restaurant', 'Midwood Smokehouse', '2026-01-23'),
(1224, -20.11, 'Coffee', 'Amélie’s French Bakery', '2026-01-24'),

-- FEBRUARY START
(1225, 2250.00, 'Income', 'Direct Deposit Employer', '2026-01-30'),
(1226, -1650.00, 'Rent', 'Camden South End Apartments', '2026-02-01'),
(1227, -74.99, 'Internet', 'Spectrum', '2026-02-01'),
(1228, -89.00, 'Phone', 'Verizon', '2026-02-02'),
(1229, -138.55, 'Utilities', 'Duke Energy', '2026-02-03'),
(1230, -150.00, 'Transfer', 'Transfer to Savings', '2026-02-03'),
(1231, -300.00, 'Investment', 'Vanguard Investment Contribution', '2026-02-03'),

-- VALENTINE’S SPENDING
(1232, -110.00, 'Dining', 'Charlotte Fine Dining', '2026-02-14'),
(1233, -85.00, 'Gift', 'Local Boutique', '2026-02-14'),

-- PAY
(1234, 2250.00, 'Income', 'Direct Deposit Employer', '2026-02-13'),
(1235, -385.00, 'Car Payment', 'Toyota Finance', '2026-02-14'),
(1236, -148.00, 'Insurance', 'Geico', '2026-02-14'),
(1237, -200.00, 'Transfer', 'Transfer to Savings', '2026-02-15'),
(1238, -300.00, 'Investment', 'Vanguard Investment Contribution', '2026-02-15'),

-- INVESTMENT GROWTH (STRONGEST YET)
(1239, 380.00, 'Investment', 'Dividend Payment', '2026-02-28'),

-- MARCH (STABLE)
(1240, 2250.00, 'Income', 'Direct Deposit Employer', '2026-02-27'),
(1241, -1650.00, 'Rent', 'Camden South End Apartments', '2026-03-01'),
(1242, -75.00, 'Internet', 'Spectrum', '2026-03-01'),
(1243, -89.00, 'Phone', 'Verizon', '2026-03-02'),
(1244, -140.22, 'Utilities', 'Duke Energy', '2026-03-03'),
(1245, -150.00, 'Transfer', 'Transfer to Savings', '2026-03-03'),
(1246, -300.00, 'Investment', 'Vanguard Investment Contribution', '2026-03-03'),

-- NORMAL LIFE
(1247, -88.44, 'Groceries', 'Publix', '2026-03-04'),
(1248, -12.88, 'Coffee', 'Starbucks', '2026-03-04'),
(1249, -41.55, 'Gas', 'Shell', '2026-03-05'),
(1250, -19.22, 'Food', 'Chick-fil-A', '2026-03-06'),

-- WEEKEND
(1251, -82.00, 'Restaurant', 'Midwood Smokehouse', '2026-03-07'),
(1252, -24.33, 'Coffee', 'Amélie’s French Bakery', '2026-03-08'),

-- PAY
(1253, 2250.00, 'Income', 'Direct Deposit Employer', '2026-03-13'),
(1254, -385.00, 'Car Payment', 'Toyota Finance', '2026-03-14'),
(1255, -148.00, 'Insurance', 'Geico', '2026-03-14'),
(1256, -200.00, 'Transfer', 'Transfer to Savings', '2026-03-15'),
(1257, -300.00, 'Investment', 'Vanguard Investment Contribution', '2026-03-15'),

-- FINAL NORMAL SPENDING
(1258, -95.22, 'Shopping', 'Amazon', '2026-03-16'),
(1259, -115.00, 'Groceries', 'Harris Teeter', '2026-03-17'),
(1260, -42.44, 'Gas', 'Circle K', '2026-03-18'),

-- CLEAN END STATE
(1261, -18.55, 'Food', 'Chipotle', '2026-03-19'),
(1262, -70.22, 'Groceries', 'Publix', '2026-03-20'),

-- FINAL ROW
(1400, -85.33, 'Groceries', 'Harris Teeter', '2026-03-21');

INSERT INTO customer_data (id, amount, category, description, transaction_date) VALUES
(1401, 2250.00, 'Income', 'Direct Deposit Employer', '2026-03-27'),
(1402, -385.00, 'Car Payment', 'Toyota Finance', '2026-03-28'),
(1403, -148.00, 'Insurance', 'Geico', '2026-03-28'),
(1404, -200.00, 'Transfer', 'Transfer to Savings', '2026-03-29'),
(1405, -300.00, 'Investment', 'Vanguard Investment Contribution', '2026-03-29'),

-- END OF MARCH NORMAL SPENDING
(1406, -82.55, 'Groceries', 'Harris Teeter', '2026-03-30'),
(1407, -12.33, 'Coffee', 'Starbucks', '2026-03-30'),
(1408, -41.88, 'Gas', 'Shell', '2026-03-31'),
(1409, -19.22, 'Food', 'Chick-fil-A', '2026-03-31'),

-- APRIL START
(1410, -1650.00, 'Rent', 'Camden South End Apartments', '2026-04-01'),
(1411, -75.00, 'Internet', 'Spectrum', '2026-04-01'),
(1412, -89.00, 'Phone', 'Verizon', '2026-04-02'),
(1413, -142.11, 'Utilities', 'Duke Energy', '2026-04-02'),
(1414, -150.00, 'Transfer', 'Transfer to Savings', '2026-04-02'),
(1415, -300.00, 'Investment', 'Vanguard Investment Contribution', '2026-04-02'),

-- NORMAL WEEK
(1416, -78.44, 'Groceries', 'Publix', '2026-04-03'),
(1417, -11.88, 'Coffee', 'Starbucks', '2026-04-03'),
(1418, -39.55, 'Gas', 'Circle K', '2026-04-04'),
(1419, -18.77, 'Food', 'Chipotle', '2026-04-04'),

-- WEEKEND (SLIGHTLY HIGHER)
(1420, -85.22, 'Restaurant', 'Midwood Smokehouse', '2026-04-05'),
(1421, -24.11, 'Coffee', 'Amélie’s French Bakery', '2026-04-06'),

-- PAYCHECK (FINAL ONE IN DATASET)
(1422, 2250.00, 'Income', 'Direct Deposit Employer', '2026-04-10'),

-- POST-PAY DISTRIBUTION (REALISTIC BEHAVIOR)
(1423, -200.00, 'Transfer', 'Transfer to Savings', '2026-04-10'),
(1424, -300.00, 'Investment', 'Vanguard Investment Contribution', '2026-04-10'),

-- FINAL DAY ACTIVITY (APRIL 11, 2026)
(1425, -92.55, 'Groceries', 'Harris Teeter', '2026-04-11'),
(1426, -14.22, 'Food', 'Bojangles', '2026-04-11'),
(1427, -42.88, 'Gas', 'Shell', '2026-04-11'),
(1428, -12.55, 'Coffee', 'Starbucks', '2026-04-11'),

-- FINAL INVESTMENT SIGNAL (ENDING CLEAN)
(1429, 410.00, 'Investment', 'Dividend Payment', '2026-04-11'),

-- FINAL ROW MARKER
(1450, -0.01, 'System', 'End of Dataset Marker', '2026-04-11');

INSERT INTO customer_data (id, amount, category, description, transaction_date) VALUES
-- POST WEEKEND NORMALIZATION
(1451, -38.44, 'Gas', 'Circle K', '2026-04-12'),
(1452, -16.22, 'Food', 'Cook Out', '2026-04-12'),

-- LOW-SPEND WEEKDAY
(1453, -11.88, 'Coffee', 'Starbucks', '2026-04-13'),
(1454, -72.55, 'Groceries', 'Food Lion', '2026-04-13'),

-- MIDWEEK ROUTINE
(1455, -40.11, 'Gas', 'Shell', '2026-04-14'),
(1456, -18.44, 'Food', 'Chick-fil-A', '2026-04-14'),
(1457, -12.55, 'Coffee', 'Not Just Coffee', '2026-04-14'),

-- SLIGHT SPENDING DAY
(1458, -95.22, 'Shopping', 'Amazon', '2026-04-15'),
(1459, -120.33, 'Groceries', 'Publix', '2026-04-15'),

-- PRE-PAYCHECK LOW BALANCE BEHAVIOR
(1460, 150.00, 'Transfer', 'Transfer from Savings', '2026-04-16'),

-- SMALL NECESSARY SPENDING
(1461, -42.88, 'Gas', 'Exxon', '2026-04-16'),
(1462, -17.55, 'Food', 'Bojangles', '2026-04-16'),

-- FINAL DAY (APRIL 17, 2026)
(1463, 2250.00, 'Income', 'Direct Deposit Employer', '2026-04-17'),
(1464, -200.00, 'Transfer', 'Transfer to Savings', '2026-04-17'),
(1465, -300.00, 'Investment', 'Vanguard Investment Contribution', '2026-04-17'),

-- REALISTIC SAME-DAY SPENDING AFTER PAYCHECK
(1466, -110.44, 'Groceries', 'Harris Teeter', '2026-04-17'),
(1467, -19.22, 'Food', 'Chipotle', '2026-04-17'),
(1468, -12.88, 'Coffee', 'Starbucks', '2026-04-17'),

-- FINAL CLEAN END MARKER
(1480, -0.01, 'System', 'End of Dataset Marker', '2026-04-17');

-- Reindex IDs to be contiguous with no gaps, preserving chronological order.
CREATE TABLE customer_data_reindexed (
	id INTEGER PRIMARY KEY,
	amount DECIMAL(12,2) NOT NULL,
	category VARCHAR(100) NOT NULL,
	description VARCHAR(255) NOT NULL,
	transaction_date DATE NOT NULL,
	account VARCHAR(50),
	type VARCHAR(50)
);

WITH base_rows AS (
	SELECT
		id,
		amount,
		category,
		description,
		transaction_date
	FROM customer_data
	WHERE category <> 'System'
),
expanded_rows AS (
	SELECT
		id AS original_id,
		0 AS leg_order,
		amount,
		category,
		description,
		transaction_date,
		CASE
			WHEN category = 'Transfer' AND description LIKE '%to Savings%' THEN 'Checking'
			WHEN category = 'Transfer' AND description LIKE '%from Savings%' THEN 'Savings'
			WHEN category = 'Investment' THEN 'Brokerage'
			ELSE 'Checking'
		END AS account,
		CASE
			WHEN category = 'Transfer' THEN 'transfer'
			WHEN category = 'Investment' AND amount > 0 THEN 'investment_return'
			WHEN category = 'Investment' AND amount < 0 THEN 'investment_contribution'
			WHEN amount > 0 THEN 'income'
			ELSE 'expense'
		END AS type
	FROM base_rows

	UNION ALL

	SELECT
		id AS original_id,
		1 AS leg_order,
		-amount AS amount,
		'Transfer' AS category,
		CASE
			WHEN description LIKE '%to Savings%' THEN 'Transfer from Checking (counterpart)'
			WHEN description LIKE '%from Savings%' THEN 'Transfer from Savings (counterpart)'
			ELSE 'Transfer Counterpart'
		END AS description,
		transaction_date,
		CASE
			WHEN description LIKE '%to Savings%' THEN 'Savings'
			WHEN description LIKE '%from Savings%' THEN 'Checking'
			ELSE 'Unknown'
		END AS account,
		'transfer' AS type
	FROM base_rows
	WHERE category = 'Transfer'
)
INSERT INTO customer_data_reindexed (id, amount, category, description, transaction_date, account, type)
SELECT
	ROW_NUMBER() OVER (ORDER BY transaction_date, original_id, leg_order) AS id,
	amount,
	category,
	description,
	transaction_date,
	account,
	type
FROM expanded_rows;

DROP TABLE customer_data;
ALTER TABLE customer_data_reindexed RENAME TO customer_data;