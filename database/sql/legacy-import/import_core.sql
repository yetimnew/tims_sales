-- Replace OLD_DB and NEW_DB with actual database names before running
SET FOREIGN_KEY_CHECKS=0;

-- VEHICLE TYPES
INSERT INTO `NEW_DB`.`vehicletypes` (id, name, description, created_at, updated_at)
SELECT id, name, NULLIF(comment, ''), created_at, updated_at
FROM `OLD_DB`.`vehecletypes`;

-- TRUCKS
INSERT INTO `NEW_DB`.`trucks`
(id, plate, vehicletype_id, chasisNumber, engineNumber, tyreSyze, serviceIntervalKM, purchasePrice, productionDate, serviceStartDate, status, created_at, updated_at, deleted_at)
SELECT
  t.id,
  t.plate,
  t.vehecletype_id,
  t.chasisNumber,
  t.engineNumber,
  CAST(t.tyreSyze AS CHAR),
  CASE WHEN t.serviceIntervalKM IS NULL THEN NULL ELSE ROUND(t.serviceIntervalKM) END,
  CASE WHEN t.purchasePrice IS NULL THEN NULL ELSE ROUND(t.purchasePrice, 2) END,
  NULLIF(t.productionDate, '0000-00-00'),
  NULLIF(t.serviceStartDate, '0000-00-00'),
  CASE WHEN t.status=1 THEN 'active' ELSE 'inactive' END,
  NULLIF(t.created_at,'0000-00-00 00:00:00'),
  NULLIF(t.updated_at,'0000-00-00 00:00:00'),
  t.deleted_at
FROM `OLD_DB`.`trucks` t;

-- DRIVERS
INSERT INTO `NEW_DB`.`drivers`
(id, driverid, name, sex, birthdate, zone, woreda, kebele, housenumber, mobile, hireddate, status, created_at, updated_at, deleted_at)
SELECT
  id, driverid, name,
  CASE sex WHEN 1 THEN 'male' WHEN 0 THEN 'female' ELSE 'unknown' END,
  NULLIF(birthdate,'0000-00-00'),
  zone, woreda, kebele, housenumber, mobile,
  NULLIF(hireddate,'0000-00-00'),
  CASE WHEN status=1 THEN 'active' ELSE 'inactive' END,
  created_at, updated_at, deleted_at
FROM `OLD_DB`.`drivers`;

-- CUSTOMERS
INSERT INTO `NEW_DB`.`customers`
(id, name, contact_person, phone, email, address, status, created_at, updated_at, deleted_at)
SELECT
  id, name, NULL, mobile, NULL, address,
  CASE WHEN status=1 THEN 'active' ELSE 'inactive' END,
  created_at, updated_at, deleted_at
FROM `OLD_DB`.`customers`;

-- REGIONS
INSERT INTO `NEW_DB`.`regions` (id, name, code, description, created_at, updated_at)
SELECT id, name, NULL, comment, created_at, updated_at
FROM `OLD_DB`.`regions`;

-- ZONES
INSERT INTO `NEW_DB`.`zones` (id, name, code, region_id, description, created_at, updated_at)
SELECT id, name, NULL, region_id, comment, created_at, updated_at
FROM `OLD_DB`.`zones`;

-- WOREDAS
INSERT INTO `NEW_DB`.`woredas` (id, name, code, zone_id, description, created_at, updated_at)
SELECT id, name, NULL, zone_id, comment, created_at, updated_at
FROM `OLD_DB`.`woredas`;

-- PLACES
INSERT INTO `NEW_DB`.`places` (id, name, code, woreda_id, latitude, longitude, description, created_at, updated_at)
SELECT id, name, NULL, woreda_id, NULL, NULL, comment, created_at, updated_at
FROM `OLD_DB`.`places`;

-- OPERATIONS
INSERT INTO `NEW_DB`.`operations`
(id, operationid, customer_id, startdate, region_id, volume, cargotype, km, tariff, status, closed, enddate, remark, user_id, created_at, updated_at, deleted_at)
SELECT
  id, operationid, customer_id,
  DATE(startdate),
  region_id,
  CAST(volume AS DECIMAL(10,2)),
  CAST(cargotype AS CHAR),
  CAST(km AS DECIMAL(10,2)),
  CAST(tariff AS DECIMAL(10,2)),
  CASE WHEN closed=1 THEN 'closed' ELSE 'open' END,
  (closed=1),
  enddate, remark, user_id,
  created_at, updated_at, deleted_at
FROM `OLD_DB`.`operations`;

-- DRIVER_TRUCK pivot
INSERT INTO `NEW_DB`.`driver_truck`
(id, driver_id, truck_id, assigned_date, unassigned_date, status, created_at, updated_at, deleted_at)
SELECT
  id, driver_id, truck_id,
  date_recived, date_detach,
  CASE WHEN status=1 THEN 'active' ELSE 'inactive' END,
  created_at, updated_at, deleted_at
FROM `OLD_DB`.`driver_truck`;

-- STATUS TYPES
INSERT INTO `NEW_DB`.`statustypes` (id, name, description, created_at, updated_at)
SELECT id, name, comment, created_at, updated_at
FROM `OLD_DB`.`statustypes`;

-- MASTER STATUSES (one per status type)
INSERT INTO `NEW_DB`.`statuses` (statustype_id, name, description, created_at, updated_at)
SELECT st.id, st.name, st.description, NOW(), NOW()
FROM `NEW_DB`.`statustypes` st
LEFT JOIN `NEW_DB`.`statuses` s
  ON s.statustype_id = st.id AND s.name = st.name
WHERE s.id IS NULL;

-- DAILY TRUCK STATUS HISTORY
INSERT INTO `NEW_DB`.`daily_truck_statuses`
(truck_id, status_id, status_date, notes, changed_by, created_at, updated_at)
SELECT
  t.id AS truck_id,
  s.id AS status_id,
  os.registerddate AS status_date,
  NULL AS notes,
  NULL AS changed_by,
  os.created_at,
  os.updated_at
FROM `OLD_DB`.`statuses` os
JOIN `NEW_DB`.`trucks` t
  ON t.plate = os.plate
LEFT JOIN `NEW_DB`.`statustypes` st
  ON st.id = os.statustype_id
LEFT JOIN `NEW_DB`.`statuses` s
  ON s.statustype_id = st.id AND s.name = st.name;

SET FOREIGN_KEY_CHECKS=1;


