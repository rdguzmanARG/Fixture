-- Fix match dates and matchDay numbers to match the official FIFA World Cup 2026 schedule.
-- Source: ESPN + Wikipedia (verified June 2026).
-- Group stage matches are identified by homeTeam/awayTeam code since the seed's internal
-- matchNumbers do not match FIFA's official match numbering.
-- Knockout matches are identified by matchNumber (seed 73-104 = FIFA 73-104).

-- ── GROUP A ─────────────────────────────────────────────────────────────────
-- MD1 Jun 11: MEX vs RSA, KOR vs CZE
-- MD2 Jun 18: CZE vs RSA, MEX vs KOR
-- MD3 Jun 24: CZE vs MEX, RSA vs KOR
UPDATE `Match` SET `date` = '2026-06-18 00:00:00.000', `matchDay` = 2
  WHERE `homeTeamId` = (SELECT `id` FROM `Team` WHERE `code` = 'MEX')
    AND `awayTeamId` = (SELECT `id` FROM `Team` WHERE `code` = 'KOR');
UPDATE `Match` SET `date` = '2026-06-18 00:00:00.000', `matchDay` = 2
  WHERE `homeTeamId` = (SELECT `id` FROM `Team` WHERE `code` = 'CZE')
    AND `awayTeamId` = (SELECT `id` FROM `Team` WHERE `code` = 'RSA');
UPDATE `Match` SET `date` = '2026-06-24 00:00:00.000', `matchDay` = 3
  WHERE `homeTeamId` = (SELECT `id` FROM `Team` WHERE `code` = 'MEX')
    AND `awayTeamId` = (SELECT `id` FROM `Team` WHERE `code` = 'CZE');
UPDATE `Match` SET `date` = '2026-06-24 00:00:00.000', `matchDay` = 3
  WHERE `homeTeamId` = (SELECT `id` FROM `Team` WHERE `code` = 'KOR')
    AND `awayTeamId` = (SELECT `id` FROM `Team` WHERE `code` = 'RSA');
UPDATE `Match` SET `date` = '2026-06-11 00:00:00.000', `matchDay` = 1
  WHERE `homeTeamId` = (SELECT `id` FROM `Team` WHERE `code` = 'MEX')
    AND `awayTeamId` = (SELECT `id` FROM `Team` WHERE `code` = 'RSA');
UPDATE `Match` SET `date` = '2026-06-11 00:00:00.000', `matchDay` = 1
  WHERE `homeTeamId` = (SELECT `id` FROM `Team` WHERE `code` = 'KOR')
    AND `awayTeamId` = (SELECT `id` FROM `Team` WHERE `code` = 'CZE');

-- ── GROUP B ─────────────────────────────────────────────────────────────────
-- MD1 Jun 12: CAN vs BIH | MD1 Jun 13: SUI vs QAT
-- MD2 Jun 18: CAN vs QAT, SUI vs BIH
-- MD3 Jun 24: CAN vs SUI, BIH vs QAT
UPDATE `Match` SET `date` = '2026-06-12 00:00:00.000', `matchDay` = 1
  WHERE `homeTeamId` = (SELECT `id` FROM `Team` WHERE `code` = 'CAN')
    AND `awayTeamId` = (SELECT `id` FROM `Team` WHERE `code` = 'BIH');
UPDATE `Match` SET `date` = '2026-06-13 00:00:00.000', `matchDay` = 1
  WHERE `homeTeamId` = (SELECT `id` FROM `Team` WHERE `code` = 'SUI')
    AND `awayTeamId` = (SELECT `id` FROM `Team` WHERE `code` = 'QAT');
UPDATE `Match` SET `date` = '2026-06-18 00:00:00.000', `matchDay` = 2
  WHERE `homeTeamId` = (SELECT `id` FROM `Team` WHERE `code` = 'CAN')
    AND `awayTeamId` = (SELECT `id` FROM `Team` WHERE `code` = 'QAT');
UPDATE `Match` SET `date` = '2026-06-18 00:00:00.000', `matchDay` = 2
  WHERE `homeTeamId` = (SELECT `id` FROM `Team` WHERE `code` = 'SUI')
    AND `awayTeamId` = (SELECT `id` FROM `Team` WHERE `code` = 'BIH');
UPDATE `Match` SET `date` = '2026-06-24 00:00:00.000', `matchDay` = 3
  WHERE `homeTeamId` = (SELECT `id` FROM `Team` WHERE `code` = 'CAN')
    AND `awayTeamId` = (SELECT `id` FROM `Team` WHERE `code` = 'SUI');
UPDATE `Match` SET `date` = '2026-06-24 00:00:00.000', `matchDay` = 3
  WHERE `homeTeamId` = (SELECT `id` FROM `Team` WHERE `code` = 'BIH')
    AND `awayTeamId` = (SELECT `id` FROM `Team` WHERE `code` = 'QAT');

-- ── GROUP C ─────────────────────────────────────────────────────────────────
-- MD1 Jun 13: BRA vs MAR, SCO vs HAI
-- MD2 Jun 19: BRA vs HAI, MAR vs SCO
-- MD3 Jun 24: BRA vs SCO, MAR vs HAI
UPDATE `Match` SET `date` = '2026-06-13 00:00:00.000', `matchDay` = 1
  WHERE `homeTeamId` = (SELECT `id` FROM `Team` WHERE `code` = 'BRA')
    AND `awayTeamId` = (SELECT `id` FROM `Team` WHERE `code` = 'MAR');
UPDATE `Match` SET `date` = '2026-06-13 00:00:00.000', `matchDay` = 1
  WHERE `homeTeamId` = (SELECT `id` FROM `Team` WHERE `code` = 'SCO')
    AND `awayTeamId` = (SELECT `id` FROM `Team` WHERE `code` = 'HAI');
UPDATE `Match` SET `date` = '2026-06-19 00:00:00.000', `matchDay` = 2
  WHERE `homeTeamId` = (SELECT `id` FROM `Team` WHERE `code` = 'BRA')
    AND `awayTeamId` = (SELECT `id` FROM `Team` WHERE `code` = 'HAI');
UPDATE `Match` SET `date` = '2026-06-19 00:00:00.000', `matchDay` = 2
  WHERE `homeTeamId` = (SELECT `id` FROM `Team` WHERE `code` = 'MAR')
    AND `awayTeamId` = (SELECT `id` FROM `Team` WHERE `code` = 'SCO');
UPDATE `Match` SET `date` = '2026-06-24 00:00:00.000', `matchDay` = 3
  WHERE `homeTeamId` = (SELECT `id` FROM `Team` WHERE `code` = 'BRA')
    AND `awayTeamId` = (SELECT `id` FROM `Team` WHERE `code` = 'SCO');
UPDATE `Match` SET `date` = '2026-06-24 00:00:00.000', `matchDay` = 3
  WHERE `homeTeamId` = (SELECT `id` FROM `Team` WHERE `code` = 'MAR')
    AND `awayTeamId` = (SELECT `id` FROM `Team` WHERE `code` = 'HAI');

-- ── GROUP D ─────────────────────────────────────────────────────────────────
-- MD1 Jun 12: USA vs PAR | MD1 Jun 13: AUS vs TUR
-- MD2 Jun 19: USA vs AUS, TUR vs PAR
-- MD3 Jun 25: USA vs TUR, AUS vs PAR
UPDATE `Match` SET `date` = '2026-06-12 00:00:00.000', `matchDay` = 1
  WHERE `homeTeamId` = (SELECT `id` FROM `Team` WHERE `code` = 'USA')
    AND `awayTeamId` = (SELECT `id` FROM `Team` WHERE `code` = 'PAR');
UPDATE `Match` SET `date` = '2026-06-13 00:00:00.000', `matchDay` = 1
  WHERE `homeTeamId` = (SELECT `id` FROM `Team` WHERE `code` = 'AUS')
    AND `awayTeamId` = (SELECT `id` FROM `Team` WHERE `code` = 'TUR');
UPDATE `Match` SET `date` = '2026-06-19 00:00:00.000', `matchDay` = 2
  WHERE `homeTeamId` = (SELECT `id` FROM `Team` WHERE `code` = 'USA')
    AND `awayTeamId` = (SELECT `id` FROM `Team` WHERE `code` = 'AUS');
UPDATE `Match` SET `date` = '2026-06-19 00:00:00.000', `matchDay` = 2
  WHERE `homeTeamId` = (SELECT `id` FROM `Team` WHERE `code` = 'TUR')
    AND `awayTeamId` = (SELECT `id` FROM `Team` WHERE `code` = 'PAR');
UPDATE `Match` SET `date` = '2026-06-25 00:00:00.000', `matchDay` = 3
  WHERE `homeTeamId` = (SELECT `id` FROM `Team` WHERE `code` = 'USA')
    AND `awayTeamId` = (SELECT `id` FROM `Team` WHERE `code` = 'TUR');
UPDATE `Match` SET `date` = '2026-06-25 00:00:00.000', `matchDay` = 3
  WHERE `homeTeamId` = (SELECT `id` FROM `Team` WHERE `code` = 'AUS')
    AND `awayTeamId` = (SELECT `id` FROM `Team` WHERE `code` = 'PAR');

-- ── GROUP E ─────────────────────────────────────────────────────────────────
-- MD1 Jun 14: GER vs CUW, CIV vs ECU
-- MD2 Jun 20: GER vs CIV, ECU vs CUW
-- MD3 Jun 25: GER vs ECU, CIV vs CUW
UPDATE `Match` SET `date` = '2026-06-14 00:00:00.000', `matchDay` = 1
  WHERE `homeTeamId` = (SELECT `id` FROM `Team` WHERE `code` = 'GER')
    AND `awayTeamId` = (SELECT `id` FROM `Team` WHERE `code` = 'CUW');
UPDATE `Match` SET `date` = '2026-06-14 00:00:00.000', `matchDay` = 1
  WHERE `homeTeamId` = (SELECT `id` FROM `Team` WHERE `code` = 'ECU')
    AND `awayTeamId` = (SELECT `id` FROM `Team` WHERE `code` = 'CIV');
UPDATE `Match` SET `date` = '2026-06-20 00:00:00.000', `matchDay` = 2
  WHERE `homeTeamId` = (SELECT `id` FROM `Team` WHERE `code` = 'GER')
    AND `awayTeamId` = (SELECT `id` FROM `Team` WHERE `code` = 'CIV');
UPDATE `Match` SET `date` = '2026-06-20 00:00:00.000', `matchDay` = 2
  WHERE `homeTeamId` = (SELECT `id` FROM `Team` WHERE `code` = 'ECU')
    AND `awayTeamId` = (SELECT `id` FROM `Team` WHERE `code` = 'CUW');
UPDATE `Match` SET `date` = '2026-06-25 00:00:00.000', `matchDay` = 3
  WHERE `homeTeamId` = (SELECT `id` FROM `Team` WHERE `code` = 'GER')
    AND `awayTeamId` = (SELECT `id` FROM `Team` WHERE `code` = 'ECU');
UPDATE `Match` SET `date` = '2026-06-25 00:00:00.000', `matchDay` = 3
  WHERE `homeTeamId` = (SELECT `id` FROM `Team` WHERE `code` = 'CIV')
    AND `awayTeamId` = (SELECT `id` FROM `Team` WHERE `code` = 'CUW');

-- ── GROUP F ─────────────────────────────────────────────────────────────────
-- MD1 Jun 14: NED vs JPN, SWE vs TUN
-- MD2 Jun 20: NED vs SWE, JPN vs TUN
-- MD3 Jun 25: NED vs TUN, JPN vs SWE
UPDATE `Match` SET `date` = '2026-06-14 00:00:00.000', `matchDay` = 1
  WHERE `homeTeamId` = (SELECT `id` FROM `Team` WHERE `code` = 'NED')
    AND `awayTeamId` = (SELECT `id` FROM `Team` WHERE `code` = 'JPN');
UPDATE `Match` SET `date` = '2026-06-14 00:00:00.000', `matchDay` = 1
  WHERE `homeTeamId` = (SELECT `id` FROM `Team` WHERE `code` = 'SWE')
    AND `awayTeamId` = (SELECT `id` FROM `Team` WHERE `code` = 'TUN');
UPDATE `Match` SET `date` = '2026-06-20 00:00:00.000', `matchDay` = 2
  WHERE `homeTeamId` = (SELECT `id` FROM `Team` WHERE `code` = 'NED')
    AND `awayTeamId` = (SELECT `id` FROM `Team` WHERE `code` = 'SWE');
UPDATE `Match` SET `date` = '2026-06-20 00:00:00.000', `matchDay` = 2
  WHERE `homeTeamId` = (SELECT `id` FROM `Team` WHERE `code` = 'JPN')
    AND `awayTeamId` = (SELECT `id` FROM `Team` WHERE `code` = 'TUN');
UPDATE `Match` SET `date` = '2026-06-25 00:00:00.000', `matchDay` = 3
  WHERE `homeTeamId` = (SELECT `id` FROM `Team` WHERE `code` = 'NED')
    AND `awayTeamId` = (SELECT `id` FROM `Team` WHERE `code` = 'TUN');
UPDATE `Match` SET `date` = '2026-06-25 00:00:00.000', `matchDay` = 3
  WHERE `homeTeamId` = (SELECT `id` FROM `Team` WHERE `code` = 'JPN')
    AND `awayTeamId` = (SELECT `id` FROM `Team` WHERE `code` = 'SWE');

-- ── GROUP G ─────────────────────────────────────────────────────────────────
-- MD1 Jun 15: BEL vs EGY, IRN vs NZL
-- MD2 Jun 21: BEL vs IRN, EGY vs NZL
-- MD3 Jun 26: BEL vs NZL, EGY vs IRN
UPDATE `Match` SET `date` = '2026-06-15 00:00:00.000', `matchDay` = 1
  WHERE `homeTeamId` = (SELECT `id` FROM `Team` WHERE `code` = 'BEL')
    AND `awayTeamId` = (SELECT `id` FROM `Team` WHERE `code` = 'EGY');
UPDATE `Match` SET `date` = '2026-06-15 00:00:00.000', `matchDay` = 1
  WHERE `homeTeamId` = (SELECT `id` FROM `Team` WHERE `code` = 'IRN')
    AND `awayTeamId` = (SELECT `id` FROM `Team` WHERE `code` = 'NZL');
UPDATE `Match` SET `date` = '2026-06-21 00:00:00.000', `matchDay` = 2
  WHERE `homeTeamId` = (SELECT `id` FROM `Team` WHERE `code` = 'BEL')
    AND `awayTeamId` = (SELECT `id` FROM `Team` WHERE `code` = 'IRN');
UPDATE `Match` SET `date` = '2026-06-21 00:00:00.000', `matchDay` = 2
  WHERE `homeTeamId` = (SELECT `id` FROM `Team` WHERE `code` = 'EGY')
    AND `awayTeamId` = (SELECT `id` FROM `Team` WHERE `code` = 'NZL');
UPDATE `Match` SET `date` = '2026-06-26 00:00:00.000', `matchDay` = 3
  WHERE `homeTeamId` = (SELECT `id` FROM `Team` WHERE `code` = 'BEL')
    AND `awayTeamId` = (SELECT `id` FROM `Team` WHERE `code` = 'NZL');
UPDATE `Match` SET `date` = '2026-06-26 00:00:00.000', `matchDay` = 3
  WHERE `homeTeamId` = (SELECT `id` FROM `Team` WHERE `code` = 'EGY')
    AND `awayTeamId` = (SELECT `id` FROM `Team` WHERE `code` = 'IRN');

-- ── GROUP H ─────────────────────────────────────────────────────────────────
-- MD1 Jun 15: ESP vs CPV, KSA vs URU
-- MD2 Jun 21: ESP vs KSA, URU vs CPV
-- MD3 Jun 26: ESP vs URU, KSA vs CPV
UPDATE `Match` SET `date` = '2026-06-15 00:00:00.000', `matchDay` = 1
  WHERE `homeTeamId` = (SELECT `id` FROM `Team` WHERE `code` = 'ESP')
    AND `awayTeamId` = (SELECT `id` FROM `Team` WHERE `code` = 'CPV');
UPDATE `Match` SET `date` = '2026-06-15 00:00:00.000', `matchDay` = 1
  WHERE `homeTeamId` = (SELECT `id` FROM `Team` WHERE `code` = 'KSA')
    AND `awayTeamId` = (SELECT `id` FROM `Team` WHERE `code` = 'URU');
UPDATE `Match` SET `date` = '2026-06-21 00:00:00.000', `matchDay` = 2
  WHERE `homeTeamId` = (SELECT `id` FROM `Team` WHERE `code` = 'ESP')
    AND `awayTeamId` = (SELECT `id` FROM `Team` WHERE `code` = 'KSA');
UPDATE `Match` SET `date` = '2026-06-21 00:00:00.000', `matchDay` = 2
  WHERE `homeTeamId` = (SELECT `id` FROM `Team` WHERE `code` = 'URU')
    AND `awayTeamId` = (SELECT `id` FROM `Team` WHERE `code` = 'CPV');
UPDATE `Match` SET `date` = '2026-06-26 00:00:00.000', `matchDay` = 3
  WHERE `homeTeamId` = (SELECT `id` FROM `Team` WHERE `code` = 'ESP')
    AND `awayTeamId` = (SELECT `id` FROM `Team` WHERE `code` = 'URU');
UPDATE `Match` SET `date` = '2026-06-26 00:00:00.000', `matchDay` = 3
  WHERE `homeTeamId` = (SELECT `id` FROM `Team` WHERE `code` = 'KSA')
    AND `awayTeamId` = (SELECT `id` FROM `Team` WHERE `code` = 'CPV');

-- ── GROUP I ─────────────────────────────────────────────────────────────────
-- MD1 Jun 16: FRA vs SEN, NOR vs IRQ
-- MD2 Jun 22: FRA vs IRQ, NOR vs SEN
-- MD3 Jun 26: FRA vs NOR, SEN vs IRQ
UPDATE `Match` SET `date` = '2026-06-16 00:00:00.000', `matchDay` = 1
  WHERE `homeTeamId` = (SELECT `id` FROM `Team` WHERE `code` = 'FRA')
    AND `awayTeamId` = (SELECT `id` FROM `Team` WHERE `code` = 'SEN');
UPDATE `Match` SET `date` = '2026-06-16 00:00:00.000', `matchDay` = 1
  WHERE `homeTeamId` = (SELECT `id` FROM `Team` WHERE `code` = 'NOR')
    AND `awayTeamId` = (SELECT `id` FROM `Team` WHERE `code` = 'IRQ');
UPDATE `Match` SET `date` = '2026-06-22 00:00:00.000', `matchDay` = 2
  WHERE `homeTeamId` = (SELECT `id` FROM `Team` WHERE `code` = 'FRA')
    AND `awayTeamId` = (SELECT `id` FROM `Team` WHERE `code` = 'IRQ');
UPDATE `Match` SET `date` = '2026-06-22 00:00:00.000', `matchDay` = 2
  WHERE `homeTeamId` = (SELECT `id` FROM `Team` WHERE `code` = 'SEN')
    AND `awayTeamId` = (SELECT `id` FROM `Team` WHERE `code` = 'NOR');
UPDATE `Match` SET `date` = '2026-06-26 00:00:00.000', `matchDay` = 3
  WHERE `homeTeamId` = (SELECT `id` FROM `Team` WHERE `code` = 'FRA')
    AND `awayTeamId` = (SELECT `id` FROM `Team` WHERE `code` = 'NOR');
UPDATE `Match` SET `date` = '2026-06-26 00:00:00.000', `matchDay` = 3
  WHERE `homeTeamId` = (SELECT `id` FROM `Team` WHERE `code` = 'SEN')
    AND `awayTeamId` = (SELECT `id` FROM `Team` WHERE `code` = 'IRQ');

-- ── GROUP J ─────────────────────────────────────────────────────────────────
-- MD1 Jun 16: ARG vs ALG, AUT vs JOR
-- MD2 Jun 22: ARG vs AUT, ALG vs JOR
-- MD3 Jun 27: ARG vs JOR, ALG vs AUT
UPDATE `Match` SET `date` = '2026-06-16 00:00:00.000', `matchDay` = 1
  WHERE `homeTeamId` = (SELECT `id` FROM `Team` WHERE `code` = 'ARG')
    AND `awayTeamId` = (SELECT `id` FROM `Team` WHERE `code` = 'ALG');
UPDATE `Match` SET `date` = '2026-06-16 00:00:00.000', `matchDay` = 1
  WHERE `homeTeamId` = (SELECT `id` FROM `Team` WHERE `code` = 'AUT')
    AND `awayTeamId` = (SELECT `id` FROM `Team` WHERE `code` = 'JOR');
UPDATE `Match` SET `date` = '2026-06-22 00:00:00.000', `matchDay` = 2
  WHERE `homeTeamId` = (SELECT `id` FROM `Team` WHERE `code` = 'ARG')
    AND `awayTeamId` = (SELECT `id` FROM `Team` WHERE `code` = 'AUT');
UPDATE `Match` SET `date` = '2026-06-22 00:00:00.000', `matchDay` = 2
  WHERE `homeTeamId` = (SELECT `id` FROM `Team` WHERE `code` = 'ALG')
    AND `awayTeamId` = (SELECT `id` FROM `Team` WHERE `code` = 'JOR');
UPDATE `Match` SET `date` = '2026-06-27 00:00:00.000', `matchDay` = 3
  WHERE `homeTeamId` = (SELECT `id` FROM `Team` WHERE `code` = 'ARG')
    AND `awayTeamId` = (SELECT `id` FROM `Team` WHERE `code` = 'JOR');
UPDATE `Match` SET `date` = '2026-06-27 00:00:00.000', `matchDay` = 3
  WHERE `homeTeamId` = (SELECT `id` FROM `Team` WHERE `code` = 'ALG')
    AND `awayTeamId` = (SELECT `id` FROM `Team` WHERE `code` = 'AUT');

-- ── GROUP K ─────────────────────────────────────────────────────────────────
-- MD1 Jun 17: POR vs COD, COL vs UZB
-- MD2 Jun 23: POR vs UZB, COL vs COD
-- MD3 Jun 27: POR vs COL, COD vs UZB
UPDATE `Match` SET `date` = '2026-06-17 00:00:00.000', `matchDay` = 1
  WHERE `homeTeamId` = (SELECT `id` FROM `Team` WHERE `code` = 'POR')
    AND `awayTeamId` = (SELECT `id` FROM `Team` WHERE `code` = 'COD');
UPDATE `Match` SET `date` = '2026-06-17 00:00:00.000', `matchDay` = 1
  WHERE `homeTeamId` = (SELECT `id` FROM `Team` WHERE `code` = 'COL')
    AND `awayTeamId` = (SELECT `id` FROM `Team` WHERE `code` = 'UZB');
UPDATE `Match` SET `date` = '2026-06-23 00:00:00.000', `matchDay` = 2
  WHERE `homeTeamId` = (SELECT `id` FROM `Team` WHERE `code` = 'POR')
    AND `awayTeamId` = (SELECT `id` FROM `Team` WHERE `code` = 'UZB');
UPDATE `Match` SET `date` = '2026-06-23 00:00:00.000', `matchDay` = 2
  WHERE `homeTeamId` = (SELECT `id` FROM `Team` WHERE `code` = 'COL')
    AND `awayTeamId` = (SELECT `id` FROM `Team` WHERE `code` = 'COD');
UPDATE `Match` SET `date` = '2026-06-27 00:00:00.000', `matchDay` = 3
  WHERE `homeTeamId` = (SELECT `id` FROM `Team` WHERE `code` = 'POR')
    AND `awayTeamId` = (SELECT `id` FROM `Team` WHERE `code` = 'COL');
UPDATE `Match` SET `date` = '2026-06-27 00:00:00.000', `matchDay` = 3
  WHERE `homeTeamId` = (SELECT `id` FROM `Team` WHERE `code` = 'COD')
    AND `awayTeamId` = (SELECT `id` FROM `Team` WHERE `code` = 'UZB');

-- ── GROUP L ─────────────────────────────────────────────────────────────────
-- MD1 Jun 17: ENG vs CRO, GHA vs PAN
-- MD2 Jun 23: ENG vs GHA, CRO vs PAN
-- MD3 Jun 27: ENG vs PAN, CRO vs GHA
UPDATE `Match` SET `date` = '2026-06-17 00:00:00.000', `matchDay` = 1
  WHERE `homeTeamId` = (SELECT `id` FROM `Team` WHERE `code` = 'ENG')
    AND `awayTeamId` = (SELECT `id` FROM `Team` WHERE `code` = 'CRO');
UPDATE `Match` SET `date` = '2026-06-17 00:00:00.000', `matchDay` = 1
  WHERE `homeTeamId` = (SELECT `id` FROM `Team` WHERE `code` = 'GHA')
    AND `awayTeamId` = (SELECT `id` FROM `Team` WHERE `code` = 'PAN');
UPDATE `Match` SET `date` = '2026-06-23 00:00:00.000', `matchDay` = 2
  WHERE `homeTeamId` = (SELECT `id` FROM `Team` WHERE `code` = 'ENG')
    AND `awayTeamId` = (SELECT `id` FROM `Team` WHERE `code` = 'GHA');
UPDATE `Match` SET `date` = '2026-06-23 00:00:00.000', `matchDay` = 2
  WHERE `homeTeamId` = (SELECT `id` FROM `Team` WHERE `code` = 'CRO')
    AND `awayTeamId` = (SELECT `id` FROM `Team` WHERE `code` = 'PAN');
UPDATE `Match` SET `date` = '2026-06-27 00:00:00.000', `matchDay` = 3
  WHERE `homeTeamId` = (SELECT `id` FROM `Team` WHERE `code` = 'ENG')
    AND `awayTeamId` = (SELECT `id` FROM `Team` WHERE `code` = 'PAN');
UPDATE `Match` SET `date` = '2026-06-27 00:00:00.000', `matchDay` = 3
  WHERE `homeTeamId` = (SELECT `id` FROM `Team` WHERE `code` = 'CRO')
    AND `awayTeamId` = (SELECT `id` FROM `Team` WHERE `code` = 'GHA');

-- ── ROUND OF 32 (matches 73-88) ──────────────────────────────────────────────
UPDATE `Match` SET `date` = '2026-06-28 00:00:00.000' WHERE `matchNumber` = 73;
UPDATE `Match` SET `date` = '2026-06-29 00:00:00.000' WHERE `matchNumber` = 74;
UPDATE `Match` SET `date` = '2026-06-29 00:00:00.000' WHERE `matchNumber` = 75;
UPDATE `Match` SET `date` = '2026-06-29 00:00:00.000' WHERE `matchNumber` = 76;
UPDATE `Match` SET `date` = '2026-06-30 00:00:00.000' WHERE `matchNumber` = 77;
UPDATE `Match` SET `date` = '2026-06-30 00:00:00.000' WHERE `matchNumber` = 78;
UPDATE `Match` SET `date` = '2026-06-30 00:00:00.000' WHERE `matchNumber` = 79;
UPDATE `Match` SET `date` = '2026-07-01 00:00:00.000' WHERE `matchNumber` = 80;
UPDATE `Match` SET `date` = '2026-07-01 00:00:00.000' WHERE `matchNumber` = 81;
UPDATE `Match` SET `date` = '2026-07-01 00:00:00.000' WHERE `matchNumber` = 82;
UPDATE `Match` SET `date` = '2026-07-02 00:00:00.000' WHERE `matchNumber` = 83;
UPDATE `Match` SET `date` = '2026-07-02 00:00:00.000' WHERE `matchNumber` = 84;
UPDATE `Match` SET `date` = '2026-07-02 00:00:00.000' WHERE `matchNumber` = 85;
UPDATE `Match` SET `date` = '2026-07-03 00:00:00.000' WHERE `matchNumber` = 86;
UPDATE `Match` SET `date` = '2026-07-03 00:00:00.000' WHERE `matchNumber` = 87;
UPDATE `Match` SET `date` = '2026-07-03 00:00:00.000' WHERE `matchNumber` = 88;

-- ── ROUND OF 16 (matches 89-96) ──────────────────────────────────────────────
UPDATE `Match` SET `date` = '2026-07-04 00:00:00.000' WHERE `matchNumber` = 89;
UPDATE `Match` SET `date` = '2026-07-04 00:00:00.000' WHERE `matchNumber` = 90;
UPDATE `Match` SET `date` = '2026-07-05 00:00:00.000' WHERE `matchNumber` = 91;
UPDATE `Match` SET `date` = '2026-07-05 00:00:00.000' WHERE `matchNumber` = 92;
UPDATE `Match` SET `date` = '2026-07-06 00:00:00.000' WHERE `matchNumber` = 93;
UPDATE `Match` SET `date` = '2026-07-06 00:00:00.000' WHERE `matchNumber` = 94;
UPDATE `Match` SET `date` = '2026-07-07 00:00:00.000' WHERE `matchNumber` = 95;
UPDATE `Match` SET `date` = '2026-07-07 00:00:00.000' WHERE `matchNumber` = 96;

-- ── QUARTERFINALS (matches 97-100) ───────────────────────────────────────────
UPDATE `Match` SET `date` = '2026-07-09 00:00:00.000' WHERE `matchNumber` = 97;
UPDATE `Match` SET `date` = '2026-07-10 00:00:00.000' WHERE `matchNumber` = 98;
UPDATE `Match` SET `date` = '2026-07-11 00:00:00.000' WHERE `matchNumber` = 99;
UPDATE `Match` SET `date` = '2026-07-11 00:00:00.000' WHERE `matchNumber` = 100;

-- ── SEMIFINALS (matches 101-102) ─────────────────────────────────────────────
UPDATE `Match` SET `date` = '2026-07-14 00:00:00.000' WHERE `matchNumber` = 101;
UPDATE `Match` SET `date` = '2026-07-15 00:00:00.000' WHERE `matchNumber` = 102;

-- ── THIRD PLACE (match 103) ──────────────────────────────────────────────────
UPDATE `Match` SET `date` = '2026-07-18 00:00:00.000' WHERE `matchNumber` = 103;

-- ── FINAL (match 104) ────────────────────────────────────────────────────────
UPDATE `Match` SET `date` = '2026-07-19 00:00:00.000' WHERE `matchNumber` = 104;
